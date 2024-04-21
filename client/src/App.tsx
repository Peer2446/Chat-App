import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const socket = io("http://localhost:3001");

function App() {
  const [userName, setUserName] = useState("");
  const [recieverId, setRecieverId] = useState("");
  const [clients, setClients] = useState<{ [id: string]: string }>({});
  const [privateMessage, setPrivateMessage] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groups, setGroups] = useState<{ [name: string]: string[] }>({});
  const [groupMessage, setGroupMessage] = useState("");
  const [currentGroup, setCurrentGroup] = useState<string>("");
  const privateChatHistoryRef = useRef<HTMLDivElement>(null);
  const groupChatHistoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on("clientList", (clients: { [id: string]: string }) => {
      setClients(clients);
    });
    socket.on("groupList", (groups: { [name: string]: string[] }) => {
      setGroups(groups);
    });
  }, []);

  useEffect(() => {
    socket.on(
      "privateMessageSend",
      (data: { from: string; message: string; time: string }) => {
        if (recieverId === data.from) {
          var newDiv = document.createElement("div");
          const time = new Date(data.time).toLocaleTimeString(); // Parse time
          newDiv.innerHTML = `<p>${clients[data.from]} (${time}): ${
            data.message
          }</p>`;
          privateChatHistoryRef.current?.appendChild(newDiv); // Append new message to chat history
        }
      }
    );
    return () => {
      socket.off("privateMessageSend");
    };
  }, [recieverId]);

  useEffect(() => {
    socket.on(
      "groupMessageSend",
      (data: { from: string; message: string; time: string }) => {
        var newDiv = document.createElement("div");
        const time = new Date(data.time).toLocaleTimeString(); // Parse time
        newDiv.innerHTML = `<p>${clients[data.from]} (${time}): ${
          data.message
        }</p>`;
        groupChatHistoryRef.current?.appendChild(newDiv); // Append new message to chat history
        console.log(data);
      }
    );
    return () => {
      socket.off("groupMessageSend");
    };
  }, [currentGroup]);

  const handleSetName = (username: string) => {
    if (!Object.values(clients).includes(username)) {
      socket.emit("setName", username);
      document.getElementById("username")?.setAttribute("disabled", "true");
    }
  };

  const handleSetGroupName = (groupName: string) => {
    if (!Object.keys(groups).includes(groupName)) {
      socket.emit("createGroup", groupName, socket.id);
    }
  };

  const handleJoinGroup = (groupName: string) => {
    socket.emit("joinGroup", groupName);
    if (groupChatHistoryRef.current) {
      groupChatHistoryRef.current.innerHTML = "";
    }
    setCurrentGroup(groupName);
  };

  const handleJoinPrivateChat = (id: string) => {
    setRecieverId(id);
    if (privateChatHistoryRef.current) {
      privateChatHistoryRef.current.innerHTML = "";
    }
  };

  const handleSendPrivateMessage = (receiverId: string, message: string) => {
    socket.emit("privateMessage", { to: receiverId, message });

    var newDiv = document.createElement("div");
    const time = new Date().toLocaleTimeString(); // Get current time
    newDiv.innerHTML = `<p class="text-right">Me (${time}): ${message}</p>`;
    privateChatHistoryRef.current?.appendChild(newDiv);

    setPrivateMessage("");
  };

  const handleSendGroupMessage = (groupName: string, message: string) => {
    socket.emit("groupMessage", { groupName, message });

    var newDiv = document.createElement("div");
    const time = new Date().toLocaleTimeString(); // Get current time
    newDiv.innerHTML = `<p class="text-right">Me (${time}): ${message}</p>`;
    groupChatHistoryRef.current?.appendChild(newDiv);

    setGroupMessage("");
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
              <div key={id} onClick={() => handleJoinPrivateChat(id)}>
                <p
                  className={`text-xl font-semibold ${
                    recieverId === id ? "text-red-500" : ""
                  }`}
                >
                  {clients[id]}
                </p>
              </div>
            ) : null
          )}
        </div>
        {recieverId !== "" && (
          <ScrollArea className="w-1/2 h-1/2 border-8">
            <div
              id="chat-history"
              className="overflow-y-auto overflow-x-hidden h-[300px]"
              ref={privateChatHistoryRef}
            ></div>
            <div>
              <Input
                type="text"
                id="input-box"
                placeholder="Enter message"
                value={privateMessage}
                onChange={(e) => setPrivateMessage(e.target.value)}
              />
              <Button
                disabled={privateMessage === ""}
                onClick={() =>
                  handleSendPrivateMessage(recieverId, privateMessage)
                }
              >
                Send
              </Button>
            </div>
          </ScrollArea>
        )}
        <div>
          <h1>Group Chat</h1>
          <Input
            type="text"
            placeholder="Enter group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <Button
            disabled={groupName === ""}
            onClick={() => handleSetGroupName(groupName)}
          >
            Create Group
          </Button>
          <div className="flex flex-col">
            {Object.keys(groups).map((name) => (
              <div key={name}>
                <p
                  className={`text-xl font-semibold ${
                    currentGroup == name ? "text-red-500" : ""
                  }`}
                >
                  {name}
                </p>
                <Button onClick={() => socket.emit("deleteGroup", name)}>
                  Delete Group
                </Button>
                <Button onClick={() => handleJoinGroup(name)}>
                  Join Group
                </Button>
              </div>
            ))}
          </div>
          {currentGroup !== "" && (
            <ScrollArea className="w-1/2 h-1/2 border-8">
              <div
                id="chat-history"
                className="overflow-y-auto overflow-x-hidden h-[300px]"
                ref={groupChatHistoryRef}
              ></div>
              <div>
                <Input
                  type="text"
                  id="input-box"
                  placeholder="Enter message"
                  value={groupMessage}
                  onChange={(e) => setGroupMessage(e.target.value)}
                />
                <Button
                  disabled={groupMessage === ""}
                  onClick={() =>
                    handleSendGroupMessage(currentGroup, groupMessage)
                  }
                >
                  Send
                </Button>
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
