import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5000");

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("user-joined", ({ username }) => {
      setMessages((prev) => [
        ...prev,
        {
          type: "system",
          message: `${username} joined the room`,
        },
      ]);
    });

    socket.on("user-left", ({ username }) => {
      setMessages((prev) => [
        ...prev,
        {
          type: "system",
          message: `${username} left the room`,
        },
      ]);
    });

    return () => {
      socket.off("receive-message");
      socket.off("user-joined");
      socket.off("user-left");
    };
  }, []);

  const joinRoom = () => {
    if (!username.trim() || !room.trim()) return;

    socket.emit("join-room", {
      username,
      room,
    });

    setJoined(true);
  };

  const sendMessage = (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    socket.emit("send-message", {
      username,
      message,
      room,
    });

    setMessage("");
  };

  if (!joined) {
    return (
      <div className="app">
        <div className="join-card">
          <h1>Real-time Chat</h1>
          <p>Join a room to start chatting</p>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="text"
            placeholder="Room name"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />

          <button onClick={joinRoom}>Join Room</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="chat-container">
        <header>
          <h2>Room: {room}</h2>
          <p>Logged in as {username}</p>
        </header>

        <div className="messages">
          {messages.map((msg, index) =>
            msg.type === "system" ? (
              <div className="system-message" key={index}>
                {msg.message}
              </div>
            ) : (
              <div className="message" key={index}>
                <strong>{msg.username}</strong>
                <p>{msg.message}</p>
                <small>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </small>
              </div>
            )
          )}
        </div>

        <form className="message-form" onSubmit={sendMessage}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
          />

          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;