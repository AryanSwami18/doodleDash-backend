import type { Server } from "socket.io";
import { rooms } from "../store/roomStore.js";
import startRound from "./startRound.js";

export default function tryStartGame(io: Server, roomId: string) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.players.length < 2) return;

    if (room.gameState != "waiting") return;

    console.log(`Starting game in room ${roomId}`);


    room.gameState = "in-progress";

    room.currentRound = 1;

    const firstPlayer = room.players[0];
    if (!firstPlayer) return;

    room.currentDrawerId = firstPlayer.id;

    startRound(io, roomId);
}