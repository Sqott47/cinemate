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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PeopleIcon from "@mui/icons-material/People";
import ChatIcon from "@mui/icons-material/Chat";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import CloseIcon from "@mui/icons-material/Close";

import CustomVideoPlayer from "./CustomVideoPlayer";
import ChatBox from "./ChatBox";
import ParticipantsList from "./ParticipantsList";

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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${roomId}?username=${encodeURIComponent(username)}&user_id=${userId}`);
    wsRef.current = ws;

    ws.onopen = () => setWsReady(true);

    ws.onclose = () => {
      if (!wasKickedRef.current) {
        console.warn("WebSocket closed without kicked message");
      }
    };

    ws.onmessage = (event) => {
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
      {/* Header */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight={600}>
            Room: {roomId}
          </Typography>
          <IconButton onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Video section */}
      <Box sx={{ px: 2, py: 4, display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
        <CustomVideoPlayer
          src={videoUrl}
          canControl={canControl}
          onPlay={() => sendEvent("play")}
          onPause={() => sendEvent("pause")}
          onSeek={(time) => sendEvent("seek")}
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
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
