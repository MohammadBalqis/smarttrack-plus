import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import api from "../../api/apiClient";
import styles from "../../styles/company/companyChat.module.css";

const CompanyChat = () => {
  const [managers, setManagers] = useState([]);
  const [activeManager, setActiveManager] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  const socketRef = useRef(null);

  /* ================= SOCKET (SAFE INIT) ================= */
  useEffect(() => {
    const token = localStorage.getItem("st_token");

    if (!token) {
      console.warn("⛔ Socket not started: token missing");
      return;
    }

    socketRef.current = io(
      import.meta.env.VITE_API_URL || "http://localhost:5000",
      {
        transports: ["websocket"],
        auth: { token },
      }
    );

    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected:", socketRef.current.id);
      socketRef.current.emit("join", { role: "company" });
    });

    socketRef.current.on("chat:mc:new", (msg) => {
      if (msg.managerId === activeManager?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("❌ Socket error:", err.message);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [activeManager]);

  /* ================= LOAD MANAGERS ================= */
  useEffect(() => {
    const loadManagers = async () => {
      try {
        const res = await api.get("/manager/list-for-company");
        setManagers(res.data.data || []);
      } catch (err) {
        console.error("❌ Failed to load managers:", err);
      } finally {
        setLoading(false);
      }
    };

    loadManagers();
  }, []);

  /* ================= LOAD CHAT ================= */
  useEffect(() => {
    if (!activeManager) return;

    const loadChat = async () => {
      try {
        const res = await api.get(
          `/chat/manager-company/${activeManager._id}`
        );
        setMessages(res.data.data || []);
      } catch (err) {
        console.error("❌ Failed to load chat:", err);
      }
    };

    loadChat();
  }, [activeManager]);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!input.trim() || !activeManager) return;

    try {
      const res = await api.post("/chat/manager-company/send", {
        managerId: activeManager._id,
        message: input.trim(),
      });

      setMessages((prev) => [...prev, res.data.data]);
      setInput("");
    } catch (err) {
      console.error("❌ Failed to send message:", err);
    }
  };

  /* ================= UI ================= */
  if (loading) {
    return <div className={styles.selectText}>Loading managers…</div>;
  }

  return (
    <div className={styles.chatContainer}>
      {/* LEFT */}
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
            <div className={styles.managerName}>{m.fullName}</div>
            <div className={styles.managerShop}>{m.branchName || "—"}</div>
          </div>
        ))}

        {managers.length === 0 && (
          <div className={styles.selectText}>No managers found</div>
        )}
      </div>

      {/* RIGHT */}
      <div className={styles.chatWindow}>
        {activeManager ? (
          <>
            <div className={styles.chatHeader}>
              Chat with {activeManager.fullName}
            </div>

            <div className={styles.messages}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
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
                placeholder="Type a message…"
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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
