"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSockets = void 0;
const setupSockets = (io) => {
    io.on("connection", (socket) => {
        console.log(`Client connected: ${socket.id}`);
        // Handle disconnection
        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
};
exports.setupSockets = setupSockets;
