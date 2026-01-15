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

async function searchTasks(req, res) {
  try {
    const {
      project_id,
      assignee_id,
      status,
      priority,
      dueDateFrom,
      dueDateTo,
      searchTerm,
      labels,
    } = req.query;

    console.log("query : ", req.query);

    let query = `SELECT * FROM tasks
                 WHERE 1=1`;

    const values = [];

    if (project_id) {
      query += ` AND project_id = $${values.length + 1}`;
      values.push(project_id);
    }

    if (assignee_id) {
      query += ` AND assignee_id = $${values.length + 1}`;
      values.push(assignee_id);
    }

    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      query += ` AND status = ANY($${values.length + 1})`;
      values.push(statusArray);
    }

    if (priority) {
      const priorityArray = Array.isArray(priority) ? priority : [priority];
      query += ` AND priority = ANY($${values.length + 1})`;
      values.push(priorityArray);
    }

    if (dueDateFrom) {
      query += ` AND due_date >= $${values.length + 1}`;
      values.push(dueDateFrom);
    }

    if (dueDateTo) {
      query += ` AND due_date <= $${values.length + 1}`;
      values.push(dueDateTo);
    }

    if (searchTerm) {
      query += ` AND (title ILIKE $${values.length + 1} OR description ILIKE $${
        values.length + 1
      })`;
      values.push(`%${searchTerm}%`);
    }

    if (labels) {
      const labelArray = Array.isArray(labels) ? labels : [labels];
      query += ` AND EXISTS (SELECT 1 FROM task_labels tl WHERE tl.task_id = tasks.id AND tl.label_id = ANY($${
        values.length + 1
      }))`;
      values.push(labelArray);
    }

    console.log("query", query);
    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error executing query : ", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// 4.3 Subqueries

async function getUnassignedUsers(req, res) {
  const query = `
    select u.username
    from users u
    where not exists (
    select 1
    from tasks t
    where t.assignee_id = u.id
    );
  `;

  try {
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error executing query : ", err);
    res.status(500).json({ Error: "Internal server error" });
  }
}

async function getLatestTaskPerProject(req, res) {
  const query = `
    SELECT
    t1.* FROM tasks t1
      WHERE
        t1.created_at = (
          SELECT
              MAX(t2.created_at)
          FROM
              tasks t2
          WHERE
              t2.project_id = t1.project_id
          )
      ;
  `;

  try {
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error executing query : ", err);
    res.status(500).json({ Error: "Internal server error" });
  }
}

async function getHighPerformers(req, res) {
  const query = `
    SELECT
    u.username,
    COUNT(t.id) AS tasks_completed FROM users u
    JOIN tasks t ON u.id = t.assignee_id
    GROUP BY u.id, u.username
    HAVING
        COUNT(t.id) > (SELECT AVG(task_count) FROM (
          SELECT
              COUNT(id) AS task_count
          FROM
              tasks
          GROUP BY
              id
          ) 
    );
  `;

  try {
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error executing query : ", err);
    res.status(500).json({ Error: "Internal server error" });
  }
}

export {
  getProjectTaskStats,
  getProjectMemberStats,
  getProjectWithTaskCounts,
  searchTasks,
  getUnassignedUsers,
  getLatestTaskPerProject,
  getHighPerformers,
};
