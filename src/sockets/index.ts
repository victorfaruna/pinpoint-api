import { Server as SocketIOServer, Socket } from "socket.io";

export const setupSockets = (io: SocketIOServer) => {
  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};
