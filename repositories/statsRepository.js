import pool from "../db.js";

// 4.1 Project Statistics

async function getProjectTaskStats(req, res) {
  const { project_id } = req.params;

  const query = `
    SELECT status, COUNT(*) AS count_task from tasks 
    WHERE project_id = $1
    GROUP BY status;
    `;
  const values = [project_id];

  try {
    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error executing query : ", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getProjectMemberStats(req, res) {
  const { project_id } = req.params;

  const query = `
  select u.id as user_id, u.username as user_name, count(t.title) as task_count from users u
  join projects p on u.id = p.owner_id
  join tasks t on u.id = t.assignee_id
  where p.id = $1
  group by u.id,u.username;
   `;

  const values = [project_id];

  try {
    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error executing query : ", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getProjectWithTaskCounts(req, res) {
  const query = `
    SELECT 
        p.id,
        p.name,
        COUNT(t.title) AS total_tasks,
        COUNT(*) FILTER (WHERE t.status = 'done') AS completed_tasks
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id
        GROUP BY p.id, p.name;
`;

  try {
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error executing query : ", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// 4.2 Advanced Filtering

async function searchTasks(params) {

  const query = ``;
}

// 4.3 Subqueries

async function getUnassignedUsers(params) {}

async function getLatestTaskPerProject(params) {}

async function getHighPerformers(params) {}

export { getProjectTaskStats, getProjectMemberStats, getProjectWithTaskCounts };
