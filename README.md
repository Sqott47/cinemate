# Cinemate

## LiveKit server

The project uses [LiveKit](https://livekit.io) for voice chat. To run the server locally:

1. Define the environment variables:
   - `LIVEKIT_API_KEY` – API key for the server.
   - `LIVEKIT_API_SECRET` – API secret used for signing tokens.
   - `LIVEKIT_URL` – WebSocket URL of the LiveKit server (for example, `ws://localhost:7880`).
   - `LIVEKIT_METRICS_URL` – optional metrics endpoint (default `http://livekit:7880/metrics`).
   - `USE_LIVEKIT` – set to `true` to enable LiveKit in the backend.
   - `VITE_USE_LIVEKIT` – set to `true` when building the frontend to enable LiveKit.
2. Start the LiveKit server and backend via docker:

```bash
LIVEKIT_API_KEY=devkey \
LIVEKIT_API_SECRET=devsecret \
LIVEKIT_URL=ws://localhost:7880 \
docker compose up livekit backend
```

The server runs on port `7880` in development mode without TLS.

## Manual reproduction steps for WebSocket disconnect

1. Run the backend server and frontend.
2. Open the application and connect to a room.
3. Stop the backend or block the connection before any WebSocket message is received.
4. Observe the browser console: a warning `WebSocket closed without kicked message` should appear, confirming the close handler runs even when no messages were processed.

