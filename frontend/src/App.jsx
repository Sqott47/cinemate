import React, { useState } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
} from "@mui/material";
import TelegramLogin from "./components/TelegramLogin";
import VideoPlayer from "./components/VideoPlayer";

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
  const [roomId, setRoomId] = useState("");
  const [user, setUser] = useState(null);
  const [joined, setJoined] = useState(false);

  const handleJoin = () => {
    if (roomId.trim() && user) {
      setJoined(true);
    }
  };

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
              <>
                <Typography variant="h4" align="center" gutterBottom fontWeight={600}>
                  Join Room
                </Typography>
                <TextField
                  fullWidth
                  label="Room ID"
                  variant="outlined"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  sx={{ mt: 2 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ mt: 3, fontWeight: 600 }}
                  onClick={handleJoin}
                >
                  Join
                </Button>
              </>
            ) : (
              <VideoPlayer roomId={roomId} username={user.name} userId={user.id} />
            )}
          </Paper>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
