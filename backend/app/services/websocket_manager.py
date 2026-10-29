import json
import logging
from typing import List, Dict, Any
from starlette.websockets import WebSocket, WebSocketState

logger = logging.getLogger(__name__)


class WebSocketConnectionManager:
    """Manages real-time WebSocket connections and broadcasts telemetry updates."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Active connections: {len(self.active_connections)}")

    async def broadcast_json(self, data: Dict[str, Any]):
        """Broadcasts a JSON-serializable message to all connected clients."""
        dead_connections = []
        for connection in self.active_connections:
            try:
                if connection.client_state == WebSocketState.CONNECTED:
                    await connection.send_json(data)
                else:
                    dead_connections.append(connection)
            except Exception as e:
                logger.warning(f"Error sending to WebSocket client: {e}")
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)


ws_manager = WebSocketConnectionManager()
