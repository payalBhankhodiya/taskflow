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
       WHERE id = $1`,
      [id]
    );
    res.json(taskByIdQuery.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
}

async function getTaskByProject(projectId) {
  const getTaskByProjectyquery =
    "SELECT * FROM tasks WHERE project_id = $1 ORDER BY id ASC";
  const values = [projectId];

  try {
    const res = await pool.query(getTaskByProjectyquery, values);
    return res.rows;
  } catch (err) {
    console.error("Error fetching tasks by project ID:", err);
    throw err;
  }
}

async function getTaskByAssignee(userId) {
  const getTaskByUserquery = "SELECT * FROM tasks WHERE assignee_id = $1";
  const values = [userId];

  try {
    const res = await pool.query(getTaskByUserquery, values);
    return res.rows;
  } catch (err) {
    console.error("Error executing query", err.stack);
    throw err;
  }
}

async function updateUser(req, res) {
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

async function addLabelFromTask(taskId, labelId) {
  const addLabelsQuery = `
        INSERT INTO task_labels (task_id, label_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING;
    `;
  const values = [taskId, labelId];

  try {
    await pool.query(addLabelsQuery, values);
    console.log(`Label ${labelId} added to task ${taskId}.`);
  } catch (err) {
    console.error("Error adding label to task", err);
  }
}

async function removeLabelFromTask(taskId, labelId) {
  const removeLabelQuery = `
        DELETE FROM task_labels
        WHERE task_id = $1 AND label_id = $2;
    `;
  const values = [taskId, labelId];

  try {
    const res = await pool.query(removeLabelQuery, values);
    if (res.rowCount > 0) {
      console.log(`Label ${labelId} removed from task ${taskId}.`);
    } else {
      console.log("Label association not found.");
    }
  } catch (err) {
    console.error("Error removing label from task", err);
  }
}

async function getTaskByIdWithLabels(taskId) {
  const query = `
        SELECT
            t.id,
            t.title,
            t.description,
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
            t.id, t.description, t.completed;
    `;

  try {
    const result = await pool.query(query, [taskId]);
    if (result.rows.length > 0) {
      return result.rows[0];
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching task by ID:", error);
    throw error;
  }
}

async function getTasksByLabel(labelId) {
  const query = `
    SELECT 
      tasks.id, 
      tasks.title, 
      tasks.description, 
      tasks.due_date,
      tasks.status
    FROM 
      tasks
    JOIN 
      task_labels ON tasks.id = task_labels.task_id
    WHERE 
      task_labels.label_id = $1;
  `;
  const values = [labelId];

  try {
    const result = await pool.query(query, values);
    console.log(`Getting ${result.rows.length} tasks for label ID ${labelId}`);
    return result.rows;
  } catch (err) {
    console.error(`Error fetching tasks for label ID ${labelId}:`, err);
    throw err;
  }
}
