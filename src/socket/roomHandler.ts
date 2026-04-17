import { Server, Socket } from "socket.io";
import type { Room } from "../types/room.js";
import generateRoomId from "../utils/generateRoomId.js";
import { rooms } from "../store/roomStore.js";
import tryStartGame from "../utils/tryStartGame.js";
import endRound from "../utils/endRound.js";


interface CreateRoomPayload {
  playerId: string;
  name: string;
}

interface JoinRoomPayload {
  roomId: string;
  name: string;
  playerId: string;
}

interface SendMessagePayload {
  roomId: string;
  message: string;
}

export default function roomHandler(io: Server, socket: Socket) {
  /* CREATE ROOM */
  socket.on("create-room", ({ name, playerId }: CreateRoomPayload) => {
    const roomId = generateRoomId();
    rooms[roomId] = {
      players: [],
      gameState: "waiting"
    };

    socket.join(roomId);

    rooms[roomId].players.push({
      id: playerId,
      socketId: socket.id,
      name: name,
      score: 0,
      isHost: true
    });

    console.log(`Room created: ${roomId} by ${name}`);

    socket.emit("room-created", { roomId });

    io.to(roomId).emit("players-update", rooms[roomId].players);
  });

  socket.on("join-room", ({ roomId, name, playerId }: JoinRoomPayload) => {
    console.log(`Request to join join Room:${roomId} By ${playerId} - ${name}`);

    const room = rooms[roomId];

    if (!room) {
      socket.emit("room-not-found");
      return;
    }

    /* Prevent duplicate joins */
    const exiistingPlayer = room.players.find((p) => p.id === playerId)

    if (exiistingPlayer) {
      exiistingPlayer.socketId = socket.id;
      socket.join(roomId);
      io.to(roomId).emit("players-update", room.players);
      return;
    }

    room.players.push({ id: playerId, name, score: 0, socketId: socket.id, isHost: false });

    socket.join(roomId);

    io.to(roomId).emit("players-update", room.players);
    tryStartGame(io, roomId);
  });


  socket.on("send-message", ({ roomId, message }: SendMessagePayload) => {
    const room: any = rooms[roomId];
    if (!room) {
      socket.emit("room-not-found");
      return;
    };

    const player = room.players.find((p: { socketId: string; }) => p.socketId === socket.id);

    if (!player) {
      socket.emit("not-in-room");
      return;
    }

    const normalizedMessage = message.trim().toLowerCase();
    const correctWord = room.wordToDraw?.trim().toLowerCase();
    if (!correctWord) return;

    if (player.id === room.currentDrawerId) {
      socket.emit("message-error", "You can't send messages while drawing!");
      return;
    }

    if (normalizedMessage === correctWord) {
      if (room.guessedPlayers.includes(player.id)) return;
      room.guessedPlayers.push(player.id);
      player.score += 10;
      io.to(roomId).emit("correct-guess", {
        playerName: player.name,
      });

      const totalGuessers = room.players.length - 1;

      if (room.guessedPlayers!.length === totalGuessers) {
        endRound(io, roomId);
      }
      return;
    }


    io.to(roomId).emit("message-sent", {
      player: player.name,
      message: message
    });
  });




  /* DISCONNECT */
  socket.on("disconnect", () => {
    for (const [roomId, room] of Object.entries(rooms)) {

      const leavingPlayer = room.players.find(p => p.socketId === socket.id);

      room.players = room.players.filter(p => p.socketId !== socket.id);

      if (room.players.length === 0) {
        delete rooms[roomId];
        continue;
      }


      if (room.players.length < 2) {
        room.gameState = "waiting";
        room.currentDrawerId = undefined;

        io.to(roomId).emit("game-paused");
      }

      // ❗ If drawer left → end round
      if (leavingPlayer?.id === room.currentDrawerId) {
        endRound(io, roomId);
      }

      io.to(roomId).emit("players-update", room.players);
    }
  });
}
