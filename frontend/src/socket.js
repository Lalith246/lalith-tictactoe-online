import { io } from "socket.io-client";

// Use environment variable or fallback to localhost
const SOCKET_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5678";

export const socket = io(SOCKET_URL);
