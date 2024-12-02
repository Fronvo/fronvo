import { Request, Response } from "express";
import { messageContent } from "../schemas";
import { getParams, sendError, sendSuccess } from "../utils";
import { prismaClient } from "../vars";
import { object } from "zod";

const messageSchema = object({
  content: messageContent,
});

export async function createMessage(req: Request, res: Response) {
  const { content } = getParams(req, ["content"]);

  const schemaResult = messageSchema.safeParse({ content });

  if (!schemaResult.success) {
    return sendError(400, res, schemaResult.error.errors, true);
  }

  const messageData = await prismaClient.member_messages.create({
    data: {
      content,
      profile_id: req.userId,
      channel_id: req.channelId,
      server_id: req.serverId,
    },

    select: {
      id: true,
      content: true,
      server_id: true,
      channel_id: true,
      profile_id: true,
      created_at: true,
    },
  });

  return sendSuccess(res, { messageData }, true);
}

export async function editMessage(req: Request, res: Response) {
  const { content } = getParams(req, ["content"]);

  const schemaResult = messageSchema.safeParse({ content });

  if (!schemaResult.success) {
    return sendError(400, res, schemaResult.error.errors, true);
  }

  const messageData = await prismaClient.member_messages.update({
    where: {
      id: req.messageId,
      channel_id: req.channelId,
      server_id: req.serverId,
    },

    data: {
      content,
      edited: true,
    },

    select: {
      id: true,
      content: true,
      server_id: true,
      channel_id: true,
      profile_id: true,
      created_at: true,
    },
  });

  return sendSuccess(res, { messageData }, true);
}

export async function deleteMessage(req: Request, res: Response) {
  // TODO: Imagekit channel folder

  await prismaClient.member_messages.delete({
    where: {
      id: req.messageId,
      channel_id: req.channelId,
      server_id: req.serverId,
    },
  });

  return sendSuccess(res, "Message deleted.");
}
