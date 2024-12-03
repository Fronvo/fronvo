import { Request, Response } from "express";
import {
  getParams,
  informProfile,
  sendEmail,
  sendError,
  sendSuccess,
} from "../utils";
import { imagekit, prismaClient } from "../vars";
import {
  accounts,
  channels,
  member_messages,
  member_messages_pinned,
  member_roles,
  servers,
} from "@prisma/client";
import { DMOption, FilterOption, LastStatus } from "types";
import { differenceInHours, differenceInMonths } from "date-fns";
import { object } from "zod";
import {
  attachment,
  dmOption,
  filterOption,
  note,
  status,
  text,
} from "../schemas";
import { v4 } from "uuid";

interface FetchedDM {
  id: string;
  last_message_at: string;
  other_user: accounts;
}

interface FetchedAccount extends accounts {
  status: LastStatus;
  note: string;
  dm_option: DMOption;
  filter_option: FilterOption;
  dms: FetchedDM[];
  servers: servers[];
}

interface FetchedChannels extends channels {
  member_messages: member_messages[];
  member_messages_pinned: member_messages_pinned[];
}

const updateStatusSchema = object({ status });

const updateNoteSchema = object({ note });

const sharePostSchema = object({ text, attachment });

const updateDMOptionSchema = object({ dmOption });

const updateFilterOptionSchema = object({ filterOption });

export async function fetchMe(req: Request, res: Response) {
  const {
    id,
    username,
    bio,
    avatar,
    banner,
    created_at,
    last_note,
    last_note_d,
    last_status,
    dm_option,
    filter_option,
    last_data_req,
  } = await prismaClient.accounts.findFirst({
    where: {
      id: req.userId,
    },

    select: {
      id: true,
      username: true,
      bio: true,
      avatar: true,
      banner: true,
      created_at: true,
      last_note: true,
      last_note_d: true,
      last_status: true,
      dm_option: true,
      filter_option: true,
      last_data_req: true,
    },
  });

  const profileData: Partial<FetchedAccount> = {
    id,
    username,
    bio,
    avatar,
    banner,
    created_at,
    status: last_status as LastStatus,
    dm_option: dm_option as DMOption,
    filter_option: filter_option as FilterOption,
    last_data_req,
  };

  // Note expires after 24 hours
  if (
    last_note &&
    last_note_d &&
    differenceInHours(new Date(), new Date(last_note_d)) < 24
  ) {
    profileData.note = last_note;
  }

  // const dms = await prismaClient.dms.findMany({
  //   where: {
  //     users: {
  //       has: id,
  //     },
  //   },

  //   orderBy: {
  //     last_message_at: "desc",
  //   },
  // });

  // profileData.dms = await Promise.all(
  //   dms.map(async (v) => {
  //     return {
  //       id: v.id,
  //       last_message_at: v.last_message_at.toString(),
  //       other_user: await prismaClient.accounts.findFirst({
  //         where: {
  //           id: v.users.find((v2) => v2 !== id),
  //         },
  //       }),
  //     };
  //   })
  // );

  const profileServersIds = (
    await prismaClient.member_servers.findMany({
      where: {
        profile_id: profileData.id,
      },

      select: {
        server_id: true,
      },
    })
  ).map((v) => v.server_id);

  profileData.servers = await prismaClient.servers.findMany({
    where: {
      id: {
        in: profileServersIds,
      },
    },

    orderBy: {
      created_at: "desc",
    },

    include: {
      channels: {
        include: {
          member_messages: true,
          member_messages_pinned: true,
        },

        orderBy: {
          created_at: "asc",
        },
      },
      roles: {
        orderBy: {
          created_at: "asc",
        },
      },
      member_servers: {
        include: {
          accounts: {
            select: {
              avatar: true,
              banner: true,
              username: true,
              bio: true,
              created_at: true,
              member_roles: true,
            },
          },
        },
        orderBy: {
          joined_at: "desc",
        },
      },
      member_servers_banned: {
        include: {
          accounts: {
            select: {
              avatar: true,
              banner: true,
              username: true,
              bio: true,
              created_at: true,
            },
          },
        },
        orderBy: {
          banned_at: "desc",
        },
      },
    },
  });

  profileData.servers = profileData.servers.map(
    // @ts-ignore
    ({ member_servers_banned, member_servers, channels, ...v }) => {
      return {
        ...v,
        members: (
          member_servers as {
            id: string;
            server_username: string;
            server_avatar: string;
            joined_at: string;
            profile_id: string;
            server_id: string;
            accounts: {
              avatar: string;
              banner: string;
              username: string;
              bio: string;
              created_at: string;
              member_roles: member_roles[];
            };
          }[]
        ).map(({ id, server_id, profile_id, accounts, ...member }) => {
          const { member_roles, ...finalAccounts } = { ...accounts };

          return {
            ...member,
            ...finalAccounts,
            roles: accounts.member_roles.filter(
              (role) => role.server_id === server_id
            ),
            id: profile_id,
          };
        }),
        banned_members: (
          member_servers_banned as {
            id: string;
            server_username: string;
            server_avatar: string;
            banned_at: string;
            profile_id: string;
            server_id: string;
            accounts: {
              avatar: string;
              banner: string;
              username: string;
              bio: string;
              created_at: string;
            };
          }[]
        ).map(({ id, server_id, profile_id, accounts, ...member }) => {
          return { ...member, ...accounts, id: profile_id };
        }),
        channels: (channels as FetchedChannels[])?.map(
          ({ member_messages, member_messages_pinned, ...channel }) => {
            return {
              messages: member_messages,
              pinned_messages: member_messages_pinned,
              ...channel,
            };
          }
        ),
      };
    }
  );

  return sendSuccess(
    res,
    {
      profileData,
    },
    true
  );
}

// TODO
// export async function fetchHomePosts(req: Request, res: Response) {
//   const homePosts = await prismaClient.posts.findMany({
//     where: {
//       post_creator: {
//         in: req.user.following,
//       },
//     },
//   });

//   return sendSuccess(res, { homePosts }, true);
// }

export async function updateStatus(req: Request, res: Response) {
  const { status } = getParams(req, ["status"]);

  const schemaResult = updateStatusSchema.safeParse({ status });

  if (!schemaResult.success) {
    return sendError(400, res, schemaResult.error.errors, true);
  }

  await prismaClient.accounts.update({
    where: {
      id: req.userId,
    },

    data: {
      last_status: status,
    },
  });

  informProfile(req.userId, "statusUpdated", { status });

  return sendSuccess(res, { status }, true);
}

export async function updateNote(req: Request, res: Response) {
  const { note } = getParams(req, ["note"]);

  const schemaResult = updateNoteSchema.safeParse({ note });

  if (!schemaResult.success) {
    return sendError(400, res, schemaResult.error.errors, true);
  }

  await prismaClient.accounts.update({
    where: {
      id: req.userId,
    },

    data: {
      last_note: note,
      last_note_d: new Date(),
    },
  });

  informProfile(req.userId, "noteUpdated", { note });

  return sendSuccess(res, { note }, true);
}

export async function sharePost(req: Request, res: Response) {
  const { text, attachment } = getParams(req, ["text", "attachment"]);

  const schemaResult = sharePostSchema.safeParse({ text, attachment });

  if (!schemaResult.success) {
    return sendError(400, res, schemaResult.error.errors, true);
  }

  const post = await prismaClient.posts.create({
    data: {
      text,
      attachment,
      profile_id: req.userId,
    },

    select: {
      id: true,
      text: true,
      attachment: true,
      posted_at: true,
      profile_id: true,
    },
  });

  informProfile(req.userId, "postShared", { post });

  return sendSuccess(res, { post }, true);
}

export async function updateDM(req: Request, res: Response) {
  const { dmOption } = getParams(req, ["dmOption"]);

  const schemaResult = updateDMOptionSchema.safeParse({ dmOption });

  if (!schemaResult.success) {
    return sendError(400, res, schemaResult.error.errors, true);
  }

  await prismaClient.accounts.update({
    where: {
      id: req.userId,
    },

    data: {
      dm_option: dmOption as DMOption,
    },
  });

  return sendSuccess(res, "DM Option updated.");
}

export async function updateFilter(req: Request, res: Response) {
  const { filterOption } = getParams(req, ["filterOption"]);

  const schemaResult = updateFilterOptionSchema.safeParse({ filterOption });

  if (!schemaResult.success) {
    return sendError(400, res, schemaResult.error.errors, true);
  }

  await prismaClient.accounts.update({
    where: {
      id: req.userId,
    },

    data: {
      filter_option: filterOption as FilterOption,
    },
  });

  return sendSuccess(res, "Filter Option updated.");
}

export async function data(req: Request, res: Response) {
  const profileData = await prismaClient.accounts.findFirst({
    where: {
      id: req.userId,
    },

    select: {
      id: true,
      email: true,
      username: true,
      bio: true,
      avatar: true,
      banner: true,
      created_at: true,
      last_note: true,
      last_note_d: true,
      last_status: true,
      dm_option: true,
      filter_option: true,
      last_data_req: true,
      posts: true,
      servers: true,
    },
  });

  if (profileData.last_data_req) {
    if (differenceInMonths(new Date(), profileData.last_data_req) === 0) {
      return sendError(
        400,
        res,
        "You have requested your data in the past 30 days."
      );
    }
  }

  // Upload to imagekit
  const file = await imagekit.upload({
    file: btoa(JSON.stringify(profileData)),
    fileName: `${v4()}.json`,
    folder: "data",
    useUniqueFileName: false,
  });

  sendEmail(profileData.email, "Your Fronvo data", [
    `Your profile data is located at: ${file.url}`,
    "Remember not to share this link elsewhere!",
  ]);

  await prismaClient.accounts.update({
    where: {
      id: profileData.id,
    },

    data: {
      last_data_req: new Date(),
    },
  });

  return sendSuccess(res, "Data sent");
}
