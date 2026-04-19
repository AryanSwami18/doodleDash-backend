import type { Server } from "socket.io";
import { rooms } from "../store/roomStore.js";
import getRandomWord from "./getRandomWord.js";
export default function startRound(io: Server, roomId: string) {
  const room = rooms[roomId];
  if (!room) return;

  room.guessedPlayers = [];

  room.wordToDraw = getRandomWord();
  room.roundStartTime = Date.now();

  io.to(roomId).emit("clear-canvas");

  io.to(roomId).emit("round-start", {
    drawerId: room.currentDrawerId,
    wordLength: room.wordToDraw.length
  });

  const drawer = room.players.find(p => p.id === room.currentDrawerId);

  if (drawer?.socketId) {
    io.to(drawer.socketId).emit("your-word", {
      word: room.wordToDraw
    });

  }

}