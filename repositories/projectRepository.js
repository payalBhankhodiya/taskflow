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

async function fetchProjectWithOwner(id) {
  const fetchQuery = {
    text: `
      SELECT 
        p.id AS project_id, 
        p.name, 
        p.description, 
        u.username AS owner_username,
        p.created_at
      FROM projects p
      INNER JOIN users u ON p.owner_id = u.id
      WHERE p.id = $1
    `,
    values: [id],
  };

  try {
    const res = await pool.query(fetchQuery);

    if (res.rows.length > 0) {
      console.log("Project fetched successfully:", res.rows[0]);
      return res.rows[0];
    } else {
      console.log(`No project found with ID: ${id}`);
      return null;
    }
  } catch (err) {
    console.error("Error executing query", err.message);
    throw err;
  }
}

async function getProjectsByUserId(id) {
  try {
    const query = "SELECT * FROM projects WHERE owner_id = $1";
    const values = [id];

    const result = await pool.query(query, values);

    return result.rows;
  } catch (error) {
    console.error("Error fetching projects for user ID:", id, error);
    throw error;
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
