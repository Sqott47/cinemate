import React, { useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Stack,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  Tooltip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ForumIcon from "@mui/icons-material/Forum";

export default function ChatBox({ messages, input, setInput, onSend }) {
  const endRef = useRef(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2, bgcolor: "#121212", height: "100%", display: "flex", flexDirection: "column", borderRadius: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <ForumIcon color="primary" />
        <Typography variant="h6" fontWeight={700} color="white">
          Чат участников
        </Typography>
      </Stack>

      <Divider sx={{ borderColor: "#333", mb: 2 }} />

      <List sx={{ flexGrow: 1, overflowY: "auto", pr: 1 }}>
        {messages.map((msg, idx) => (
          <ListItem key={idx} alignItems="flex-start" sx={{ px: 0 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Avatar sx={{ bgcolor: "primary.main", fontSize: 14 }}>
                {msg.username[0]?.toUpperCase() || "?"}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                  {msg.username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {msg.message}
                </Typography>
              </Box>
            </Stack>
          </ListItem>
        ))}
        <div ref={endRef} />
      </List>

      <Divider sx={{ borderColor: "#333", my: 2 }} />

      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          variant="filled"
          placeholder="Введите сообщение..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          multiline
          maxRows={4}
          InputProps={{
            disableUnderline: true,
            sx: {
              bgcolor: "#1e1e1e",
              color: "white",
              borderRadius: 2,
              "& .MuiInputBase-input": {
                pb: "6px",
              },
            },
          }}

        />
        <Tooltip title="Отправить">
          <span>
            <IconButton
              color="primary"
              onClick={onSend}
              disabled={!input.trim()}
              sx={{ bgcolor: "#272727", borderRadius: 2 }}
            >
              <SendIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Paper>
  );
}
