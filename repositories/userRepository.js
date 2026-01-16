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
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const offset = (page - 1) * limit;

  try {
    const query = "SELECT * FROM users ORDER BY id LIMIT $1 OFFSET $2";
    const values = [limit, offset];

    const allUserQuery = await pool.query(query, values);
    const users = allUserQuery.rows;

    const countQuery = "SELECT COUNT(*) FROM users;";
    const countResult = await pool.query(countQuery);
    const totalUsers = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalUsers / limit);
    const pagination = {
      page,
      limit,
      totalUsers,
      totalPages
    };

    res.json({
      data: users,
      pagination,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
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
