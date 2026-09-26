const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", ({ username, room }) => {
    socket.join(room);

    socket.username = username;
    socket.room = room;

    socket.to(room).emit("user-joined", {
      username,
    });

    console.log(`${username} joined ${room}`);
  });

  socket.on("send-message", ({ username, message, room }) => {
    io.to(room).emit("receive-message", {
      username,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("disconnect", () => {
    if (socket.username && socket.room) {
      socket.to(socket.room).emit("user-left", {
        username: socket.username,
      });
    }

    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});