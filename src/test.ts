import { v4 } from "uuid";
import server from "./api";
import supertest from "supertest";
import defaults from "superagent-defaults";
import { getNormalisedV4 } from "./utils";
import { channels, member_messages, roles, servers } from "@prisma/client";

const request = defaults(supertest(server));

// Account 1
const username = v4().substring(0, 30);
const profileId = getNormalisedV4().substring(0, 30);
const email = `${v4()}@gmail.com`;
const password = v4();
let accessToken = "";
let refreshToken = "";
let serverId = "";
let serverInvite = "";
let channelId = "";
let messageId = "";
let roleId = "";

// Account 2
const username2 = v4().substring(0, 30);
const profileId2 = getNormalisedV4().substring(0, 30);
const email2 = `${v4()}@gmail.com`;
const password2 = v4();
let accessToken2 = "";

describe("Authentication", () => {
  it("Register", async () => {
    const res = await request.post("/register").send({
      username,
      profileId,
      email,
      password,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body).toHaveProperty("id");

    const res2 = await request.post("/register").send({
      username: username2,
      profileId: profileId2,
      email: email2,
      password: password2,
    });

    expect(res2.status).toEqual(200);
    expect(res2.type).toEqual(expect.stringContaining("json"));
    expect(res2.body).toHaveProperty("accessToken");
    expect(res2.body).toHaveProperty("refreshToken");
    expect(res2.body).toHaveProperty("id");

    accessToken2 = `Bearer ${res2.body.accessToken}`;
  });

  it("Login", async () => {
    const res = await request.post("/login").send({
      email,
      password,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body).toHaveProperty("id");

    accessToken = `Bearer ${res.body.accessToken}`;
    refreshToken = `Bearer ${res.body.refreshToken}`;

    // For the accessToken test below
    request.set({
      Authorization: refreshToken,
    });
  });

  it("Regenerate access token", async () => {
    const res = await request.get("/token");

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty("accessToken");

    accessToken = `Bearer ${res.body.accessToken}`;

    request.set({
      Authorization: accessToken,
    });
  });
});

describe("Profiles", () => {
  it("Fetch self data", async () => {
    const res = await request.get("/me");

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));

    const profileData = res.body.profileData;

    expect(profileData).toBeDefined();

    expect(profileData.created_at).toBeDefined();
  });

  it("Update self status", async () => {
    const res = await request.post("/me/status").send({
      status: 1,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty("status");
  });

  it("Update self note", async () => {
    const res = await request.post("/me/note").send({
      note: "Example note",
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty("note");
  });

  it("Share post", async () => {
    const res = await request.post("/me/post").send({
      text: "Example post",
      attachment: `https://ik.imagekit.io/fronvo2/folder/user/3e1d39b5-1790-474b-88a2-728aa8342e89/`,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty("post");
  });

  it("Update DM preference", async () => {
    const res = await request.post("/me/dm").send({
      dmOption: 0,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty("success");
  });

  it("Update filter preference", async () => {
    const res = await request.post("/me/filter").send({
      filterOption: 0,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty("success");
  });
});

describe("Servers", () => {
  it("Create server", async () => {
    const res = await request.post("/servers/create").send({
      name: "Example server",
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));

    const serverData = res.body.serverData as servers;

    serverId = serverData.id;
    serverInvite = serverData.invite;
  });

  it("Join server", async () => {
    const res = await request
      .post("/servers/join")
      .send({
        invite: serverInvite,
      })
      .set({ Authorization: accessToken2 });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });

  it("Edit server", async () => {
    const res = await request.post("/servers/edit").send({
      id: serverId,
      name: "edited name",
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });

  it("Transfer server", async () => {
    const res = await request.post("/servers/transfer").send({
      id: serverId,
      memberId: profileId2,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));

    const res2 = await request
      .post("/servers/transfer")
      .send({
        id: serverId,
        memberId: profileId,
      })
      .set({ Authorization: accessToken2 });

    expect(res2.status).toEqual(200);
    expect(res2.type).toEqual(expect.stringContaining("json"));
  });

  it("Leave server", async () => {
    const res = await request
      .delete("/servers/leave")
      .send({
        id: serverId,
      })
      .set({ Authorization: accessToken2 });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));

    const res2 = await request
      .post("/servers/join")
      .send({
        invite: serverInvite,
      })
      .set({ Authorization: accessToken2 });

    expect(res2.status).toEqual(200);
    expect(res2.type).toEqual(expect.stringContaining("json"));
  });
});

describe("Invites", () => {
  it("Regenerate invite", async () => {
    const res = await request.post("/invites/regenerate").send({
      id: serverId,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));

    expect(res.body).toHaveProperty("invite");

    serverInvite = res.body.invite;
  });

  it("Disable invite", async () => {
    const res = await request.post("/invites/disable").send({
      id: serverId,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty("success");
  });

  it("Enable invite", async () => {
    const res = await request.post("/invites/enable").send({
      id: serverId,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty("success");
  });
});

describe("Channels", () => {
  it("Create channel", async () => {
    const res = await request.post("/channels/create").send({
      id: serverId,
      name: "general",
      description: "Channel description amazing",
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));

    const channelData = res.body.channelData as channels;
    channelId = channelData.id;
  });

  it("Edit channel", async () => {
    const res = await request.post("/channels/edit").send({
      id: serverId,
      channelId,
      name: "general",
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });
});

describe("Roles", () => {
  it("Create role", async () => {
    const res = await request.post("/roles/create").send({
      id: serverId,
      name: "test",
      color: "#123456",
      members: [profileId2],
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));

    const roleData = res.body.roleData as roles;
    roleId = roleData.id;
  });

  it("Edit role", async () => {
    const res = await request.post("/roles/edit").send({
      id: serverId,
      roleId,
      name: "Admin",
      color: "#ffffff",
      members: [profileId2],
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });

  it("Assign role", async () => {
    const res = await request.post("/roles/assign").send({
      id: serverId,
      roleId,
      members: [profileId, profileId2],
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });
});

describe("Members", () => {
  it("Kick member", async () => {
    const res = await request.post("/members/kick").send({
      id: serverId,
      memberId: profileId2,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));

    const res2 = await request
      .post("/servers/join")
      .send({
        invite: serverInvite,
      })
      .set({ Authorization: accessToken2 });

    expect(res2.status).toEqual(200);
    expect(res2.type).toEqual(expect.stringContaining("json"));
  });

  it("Ban member", async () => {
    const res = await request.post("/members/ban").send({
      id: serverId,
      memberId: profileId2,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });

  it("Unban member", async () => {
    const res = await request.post("/members/unban").send({
      id: serverId,
      memberId: profileId2,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });
});

describe("Messages", () => {
  it("Create message", async () => {
    const res = await request.post("/messages/create").send({
      id: serverId,
      channelId,
      content: "hello world",
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));

    const messageData = res.body.messageData as member_messages;
    messageId = messageData.id;
  });

  it("Edit message", async () => {
    const res = await request.post("/messages/edit").send({
      id: serverId,
      channelId,
      messageId,
      content: "hello world edit",
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });

  it("Pin message", async () => {
    const res = await request.post("/messages/pin").send({
      id: serverId,
      channelId,
      messageId,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });

  it("Unpin message", async () => {
    const res = await request.post("/messages/pin").send({
      id: serverId,
      channelId,
      messageId,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });

  it("Delete message", async () => {
    const res = await request.post("/messages/delete").send({
      id: serverId,
      channelId,
      messageId,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });
});

describe("Other", () => {
  it("Get version", async () => {
    const res = await request.get("/version");

    expect(res.status).toEqual(200);
  });

  it("Keep alive", async () => {
    const res = await request.get("/keep-alive");

    expect(res.status).toEqual(200);
  });
});

describe("Finalise", () => {
  it("Delete role", async () => {
    const res = await request.delete("/roles/delete").send({
      id: serverId,
      roleId,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty("success");
  });

  it("Delete channel", async () => {
    const res = await request.delete("/channels/delete").send({
      id: serverId,
      channelId,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty("success");
  });

  it("Delete server", async () => {
    const res = await request.delete("/servers/delete").send({
      id: serverId,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty("success");
  });

  it("Delete accounts", async () => {
    const res = await request.delete("/login").send({
      password,
    });

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty("success");

    const res2 = await request
      .delete("/login")
      .send({
        password: password2,
      })
      .set({ Authorization: accessToken2 });

    expect(res2.status).toEqual(200);
    expect(res2.type).toEqual(expect.stringContaining("json"));
    expect(res2.body).toHaveProperty("success");
  });
});
