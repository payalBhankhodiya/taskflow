import pool from "../db.js";

async function createUser(req, res) {
  try {
    const { id, email, username, password_hash, full_name, avatar_url } =
      req.body;
    const addQuery = await pool.query(
      "INSERT INTO users ( id, email, username, password_hash, full_name, avatar_url) VALUES($1) RETURNING *",
      [id, email, username, password_hash, full_name, avatar_url]
    );
    res.json(addQuery.raws[0]);
  } catch {
    console.error(err.message);
  }
}
async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const userByIdQuery = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [id]
    );
    res.json(userByIdQuery.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
}

async function getUserByEmail(email) {
  try {
    const { email } = req.params;
    const userByEmailQuery = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    res.json(userByEmailQuery.rows[0]);
  } catch (error) {
    console.error(error);
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { email, username, password_hash, full_name, avatar_url } = req.body;

    const updatedUserQuery = await pool.query(
      "UPDATE users SET email, username, password_hash, full_name, avatar_url = $1 WHERE id= $2",
      [email, username, password_hash, full_name, avatar_url, id]
    );

    res.json("User has been updated");
  } catch (err) {
    console.error(err.message);
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const deleteUserQuery = await pool.query(
      "DELETE FROM users WHERE id = $1",
      [id]
    );
    res.json("User has been deleted");
  } catch (err) {
    console.error(err.message);
  }
}

async function getAllUsers(req, res) {
  try {
    const allUserQuery = await pool.query("SELECT * FROM users");
    res.json(allUserQuery.rows);
  } catch (err) {
    console.error(err.message);
  }
}

export {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  getAllUsers,
};
