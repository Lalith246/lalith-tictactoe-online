import { useState, useEffect } from "react";
import { socket } from "./socket";

function TicTacToeGame({ gameData, playerName, onBackToLobby }) {
  const [board, setBoard] = useState(Array(9).fill(""));
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [gameStatus, setGameStatus] = useState("waiting"); // waiting, playing, won, draw
  const [winner, setWinner] = useState("");
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [playerSymbol, setPlayerSymbol] = useState("");
  const [opponentName, setOpponentName] = useState("");

  useEffect(() => {
    // Determine player symbols and turn order
    const isPlayer1 = gameData.player1 === playerName;
    setPlayerSymbol(isPlayer1 ? "X" : "O");
    setOpponentName(isPlayer1 ? gameData.player2 : gameData.player1);
    setIsMyTurn(isPlayer1); // Player 1 (X) goes first

    if (gameData.player2) {
      setGameStatus("playing");
    }

    const handleMove = (data) => {
      setBoard(data.board);
      setCurrentPlayer(data.currentPlayer);
      setIsMyTurn(data.currentPlayer === playerSymbol);

      if (data.winner) {
        setWinner(data.winner);
        setGameStatus(data.winner === "draw" ? "draw" : "won");
      }
    };

    const handleGameStart = (data) => {
      setGameStatus("playing");
      setOpponentName(data.opponentName);
    };

    const handlePlayerDisconnected = (data) => {
      alert(data.message || "Your opponent disconnected!");
      // Automatically return to lobby after disconnect
      setTimeout(() => {
        onBackToLobby();
      }, 2000);
    };

    socket.on("MOVE_MADE", handleMove);
    socket.on("GAME_START", handleGameStart);
    socket.on("PLAYER_DISCONNECTED", handlePlayerDisconnected);

    return () => {
      socket.off("MOVE_MADE", handleMove);
      socket.off("GAME_START", handleGameStart);
      socket.off("PLAYER_DISCONNECTED", handlePlayerDisconnected);
    };
  }, [gameData, playerName, playerSymbol]);

  const makeMove = (index) => {
    if (board[index] !== "" || !isMyTurn || gameStatus !== "playing") {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = playerSymbol;
    setBoard(newBoard);
    setIsMyTurn(false);

    socket.emit("MAKE_MOVE", {
      gameId: gameData.gameId,
      move: index,
      board: newBoard,
      player: playerSymbol,
    });
  };

  const renderSquare = (index) => {
    const value = board[index];
    const isWinningSquare = false; // You can implement winning line highlighting here

    return (
      <button
        key={index}
        className={`
          w-24 h-24 text-4xl font-bold border-2 border-gray-400 
          transition-all duration-200 ease-in-out
          ${value === "X" ? "text-blue-600" : "text-red-600"}
          ${
            isMyTurn && !value && gameStatus === "playing"
              ? "hover:bg-gray-100 hover:border-blue-400 cursor-pointer"
              : "cursor-not-allowed"
          }
          ${isWinningSquare ? "bg-green-200" : "bg-white"}
          focus:outline-none focus:ring-2 focus:ring-blue-400
        `}
        onClick={() => makeMove(index)}
        disabled={!isMyTurn || gameStatus !== "playing"}
      >
        {value}
      </button>
    );
  };

  const getGameStatusMessage = () => {
    switch (gameStatus) {
      case "waiting":
        return "Waiting for opponent to join...";
      case "playing":
        if (isMyTurn) {
          return `Your turn (${playerSymbol})`;
        } else {
          return `${opponentName}'s turn (${playerSymbol === "X" ? "O" : "X"})`;
        }
      case "won":
        if (winner === playerSymbol) {
          return "🎉 You won!";
        } else {
          return `${opponentName} won!`;
        }
      case "draw":
        return "It's a draw!";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Tic Tac Toe</h1>
          <div className="text-sm text-gray-600 mb-4">
            <p>
              Game ID:{" "}
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                {gameData.gameId}
              </span>
            </p>
            <p>
              You:{" "}
              <span className="font-semibold text-blue-600">
                {playerName} ({playerSymbol})
              </span>
            </p>
            {opponentName && (
              <p>
                Opponent:{" "}
                <span className="font-semibold text-red-600">
                  {opponentName} ({playerSymbol === "X" ? "O" : "X"})
                </span>
              </p>
            )}
          </div>

          {/* Game Status */}
          <div
            className={`
            text-lg font-semibold p-3 rounded-lg mb-4
            ${
              gameStatus === "playing" && isMyTurn
                ? "bg-green-100 text-green-800"
                : ""
            }
            ${
              gameStatus === "playing" && !isMyTurn
                ? "bg-yellow-100 text-yellow-800"
                : ""
            }
            ${
              gameStatus === "won" && winner === playerSymbol
                ? "bg-green-200 text-green-800"
                : ""
            }
            ${
              gameStatus === "won" && winner !== playerSymbol
                ? "bg-red-100 text-red-800"
                : ""
            }
            ${gameStatus === "draw" ? "bg-gray-100 text-gray-800" : ""}
            ${gameStatus === "waiting" ? "bg-blue-100 text-blue-800" : ""}
          `}
          >
            {getGameStatusMessage()}
          </div>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-3 gap-2 mb-8 mx-auto max-w-xs">
          {Array(9)
            .fill(null)
            .map((_, index) => renderSquare(index))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {(gameStatus === "won" || gameStatus === "draw") && (
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                Game finished! The game will be cleaned up automatically.
              </p>
              <p className="text-xs text-gray-500">
                Create a new game to play again.
              </p>
            </div>
          )}

          <button
            onClick={onBackToLobby}
            className="w-full py-3 px-6 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Back to Lobby
          </button>
        </div>

        {/* Loading Spinner for Waiting State */}
        {gameStatus === "waiting" && (
          <div className="flex justify-center mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TicTacToeGame;
