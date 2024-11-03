import { Request, Response } from "express";
import { members, membersOptional, roleColor, roleName } from "../schemas";
import {
  updateRoleMembers,
  deleteServerRole,
  getParams,
  getServerMember,
  sendError,
  sendSuccess,
} from "../utils";
import { MAX_ROLES, prismaClient } from "../vars";
import { object } from "zod";

const createRoleSchema = object({
  name: roleName,
  color: roleColor,
  members: membersOptional,
});

const editRoleSchema = object({
  name: roleName,
  color: roleColor,
  members: membersOptional,
});

const assignRoleSchema = object({ members });

export async function createRole(req: Request, res: Response) {
  const { name, color, members } = getParams(req, ["name", "color", "members"]);

  const schemaResult = createRoleSchema.safeParse({
    name,
    color,
    members,
  });

  if (!schemaResult.success) {
    return sendError(400, res, schemaResult.error.errors, true);
  }

  const totalRoles = await prismaClient.roles.count({
    where: { server_id: req.serverId },
  });

  if (totalRoles >= MAX_ROLES) {
    return sendError(400, res, `Can't create more than ${MAX_ROLES} roles.`);
  }

  // Check members before creating
  if (members) {
    for (const member of members) {
      if (!(await getServerMember(req.serverId, member))) {
        return sendError(404, res, "Some members are not in this server.");
      }
    }
  }

  const roleData = await prismaClient.roles.create({
    data: {
      name,
      hex_color: color || "#000000",
      server_id: req.serverId,
    },

    select: {
      id: true,
      name: true,
      hex_color: true,
      server_id: true,
      created_at: true,
      member_roles: true,
    },
  });

  if (members) {
    await updateRoleMembers(req.serverId, roleData, members);
  }

  return sendSuccess(res, { roleData }, true);
}

export async function editRole(req: Request, res: Response) {
  const { name, color, members } = getParams(req, [
    "name",
    "color",
    "members",
  ]);

  const schemaResult = editRoleSchema.safeParse({
    name,
    color,
    members,
  });

  if (!schemaResult.success) {
    return sendError(400, res, schemaResult.error.errors, true);
  }

  // Check members before updating
  if (members) {
    for (const member of members) {
      if (!(await getServerMember(req.serverId, member))) {
        return sendError(404, res, "Some members are not in this server.");
      }
    }
  }

  const roleData = await prismaClient.roles.update({
    where: {
      id: req.roleId,
    },

    data: {
      name,
      hex_color: color || req.role.hex_color,
    },

    select: {
      id: true,
      name: true,
      hex_color: true,
      server_id: true,
      created_at: true,
    },
  });

  if (members) {
    await updateRoleMembers(req.serverId, req.role, members);
  }

  return sendSuccess(res, { roleData }, true);
}

export async function assignRole(req: Request, res: Response) {
  const { members } = getParams(req, ["members"]);

  const schemaResult = assignRoleSchema.safeParse({
    members,
  });

  if (!schemaResult.success) {
    return sendError(400, res, schemaResult.error.errors, true);
  }

  for (const member of members) {
    if (!(await getServerMember(req.serverId, member))) {
      return sendError(404, res, "Some members are not in this server.");
    }
  }

  await updateRoleMembers(req.serverId, req.role, members);

  return sendSuccess(res, "Role assigned to member(s).");
}

export async function deleteRole(req: Request, res: Response) {
  await deleteServerRole(req.serverId, req.roleId);

  return sendSuccess(res, "Role deleted.");
}
