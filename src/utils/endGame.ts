import type { Server } from "socket.io";
import { rooms } from "../store/roomStore.js";

export default function endGame(io:Server,roomId:string){
    const room = rooms[roomId];
    if(!room) return;


    room.gameState = "finished";


    const leaderBoard = [...room.players].sort((a,b) => b.score-a.score);

    io.to(roomId).emit("game-ended",{
        leaderBoard
    });


    console.log(`Game ended in room ${roomId}`);
    
    
}