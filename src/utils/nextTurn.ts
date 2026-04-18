import type { Server } from "socket.io";
import { rooms } from "../store/roomStore.js";
import startRound from "./startRound.js";

export default function nextTurn(io: Server, roomId: string) {
    const room = rooms[roomId];
    if (!room) return;

    const currentDrawerIndex = room.players.findIndex(
        p => p.id === room.currentDrawerId
    );
    if (currentDrawerIndex === -1) return;

    const nextDrawerIndex =
        (currentDrawerIndex + 1) % room.players.length;

    const nextDrawer = room.players[nextDrawerIndex];
    if (!nextDrawer) return;

    if (room.players.length < 2) {
        room.gameState = "waiting";
        room.currentDrawerId = undefined;
        return;
    }

    const isCycleComplete = nextDrawerIndex === 0;

    if (isCycleComplete) {
        const finishedRound = room.currentRound || 1;
        const nextRound = finishedRound + 1;


        io.to(roomId).emit("round-finished", {
            round: finishedRound,
            nextRound,
            players: room.players
        });

 
        setTimeout(() => {
            const updatedRoom = rooms[roomId];
            if (!updatedRoom) return;

            updatedRoom.currentDrawerId = nextDrawer.id;
            updatedRoom.currentRound = nextRound;

            startRound(io, roomId);
        }, 4000);

        return; 
    }


    room.currentDrawerId = nextDrawer.id;
    startRound(io, roomId);
}