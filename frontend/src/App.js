import { useState } from "react";
import { useEffect } from "react";
import { socket } from "./socket";
import TicTacToeGame from "./TicTacToeGame";
import "./App.css";

function App() {
  const [name, setName] = useState("");
  const [gameId, setGameId] = useState("");
  const [error, setError] = useState("");
  const [currentGameData, setCurrentGameData] = useState(null);
  const [currentScreen, setCurrentScreen] = useState("lobby"); // lobby, game

  const [games, setGames] = useState([]);

  useEffect(() => {
    const handleGameCreated = (data) => {
      console.log(
        "Game created with ID:",
        data.gameId,
        "by player:",
        data.player1
      );
      setGames((prevGames) => [...prevGames, data]);
      setCurrentGameData(data);
      setCurrentScreen("game");
    };

    const handleGameJoined = (player2) => {
      console.log("A player joined your game:", player2);
      // Update current game data with player2 info
      setCurrentGameData((prev) => (prev ? { ...prev, player2 } : null));
    };

    const handleJoinError = (data) => {
      console.log("Join error:", data.message);
      setError(data.message);
    };

    const handleJoinSuccess = (data) => {
      console.log("Successfully joined game:", data);
      setError("");
      setCurrentGameData(data);
      setCurrentScreen("game");
    };

    socket.on("GAME_CREATED", handleGameCreated);
    socket.on("GAME_JOINED", handleGameJoined);
    socket.on("JOIN_ERROR", handleJoinError);
    socket.on("GAME_JOINED_SUCCESS", handleJoinSuccess);

    return () => {
      socket.off("GAME_CREATED", handleGameCreated);
      socket.off("GAME_JOINED", handleGameJoined);
      socket.off("JOIN_ERROR", handleJoinError);
      socket.off("GAME_JOINED_SUCCESS", handleJoinSuccess);
    };
  }, []);

  const handleCreateGame = () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    setError("");
    console.log("Create game clicked by:", name);
    // Create a new GUID that will act as the game ID
    socket.emit("CREATE_GAME", name);
  };

  const handleJoinGame = () => {
    if (!name.trim() || !gameId.trim()) {
      setError("Please enter your name and game ID");
      return;
    }
    setError("");
    console.log("Join game clicked by:", name);

    socket.emit("JOIN_GAME", {
      player2: name,
      gameId: gameId,
    });
  };

  const handleBackToLobby = () => {
    setCurrentScreen("lobby");
    setCurrentGameData(null);
    setError("");
  };

  if (currentScreen === "game" && currentGameData) {
    return (
      <TicTacToeGame
        gameData={currentGameData}
        playerName={name}
        onBackToLobby={handleBackToLobby}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎮 Tic Tac Toe
          </h1>
          <p className="text-gray-600">Connect and play with friends online!</p>
        </div>

        <div className="space-y-4 mb-6">
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:outline-none transition-colors duration-200 text-lg"
          />

          <input
            type="text"
            placeholder="Enter Game ID to join existing game"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:outline-none transition-colors duration-200 text-lg"
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <button
            onClick={handleCreateGame}
            className="w-full py-4 px-6 bg-purple-600 text-white font-semibold text-lg rounded-lg hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            🎯 Create New Game
          </button>

          <button
            onClick={handleJoinGame}
            className="w-full py-4 px-6 bg-blue-600 text-white font-semibold text-lg rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            🚀 Join Existing Game
          </button>
        </div>

        {games.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Available Games
            </h3>
            <div className="space-y-2">
              {games.map((game, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg border">
                  <div className="text-sm">
                    <span className="font-medium">Game ID:</span>
                    <span className="font-mono ml-1">{game.gameId}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Created by:</span>{" "}
                    {game.player1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
