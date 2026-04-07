import {Server} from "@hocuspocus/server";
import {Logger} from "@hocuspocus/extension-logger";
import {Database} from "@hocuspocus/extension-database";
import * as jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import {getRoomMembership,loadYjsDocument,storeYjsDocument} from "./db";

dotenv.config();

const AUTH_SECRET=process.env.AUTH_SECRET!;
const PORT=parseInt(process.env.PORT||"1234");

if(!AUTH_SECRET) throw new Error("AUTH_SECRET is not set in .env");

interface TokenPayload{
  userId:string;
  roomCode:string;
  role:"ADMIN"|"MEMBER";
  canWrite:boolean;
  canVideo:boolean;
}

const server=new Server({
  port:PORT,
  extensions:[
    new Logger(),
    new Database({
      fetch:async({documentName})=>{
        console.log(`[DB] Loading document: ${documentName}`);
        const doc=await loadYjsDocument(documentName);
        return doc??null;
      },
      store:async({documentName,state})=>{
        console.log(`[DB] Storing document: ${documentName}`);
        await storeYjsDocument(documentName,state);
      }
    })
  ],
  async onAuthenticate(data){
    const {token,documentName,connection}=data as any;
    const roomCode=documentName;
    if(!token) throw new Error("No token provided");
    let payload:TokenPayload;
    try{
      payload=jwt.verify(token,AUTH_SECRET) as TokenPayload;
    }catch(err){
      console.error("[AUTH] JWT verification failed:",err);
      throw new Error("Invalid token");
    }
    if(payload.roomCode!==roomCode) throw new Error("Token does not match this room");
    const membership=await getRoomMembership(payload.userId,roomCode);
    if(!membership) throw new Error("User is not a member of this room");
    const canWrite=membership.role==="ADMIN"||membership.canWrite;
    connection.readOnly=!canWrite;
    console.log(`[AUTH] ✅ User ${payload.userId} authenticated for room ${roomCode} | role: ${membership.role} | readOnly: ${!canWrite}`);
    return {
      userId:payload.userId,
      roomCode,
      role:membership.role,
      canWrite,
      canVideo:membership.role==="ADMIN"||membership.canVideo
    };
  },
  async onConnect(data){
    console.log(`[WS] Client connected to room: ${data.documentName}`);
  },
  async onDisconnect(data){
    console.log(`[WS] Client disconnected from room: ${data.documentName}`);
  }
});

server.listen().then(()=>{
  console.log(`✅ Hocuspocus server listening on port ${PORT}`);
});

//collab-board\apps\hocuspocus\src\server.ts