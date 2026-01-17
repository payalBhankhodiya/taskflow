import pool from "../db.js";

// 5.1

async function createProjectWithSetup(req, res) {
  const { projectData, initialTasks = [], initialLabels = [] } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const projectQuery = `
      INSERT INTO projects (name, description, owner_id, status, deadline)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `;

    const projectResult = await client.query(projectQuery, [
      projectData.name,
      projectData.description,
      projectData.owner_id,
      projectData.status,
      projectData.deadline,
    ]);

    if (projectResult.rowCount === 0) {
      throw new Error("Project creation failed");
    }

    const project_id = projectResult.rows[0].id;

    for (const label of initialLabels) {
      const labelQuery = `
        INSERT INTO labels (name, color, project_id)
        VALUES ($1, $2, $3);
      `;

      await client.query(labelQuery, [label.name, label.color, project_id]);
    }

    for (const task of initialTasks) {
      const taskQuery = `
        INSERT INTO tasks 
          (title, description, project_id, assignee_id, status, priority, due_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `;

      await client.query(taskQuery, [
        task.title,
        task.description,
        project_id,
        task.assignee_id || null,
        task.status,
        task.priority,
        task.due_date || null,
      ]);
    }

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Project, tasks, and labels created successfully",
      project_id: project_id,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Transaction failed:", error);

    res.status(500).json({
      error: "Failed to create project setup",
      details: error.message,
    });
  } finally {
    client.release();
  }
}

async function archiveProject(req, res) {
  const { project_id } = req.params;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updateStatusQuery = `
      UPDATE projects
      SET status = $1
      where id = $2
      RETURNING id, status;
    `;

    const projectResult = await client.query(updateStatusQuery, [
      "archived",
      project_id,
    ]);

    if (projectResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: `Project with ID ${project_id} not found.` });
    }

    const updateTasksQuery = `
      UPDATE tasks
      SET status = $1
      WHERE project_id = $2
      RETURNING id, status;
    `;
    const tasksResult = await client.query(updateTasksQuery, [
      "done",
      project_id,
    ]);

    res.status(200).json({
      message: "Project and all associated tasks successfully archived.",
      project: projectResult.rows[0],
      tasksUpdated: tasksResult.rowCount,
    });
  } catch (err) {
    await client.query("ROLLBACK");

    console.error("Error executing query : ", err);
    res.status(500).json({ Error: "Internal server error" });
  } finally {
    client.release();
  }
}

// 5.2

async function transferTasks(req, res) {
  const { project_id, fromUserId, toUserId } = req.params;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const usersExist = await client.query(
      "SELECT COUNT(id) FROM users WHERE id IN ($1, $2)",
      [fromUserId, toUserId]
    );

    if (parseInt(usersExist.rows[0].count, 10) !== 2) {
      throw new Error("One or both users do not exist");
    }

    const projectExist = await client.query(
      "SELECT COUNT(id) FROM projects WHERE id = $1",
      [project_id]
    );

    if (parseInt(projectExist.rows[0].count, 10) === 0) {
      throw new Error("Project does not exists");
    }

    const result = await client.query(
      "UPDATE tasks SET assignee_id = $1 where assignee_id = $2 AND project_id = $3 RETURNING id;",
      [toUserId, fromUserId, project_id]
    );

    // const tranferCount = result.rows.count;
    // console.log("transfer count : ", tranferCount);

    await client.query("COMMIT");

    res.status(200).json({ message: `Successfully transferred tasks.` });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during task transfer:", error);
    res.status(500).json({ error: error.message || "Task transfer failed" });
  } finally {
    client.release();
  }
}

// 5.3

async function bulkCreateTasks(req, res) {
  const { project_id } = req.params;
  const { tasksArray = [] } = req.body;

  if (!project_id || !Array.isArray(tasksArray) || tasksArray.length === 0) {
    return res.status(400).json({
      error:
        "Invalid input: project_id and a non-empty tasksArray are required.",
    });
  }

  const titles = [];
  const descriptions = [];
  const projectIDs = [];
  const assigneeIDs = [];
  const statuses = [];
  const priorities = [];
  const dueDates = [];

  for (const task of tasksArray) {
    titles.push(task.title);
    descriptions.push(task.description),
      projectIDs.push(task.project_id),
      assigneeIDs.push(task.assignee_id),
      statuses.push(task.status),
      priorities.push(task.priority),
      dueDates.push(task.due_date);
  }

  const insertQuery = `
    INSERT INTO tasks (title,description,project_id,assignee_id,status,priority,due_date)
    SELECT * 
    FROM UNNEST($1::TEXT[], $2::TEXT[], $3::INT[], $4::INT[], $5::TEXT[], $6::TEXT[], $7::DATE[]);   
`;
  const values = [
    titles,
    descriptions,
    projectIDs,
    assigneeIDs,
    statuses,
    priorities,
    dueDates,
  ];

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(insertQuery, values);

    await client.query("COMMIT");

    res.status(201).json({
      message: "Insert multiple tasks successfully",
      project_id: project_id,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Transaction failed:", error);

    res.status(500).json({
      error: "Failed to insert tasks : ",
      details: error.message,
    });
  } finally {
    client.release();
  }
}
export {
  createProjectWithSetup,
  archiveProject,
  transferTasks,
  bulkCreateTasks,
};
