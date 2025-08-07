import React, { useState, useEffect } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Paper,
  Typography,
  Button,
} from "@mui/material";
import TelegramLogin from "./components/TelegramLogin";
import VideoPlayer from "./components/VideoPlayer";
import { API_BASE_URL } from "./config";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0a0a0a",
      paper: "#141414",
    },
    primary: {
      main: "#8b5cf6",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: "Inter, sans-serif",
  },
});

export default function App() {
  const [roomId, setRoomId] = useState(() =>
    new URLSearchParams(window.location.search).get("room") || ""
  );
  const [user, setUser] = useState(null);
  const [joined, setJoined] = useState(false);

  const createRoom = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/rooms/create`, {
        method: "POST",
      });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const data = await resp.json();
      setRoomId(data.room_id);
      const newUrl =
        data.room_url || `${window.location.pathname}?room=${data.room_id}`;
      window.history.replaceState(null, "", newUrl);
    } catch (err) {
      console.error("Failed to create room", err);
    }
  };

  useEffect(() => {
    if (user && roomId) {
      setJoined(true);
    }
  }, [user, roomId]);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          height: "100vh",
          width: "100vw",
          background: "radial-gradient(circle at top left, #1a1a2e, #0a0a0a)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 2,
        }}
      >
        <Box sx={{
                width: "100%",
                maxWidth: !user || !joined ? 400 : "min(95vw, 1280px)",
                mx: "auto",
            }}>
          <Paper
            elevation={6}
            sx={{
              p: 4,
              borderRadius: 4,
              width: "100%",
            }}
          >
            {!user ? (
              <>
                <Typography variant="h3" align="center" gutterBottom fontWeight={700}>
                  🎬 Cinemate
                </Typography>
                <TelegramLogin onAuthSuccess={setUser} />
              </>
            ) : !joined ? (
              <Button variant="contained" fullWidth onClick={createRoom}>
                Создать комнату
              </Button>
            ) : (
              <VideoPlayer roomId={roomId} username={user.name} userId={user.id} />
            )}
          </Paper>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
