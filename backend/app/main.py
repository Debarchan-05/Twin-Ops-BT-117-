from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import init_db
from backend.app.seed import seed_database
from backend.app.api import api_router
from backend.app.services.websocket_manager import ws_manager
from backend.app.simulator.engine import simulation_engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed sample data
    init_db()
    seed_database()

    # Start the simulation background loop
    if settings.SIMULATION_AUTOSTART:
        simulation_engine.start()

    yield

    # Clean shutdown
    simulation_engine.stop()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="TwinOps: Generalized Modular Digital Twin Framework for Real-Time Industrial Infrastructure Monitoring",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["system"])
def health_check():
    """Service health probe endpoint."""
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "simulation": simulation_engine.get_status(),
    }


@app.websocket("/ws")
@app.websocket("/api/ws")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time telemetry streaming and asset alerts.
    Clients receive instant updates when simulation ticks occur.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection open; receive client pings/messages if sent
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
