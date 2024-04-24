"use client";

import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { TypingIndicator } from "@/components/ui/typing-Indicator";
import { render } from "react-dom";
import { ChatMessage } from "@/components/ui/chatMessageBox";

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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const privateChatHistoryRef = useRef<HTMLDivElement>(null);
  const groupChatHistoryRef = useRef<HTMLDivElement>(null);
  const [isNameSet, setIsNameSet] = useState(false);
  const [isTyping, setIsTyping] = useState({ private: false, group: false });
  const [isTypingPrivate, setIsTypingPrivate] = useState(false);
  const [isTypingGroup, setIsTypingGroup] = useState(false);
  const [userTypingGroup, setUserTypingGroup] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    socket.on("clientList", (clients: { [id: string]: string }) => {
      setClients(clients);
    });
    socket.on("groupList", (groups: { [name: string]: string[] }) => {
      setGroups(groups);
    });
  }, []);

  useEffect(() => {
    console.log(clients);
  }, [clients]);

  useEffect(() => {
    socket.on(
      "privateMessageSend",
      (data: { from: string; message: string; time: string }) => {
        if (recieverId === data.from) {
          var newDiv = document.createElement("div");
          const time = new Date(data.time).toLocaleTimeString();
          render(
            <ChatMessage
              username={clients[data.from]}
              message={data.message}
              time={time}
              isSender={false}
            />,
            newDiv
          );

          privateChatHistoryRef.current?.appendChild(newDiv);
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
        const time = new Date(data.time).toLocaleTimeString();
        render(
          <ChatMessage
            username={clients[data.from]}
            message={data.message}
            time={time}
            isSender={false}
          />,
          newDiv
        );
        groupChatHistoryRef.current?.appendChild(newDiv);
      }
    );
    return () => {
      socket.off("groupMessageSend");
    };
  }, [currentGroup]);

  useEffect(() => {
    console.log(isTypingGroup, isTypingPrivate);
  }, [isTypingGroup, isTypingPrivate]);
  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;

    const handleTyping = (send_id: string, receive_id: string) => {
      if (send_id === socket.id) return;
      if (groups[receive_id]) {
        setUserTypingGroup(clients[send_id]);
        setIsTypingGroup(true);
      } else {
        setUserTypingGroup("");
        setIsTypingPrivate(true);
      }

      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        setIsTypingPrivate(false);
        setIsTypingGroup(false);
        setIsTyping({ private: false, group: false });
        setUserTypingGroup("");
      }, 1000);
    };

    if (isTyping.private) {
      socket.emit("typing", { senderId: socket.id, receiverId: recieverId });
    }
    if (isTyping.group) {
      socket.emit("typing", { senderId: socket.id, groupName: currentGroup });
    }

    socket.on("typingsend", handleTyping);

    return () => {
      socket.off("typingsend", handleTyping);
      clearTimeout(typingTimeout);
    };
  }, [clients, groups, isTyping]);

  const handleSetName = (username: string) => {
    if (!Object.values(clients).includes(username)) {
      socket.emit("setName", username);
      document.getElementById("username")?.setAttribute("disabled", "true");
      setIsNameSet(true);
    } else {
      toast({
        title: "This name is already taken",
        description: "Please choose another name",
      });
    }
  };

  const handleSetGroupName = (groupName: string) => {
    if (!Object.keys(groups).includes(groupName)) {
      socket.emit("createGroup", groupName, socket.id);
    } else {
      toast({
        title: "This group name is already taken",
        description: "Please choose another group name",
      });
    }
  };

  const handleJoinGroup = (groupName: string) => {
    if (!isNameSet) {
      toast({
        title: "Please set your name first",
        description: "Enter your name in the input box",
      });
      return;
    }
    socket.emit("joinGroup", groupName);
    if (groupChatHistoryRef.current) {
      groupChatHistoryRef.current.innerHTML = "";
    }
    setCurrentGroup(groupName);
  };

  const handleJoinPrivateChat = (id: string) => {
    if (!isNameSet) {
      toast({
        title: "Please set your name first",
        description: "Enter your name in the input box",
      });
      return;
    }
    setRecieverId(id);
    if (privateChatHistoryRef.current) {
      privateChatHistoryRef.current.innerHTML = "";
    }
  };

  const handleSendPrivateMessage = (receiverId: string, message: string) => {
    socket.emit("privateMessage", { to: receiverId, message });

    var newDiv = document.createElement("div");
    const time = new Date().toLocaleTimeString();
    render(
      <ChatMessage
        username="Me"
        message={message}
        time={time}
        isSender={true}
      />,
      newDiv
    );
    privateChatHistoryRef.current?.appendChild(newDiv);

    setPrivateMessage("");
  };

  const handleSendGroupMessage = (groupName: string, message: string) => {
    socket.emit("groupMessage", { groupName, message });

    var newDiv = document.createElement("div");
    const time = new Date().toLocaleTimeString();
    render(
      <ChatMessage
        username="Me"
        message={message}
        time={time}
        isSender={true}
      />,
      newDiv
    );
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
        className={`flex justify-end p-4 ${isDarkMode ? "bg-blue-500" : "bg-yellow-500"
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
                <h1 className="text-xl font-bold leading-6">{userName}</h1>
                <p className="text-sm">
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
            <h1 className="text-xl font-bold leading-6">
              Create your account name
            </h1>
          </div>
          <Input
            id="username"
            type="text"
            placeholder="Enter your username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <Button
            className="my-2"
            disabled={userName === ""}
            onClick={() => handleSetName(userName)}
          >
            Set Name
          </Button>
          <div className="border-b border-gray-200 p-2">
            <h3 className="text-xl font-bold leading-6">Available Friends</h3>
          </div>
          <div className="flex flex-col">
            {Object.keys(clients).map((id) =>
              id !== socket.id ? (
                <div
                  className="mx-3"
                  key={id}
                  onClick={() => handleJoinPrivateChat(id)}
                >
                  <p
                    className={`text-xl ${recieverId === id ? "font-bold" : "font-semibold"
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
              ></div>
              <div className="typing-indicator flex justify-start my-4 h-6">
                <TypingIndicator isVisible={isTypingPrivate} />
              </div>
              <div>
                <textarea
                  rows={1}
                  id="input-box"
                  placeholder=" Enter message"
                  value={privateMessage}
                  onChange={(e) => {
                    setIsTyping({ private: true, group: false });
                    setPrivateMessage(e.target.value);
                  }}
                  className="block w-full rounded-md border-0 py-2.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-60"
                />
                <Button
                  className="my-2"
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
            <h1 className="text-xl font-bold leading-6">
              Group Chat
            </h1>
          </div>
          <Input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <Button
            className="my-2"
            disabled={groupName === ""}
            onClick={() => handleSetGroupName(groupName)}
          >
            Create Group
          </Button>
          <div className="border-b border-gray-200 p-2">
            <h3 className="text-xl font-bold leading-6">
              Available Groups
            </h3>
          </div>
          <div className="flex flex-col">
            {Object.keys(groups).map((name) => (
              <div className="mx-3" key={name}>
                <p
                  className={`text-xl ${currentGroup == name ? "font-bold" : "font-semibold"
                    }`}
                >
                  {name}
                </p>
                <Button
                  className="my-2"
                  onClick={() => {
                    socket.emit("deleteGroup", name);
                    if (currentGroup === name) {
                      setCurrentGroup("");
                    }
                  }}
                >
                  Delete Group
                </Button>
                <Button className="m-2" onClick={() => handleJoinGroup(name)}>
                  Join Group
                </Button>
              </div>
            ))}
          </div>
          {currentGroup !== "" && groups && (
            <ScrollArea className="h-1/10 border-8 overflow-y">
              <div
                id="chat-history"
                className="overflow-y-auto overflow-x-hidden h-[300px]"
                ref={groupChatHistoryRef}
              ></div>
              <div className="typing-indicator flex flex-col justify-start items-start my-4 h-6">
                <p className="word-wrap: break-word">{userTypingGroup}</p>
                <TypingIndicator isVisible={isTypingGroup} />
              </div>
              <div>
                <textarea
                  rows={1}
                  id="input-box"
                  placeholder=" Enter message"
                  value={groupMessage}
                  onChange={(e) => {
                    setIsTyping({ private: false, group: true });
                    setGroupMessage(e.target.value);
                  }}
                  className="block w-full rounded-md border-0 py-2.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-60"
                />
                <Button
                  className="my-2"
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
        <Toaster />
      </div>
    </>
  );
}

export default App;
