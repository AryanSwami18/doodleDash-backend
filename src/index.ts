import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import roomHandler from './socket/roomHandler.js';


dotenv.config();

const app = express();
app.use(cors());


const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "doodle-dash-frontend-3ef7.vercel.app",
        methods: ["GET", "POST"],
    },
});


io.on("connection", (socket) => {

    console.log("a user connected", socket.id);
    roomHandler(io,socket);

    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
    });
});


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});