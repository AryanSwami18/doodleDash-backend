import { Server, Socket } from "socket.io";
import type { Room } from "../types/room.js";
import generateRoomId from "../utils/generateRoomId.js";

const rooms: Record<string, Room> = {};

interface CreateRoomPayload {
  playerId:string;
  name: string;
}

interface JoinRoomPayload {
  roomId: string;
  name: string;
  playerId:string;
}

export default function roomHandler(io: Server, socket: Socket) {
  /* CREATE ROOM */
  socket.on("create-room", ({ name,playerId }: CreateRoomPayload) => {    
    const roomId = generateRoomId();
    rooms[roomId] = {
      players: [], 
      gameState: "waiting" 
    };

    socket.join(roomId);
    
    rooms[roomId].players.push({ 
        id: playerId,
        socketId:socket.id, 
        name: name, 
        score: 0,
        isHost: true 
    });

    console.log(`Room created: ${roomId} by ${name}`);

    socket.emit("room-created", { roomId });
    
    io.to(roomId).emit("players-update", rooms[roomId].players);
  });

  socket.on("join-room", ({ roomId, name,playerId }: JoinRoomPayload) => {
    console.log(`Request to join join Room:${roomId} By ${playerId} - ${name}`);
    
    const room = rooms[roomId];

    if (!room) {
      socket.emit("room-not-found");
      return;
    }

    /* Prevent duplicate joins */
    const exiistingPlayer = room.players.find((p)=>p.id === playerId)

    if(exiistingPlayer){
      exiistingPlayer.socketId = socket.id;
      socket.join(roomId);
      io.to(roomId).emit("players-updated",room.players);
      return;
    }

    room.players.push({ id: playerId, name, score: 0, socketId: socket.id,isHost:false });

    socket.join(roomId);

    io.to(roomId).emit("players-update", room.players);
  });

  /* DISCONNECT */
  socket.on("disconnect", () => {
    for (const [roomId, room] of Object.entries(rooms)) {
      room.players = room.players.filter((p) => p.socketId !== socket.id);

      if (room.players.length === 0) {
        delete rooms[roomId];
      } else {
        io.to(roomId).emit("players-update", room.players);
      }
    }
  });
}
