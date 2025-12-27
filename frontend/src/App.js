import { useState } from "react";
import { useEffect } from "react";
import { socket } from "./socket";
import "./App.css";

function App() {
  const [name, setName] = useState("");
  const [gameId, setGameId] = useState("");
  const [error, setError] = useState("");

  const [games, setGames] = useState([]);

  // socket.on("GAME_CREATED", (data) => {
  //   console.log("Game created with ID:", data.gameId, "by player:", data.name);
  //   setGames((prevGames) => [...prevGames, data]);
  // });

  useEffect(() => {
    const handleGameCreated = (data) => {
      console.log(
        "Game created with ID:",
        data.gameId,
        "by player:",
        data.player1
      );
      setGames((prevGames) => [...prevGames, data]);
    };

    const handleGameJoined = (player2) => {
      console.log("A player joined your game:", player2);
    };

    const handleJoinError = (data) => {
      console.log("Join error:", data.message);
      setError(data.message);
    };

    const handleJoinSuccess = (data) => {
      console.log("Successfully joined game:", data);
      setError("");
      // You can add navigation to game screen here
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

  return (
    <div className="container">
      <h1>Tic Tac Toe</h1>

      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="text"
        placeholder="Enter the gameId if joining a game"
        value={gameId}
        onChange={(e) => setGameId(e.target.value)}
      />

      {error && <p className="error">{error}</p>}

      <div className="buttons">
        <button onClick={handleCreateGame}>Create New Game</button>
        <button onClick={handleJoinGame}>Join Existing Game</button>
      </div>

      <div className="games-list">
        {games.length > 0 &&
          games.map((game, index) => (
            <div key={index}>
              Game ID: {game.gameId}, Created by: {game.player1}
            </div>
          ))}
      </div>
    </div>
  );
}

export default App;
