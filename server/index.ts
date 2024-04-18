import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());

const port = 3001;

let clients: { [id: string]: string } = {}; // Map of client sockets to usernames
let groups: { [name: string]: string[] } = {}; // Map of group names to arrays of client IDs

// Handle client connection
io.on("connection", (socket: Socket) => {
  console.log("A user connected", socket.id);

  // Handle setting the user's name
  socket.on("setName", (name: string) => {
    clients[socket.id] = name;
    // Notify all clients about the updated list
    io.emit("clientList", clients);
    console.log(clients);
  });

  // Handle creating a group
  socket.on("createGroup", (groupName: string) => {
    groups[groupName] = [];
    // Notify all clients about the new group
    io.emit("groupList", Object.keys(groups));
  });

  // Handle joining a group
  socket.on("joinGroup", (groupName: string) => {
    if (groups[groupName]) {
      groups[groupName].push(socket.id);
      socket.join(groupName);
      console.log(`${clients[socket.id]} joined group ${groupName}`);
    }
  });

  // Handle private messages
  socket.on("privateMessage", ({ to, message }) => {
    const targetSocket = Object.keys(clients).find((id) => clients[id] === to);
    if (targetSocket) {
      io.to(targetSocket).emit("privateMessage", {
        from: clients[socket.id],
        message,
      });
    }
  });

  // Handle group messages
  socket.on("groupMessage", ({ groupName, message }) => {
    io.to(groupName).emit("groupMessage", {
      from: clients[socket.id],
      message,
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
    delete clients[socket.id];
    // Notify all clients about the updated list
    io.emit("clientList", Object.values(clients));
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
