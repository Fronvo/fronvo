import { accounts, channels, member_messages, servers } from "@prisma/client";
import { RoleWithMembers } from "types";

declare global {
  namespace Express {
    interface Request {
      user: accounts;
      userId: string;
      server?: servers;
      serverId?: string;
      channel?: channels;
      channelId?: string;
      role?: RoleWithMembers;
      roleId?: string;
      message?: member_messages;
      messageId?: string;
    }
  }
}
