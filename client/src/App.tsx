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
  const [isDarkMode, setIsDarkMode] = useState(false); // New state for dark mode
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

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  };

  return (
    <>
      <div
        className={`flex justify-end p-4 ${
          isDarkMode ? "bg-blue-500" : "bg-yellow-500"
        }`}
      >
        <button
          className="text-gray-800 font-bold rounded inline-flex items-center"
          onClick={toggleDarkMode}
        >
          {isDarkMode ? (
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <path
                  d="M3.32031 11.6835C3.32031 16.6541 7.34975 20.6835 12.3203 20.6835C16.1075 20.6835 19.3483 18.3443 20.6768 15.032C19.6402 15.4486 18.5059 15.6834 17.3203 15.6834C12.3497 15.6834 8.32031 11.654 8.32031 6.68342C8.32031 5.50338 8.55165 4.36259 8.96453 3.32996C5.65605 4.66028 3.32031 7.89912 3.32031 11.6835Z"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </g>
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <path
                  d="M12 3V4M12 20V21M4 12H3M6.31412 6.31412L5.5 5.5M17.6859 6.31412L18.5 5.5M6.31412 17.69L5.5 18.5001M17.6859 17.69L18.5 18.5001M21 12H20M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </g>
            </svg>
          )}
          {isDarkMode ? " Dark Theme" : " Light Theme"}
        </button>
      </div>
       <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
        <div className="-ml-4 -mt-4 flex flex-wrap items-center justify-between sm:flex-nowrap">
          <div className="ml-4 mt-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img
                  className="h-12 w-12 rounded-full"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt=""
                />
              </div>
              <div className="ml-4">
                <h3 className="text-base font-semibold leading-6 text-gray-900">{userName}</h3>
                <p className="text-sm text-gray-500">
                  <a href="#">Welcome Back!!!</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>  
      <div className="container">
        <div className="left">
          <div className="border-b border-gray-200 p-2">
            <h1 className="text-base font-semibold leading-6 text-gray-900">Create your account name</h1>
          </div>
          <Input
            id="username"
            type="text"
            placeholder="Enter your username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <Button onClick={() => handleSetName(userName)}>Set Name</Button>
          <div className="border-b border-gray-200 p-2">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Available Friends</h3>
          </div>
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
            <ScrollArea className="h-1/10 border-8 overflow-y">
              <div
                id="chat-history"
                className="overflow-y-auto overflow-x-hidden h-[300px]"
                ref={privateChatHistoryRef}
              >
              </div>
              <div>
                {/* <Input
                  type="text"
                  id="input-box"
                  placeholder="Enter message"
                  value={privateMessage}
                  onChange={(e) => setPrivateMessage(e.target.value)}
                /> */}
                 <textarea
                  rows={3}
                  type="text"
                  id="input-box"
                  placeholder=" Enter message"
                  value={privateMessage}
                  onChange={(e) => setPrivateMessage(e.target.value)}
                  className="block w-full rounded-md border-0 py-2.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-60"
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
        </div>
        <div className="divider"></div>
        <div className="right">
          <div className="border-b border-gray-200 p-2">
            <h1 className="text-base font-semibold leading-6 text-gray-900">Group Chat</h1>
          </div>
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
          <div className="border-b border-gray-200 p-2">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Available Groups</h3>
          </div>
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
            <ScrollArea className="h-1/2 border-8">
              <div
                id="chat-history"
                className="overflow-y-auto overflow-x-hidden h-[300px]"
                ref={groupChatHistoryRef}
              ></div>
              <div>
                {/* <Input
                  type="text"
                  id="input-box"
                  placeholder="Enter message"
                  value={groupMessage}
                  onChange={(e) => setGroupMessage(e.target.value)}
                /> */}
                <textarea
                  rows={4}
                  type="text"
                  id="input-box"
                  placeholder=" Enter message"
                  value={groupMessage}
                  onChange={(e) => setPrivateMessage(e.target.value)}
                  className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-60"
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
