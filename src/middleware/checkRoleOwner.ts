import { NextFunction, Request, Response } from "express";
import { getParams, getServerMember, sendError } from "../utils";
import { prismaClient } from "../vars";
import { object } from "zod";
import { id as idSchema } from "../schemas";

export default async function checkRoleOwner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { id, roleId } = getParams(req, ["id", "roleId"]);

  const schemaResult = object({ id: idSchema, roleId: idSchema }).safeParse({
    id,
    roleId,
  });

  if (!schemaResult.success) {
    return sendError(400, res, schemaResult.error.errors, true);
  }

  const server = await prismaClient.servers.findFirst({
    where: {
      id,
    },
  });

  if (!server) {
    return sendError(404, res, "Server not found");
  }

  if (!getServerMember(server.id, req.userId)) {
    return sendError(400, res, "You aren't in this server.");
  }

  if (server.owner_id !== req.userId) {
    return sendError(400, res, "You don't own this server.");
  }

  const role = await prismaClient.roles.findFirst({
    where: {
      id: roleId,
      server_id: server.id,
    },

    include: {
      member_roles: true,
    },
  });

  if (!role) {
    return sendError(404, res, "Role not found");
  }

  req.server = server;
  req.serverId = server.id;
  req.role = role;
  req.roleId = role.id;

  next();
}
