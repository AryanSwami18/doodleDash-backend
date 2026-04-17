import { Server } from "socket.io";
import { rooms } from "../store/roomStore.js";
import nextTurn from "./nextTurn.js"; 
export default function endRound(io: Server, roomId: string) {
    const room = rooms[roomId];
    if(!room) return;

    if(room.roundEnding) return;

    room.roundEnding = true;

    io.to(roomId).emit("round-end",{
        word:room.wordToDraw
    });


    setTimeout(()=>{
        room.roundEnding = false;
        nextTurn(io,roomId);
    },4000);
}
    