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

export { getProjectReport };
