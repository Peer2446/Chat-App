import { useState, useEffect } from "react";
import io from "socket.io-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const socket = io("http://localhost:3001");

function App() {
  const [userName, setUserName] = useState("Me");
  const [recieverId, setRecieverId] = useState("");
  const [clients, setClients] = useState<{ [id: string]: string }>({});
  const [privateMessage, setPrivateMessage] = useState("");

  useEffect(() => {
    socket.on("clientList", (clients: { [id: string]: string }) => {
      setClients(clients);
    });
  }, []);

  useEffect(() => {
    socket.on(
      "privateMessageSend",
      (data: { from: string; message: string }) => {
        if (recieverId === data.from) {
          var newDiv = document.createElement("div");
          newDiv.innerHTML = `<p>${clients[data.from]}: ${data.message}</p>`;
          document.getElementById("chat-message")?.appendChild(newDiv);
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
    newDiv.innerHTML = `<p class="text-right">Me: ${message}</p>`;
    newDiv.classList.add("mr-4");
    document.getElementById("chat-message")?.appendChild(newDiv);

    setPrivateMessage("");
  };

  return (
    <>
      <div>
        <h1>Connected Users</h1>
        <div className="flex flex-col">
          {Object.keys(clients).map((id) =>
            id !== socket.id ? (
              <div key={id} onClick={() => setRecieverId(id)}>
                <p className="text-xl font-semibold">{clients[id]}</p>
              </div>
            ) : null
          )}
        </div>
        <h1>Set your username</h1>
        <Input
          id="username"
          type="text"
          placeholder="Enter your username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
        <Button onClick={() => handleSetName(userName)}>Set Name</Button>
        {recieverId !== "" && (
          <div className="border-8">
            <h1>{clients[recieverId]}</h1>
            <div className="min-w-48 min-h-72"></div>
            <div>
              <div id="chat-message"></div>
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
