import pool from "../db.js";

async function createProject(req, res) {
  try {
    const { name, description, owner_id, status, deadline } = req.body;
    const addProjectQuery = await pool.query(
      "INSERT INTO projects (name, description, owner_id, status, deadline) VALUES($1,$2,$3,$4,$5) RETURNING *",
      [name, description, owner_id, status, deadline]
    );
    res.json(addProjectQuery.rows[0]);
  } catch {
    console.error(err.message);
  }
}
async function getProjectById(req, res) {
  try {
    const { id } = req.params;
    const projectByIdQuery = await pool.query(
      "SELECT * FROM projects WHERE id = $1",
      [id]
    );
    res.json(projectByIdQuery.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
}

// async function getProjectsByEmail(email) {

//   try{
//     const { email } = req.params;
//     const userByEmailQuery = await pool.query('SELECT * FROM projects WHERE email = $1', [email]);
//     res.json(userByEmailQuery.rows[0]);
//   } catch(error) {
//       console.error(error);
//    }

// };

async function updateProject(req, res) {
  try {
    const { id } = req.params;
    const { name, description, owner_id, status, deadline } = req.body;

    const updatedProjectQuery = await pool.query(
      `UPDATE projects
       SET name = $1,
           description = $2,
           owner_id = $3,
           status = $4,
           deadline = $5
       WHERE id = $6`,
      [name, description, owner_id, status, deadline, id]
    );

    res.json({ message: "Project updated successfully" });
  } catch (err) {
    console.error(err.message);
  }
}

async function deleteProject(req, res) {
  try {
    const { id } = req.params;
    const deleteProjectQuery = await pool.query(
      "DELETE FROM projects WHERE id = $1",
      [id]
    );
    res.json("Project has been deleted");
  } catch (err) {
    console.error(err.message);
  }
}

async function getAllProjects(req, res) {
  try {
    const allProjectsQuery = await pool.query("SELECT * FROM projects");
    res.json(allProjectsQuery.rows);
  } catch (err) {
    console.error(err.message);
  }
}

async function fetchProjectWithOwner(req, res) {
  const { owner_id } = req.params;

  const fetchQuery = `
      SELECT p.id,p.name,p.description,p.owner_id,p.status,p.deadline ,p.created_at,p.updated_at, u.username
      FROM projects p
      INNER JOIN users u ON p.owner_id = u.id
      WHERE u.id = $1
    `;

  try {
    const result = await pool.query(fetchQuery, [owner_id]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getProjectsByUserId(req, res) {
  const { owner_id } = req.params;

  const query = "SELECT * FROM projects WHERE owner_id = $1";

  try {
    const result = await pool.query(query, [owner_id]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export {
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  getAllProjects,
  fetchProjectWithOwner,
  getProjectsByUserId,
};
