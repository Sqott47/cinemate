import React, { useEffect, useRef, useState } from "react";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  TextField,
  useTheme,
  useMediaQuery,
  Button,
  LinearProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PeopleIcon from "@mui/icons-material/People";
import ChatIcon from "@mui/icons-material/Chat";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import CloseIcon from "@mui/icons-material/Close";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import LinkIcon from "@mui/icons-material/Link";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import CustomVideoPlayer from "./CustomVideoPlayer";
import ChatBox from "./ChatBox";
import ParticipantsList from "./ParticipantsList";
import { WS_BASE_URL } from "../config";

function RemoteAudio({ stream }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err.name !== "AbortError") {
            console.error("Audio play failed", err);
          }
        });
      }
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay style={{ display: "none" }} />;
}

export default function VideoPlayer({ roomId, username, userId }) {
  const videoRef = useRef(null);
  const wsRef = useRef(null);
  const isRemoteAction = useRef(false);
  const wasKickedRef = useRef(false);

  const [wsReady, setWsReady] = useState(false);
  const [wasKicked, setWasKicked] = useState(false);
  const [users, setUsers] = useState([]);
  const [myUserId, setMyUserId] = useState(userId || null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [videoUrl, setVideoUrl] = useState("/sample.mp4");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("participants");

  const [micOn, setMicOn] = useState(false);
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const [remoteAudios, setRemoteAudios] = useState([]);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);
  const [micLevel, setMicLevel] = useState(0);
  const [micError, setMicError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const roomLink = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

  const handleCopyLink = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(roomLink)
        .then(() => setCopySuccess(true))
        .catch((err) => console.error("Clipboard write failed", err));
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = roomLink;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopySuccess(true);
      } catch (err) {
        console.error("execCommand copy failed", err);
      }
      textArea.remove();
    }
  };

  useEffect(() => {
    const ws = new WebSocket(
      `${WS_BASE_URL}/ws/${roomId}?username=${encodeURIComponent(username)}&user_id=${userId}`
    );
    wsRef.current = ws;

    ws.onopen = () => setWsReady(true);

    ws.onclose = () => {
      if (!wasKickedRef.current) {
        console.warn("WebSocket closed without kicked message");
      }
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "joined") {
        setMyUserId(data.user_id);
        return;
      }

      if (data.type === "users_update") {
        setUsers(data.users);
        return;
      }

      if (data.type === "video_changed") {
        setVideoUrl(data.video_url);
        return;
      }

      if (data.type === "kicked") {
        console.log("Received kicked");
        setWasKicked(true);
        wasKickedRef.current = true;
        wsRef.current?.close();
        setUsers([]);
        setMyUserId(null);
        return;
      }

      if (data.type === "voice-offer") {
        const { user_id: senderId, offer } = data;
        let pc = peersRef.current[senderId];
        if (!pc) {
          pc = createPeerConnection(senderId);
          peersRef.current[senderId] = pc;
        }
        if (localStreamRef.current) {
          const existingSenders = pc.getSenders();
          localStreamRef.current.getTracks().forEach((track) => {
            if (!existingSenders.find((s) => s.track === track)) {
              pc.addTrack(track, localStreamRef.current);
            }
          });
        }
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        wsRef.current?.send(JSON.stringify({
          type: "voice-answer",
          user_id: myUserId,
          target_id: senderId,
          answer,
        }));
        return;
      }

      if (data.type === "voice-answer") {
        const { user_id: senderId, answer } = data;
        const pc = peersRef.current[senderId];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
        return;
      }

      if (data.type === "voice-candidate") {
        const { user_id: senderId, candidate } = data;
        const pc = peersRef.current[senderId];
        if (pc && candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        return;
      }

      if (data.type === "chat") {
        setMessages((prev) => [...prev, data]);
        return;
      }

      const { type, timestamp } = data;
      isRemoteAction.current = true;

      if (!videoRef.current) return;

      switch (type) {
        case "play":
          videoRef.current.currentTime = timestamp;
          videoRef.current.play();
          break;
        case "pause":
          videoRef.current.currentTime = timestamp;
          videoRef.current.pause();
          break;
        case "seek":
          videoRef.current.currentTime = timestamp;
          break;
        default:
          break;
      }

      setTimeout(() => {
        isRemoteAction.current = false;
      }, 100);
    };

    return () => {
      ws.close();
      Object.values(peersRef.current).forEach((pc) => pc.close());
      setRemoteAudios([]);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      stopMicLevelMonitoring();
    };
  }, [roomId, username]);

  const sendEvent = (type) => {
    if (!wsReady || !videoRef.current || isRemoteAction.current || !myUserId) {
      console.log("[SEND BLOCKED]", { wsReady, hasVideo: !!videoRef.current, isRemote: isRemoteAction.current, myUserId });
      return;
    }

    const payload = {
      type,
      user_id: myUserId,
      timestamp: videoRef.current.currentTime,
    };
    console.log("[SEND EVENT]", payload);
    wsRef.current.send(JSON.stringify(payload));
  };

  const startMicLevelMonitoring = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioCtx();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      const update = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          const val = dataArrayRef.current[i] - 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / dataArrayRef.current.length) / 128;
        setMicLevel(rms);
        animationRef.current = requestAnimationFrame(update);
      };
      update();
    } catch (err) {
      console.error("Mic level monitoring failed", err);
    }
  };

  const stopMicLevelMonitoring = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setMicLevel(0);
  };
  const createPeerConnection = (targetId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        wsRef.current?.send(
          JSON.stringify({
            type: "voice-candidate",
            user_id: myUserId,
            target_id: targetId,
            candidate: e.candidate,
          })
        );
      }
    };
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      setRemoteAudios((prev) => {
        const exists = prev.find((a) => a.id === targetId);
        if (exists) {
          return prev.map((a) =>
            a.id === targetId ? { id: targetId, stream } : a
          );
        }
        return [...prev, { id: targetId, stream }];
      });
    };
    return pc;
  };

  const toggleMic = async () => {
    if (!myUserId) return;
    if (micOn) {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      stopMicLevelMonitoring();
      Object.values(peersRef.current).forEach((pc) => {
        pc.getSenders().forEach((sender) => {
          if (sender.track && sender.track.kind === "audio") {
            pc.removeTrack(sender);
          }
        });
      });
      setMicOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        startMicLevelMonitoring(stream);
        setMicOn(true);
        for (const u of users) {
          if (u.id === myUserId) continue;
          // Ensure consistent ordering for peer connection initiation.
          // User IDs are UUID strings, so numeric comparison fails (NaN),
          // resulting in both peers trying to create offers simultaneously.
          // Use string comparison instead to deterministically choose one
          // initiator per pair and avoid negotiation glare.
          if (String(myUserId) > String(u.id)) continue;
          let pc = peersRef.current[u.id];
          if (!pc) {
            pc = createPeerConnection(u.id);
            peersRef.current[u.id] = pc;
          }
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          wsRef.current?.send(
            JSON.stringify({
              type: "voice-offer",
              user_id: myUserId,
              target_id: u.id,
              offer,
            })
          );
        }
      } catch (err) {
        console.error("Mic error", err);
        setMicError(
          "Unable to access microphone. Please check permissions or device availability."
        );
      }
    }
  };

  useEffect(() => {
    if (!micOn || !localStreamRef.current || !myUserId) return;
    const setupPeers = async () => {
      try {
        for (const u of users) {
          if (u.id === myUserId) continue;
          // Same ordering logic as in toggleMic: compare IDs as strings
          // to decide which peer should create the offer.
          if (String(myUserId) > String(u.id)) continue;
          if (!peersRef.current[u.id]) {
            const pc = createPeerConnection(u.id);
            peersRef.current[u.id] = pc;
            localStreamRef.current
              .getTracks()
              .forEach((track) => pc.addTrack(track, localStreamRef.current));
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            wsRef.current?.send(
              JSON.stringify({
                type: "voice-offer",
                user_id: myUserId,
                target_id: u.id,
                offer,
              })
            );
          }
        }
      } catch (err) {
        console.error("Peer setup error", err);
      }
    };
    setupPeers();
    Object.keys(peersRef.current).forEach((id) => {
      if (!users.find((u) => u.id === id)) {
        peersRef.current[id].close();
        delete peersRef.current[id];
        setRemoteAudios((audios) => audios.filter((a) => a.id !== id));
      }
    });
  }, [users, micOn]);


  const setPermission = (targetId, newPermissions) => {
    if (!myUserId || !wsRef.current) return;
    wsRef.current.send(
      JSON.stringify({
        type: "set_permissions",
        user_id: myUserId,
        target_id: targetId,
        permissions: newPermissions,
      })
    );
  };

  const kickUser = (targetId) => {
    if (!myUserId || !wsRef.current) return;
    wsRef.current.send(
      JSON.stringify({
        type: "kick",
        user_id: myUserId,
        target_id: targetId,
      })
    );
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || !myUserId || !wsRef.current) return;
    wsRef.current.send(
      JSON.stringify({
        type: "chat",
        user_id: myUserId,
        message: chatInput.trim(),
      })
    );
    setChatInput("");
  };

  const me = users.find((u) => u.id === myUserId);
  const canChangeVideo = me?.permissions?.change_video;
  const canControl = me?.permissions?.control_video;
  if (wasKicked) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#0f0f0f",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          textAlign: "center",
          p: 4,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>Вы были удалены из комнаты</Typography>
          <Typography variant="body1">Вас удалил администратор или модератор.</Typography>
          <Button
            variant="contained"
            sx={{ mt: 3 }}
            onClick={() => window.location.reload()}
          >
            Вернуться на главную
          </Button>
        </Box>
      </Box>
    );
  }
  return (

    <>
      {remoteAudios.map(({ id, stream }) => (
        <RemoteAudio key={id} stream={stream} />
      ))}
      {/* Header */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight={600}>
            Room: {roomId}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
              <IconButton
                onClick={toggleMic}
                color={micOn ? "secondary" : "default"}
              >
                {micOn ? <MicIcon /> : <MicOffIcon />}
              </IconButton>
              {micOn && (
                <Box sx={{ width: 40, ml: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={micLevel * 100}
                    sx={{ height: 6, borderRadius: 2 }}
                  />
                </Box>
              )}
            </Box>

            <IconButton onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Video section */}
      <Box sx={{ px: 2, py: 4, display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
        <CustomVideoPlayer
          src={videoUrl}
          canControl={canControl}
          onPlay={() => sendEvent("play")}
          onPause={() => sendEvent("pause")}
          onSeek={() => sendEvent("seek")}
          ref={videoRef}
        />
      </Box>

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 380 }, bgcolor: "#1e1e1e" } }}
      >
        {/* Telegram-style side nav */}
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <List>
            <ListItemButton selected={activeTab === "participants"} onClick={() => setActiveTab("participants")}>
              <ListItemIcon><PeopleIcon /></ListItemIcon>
              <ListItemText primary="Участники" />
            </ListItemButton>
            <ListItemButton selected={activeTab === "video"} onClick={() => setActiveTab("video")}>
              <ListItemIcon><VideoLibraryIcon /></ListItemIcon>
              <ListItemText primary="Сменить видео" />
            </ListItemButton>
            <ListItemButton selected={activeTab === "chat"} onClick={() => setActiveTab("chat")}>
              <ListItemIcon><ChatIcon /></ListItemIcon>
              <ListItemText primary="Чат" />
            </ListItemButton>
            <ListItemButton selected={activeTab === "share"} onClick={() => setActiveTab("share")}>
              <ListItemIcon><LinkIcon /></ListItemIcon>
              <ListItemText primary="Скопировать ссылку" />
            </ListItemButton>
          </List>

          {isMobile && (
            <Box sx={{ p: 1 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setDrawerOpen(false)}
                startIcon={<CloseIcon />}
              >
                Закрыть
              </Button>
            </Box>
          )}

          <Divider sx={{ my: 1 }} />

          {/* Tab content */}
          <Box sx={{ p: 2, overflowY: "auto", flexGrow: 1 }}>
            {activeTab === "participants" && (
              <ParticipantsList
                users={users}
                myUserId={myUserId}
                onSetPermission={setPermission}
                onKickUser={kickUser}
              />
            )}
            {activeTab === "video" && (
              canChangeVideo ? (
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Вставьте URL видео и нажмите Enter"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      wsRef.current.send(
                        JSON.stringify({
                          type: "change_video",
                          user_id: myUserId,
                          video_url: e.target.value.trim(),
                        })
                      );
                      e.target.value = "";
                    }
                  }}
                />
              ) : (
                <Typography>У вас нет прав на смену видео.</Typography>
              )
            )}
            {activeTab === "chat" && (
              <ChatBox
                messages={messages}
                input={chatInput}
                setInput={setChatInput}
                onSend={handleSendChat}
              />
            )}
            {activeTab === "share" && (
              <Box>
                <Typography gutterBottom>Поделитесь ссылкой:</Typography>
                <TextField
                  fullWidth
                  value={roomLink}
                  InputProps={{ readOnly: true }}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopyLink}
                >
                  Скопировать
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>
      <Snackbar
        open={copySuccess}
        autoHideDuration={3000}
        onClose={() => setCopySuccess(false)}
      >
        <Alert
          onClose={() => setCopySuccess(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Ссылка успешно скопирована
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!micError}
        autoHideDuration={6000}
        onClose={() => setMicError("")}
      >
        <Alert
          onClose={() => setMicError("")}
          severity="error"
          sx={{ width: "100%" }}
        >
          {micError}
        </Alert>
      </Snackbar>
    </>
  );
}
