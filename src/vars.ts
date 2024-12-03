import { PrismaClient } from "@prisma/client";
import { configDotenv } from "dotenv";
import ImageKit from "imagekit";
import { Resend } from "resend";
import { Server } from "socket.io";
import fetch from "node-fetch";

(async () => {
  // @ts-ignore
  globalThis.Headers = fetch.Headers;
})();

configDotenv();

export const prismaClient = new PrismaClient();
export const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY as string,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT as string,
});
export const resend = new Resend(process.env.RESEND_API_KEY);

// Other
export const MAX_SERVERS = 10;
export const MAX_CONCURRENT_SERVERS = 50;
export const MAX_CHANNELS = 20;
export const MAX_ROLES = 15;
export const MAX_PINS = 30;

// Socket.IO
export let server: Server;

export function setServer(serverVar: Server): Server {
  server = serverVar;

  return server;
}

export let associatedSockets: { socketId: string; accountId: string }[] = [];

export function addAssociatedSocket(socketId: string, accountId: string) {
  associatedSockets.push({ socketId, accountId });
}

export function removeAssociatedSocket(socketId: string) {
  associatedSockets = associatedSockets.filter((v) => v.socketId != socketId);
}
