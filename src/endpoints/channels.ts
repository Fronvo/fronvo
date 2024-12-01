import { Request, Response } from "express";
import { channelName, description } from "../schemas";
import { getParams, sendError, sendSuccess } from "../utils";
import { MAX_CHANNELS, prismaClient } from "../vars";
import { object } from "zod";

const createChannelSchema = object({ name: channelName, description });

const editChannelSchema = object({
  name: channelName,
  description,
});

export async function createChannel(req: Request, res: Response) {
  const { name, description } = getParams(req, ["name", "description"]);

  const schemaResult = createChannelSchema.safeParse({ name, description });

  if (!schemaResult.success) {
    return sendError(400, res, schemaResult.error.errors, true);
  }

  const totalChannels = await prismaClient.channels.count({
    where: { server_id: req.serverId },
  });

  if (totalChannels >= MAX_CHANNELS) {
    return sendError(
      400,
      res,
      `Can't create more than ${MAX_CHANNELS} channels.`
    );
  }

  const channelData = await prismaClient.channels.create({
    data: {
      name,
      description,
      server_id: req.serverId,
    },

    select: {
      id: true,
      name: true,
      description: true,
      server_id: true,
      created_at: true,
    },
  });

  return sendSuccess(res, { channelData }, true);
}

export async function editChannel(req: Request, res: Response) {
  const { name, description } = getParams(req, ["name", "description"]);

  const schemaResult = editChannelSchema.safeParse({
    name,
    description,
  });

  if (!schemaResult.success) {
    return sendError(400, res, schemaResult.error.errors, true);
  }

  const channelData = await prismaClient.channels.update({
    where: {
      id: req.channelId,
    },

    data: {
      name,
      description:
        description !== undefined ? description : req.channel.description,
    },

    select: {
      id: true,
      name: true,
      description: true,
      created_at: true,
    },
  });

  return sendSuccess(res, { channelData }, true);
}

export async function deleteChannel(req: Request, res: Response) {
  await prismaClient.member_messages.deleteMany({
    where: {
      channel_id: req.channelId,
    },
  });

  // TODO: Imagekit channel folder

  await prismaClient.channels.delete({
    where: {
      id: req.channelId,
      server_id: req.serverId,
    },
  });

  return sendSuccess(res, "Channel deleted.");
}
