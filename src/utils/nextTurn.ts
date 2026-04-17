import type { Server } from "socket.io";
import { rooms } from "../store/roomStore.js";
import startRound from "./startRound.js";

export default function nextTurn(io: Server, roomId: string) {
    const room = rooms[roomId];
    if (!room) return;

    const currentDrawerIndex = room.players.findIndex(p => p.id === room.currentDrawerId);
    if (currentDrawerIndex === -1) return;

    const nextDrawerIndex = (currentDrawerIndex + 1) % room.players.length;
    const nextDrawer = room.players[nextDrawerIndex];

    if (!nextDrawer) return;

    if (room.players.length < 2) {
        room.gameState = "waiting";
        room.currentDrawerId = undefined;
        return;
    }

    room.currentDrawerId = nextDrawer.id;
    room.currentRound = (room.currentRound || 0) + 1;

    startRound(io, roomId);
}
