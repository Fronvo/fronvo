import { accounts, member_messages, servers } from "@prisma/client";
import { ChannelWithMessages, RoleWithMembers } from "types";

declare global {
  namespace Express {
    interface Request {
      user: accounts;
      userId: string;
      server?: servers;
      serverId?: string;
      channel?: ChannelWithMessages;
      channelId?: string;
      role?: RoleWithMembers;
      roleId?: string;
      message?: member_messages;
      messageId?: string;
    }
  }
}
