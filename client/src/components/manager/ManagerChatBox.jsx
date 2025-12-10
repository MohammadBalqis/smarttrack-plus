import React, { useEffect, useState } from "react";
import api from "../../api/apiClient";
import { io } from "socket.io-client";

const ManagerChatBox = ({ managerId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    api.get(`/chat/manager-company/${managerId}`).then((res) => {
      setMessages(res.data.data);
    });

    const socket = io(import.meta.env.VITE_API_URL);
    socket.on("chatUpdate", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.disconnect();
  }, []);

  const sendMessage = async () => {
    if (!input) return;

    await api.post("/chat/manager-company/send", {
      managerId,
      message: input
    });

    setInput("");
  };

  return (
    <div className="chat-box">
      <div className="messages">
        {messages.map((m, idx) => (
          <div key={idx} className={`msg ${m.senderType}`}>
            {m.message}
          </div>
        ))}
      </div>

      <div className="send-box">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ManagerChatBox;
