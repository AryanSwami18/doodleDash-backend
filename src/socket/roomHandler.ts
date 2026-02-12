import { Server, Socket } from "socket.io";
import type { Room } from "../types/room.js";

const rooms: Record<string, Room> = {};

interface CreateRoomPayload {
  roomId: string;
  name: string;
}

interface JoinRoomPayload {
  roomId: string;
  name: string;
}

export default function roomHandler(io: Server, socket: Socket) {
  /* CREATE ROOM */
  socket.on("create-room", ({ roomId, name }: CreateRoomPayload) => {
    if (rooms[roomId]) {
      socket.emit("room-error", "Room already exists");
      return;
    }

    rooms[roomId] = {
      players: [{ id: socket.id, name, score: 0 }],
    };

    socket.join(roomId);

    io.to(roomId).emit("players-update", rooms[roomId].players);
  });

  /* JOIN ROOM */
  socket.on("join-room", ({ roomId, name }: JoinRoomPayload) => {
    const room = rooms[roomId];

    if (!room) {
      socket.emit("room-not-found");
      return;
    }

    /* Prevent duplicate joins */
    const alreadyInRoom = room.players.some((p) => p.id === socket.id);
    if (alreadyInRoom) return;

    room.players.push({ id: socket.id, name, score: 0 });

    socket.join(roomId);

    io.to(roomId).emit("players-update", room.players);
  });

  /* DISCONNECT */
  socket.on("disconnect", () => {
    for (const [roomId, room] of Object.entries(rooms)) {
      room.players = room.players.filter((p) => p.id !== socket.id);

      if (room.players.length === 0) {
        delete rooms[roomId];
      } else {
        io.to(roomId).emit("players-update", room.players);
      }
    }
  });
}
