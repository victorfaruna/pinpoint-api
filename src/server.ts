import app from "./app";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setupSockets } from "./sockets";

// Create the HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // Configure allowed origins here
    methods: ["GET", "POST"],
  },
});

// Store the io instance in the Express app
app.set("io", io);

// Setup socket event listeners
setupSockets(io);

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
