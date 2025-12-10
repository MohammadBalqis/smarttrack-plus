// client/src/pages/manager/ManagerChat.jsx
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import {
  getManagerCompanyChatApi,
  sendManagerCompanyMessageApi,
} from "../../api/managerChatApi";

import styles from "../../styles/manager/managerChat.module.css";

const ManagerChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user?._id) return;

    // 1) Load history
    getManagerCompanyChatApi(user._id)
      .then((res) => setMessages(res.data.data || []))
      .catch(() => {});

    // 2) Socket connection
    const socket = io(import.meta.env.VITE_API_URL, {
      transports: ["websocket"],
    });

    socket.emit("register", {
      userId: user._id,
      role: user.role,
      companyId: user.companyId,
    });

    socket.on("chat:manager-company:newMessage", (msg) => {
      // Only add messages for this manager
      if (String(msg.managerId) !== String(user._id)) return;
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);

    try {
      await sendManagerCompanyMessageApi(input.trim());
      setInput(""); // message will come back via socket
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.chatWrapper}>
      <div className={styles.header}>
        <div>
          <h2>Chat with Company</h2>
          <p>Direct channel with your company owner / dispatcher.</p>
        </div>
      </div>

      <div className={styles.chatBox}>
        <div className={styles.messages}>
          {messages.length === 0 && (
            <div className={styles.emptyState}>
              No messages yet. Start the conversation with your company.
            </div>
          )}

          {messages.map((msg) => {
            const isManager = msg.senderType === "manager";
            return (
              <div
                key={msg._id}
                className={`${styles.messageRow} ${
                  isManager ? styles.manager : styles.company
                }`}
              >
                <div className={styles.bubble}>
                  <p className={styles.text}>{msg.message}</p>
                  <span className={styles.meta}>
                    {isManager ? "You" : "Company"} ·{" "}
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <form className={styles.inputBar} onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Type a message to your company..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" disabled={sending || !input.trim()}>
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManagerChat;
