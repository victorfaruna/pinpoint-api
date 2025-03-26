"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const sockets_1 = require("./sockets");
// Create the HTTP server
const server = (0, http_1.createServer)(app_1.default);
// Initialize Socket.IO
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*", // Configure allowed origins here
        methods: ["GET", "POST"],
    },
});
// Store the io instance in the Express app
app_1.default.set("io", io);
// Setup socket event listeners
(0, sockets_1.setupSockets)(io);
// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
