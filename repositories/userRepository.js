import pool from "../db.js";

async function createUser(req, res) {
  try {
    const { email, username, password_hash, full_name, avatar_url } = req.body;
    const addQuery = await pool.query(
      `INSERT INTO users (email, username, password_hash, full_name, avatar_url) VALUES($1,$2,$3,$4,$5) RETURNING *;`,
      [email, username, password_hash, full_name, avatar_url]
    );
    //console.log(addQuery);
    res.json(addQuery.rows[0]);
  } catch (err) {
    console.error("create user error:", err.message);
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
    console.error("user get by id error : ", err.message);
  }
}

async function getUserByEmail(req, res) {
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
      `UPDATE users
       SET email = $1,
           username = $2,
           password_hash = $3,
           full_name = $4,
           avatar_url = $5
       WHERE id = $6`,
      [email, username, password_hash, full_name, avatar_url, id]
    );

    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error("User update error :", err.message);
    res.status(500).json(err.message);
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
    console.error("not delete user error : ", err.message);
  }
}

async function getAllUsers(req, res) {
  try {
    const allUserQuery = await pool.query("SELECT * FROM users");
    // console.log(allUserQuery)
    res.json(allUserQuery.rows);
  } catch (err) {
    console.error("Getting user error : ", err.message);
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
