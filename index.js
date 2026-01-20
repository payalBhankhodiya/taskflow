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
  fetchProjectWithOwner,
  getProjectsByUserId,
} from "./repositories/projectRepository.js";

import {
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
} from "./repositories/taskRepository.js";

import {
  getHighPerformers,
  getLatestTaskPerProject,
  getProjectMemberStats,
  getProjectTaskStats,
  getProjectWithTaskCounts,
  getUnassignedUsers,
  searchTasks,
} from "./repositories/statsRepository.js";

import {
  archiveProject,
  bulkCreateTasks,
  createProjectWithSetup,
  transferTasks,
} from "./services/projectService.js";
import { getCompletionTrend, getProjectReport, getTaskSequence, getUserRankings } from "./services/otherServices.js";

const app = express();
const PORT = 4500;

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

app.get("/", (req, res) => {
  res.send("Hello Users!!!");
});

app.post("/api/users", createUser);
app.get("/api/users/:id", getUserById);
app.post("/api/users/:email", getUserByEmail);
app.patch("/api/users/:id", updateUser);
app.delete("/api/users/:id", deleteUser);
app.get("/api/users", getAllUsers);

app.post("/api/projects", createProject);
app.get("/api/projects/:id", getProjectById);
app.patch("/api/projects/:id", updateProject);
app.delete("/api/projects/:id", deleteProject);
app.get("/api/projects", getAllProjects);
app.get("/api/projects/owner/:owner_id", fetchProjectWithOwner);
app.get("/api/projects/users/:owner_id", getProjectsByUserId);

app.post("/api/tasks", createTask);
app.get("/api/tasks/:id", getTaskById);
app.patch("/api/tasks/:id", updateTask);
app.delete("/api/tasks/:id", deleteTask);
app.get("/api/tasks", getAllTask);
app.get("/api/projects/:project_id/tasks", getTaskByProject);
app.get("/api/users/:assignee_id/tasks", getTaskByAssignee);
app.post("/api/tasks/addLabel", addLabelFromTask);
app.delete("/api/tasks/:task_id/removeLabel/:label_id", removeLabelFromTask);
app.get("/api/tasks/labels/:id", getTaskByIdWithLabels);
app.get("/api/labels/:label_id/tasks", getTasksByLabel);

app.get("/api/projects/taskStats/:project_id", getProjectTaskStats);
app.get("/api/project/memberStats/:project_id", getProjectMemberStats);
app.get("/api/projects/tasks/count", getProjectWithTaskCounts);

app.get("/api/search/tasks", searchTasks);

app.get("/api/unassign/users", getUnassignedUsers);
app.get("/api/latestTask/projects", getLatestTaskPerProject);
app.get("/api/performers/tasks", getHighPerformers);

// Phase : 5.1

app.get("/api/create/project", createProjectWithSetup);
app.get("/api/archive/project/:project_id", archiveProject);

// Phase : 5.2

app.get("/api/transfer/tasks/:project_id/:fromUserId/:toUserId", transferTasks);

// Phase : 5.3

app.post("/api/bulk/tasks/:project_id", bulkCreateTasks);

// Phase : 6.3

app.get("/api/report/projects/:project_id", getProjectReport);

// Phase : 6.4

app.get("/api/ranking/users/:project_id", getUserRankings);
app.get("/api/completion/tasks/:project_id", getCompletionTrend);
app.get("/api/sequence/tasks/:project_id", getTaskSequence);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
