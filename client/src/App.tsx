import { useState, useEffect } from "react";
import io from "socket.io-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const socket = io("http://localhost:3001");

function App() {
  const [username, setUsername] = useState("Me");
  const [guestname, setGuestname] = useState("Guest");
  const [clientList, setClientList] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    socket.on("clientList", (clients: { [id: string]: string }) => {
      setClientList(clients);
    });
  }, []);

  const handleSetName = (username: string) => {
    socket.emit("setName", username);
    document.getElementById("username")?.setAttribute("disabled", "true");
  };

  const handleNewChat = (id: string) => {
    setGuestname(clientList[id]);
  };
  //each client will have a unique socket id
  //when user click on each client element in the list, it will create a chat window
  return (
    <>
      <div>
        <h1>Connected Users</h1>
        <div className="flex flex-col">
          {Object.keys(clientList).map((id) =>
            id !== socket.id ? (
              <div key={id} onClick={() => handleNewChat(id)}>
                <p className="text-xl font-semibold">{clientList[id]}</p>
              </div>
            ) : null
          )}
        </div>
        <h1>Set your username</h1>
        <Input
          id="username"
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Button onClick={() => handleSetName(username)}>Set Name</Button>
        <div className="border-8">
          <h1>{guestname}</h1>
          <div className="min-w-48 min-h-72"></div>
          <div>
            <Input type="text" placeholder="Enter message" />
            <Button>Send</Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
