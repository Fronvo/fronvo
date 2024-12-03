import {
  channels,
  member_messages,
  member_messages_pinned,
  member_roles,
  roles,
} from "@prisma/client";

export type LastStatus = 0 | 1 | 2 | 3;
export type OnlineStatus = "Online" | "Do Not Disturb" | "Idle" | "Offline";

export type DMOption = 0 | 1;
export type DMSetting = "Everyone" | "Friends";

export type FilterOption = 0 | 1;
export type FilterSetting = "Everything" | "Nothing";

export type Namespaces = "profiles" | "servers" | "dms";

export type SocketEvents =
  | "statusUpdated"
  | "noteUpdated"
  | "postShared"
  | "serverCreated";

export type RoleWithMembers = roles & { member_roles: member_roles[] };

export interface ChannelWithMessages extends channels {
  member_messages: member_messages[];
  member_messages_pinned: member_messages_pinned[];
}
