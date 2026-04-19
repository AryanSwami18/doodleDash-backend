import { Server, Socket } from "socket.io";
import type { Room } from "../types/room.js";
import generateRoomId from "../utils/generateRoomId.js";
import { rooms } from "../store/roomStore.js";
import tryStartGame from "../utils/tryStartGame.js";
import endRound from "../utils/endRound.js";
import restartGame from "../utils/restartGame.js";


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

interface RestartGamePayload {
  roomId: string;
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
    console.log(`Join Room:${roomId} By ${playerId} - ${name}`);

    const room = rooms[roomId];

    if (!room) {
      socket.emit("room-not-found", {
        message: "Room Not Found"
      });
      return;
    }

    let player = room.players.find(p => p.id === playerId);

    if (player) {
      player.socketId = socket.id;
    } else {
      player = {
        id: playerId,
        name,
        score: 0,
        socketId: socket.id,
        isHost: false
      };

      room.players.push(player);
    }


    socket.join(roomId);


    socket.emit("joined-room", { roomId });
    io.to(roomId).emit("players-update", {
      players: room.players,
      currentDrawerId: room.currentDrawerId
    });
    socket.emit("game-state", {
      gameState: room.gameState,
      currentDrawerId: room.currentDrawerId
    });
    tryStartGame(io, roomId);
  });


  socket.on("send-message", ({ roomId, message }: SendMessagePayload) => {
    const room: any = rooms[roomId];
    if (!room) {
      socket.emit("room-not-found");
      return;
    }

    const player = room.players.find(
      (p: { socketId: string }) => p.socketId === socket.id
    );

    if (!player) {
      socket.emit("not-in-room");
      return;
    }

    const normalizedMessage = message.trim().toLowerCase();
    const correctWord = room.wordToDraw?.trim().toLowerCase();
    if (!correctWord) return;

    const isDrawer = player.id === room.currentDrawerId;

    if (isDrawer) {
      if (normalizedMessage.includes(correctWord)) {
        return;
      }

      io.to(roomId).emit("message-sent", {
        player: player.name,
        message
      });

      return;
    }

    if (normalizedMessage === correctWord) {
      if (room.guessedPlayers.includes(player.id)) return;

      const isFirstGuess = room.guessedPlayers.length === 0;

      room.guessedPlayers.push(player.id);

      if (isFirstGuess) {
        player.score += 20;
      }
      const timeTaken = Date.now() - room.roundStartTime;

      const maxPoints = 100;
      const decayRate = 0.05; // tweak this

      const points = Math.max(
        20,
        Math.floor(maxPoints - timeTaken * decayRate)
      );

      player.score += points;

      const drawer = room.players.find((p: { id: any; }) => p.id === room.currentDrawerId);
      if (drawer) {
        drawer.score += Math.floor(points * 0.1); 
      }

      io.to(roomId).emit("correct-guess", {
        playerName: player.name,
      });

      io.to(roomId).emit("players-update", {
        players: room.players,
        currentDrawerId: room.currentDrawerId
      });

      const totalGuessers = room.players.filter(
        (p: { id: any; }) => p.id !== room.currentDrawerId
      ).length;;

      if (room.guessedPlayers.length === totalGuessers) {
        console.log("ENDING ROUND");
        endRound(io, roomId);
      }

      return;
    }

    io.to(roomId).emit("message-sent", {
      player: player.name,
      message
    });
  });


  socket.on("restart-game", ({ roomId }: RestartGamePayload) => {
    const room = rooms[roomId];
    if (!room) {
      return;
    }
    io.to(roomId).emit("game-restarted");
    restartGame(room);
    tryStartGame(io, roomId);
  });


  socket.on("draw", ({ roomId, ...data }) => {
    const room = rooms[roomId];
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    if (player.id !== room.currentDrawerId) return;

    socket.to(roomId).emit("draw", data);
  });
  socket.on("clear-canvas", ({ roomId }) => {
    socket.to(roomId).emit("clear-canvas");
  });




  //disconnect
  socket.on("disconnect", () => {
    for (const [roomId, room] of Object.entries(rooms)) {

      const leavingPlayer = room.players.find(p => p.socketId === socket.id);

      if (!leavingPlayer) continue;

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

      io.to(roomId).emit("players-update", {
        players: room.players,
        currentDrawerId: room.currentDrawerId
      });
    }
  });
}
