import pool from "../db.js";

async function createTask(req, res) {
  try {
    const {
      title,
      description,
      project_id,
      assignee_id,
      status,
      priority,
      due_date,
    } = req.body;

    const addQuery = await pool.query(
      "INSERT INTO tasks (title, description, project_id, assignee_id, status, priority, due_date) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [title, description, project_id, assignee_id, status, priority, due_date]
    );
    res.json(addQuery.rows[0]);
  } catch {
    console.error(err.message);
  }
}

async function getTaskById(req, res) {
  try {
    const { id } = req.params;
    const taskByIdQuery = await pool.query(
      `SELECT t.id, t.title, p.name, u.username FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN users u ON t.assignee_id = u.id
       WHERE t.id = $1`,
      [id]
    );
    res.json(taskByIdQuery.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
}

async function getTaskByProject(req, res) {
  const { project_id } = req.params;
  const getTaskByProjectQuery =
    "SELECT * FROM tasks WHERE project_id = $1 ORDER BY id ASC";

  try {
    const result = await pool.query(getTaskByProjectQuery, [project_id]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching tasks by project ID:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getTaskByAssignee(req, res) {
  const { assignee_id } = req.params;
  const getTaskByUserquery =
    "SELECT * FROM tasks WHERE assignee_id = $1 ORDER BY id ASC";

  try {
    const result = await pool.query(getTaskByUserquery, [assignee_id]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      project_id,
      assignee_id,
      status,
      priority,
      due_date,
    } = req.body;

    const updatedTaskQuery = await pool.query(
      `UPDATE tasks
       SET title = $1,
           description = $2,
           project_id = $3,
           assignee_id = $4,
           status = $5,
           priority = $6,
           due_date = $7
       WHERE id = $8`,
      [
        title,
        description,
        project_id,
        assignee_id,
        status,
        priority,
        due_date,
        id,
      ]
    );

    res.json({ message: "Task updated successfully" });
  } catch (err) {
    console.error(err.message);
  }
}

async function deleteTask(req, res) {
  try {
    const { id } = req.params;
    const deleteTaskQuery = await pool.query(
      "DELETE FROM tasks WHERE id = $1",
      [id]
    );
    res.json("Task has been deleted");
  } catch (err) {
    console.error(err.message);
  }
}

async function getAllTask(req, res) {
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
    res.json(result.rows);
  } catch (err) {
    console.error("Getting task error : ", err.message);
  }
}

async function addLabelFromTask(req, res) {
  const { task_id, label_id } = req.body;

  const addLabelsQuery = `
        INSERT INTO task_labels (task_id, label_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING RETURNING *;
    `;
  const values = [task_id, label_id];

  try {
    const result = await pool.query(addLabelsQuery, values);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function removeLabelFromTask(req, res) {
  const { task_id, label_id } = req.params;

  const removeLabelQuery = `
        DELETE FROM task_labels
        WHERE task_id = $1 AND label_id = $2;
    `;
  const values = [task_id, label_id];

  try {
    const result = await pool.query(removeLabelQuery, values);
    res.status(200).json("Task label has been deleted!!!");
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getTaskByIdWithLabels(req, res) {
  const { id } = req.params;

  const query = `
        SELECT
            t.id,
            t.title,
            t.description,
            t.project_id,
            t.assignee_id,
            t.status,
            t.priority,
            t.due_date,
            COALESCE(ARRAY_AGG(l.name ORDER BY l.name) , '{}') AS labels
        FROM
            tasks t
        LEFT JOIN
            task_labels tl ON t.id = tl.task_id
        LEFT JOIN
            labels l ON tl.label_id = l.id
        WHERE
            t.id = $1
        GROUP BY
            t.id;
    `;

  try {
    const result = await pool.query(query, [id]);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getTasksByLabel(req, res) {
  const { label_id } = req.params;

  const query = `
   SELECT 
      t.id, 
      t.title, 
      t.description, 
	  t.project_id,
	  t.assignee_id,
      t.status,
	  t.priority,
	  t.due_date,
	  t.created_at,
	  t.updated_at
	 FROM 
      task_labels tl
    JOIN 
      tasks t ON t.id = tl.task_id
	JOIN
	  labels l ON l.id = tl.label_id
    WHERE 
      tl.label_id = $1;
  `;
  const values = [label_id];

  try {
    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export {
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  getAllTask,
  getTaskByProject,
  getTaskByAssignee,
  addLabelFromTask,
  removeLabelFromTask,
  getTaskByIdWithLabels,
  getTasksByLabel,
};
