import express from "express";
import bodyParser from "body-parser";

import {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  getAllUsers,
} from "./repositories/userRepository.js";
import {
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  getAllProjects,
} from "./repositories/projectRepository.js";

const app = express();
const PORT = 4500;

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/", (req, res) => {
  res.send("Hello Users!!!");
});

app.post("/api/users", createUser);
app.get("/api/users/:id", getUserById);
app.put("/api/users/:id", updateUser);
app.delete("/api/users/:id", deleteUser);
app.get("/api/users", getAllUsers);

app.post("/api/projects", createProject);
app.get("/api/projects/:id", getProjectById);
app.put("/api/projects/:id", updateProject);
app.delete("/api/projects/:id", deleteProject);
app.get("/api/projects", getAllProjects);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
