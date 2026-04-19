import { Server } from "socket.io";
import { rooms } from "../store/roomStore.js";
import nextTurn from "./nextTurn.js"; 
import endGame from "./endGame.js";
export default function endRound(io: Server, roomId: string) {
    const room = rooms[roomId];
    if(!room) return;

    if(room.roundEnding) return;

    room.roundEnding = true;

    console.log("ROUND END TRIGGERED", roomId);

    io.to(roomId).emit("round-end",{
        word:room.wordToDraw
    });

    
    


    setTimeout(()=>{
        room.roundEnding = false;

        if(room.currentRound! >= room.rounds!){
            endGame(io, roomId);
            return;
        }
        nextTurn(io,roomId);
    },4000);
}
    