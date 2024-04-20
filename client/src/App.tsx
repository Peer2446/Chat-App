import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const socket = io("http://localhost:3001");

function App() {
  const [userName, setUserName] = useState("Me");
  const [recieverId, setRecieverId] = useState("");
  const [clients, setClients] = useState<{ [id: string]: string }>({});
  const [privateMessage, setPrivateMessage] = useState("");
  const chatHistoryRef = useRef<HTMLDivElement>(null); // Ref for chat history container

  useEffect(() => {
    socket.on("clientList", (clients: { [id: string]: string }) => {
      setClients(clients);
    });
  }, []);

  useEffect(() => {
    socket.on(
      "privateMessageSend",
      (data: { from: string; message: string; time: string }) => {
        if (recieverId === data.from) {
          var newDiv = document.createElement("div");
          const time = new Date(data.time).toLocaleTimeString(); // Parse time
          newDiv.innerHTML = `<p>${clients[data.from]} (${time}): ${data.message}</p>`;
          chatHistoryRef.current?.appendChild(newDiv); // Append new message to chat history
          scrollToBottom(); // Scroll to the bottom
        }
      }
    );
    return () => {
      socket.off("privateMessageSend");
    };
  }, [recieverId]);

  const handleSetName = (username: string) => {
    if (!Object.values(clients).includes(username)) {
      socket.emit("setName", username);
      document.getElementById("username")?.setAttribute("disabled", "true");
    }
  };

  const handleSendPrivateMessage = (receiverId: string, message: string) => {
    socket.emit("privateMessage", { to: receiverId, message });

    var newDiv = document.createElement("div");
    const time = new Date().toLocaleTimeString(); // Get current time
    newDiv.innerHTML = `<p class="text-right">Me (${time}): ${message}</p>`;
    chatHistoryRef.current?.appendChild(newDiv); // Append sent message to chat history
    scrollToBottom(); // Scroll to the bottom

    setPrivateMessage("");
  };

  const scrollToBottom = () => {
    chatHistoryRef.current?.scrollTo({
      top: chatHistoryRef.current?.scrollHeight,
      behavior: "smooth"
    });
  };

  return (
    <>
      <div>
        <h1>Set your username</h1>
        <Input
          id="username"
          type="text"
          placeholder="Enter your username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
        <Button onClick={() => handleSetName(userName)}>Set Name</Button>
        <h1>Connected Users</h1>
        <div className="flex flex-col">
          {Object.keys(clients).map((id) =>
            id !== socket.id ? (
              <div key={id} onClick={() => setRecieverId(id)}>
                <p className={`text-xl font-semibold ${recieverId === id ? 'text-red-500' : ''}`}>
                  {clients[id]}
                </p>
              </div>
            ) : null
          )}
        </div>
        {recieverId !== "" && (
          <div className="border-8">
            <div id="chat-history" className="overflow-y-auto overflow-x-hidden h-[300px]" ref={chatHistoryRef}>

            </div>
            <div>
              <Input
                type="text"
                id="input-box"
                placeholder="Enter message"
                value={privateMessage}
                onChange={(e) => setPrivateMessage(e.target.value)}
              />
              <Button
                onClick={() =>
                  handleSendPrivateMessage(recieverId, privateMessage)
                }
              >
                Send
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
