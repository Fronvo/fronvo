import { Request, Response } from "express";
import { fromSchema, messageContent, toSchema } from "../schemas";
import { getMessagePinned, getParams, sendError, sendSuccess } from "../utils";
import { MAX_MESSAGES_LOADED, MAX_PINS, prismaClient } from "../vars";
import { object } from "zod";
import { member_messages_pinned } from "@prisma/client";
import { ServerAccount } from "types";

const messageSchema = object({
  content: messageContent,
});

const fetchMessagesSchema = object({
  from: fromSchema,
  to: toSchema,
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

export async function fetchMessages(req: Request, res: Response) {
  const { from, to } = getParams(req, ["from", "to"]);

  const schemaResult = fetchMessagesSchema.safeParse({ from, to });

  if (!schemaResult.success) {
    return sendError(400, res, schemaResult.error.errors, true);
  }

  if (from > to) {
    return sendError(400, res, "'from' can't be bigger than 'to'.");
  }

  if (to - from > MAX_MESSAGES_LOADED) {
    return sendError(
      400,
      res,
      `Can't fetch more than ${MAX_MESSAGES_LOADED} messages at once.`
    );
  }

  const messages = await prismaClient.member_messages.findMany({
    where: {
      channel_id: req.channelId,
      server_id: req.serverId,
    },

    skip: from,

    take: -(to - from),

    select: {
      id: true,
      content: true,
      server_id: true,
      channel_id: true,
      profile_id: true,
      created_at: true,
    },
  });

  let profileIds = messages.map((v) => v.profile_id);

  // Remove duplicates
  profileIds = profileIds.filter((v, i) => profileIds.indexOf(v) === i);

  // Add account promises
  const profileData: ServerAccount[] = [];

  await Promise.all(
    profileIds.map(async (v) => {
      const data = await prismaClient.accounts.findFirst({
        where: {
          id: v,
        },

        select: {
          id: true,
          avatar: true,
          banner: true,
          bio: true,
          created_at: true,
          last_note: true,
          last_status: true,
          username: true,
          member_servers: true,
          member_roles: true,
        },
      });

      const {
        id,
        avatar,
        banner,
        bio,
        created_at,
        last_note,
        last_status,
        username,
      } = data;

      const server_username = data.member_servers.filter(
        (v) => v.server_id === req.serverId
      )[0].server_username;

      const server_avatar = data.member_servers.filter(
        (v) => v.server_id === req.serverId
      )[0].server_avatar;

      const roles = data.member_roles
        .filter((v) => v.server_id === req.serverId)
        .map((v) => v.role_id);

      const finalData: ServerAccount = {
        id,
        avatar,
        banner,
        bio,
        created_at,
        last_note,
        last_status,
        username,
        server_username,
        server_avatar,
        roles,
      };

      profileData.push(finalData);
    })
  );

  return sendSuccess(res, { messages, profileData }, true);
}

export async function pinMessage(req: Request, res: Response) {
  const messagePinned = await getMessagePinned(
    req.serverId,
    req.channelId,
    req.messageId
  );

  const pinnedMessageData: Partial<member_messages_pinned> = {
    message_id: req.messageId,
    channel_id: req.channelId,
    server_id: req.serverId,
  };

  if (messagePinned) {
    return sendError(400, res, "Message already pinned.");
  }

  if (req.channel.member_messages_pinned.length >= MAX_PINS) {
    return sendError(
      400,
      res,
      `Can\'t pin more than ${MAX_PINS} messages in a channel.`
    );
  }

  await prismaClient.member_messages_pinned.create({
    data: pinnedMessageData,
  });

  return sendSuccess(res, "Message pinned.");
}

export async function unpinMessage(req: Request, res: Response) {
  const messagePinned = await getMessagePinned(
    req.serverId,
    req.channelId,
    req.messageId
  );

  if (!messagePinned) {
    return sendError(400, res, "Message is not pinned.");
  }

  const pinnedMessageData: Partial<member_messages_pinned> = {
    message_id: req.messageId,
    channel_id: req.channelId,
    server_id: req.serverId,
  };

  await prismaClient.member_messages_pinned.deleteMany({
    where: pinnedMessageData,
  });

  return sendSuccess(res, "Message unpinned.");
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
