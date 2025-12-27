import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});
const PORT = process.env.PORT || 5678;

// Store active games
const games = new Map();

app.get("/", (req, res) => {
  res.send("Hello from the backend server!");
});

io.on("connection", (socket) => {
  socket.on("CREATE_GAME", (player1) => {
    const gameId = crypto.randomUUID();
    console.log("New game ID:", gameId);
    console.log("Creating game with ID:", gameId, "for player:", player1);

    // Store game information
    games.set(gameId, {
      player1: player1,
      player2: null,
      players: 1,
    });

    socket.join(gameId);
    socket.emit("GAME_CREATED", { gameId, player1 });
  });

  socket.on("JOIN_GAME", (data) => {
    const { player2, gameId } = data;
    console.log("Player", player2, "is joining game ID:", gameId);

    // Validate if gameId exists
    if (!games.has(gameId)) {
      socket.emit("JOIN_ERROR", { message: "Game not found" });
      return;
    }

    const game = games.get(gameId);

    // Check if there's space for another player
    if (game.players >= 2) {
      socket.emit("JOIN_ERROR", { message: "Game is full" });
      return;
    }

    // Update game with second player
    game.player2 = player2;
    game.players = 2;
    games.set(gameId, game);

    socket.join(gameId);
    socket.to(gameId).emit("GAME_JOINED", player2);
    socket.emit("GAME_JOINED_SUCCESS", {
      gameId,
      player1: game.player1,
      player2,
    });
  });

  console.log("A user connected:", socket.id);
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
