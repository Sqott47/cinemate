import React, { useEffect, useRef, useState, forwardRef } from "react";
import {
  Box,
  IconButton,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import FullscreenIcon from "@mui/icons-material/Fullscreen";

const CustomVideoPlayer = forwardRef(function CustomVideoPlayer(
  { src, canControl = true, onPlay, onPause, onSeek },
  ref
) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60).toString().padStart(2, "0");
    const seconds = Math.floor(time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const handleVolume = (_, value) => {
    setVolume(value);
    if (videoRef.current) videoRef.current.volume = value;
  };

  const handleSeek = (_, value) => {
    if (videoRef.current) videoRef.current.currentTime = value;
    if (onSeek) onSeek(value);
  };

  const handleFullscreen = () => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlayHandler = () => {
      setIsPlaying(true);
      onPlay?.();
    };
    const onPauseHandler = () => {
      setIsPlaying(false);
      onPause?.();
    };
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };
    const onLoaded = () => {
      setDuration(video.duration);
    };

    video.addEventListener("play", onPlayHandler);
    video.addEventListener("pause", onPauseHandler);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoaded);

    return () => {
      video.removeEventListener("play", onPlayHandler);
      video.removeEventListener("pause", onPauseHandler);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [onPlay, onPause]);

  return (
    <Box
      sx={{
        background: "#1e1e1e",
        borderRadius: 3,
        p: 2,
        width: "100%",
        maxWidth: "900px",
        marginTop: 3,
      }}
    >
      <video
        ref={(el) => {
          videoRef.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        }}
        src={src}
        style={{
          width: "100%",
          height: "auto",
          borderRadius: 8,
          display: "block",
          backgroundColor: "black",
        }}
      />
      <Stack direction="row" spacing={2} alignItems="center" mt={2}>
        {canControl && (
          <>
            <IconButton onClick={togglePlay} color="primary">
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>

            <Slider
              min={0}
              max={duration}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              sx={{ flexGrow: 1 }}
            />

            <Typography variant="body2" sx={{ minWidth: 80 }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Typography>
          </>
        )}

        <IconButton onClick={handleFullscreen}>
          <FullscreenIcon />
        </IconButton>
      </Stack>

      {canControl && (
        <Stack direction="row" spacing={2} alignItems="center" mt={1}>
          <IconButton onClick={() => handleVolume(null, volume === 0 ? 1 : 0)}>
            {volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
          </IconButton>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolume}
            sx={{ width: 120 }}
          />
        </Stack>
      )}
    </Box>
  );
});

export default CustomVideoPlayer;
