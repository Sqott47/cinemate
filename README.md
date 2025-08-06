# Cinemate

## Manual reproduction steps for WebSocket disconnect

1. Run the backend server and frontend.
2. Open the application and connect to a room.
3. Stop the backend or block the connection before any WebSocket message is received.
4. Observe the browser console: a warning `WebSocket closed without kicked message` should appear, confirming the close handler runs even when no messages were processed.
