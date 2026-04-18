import type { Room } from "../types/room.js";

export default function restartGame(room:Room){
    room.gameState = "waiting";
    room.currentRound = 0;
    room.currentDrawerId = undefined;
    room.wordToDraw = undefined;
    room.guessedPlayers = [];
    room.players.forEach(p => p.score = 0);
}