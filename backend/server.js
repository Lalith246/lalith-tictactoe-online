import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://your-frontend-url.vercel.app", // We'll update this later
      "https://*.vercel.app", // Allow any vercel subdomain
    ],
    methods: ["GET", "POST"],
  },
});
const PORT = process.env.PORT || 5678;

// Store active games and socket-to-game mapping
const games = new Map();
const socketToGame = new Map(); // Track which game each socket is in

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
      board: Array(9).fill(""),
      currentPlayer: "X",
      gameStatus: "waiting", // waiting, playing, finished
      winner: null,
    });

    socket.join(gameId);
    socketToGame.set(socket.id, gameId);
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
    game.gameStatus = "playing";
    games.set(gameId, game);

    socket.join(gameId);
    socketToGame.set(socket.id, gameId);
    socket.to(gameId).emit("GAME_JOINED", player2);
    socket.emit("GAME_JOINED_SUCCESS", {
      gameId,
      player1: game.player1,
      player2,
    });
  });

  socket.on("MAKE_MOVE", (data) => {
    const { gameId, move, board, player } = data;
    console.log(
      `Player ${player} making move at position ${move} in game ${gameId}`
    );

    if (!games.has(gameId)) {
      socket.emit("MOVE_ERROR", { message: "Game not found" });
      return;
    }

    const game = games.get(gameId);

    // Validate it's the player's turn
    const isPlayer1 =
      game.player1 === (player === "X" ? game.player1 : game.player2);
    if (
      (game.currentPlayer === "X" && !isPlayer1) ||
      (game.currentPlayer === "O" && isPlayer1)
    ) {
      socket.emit("MOVE_ERROR", { message: "Not your turn" });
      return;
    }

    // Update game state
    game.board = board;
    game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";

    // Check for winner
    const winner = checkWinner(board);
    if (winner) {
      game.winner = winner;
      game.gameStatus = "finished";
    } else if (board.every((cell) => cell !== "")) {
      game.winner = "draw";
      game.gameStatus = "finished";
    }

    games.set(gameId, game);

    // Emit move to both players
    io.to(gameId).emit("MOVE_MADE", {
      board: game.board,
      currentPlayer: game.currentPlayer,
      winner: game.winner,
      gameStatus: game.gameStatus,
    });

    // Clean up finished game after a delay to allow clients to process
    if (game.gameStatus === "finished") {
      setTimeout(() => {
        cleanupGame(gameId);
      }, 5000); // 5 second delay
    }
  });

  // Handle player disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    handlePlayerDisconnect(socket.id);
  });

  console.log("A user connected:", socket.id);
});

// Helper function to clean up a game
function cleanupGame(gameId) {
  if (!games.has(gameId)) return;

  const game = games.get(gameId);
  console.log(`Cleaning up game: ${gameId}`);

  // Remove all sockets from game tracking
  for (const [socketId, gameIdForSocket] of socketToGame.entries()) {
    if (gameIdForSocket === gameId) {
      socketToGame.delete(socketId);
    }
  }

  // Clear the socket room (sockets will automatically leave when they disconnect)
  // Remove game from memory
  games.delete(gameId);

  console.log(`Game ${gameId} cleaned up. Active games: ${games.size}`);
}

// Helper function to handle player disconnect
function handlePlayerDisconnect(socketId) {
  const gameId = socketToGame.get(socketId);
  if (!gameId || !games.has(gameId)) {
    socketToGame.delete(socketId);
    return;
  }

  const game = games.get(gameId);
  console.log(`Player disconnected from game: ${gameId}`);

  // Notify other player in the room
  io.to(gameId).emit("PLAYER_DISCONNECTED", {
    message: "Your opponent has disconnected",
  });

  // Clean up the game immediately when a player disconnects
  cleanupGame(gameId);
}

// Helper function to check for winner
function checkWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // columns
    [0, 4, 8],
    [2, 4, 6], // diagonals
  ];

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
