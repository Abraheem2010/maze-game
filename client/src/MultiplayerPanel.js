import { useEffect, useMemo, useRef, useState } from "react";
import { onChat, onPeers, onStatus, sendChat, toggleMute } from "./multiplayer";

function MultiplayerPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [peers, setPeers] = useState([]);
  const [status, setStatus] = useState({ connected: false, muted: false, roomFull: false });
  const logRef = useRef(null);

  const youName = useMemo(() => {
    const name = localStorage.getItem("playerName") || "You";
    return name.trim() || "You";
  }, []);

  useEffect(() => {
    const unsubChat = onChat((msg) => {
      setMessages((prev) => [...prev, msg].slice(-60));
      requestAnimationFrame(() => {
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight;
        }
      });
    });
    const unsubPeers = onPeers((list) => setPeers(list));
    const unsubStatus = onStatus((s) => setStatus(s));
    return () => {
      unsubChat();
      unsubPeers();
      unsubStatus();
    };
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    sendChat(input);
    setInput("");
  };

  const count = peers.length + 1;

  return (
    <div className="mp-panel">
      <div className="mp-header">
        <div className="mp-title">Party Chat</div>
        <div className="mp-status">
          {status.roomFull ? "Room full" : status.connected ? `Connected (${count}/3)` : "Connecting..."}
        </div>
        <button className="mp-mic" type="button" onClick={toggleMute}>
          {status.muted ? "Mic Off" : "Mic On"}
        </button>
      </div>

      <div className="mp-players">
        <span className="mp-player">You: {youName}</span>
        {peers.map((peer) => (
          <span key={peer.id} className="mp-player">
            {peer.name || "Player"}
          </span>
        ))}
      </div>

      <div className="mp-log" ref={logRef}>
        {messages.length === 0 && <div className="mp-empty">No messages yet</div>}
        {messages.map((msg) => (
          <div key={`${msg.ts || Date.now()}-${msg.id || "sys"}`} className="mp-msg">
            <span className="mp-name">{msg.name || "Player"}:</span>
            <span className="mp-text">{msg.text}</span>
          </div>
        ))}
      </div>

      <div className="mp-input">
        <input
          type="text"
          value={input}
          placeholder="Type a message..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button type="button" onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default MultiplayerPanel;
