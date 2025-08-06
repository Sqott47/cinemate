import React from "react";
import {
  Box,
  Typography,
  Switch,
  IconButton,
  Stack,
  Paper,
  Tooltip,
  Divider,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonIcon from "@mui/icons-material/Person";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import BlockIcon from "@mui/icons-material/Block";

export default function ParticipantsList({ users, myUserId, onSetPermission, onKickUser }) {
  const me = users.find((u) => u.id === myUserId);
  const isAdmin = me?.role === "admin";

  const handlePermissionChange = (userId, key, value) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const updatedPermissions = { ...target.permissions, [key]: value };
    onSetPermission(userId, updatedPermissions);
  };

  return (
    <Stack spacing={2}>
      {users.map((user) => {
        const isSelf = user.id === myUserId;
        const canEdit = isAdmin && !isSelf;

        return (
          <Paper
            key={user.id}
            elevation={2}
            sx={{
              p: 2,
              bgcolor: isSelf ? "#272727" : "#1f1f1f",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {/* Заголовок */}
            <Stack direction="row" spacing={1} alignItems="center">
              {user.role === "admin" ? (
                <Tooltip title="Администратор">
                  <AdminPanelSettingsIcon color="warning" fontSize="small" />
                </Tooltip>
              ) : (
                <Tooltip title="Гость">
                  <PersonIcon fontSize="small" />
                </Tooltip>
              )}
              <Typography fontWeight={500}>{user.name}</Typography>
              {canEdit && (
                <Box sx={{ marginLeft: "auto" }}>
                  <Tooltip title="Исключить пользователя">
                    <IconButton size="small" color="error" onClick={() => onKickUser(user.id)}>
                      <ClearIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Stack>

            <Divider sx={{ borderColor: "#333" }} />

            {/* Свитчи с подписями */}
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center">
                  <PlayCircleOutlineIcon fontSize="small" />
                  <Typography variant="body2">Управление видео</Typography>
                </Stack>
                <Switch
                  size="small"
                  color="primary"
                  disabled={!canEdit}
                  checked={user.permissions?.control_video || false}
                  onChange={(e) => handlePermissionChange(user.id, "control_video", e.target.checked)}
                />
              </Stack>

              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center">
                  <VideoLibraryIcon fontSize="small" />
                  <Typography variant="body2">Сменить видео</Typography>
                </Stack>
                <Switch
                  size="small"
                  color="secondary"
                  disabled={!canEdit}
                  checked={user.permissions?.change_video || false}
                  onChange={(e) => handlePermissionChange(user.id, "change_video", e.target.checked)}
                />
              </Stack>

              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center">
                  <BlockIcon fontSize="small" />
                  <Typography variant="body2">Исключать участников</Typography>
                </Stack>
                <Switch
                  size="small"
                  color="error"
                  disabled={!canEdit}
                  checked={user.permissions?.kick || false}
                  onChange={(e) => handlePermissionChange(user.id, "kick", e.target.checked)}
                />
              </Stack>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
