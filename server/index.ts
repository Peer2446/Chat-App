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

  io.emit("clientList", clients);
  io.emit("groupList", groups);

  // Handle setting the user's name
  socket.on("setName", (name: string) => {
    clients[socket.id] = name;
    // Notify all clients about the updated list (except the sender)
    socket.broadcast.emit("clientList", clients);
  });

  // Handle creating a group
  socket.on("createGroup", (groupName: string, id: string) => {
    groups[groupName] = [id];
    // Notify all clients about the new group
    io.emit("groupList", groups);
  });

  //Handle deleting a group
  socket.on("deleteGroup", (groupName: string) => {
    delete groups[groupName];
    // Notify all clients about the updated list
    io.emit("groupList", groups);
    console.log(groups);
  });

  // Handle joining a group
  socket.on("joinGroup", (groupName: string) => {
    if (groups[groupName]) {
      if (!groups[groupName].includes(socket.id)) {
        groups[groupName].push(socket.id);
      }
      socket.join(groupName);
      console.log(`${clients[socket.id]} joined group ${groupName}`);
    }
  });

  // Handle private messages
  socket.on("privateMessage", ({ to, message }) => {
    if (to != "" && clients[to]) {
      console.log(`Sending private message to ${clients[to]}`);
      const time = new Date().toLocaleString(); // Get current time in a standard format
      io.to(to).emit("privateMessageSend", {
        from: socket.id,
        message,
        time,
      });
    }
  });

  // Handle group messages
  socket.on("groupMessage", ({ groupName, message }) => {
    if (groups[groupName]) {
      console.log(`Sending group message to ${groupName}`);
      console.log(groups[groupName]);
      const time = new Date().toLocaleString(); // Get current time in a standard format
      groups[groupName].forEach((id) => {
        if (id === socket.id) return; // Don't send the message to the sender (they already have it)
        const senderUsername = clients[socket.id]; // Get sender's username
        io.to(id).emit("groupMessageSend", {
          from: socket.id,
          senderUsername, // Include sender's username in the payload
          message,
          time,
        });
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
    delete clients[socket.id];

    Object.keys(groups).forEach((groupName) => {
      groups[groupName] = groups[groupName].filter((id) => id !== socket.id);
    });

    io.emit("clientList", Object.values(clients));
  });

  socket.on("typing", ({ senderId, receiverId, groupName }) => {
    console.log("Typing event received", senderId, receiverId, groupName);
    if (receiverId) {
      // If it's a private message, emit 'typingsend' event to the receiver
      io.to(receiverId).emit("typingsend", senderId, receiverId);
    } else if (groupName) {
      // If it's a group message, emit 'typingsend' event to all members in the group
      groups[groupName].forEach((id) => {
        if (id !== senderId) {
          io.to(id).emit("typingsend", senderId, groupName);
        }
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
