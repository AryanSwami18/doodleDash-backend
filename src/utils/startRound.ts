import type { Server } from "socket.io";
import { rooms } from "../store/roomStore.js";

export default function startRound(io: Server, roomId: string) {
  const room = rooms[roomId];
  if (!room) return;

  room.guessedPlayers = [];

  room.wordToDraw = "apple";

  io.to(roomId).emit("clear-canvas");

  io.to(roomId).emit("round-start", {
    drawerId: room.currentDrawerId,
  });
}