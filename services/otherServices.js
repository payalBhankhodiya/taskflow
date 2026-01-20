import pool from "../db.js";

// 6.3

async function getProjectReport(req, res) {
  const { project_id } = req.params;

  const query = `
    WITH RECURSIVE project_hierarchy AS (
        SELECT p.id, p.name, p.description, p.owner_id, p.status
        FROM projects p
        WHERE p.id = $1

        UNION ALL

        SELECT  c.id, c.name, c.description, c.owner_id, c.status
        FROM projects c
        JOIN project_hierarchy ph ON c.owner_id = ph.id
    ),

    project_tasks AS (
        SELECT t.*
        FROM tasks t
        JOIN project_hierarchy ph ON ph.id = t.project_id
    ),

    tasks_by_status AS (
        SELECT status, COUNT(*) AS count
        FROM project_tasks
        GROUP BY status
    ),

    tasks_by_assignee AS (
        SELECT
            u.id AS assignee_id,
            u.username AS assignee_name,
            COUNT(t.id) AS task_count
        FROM project_tasks t
        LEFT JOIN users u ON u.id = t.assignee_id
        GROUP BY u.id, u.username
    ),

    overdue_tasks AS (
        SELECT COUNT(*) AS count
        FROM project_tasks
        WHERE due_date < CURRENT_DATE
          AND status != 'done'
    )

    

   SELECT
    (
        SELECT row_to_json(ph)
        FROM project_hierarchy ph
        WHERE ph.id = $1
    ) AS project_details,

    (
        SELECT json_agg(
            json_build_object(
                'status', status,
                'count', count
            )
        )
        FROM tasks_by_status
    ) AS tasks_by_status,

    (
        SELECT json_agg(
            json_build_object(
                'assignee_id', assignee_id,
                'assignee_name', assignee_name,
                'task_count', task_count
            )
        )
        FROM tasks_by_assignee
    ) AS tasks_by_assignee,

    (
        SELECT count
        FROM overdue_tasks
    ) AS overdue_task_count;

        
  `;

  try {
    const result = await pool.query(query, [project_id]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching project report:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// 6.4

async function getUserRankings(req, res) {
  const { project_id } = req.params;

  const query = `
    SELECT u.id, u.username, COUNT(t.id) AS completed_tasks,
        RANK() OVER (ORDER BY COUNT(t.id) DESC) AS rank
        FROM users u
        JOIN tasks t
        ON t.assignee_id = u.id
        WHERE t.project_id = $1 AND t.status = 'done'
        GROUP BY u.id, u.username
        ORDER BY rank;
  `;
  const values = [project_id];

  try {
    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getCompletionTrend(req, res) {
  const { project_id } = req.params;

  const query = `
    SELECT
        DATE(created_at) AS task_date,
        COUNT(*) FILTER (WHERE status = 'done') AS completed_count,
        SUM(COUNT(*) FILTER (WHERE status = 'done')) OVER (ORDER BY DATE(created_at)) AS running_total_completed
        FROM tasks
        WHERE project_id = $1
        GROUP BY DATE(created_at)
        ORDER BY task_date;
  `;
  const values = [project_id];

  try {
    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getTaskSequence(req, res) {
  const { project_id } = req.params;

  const query = `
   SELECT
        LAG(title, 1, 'No previous task') OVER (ORDER BY due_date) AS previous_task,
        title AS current_task,
        LEAD(title, 1, 'No next task') OVER (ORDER BY due_date) AS next_task,
        due_date
    FROM tasks
    WHERE project_id = $1
    ORDER BY due_date;
  `;
  const values = [project_id];

  try {
    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export { getProjectReport, getUserRankings, getCompletionTrend, getTaskSequence };
