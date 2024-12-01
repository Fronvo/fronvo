// Environmental variables
import { configDotenv } from "dotenv";

configDotenv();

import express from "express";
import { createServer as createServerHTTP } from "http";

// Endpoints
import {
  changePassword,
  deleteAccount,
  generateAccessToken,
  login,
  register,
} from "./endpoints/auth";
import {
  fetchMe,
  data,
  sharePost,
  updateDM,
  updateFilter,
  updateNote,
  updateStatus,
} from "./endpoints/profiles";
import {
  createServer,
  deleteServer,
  editServer,
  joinServer,
  leaveServer,
  transferServer,
} from "./endpoints/servers";
import {
  regenerateInvite,
  disableInvite,
  enableInvite,
} from "./endpoints/invites";
import {
  createChannel,
  deleteChannel,
  editChannel,
} from "./endpoints/channels";
import {
  assignRole,
  createRole,
  deleteRole,
  editRole,
} from "./endpoints/roles";
import { banMember, kickMember, unbanMember } from "./endpoints/members";
import { createMessage, deleteMessage } from "./endpoints/messages";
import { getVersion, keepAlive } from "./endpoints/other";

// Middleware
import verifyJWT from "./middleware/verifyJWT";
import performanceChecker from "./middleware/performanceChecker";
import checkServer from "./middleware/checkServer";
import checkServerAdmin from "./middleware/checkServerOwner";
import checkChannelOwner from "./middleware/checkChannelOwner";
import checkRoleOwner from "./middleware/checkRoleOwner";
import checkChannel from "./middleware/checkChannel";
import checkMessageOwner from "./middleware/checkMessageOwner";

// Helpers
import setupSocketIO from "./other/setupSocketIO";
import startupChecks from "./other/startupChecks";

// Target PORT
const PORT = process.env.PORT || 3001;

// Initialise app
startupChecks();

const app = express();
const httpServer = createServerHTTP(app);
setupSocketIO(httpServer);

// Keep alive
app.get("/keep-alive", keepAlive);

// JSON requests only
app.use(express.json());

// Version
app.get("/version", getVersion);

// Performance checks
// @ts-ignore
app.use(performanceChecker);

// Authentication
app.post("/register", register);
app.post("/login", login);

// JWT required for the routes below this middleware
app.use(verifyJWT);

// Generate access token with refresh token
app.get("/token", generateAccessToken);

// Profiles
app.post("/me/password", changePassword);
app.get("/me", fetchMe);
app.post("/me/status", updateStatus);
app.post("/me/note", updateNote);
app.post("/me/post", sharePost);
app.post("/me/dm", updateDM);
app.post("/me/filter", updateFilter);
app.post("/me/data", data);

// Servers
app.post("/servers/create", createServer);
app.post("/servers/join", joinServer);
app.post("/servers/edit", checkServerAdmin, editServer);
app.delete("/servers/delete", checkServerAdmin, deleteServer);
app.delete("/servers/leave", checkServer, leaveServer);
app.post("/servers/transfer", checkServerAdmin, transferServer);

// Invites
app.post("/invites/regenerate", checkServerAdmin, regenerateInvite);
app.post("/invites/disable", checkServerAdmin, disableInvite);
app.post("/invites/enable", checkServerAdmin, enableInvite);

// Channels
app.post("/channels/create", checkServerAdmin, createChannel);
app.post("/channels/edit", checkChannelOwner, editChannel);
app.delete("/channels/delete", checkChannelOwner, deleteChannel);

// Roles
app.post("/roles/create", checkServerAdmin, createRole);
app.post("/roles/edit", checkRoleOwner, editRole);
app.post("/roles/assign", checkRoleOwner, assignRole);
app.delete("/roles/delete", checkRoleOwner, deleteRole);

// Members
app.post("/members/kick", checkServerAdmin, kickMember);
app.post("/members/ban", checkServerAdmin, banMember);
app.post("/members/unban", checkServerAdmin, unbanMember);

// Messages
app.post("/messages/create", checkChannel, createMessage);
app.post("/messages/delete", checkMessageOwner, deleteMessage);

// Other
app.delete("/login", deleteAccount);

// Start the server
httpServer.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

export default app;
