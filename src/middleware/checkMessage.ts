import { NextFunction, Request, Response } from "express";
import { getParams, getServerMember, sendError } from "../utils";
import { prismaClient } from "../vars";
import { object } from "zod";
import { id as idSchema } from "../schemas";

export default async function checkMessage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { id, channelId, messageId } = getParams(req, [
    "id",
    "channelId",
    "messageId",
  ]);

  const schemaResult = object({
    id: idSchema,
    channelId: idSchema,
    messageId: idSchema,
  }).safeParse({
    id,
    channelId,
    messageId,
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

  const channel = await prismaClient.channels.findFirst({
    where: {
      id: channelId,
      server_id: server.id,
    },
  });

  if (!channel) {
    return sendError(404, res, "Channel not found");
  }

  const message = await prismaClient.member_messages.findFirst({
    where: {
      id: messageId,
      channel_id: channelId,
      server_id: server.id,
    },
  });

  if (!message) {
    return sendError(404, res, "Message not found");
  }

  req.server = server;
  req.serverId = server.id;
  req.channel = channel;
  req.channelId = channel.id;
  req.message = message;
  req.messageId = message.id;

  next();
}
