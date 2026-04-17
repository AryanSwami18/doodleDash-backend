import type { Server } from "socket.io";
import { rooms } from "../store/roomStore.js";

export default function startRound(io: Server, roomId: string) {
  const room = rooms[roomId];
  if (!room) return;

  room.guessedPlayers = [];

  // TEMP: static word
  room.wordToDraw = "apple";

  io.to(roomId).emit("round-start", {
    drawerId: room.currentDrawerId
  });
}