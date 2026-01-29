const listeners = {
  peers: new Set(),
  chat: new Set(),
  status: new Set(),
};

function emit(type, payload) {
  listeners[type].forEach((cb) => cb(payload));
}

let socket = null;
let clientId = null;
let roomId = null;
let playerName = null;
let avatarUrl = null;
let peers = new Map();
let localStream = null;
let peerConnections = new Map();
let peerAudio = new Map();
let muted = false;
let roomFull = false;
let pendingPosition = null;

const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function getPeers() {
  return Array.from(peers.values());
}

function updatePeers(nextPeers) {
  peers = nextPeers;
  emit("peers", getPeers());
}

function sendJson(payload) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

async function ensureAudio() {
  if (localStream) return;
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    muted = false;
    emit("status", getStatus());
  } catch {
    emit("status", { ...getStatus(), micDenied: true });
  }
}

function attachStream(peerId, stream) {
  const existing = peerAudio.get(peerId);
  if (existing) {
    if (existing.srcObject !== stream) {
      existing.srcObject = stream;
      existing.play().catch(() => {});
    }
    return;
  }
  const audio = new Audio();
  audio.autoplay = true;
  audio.playsInline = true;
  audio.srcObject = stream;
  audio.play().catch(() => {});
  peerAudio.set(peerId, audio);
}

function stopAudio(audio) {
  if (!audio) return;
  try {
    audio.pause();
  } catch {}
  audio.srcObject = null;
}

function createPeerConnection(peerId) {
  const pc = new RTCPeerConnection(rtcConfig);
  peerConnections.set(peerId, pc);

  if (localStream) {
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
  }

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      sendJson({ type: "signal", to: peerId, signal: { type: "candidate", candidate: event.candidate } });
    }
  };

  pc.ontrack = (event) => {
    const [stream] = event.streams;
    if (stream) attachStream(peerId, stream);
  };

  return pc;
}

function closePeer(peerId) {
  const pc = peerConnections.get(peerId);
  if (pc) {
    pc.close();
  }
  peerConnections.delete(peerId);
  stopAudio(peerAudio.get(peerId));
  peerAudio.delete(peerId);
}

export async function connectToRoom({ name, room, avatar, stage }) {
  playerName = name || playerName || "Player";
  roomId = room || roomId || "maze";
  avatarUrl = typeof avatar === "string" ? avatar : avatarUrl || "";

  if (socket && socket.readyState === WebSocket.OPEN) {
    sendJson({ type: "update", name: playerName, avatar: avatarUrl, stage });
    return;
  }

  if (socket && socket.readyState === WebSocket.CONNECTING) return;

  roomFull = false;
  await ensureAudio();

  const apiBase = process.env.REACT_APP_API_URL || "";
  let wsUrl = "";
  if (apiBase) {
    try {
      const url = new URL(apiBase);
      const proto = url.protocol === "https:" ? "wss" : "ws";
      wsUrl = `${proto}://${url.host}`;
    } catch {
      wsUrl = "";
    }
  }
  if (!wsUrl) {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.port === "3001" ? `${window.location.hostname}:3000` : window.location.host;
    wsUrl = `${proto}://${host}`;
  }
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    sendJson({ type: "join", name: playerName, room: roomId, avatar: avatarUrl, stage });
  };

  socket.onmessage = async (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }

    if (msg.type === "room-full") {
      roomFull = true;
      emit("status", getStatus());
      socket.close();
      return;
    }

    if (msg.type === "welcome") {
      clientId = msg.id;
      const nextPeers = new Map();
      (msg.peers || []).forEach((peer) => {
        nextPeers.set(peer.id, { ...peer, pos: null });
      });
      updatePeers(nextPeers);

      for (const peer of nextPeers.values()) {
        const pc = createPeerConnection(peer.id);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendJson({ type: "signal", to: peer.id, signal: { type: "offer", sdp: pc.localDescription } });
      }
      if (pendingPosition) {
        sendJson({ type: "position", pos: pendingPosition.pos, stage: pendingPosition.stage });
      }
      emit("status", getStatus());
      return;
    }

    if (msg.type === "peer-joined") {
      const nextPeers = new Map(peers);
      nextPeers.set(msg.peer.id, { ...msg.peer, pos: null });
      updatePeers(nextPeers);
      return;
    }

    if (msg.type === "peer-left") {
      closePeer(msg.id);
      const nextPeers = new Map(peers);
      nextPeers.delete(msg.id);
      updatePeers(nextPeers);
      return;
    }

    if (msg.type === "peer-updated") {
      const nextPeers = new Map(peers);
      const prev = nextPeers.get(msg.peer.id) || {};
      nextPeers.set(msg.peer.id, { ...prev, ...msg.peer });
      updatePeers(nextPeers);
      return;
    }

    if (msg.type === "position") {
      const nextPeers = new Map(peers);
      const prev = nextPeers.get(msg.id) || { id: msg.id };
      nextPeers.set(msg.id, { ...prev, pos: msg.pos, stage: msg.stage });
      updatePeers(nextPeers);
      return;
    }

    if (msg.type === "chat") {
      emit("chat", msg);
      return;
    }

    if (msg.type === "signal") {
      const from = msg.from;
      let pc = peerConnections.get(from);
      if (!pc) {
        pc = createPeerConnection(from);
      }

      if (msg.signal?.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(msg.signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendJson({ type: "signal", to: from, signal: { type: "answer", sdp: pc.localDescription } });
      } else if (msg.signal?.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(msg.signal.sdp));
      } else if (msg.signal?.type === "candidate") {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(msg.signal.candidate));
        } catch {
          // ignore
        }
      }
    }
  };

  socket.onclose = () => {
    clientId = null;
    peerConnections.forEach((pc) => pc.close());
    peerConnections.clear();
    peerAudio.forEach((audio) => stopAudio(audio));
    peerAudio.clear();
    updatePeers(new Map());
    emit("status", getStatus());
  };
}

export function sendChat(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return;
  sendJson({ type: "chat", text: trimmed });
}

export function sendPosition(pos, stage) {
  if (!pos) return;
  pendingPosition = { pos, stage };
  sendJson({ type: "position", pos, stage });
}

export function toggleMute() {
  if (!localStream) return false;
  muted = !muted;
  localStream.getTracks().forEach((track) => {
    track.enabled = !muted;
  });
  emit("status", getStatus());
  return muted;
}

export function getStatus() {
  return {
    connected: Boolean(socket && socket.readyState === WebSocket.OPEN),
    roomFull,
    muted,
    clientId,
    roomId,
  };
}

export function onPeers(cb) {
  listeners.peers.add(cb);
  cb(getPeers());
  return () => listeners.peers.delete(cb);
}

export function onChat(cb) {
  listeners.chat.add(cb);
  return () => listeners.chat.delete(cb);
}

export function onStatus(cb) {
  listeners.status.add(cb);
  cb(getStatus());
  return () => listeners.status.delete(cb);
}
