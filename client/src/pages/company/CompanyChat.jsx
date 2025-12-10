// client/src/pages/company/CompanyChat.jsx
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import api from "../../api/apiClient";
import styles from "../../styles/company/companyChat.module.css";

const CompanyChat = () => {
  const [managers, setManagers] = useState([]);
  const [activeManager, setActiveManager] = useState(null);
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");

  const socket = io(import.meta.env.VITE_API_URL, {
    transports: ["websocket"],
  });

  /* ------------------------------------------------------------
     LOAD ALL MANAGERS UNDER THIS COMPANY
  ------------------------------------------------------------ */
  useEffect(() => {
    api.get("/manager/list").then((res) => {
      setManagers(res.data.data);
    });
  }, []);

  /* ------------------------------------------------------------
     LOAD CHAT WHEN MANAGER SELECTED
  ------------------------------------------------------------ */
  useEffect(() => {
    if (!activeManager) return;

    api.get(`/chat/manager-company/${activeManager._id}`).then((res) => {
      setChat(res.data.data);
    });
  }, [activeManager]);

  /* ------------------------------------------------------------
     SOCKET: REAL-TIME RECEIVING
  ------------------------------------------------------------ */
  useEffect(() => {
    socket.on("chat:manager-company:newMessage", (msg) => {
      if (msg.managerId === activeManager?._id) {
        setChat((prev) => [...prev, msg]);
      }
    });

    return () => socket.disconnect();
  }, [activeManager]);

  /* ------------------------------------------------------------
     SEND MESSAGE
  ------------------------------------------------------------ */
  const sendMessage = async () => {
    if (!input.trim() || !activeManager) return;

    const res = await api.post("/chat/manager-company/send", {
      managerId: activeManager._id,
      message: input,
    });

    setChat((prev) => [...prev, res.data.data]);
    setInput("");
  };

  return (
    <div className={styles.chatContainer}>
      {/* LEFT: MANAGER LIST */}
      <div className={styles.managerList}>
        <h3>Managers</h3>
        {managers.map((m) => (
          <div
            key={m._id}
            className={`${styles.managerItem} ${
              activeManager?._id === m._id ? styles.activeManager : ""
            }`}
            onClick={() => setActiveManager(m)}
          >
            <span className={styles.managerName}>{m.fullName}</span>
            <span className={styles.managerShop}>{m.shopName}</span>
          </div>
        ))}
      </div>

      {/* RIGHT: CHAT WINDOW */}
      <div className={styles.chatWindow}>
        {activeManager ? (
          <>
            <div className={styles.chatHeader}>
              Chat with {activeManager.fullName}
            </div>

            <div className={styles.messages}>
              {chat.map((msg, i) => (
                <div
                  key={i}
                  className={
                    msg.senderType === "company"
                      ? styles.msgCompany
                      : styles.msgManager
                  }
                >
                  {msg.message}
                </div>
              ))}
            </div>

            <div className={styles.inputBox}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className={styles.selectText}>
            Select a manager to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyChat;
