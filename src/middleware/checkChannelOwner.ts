import { NextFunction, Request, Response } from "express";
import { getParams, getServerMember, sendError } from "../utils";
import { prismaClient } from "../vars";
import { object } from "zod";
import { id as idSchema } from "../schemas";

export default async function checkChannelOwner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { id, channelId } = getParams(req, ["id", "channelId"]);

  const schemaResult = object({ id: idSchema, channelId: idSchema }).safeParse({
    id,
    channelId,
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

  const channel = await prismaClient.channels.findFirst({
    where: {
      id: channelId,
      server_id: server.id,
    },

    include: {
      member_messages: true,
      member_messages_pinned: true,
    },
  });

  if (!channel) {
    return sendError(404, res, "Channel not found");
  }

  req.server = server;
  req.serverId = server.id;
  req.channel = channel;
  req.channelId = channel.id;

  next();
}
