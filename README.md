Real-Time Multiplayer Drawing Game Backend

A scalable real-time backend for a multiplayer drawing and guessing game inspired by Skribbl.io.
Built using Node.js, Socket.IO, and TypeScript, this server powers live gameplay including drawing synchronization, chat, scoring, and round management.

🚀 Features
🏠 Room Management
Create and join rooms using unique room IDs
Host-based game control
Automatic cleanup of empty rooms
⚡ Real-Time Gameplay
Live drawing synchronization via WebSockets
Real-time chat system
Word guessing detection
🎮 Game Flow
Automatic game start when players join
Round-based gameplay system
Drawer rotation logic
Round start / end handling
Game restart support
🧠 Scoring System
Time-based scoring for guessers
First guess bonus
Balanced drawer reward system
Live leaderboard updates
🔤 Word System
Random word generation
Word visible only to drawer
Word length hints for guessers
🛡️ Edge Case Handling
Player reconnection support
Drawer disconnect handling
Prevent duplicate joins
Safe round transitions
🛠️ Tech Stack
Node.js
Socket.IO
TypeScript
