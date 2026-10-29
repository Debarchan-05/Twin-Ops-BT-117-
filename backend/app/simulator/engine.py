import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Optional, Any
from backend.app.config import settings
from backend.app.database import SessionLocal
from backend.app.models.asset import Asset
from backend.app.models.telemetry import TelemetryReading
from backend.app.analytics.health_engine import calculate_health_assessment
from backend.app.services.alert_service import process_violations
from backend.app.services.websocket_manager import ws_manager
from backend.app.simulator.generator import PhysicalSensorSimulator

logger = logging.getLogger(__name__)


def utc_now():
    return datetime.now(timezone.utc)


class SimulationEngine:
    """
    Core industrial simulator engine.
    Runs continuous background loop generating realistic telemetry,
    computing asset health scores, handling anomalies/alerts, and broadcasting live.
    """

    def __init__(self):
        self.interval_seconds: float = settings.SIMULATION_INTERVAL_SECONDS
        self.seed: int = settings.SIMULATION_RANDOM_SEED
        self.generator = PhysicalSensorSimulator(seed=self.seed)
        self.is_running: bool = settings.SIMULATION_AUTOSTART
        self.tick_count: int = 0
        self._task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock()

    def start(self):
        """Starts background loop if not already running."""
        if self._task is None or self._task.done():
            self.is_running = True
            self._task = asyncio.create_task(self._run_loop())
            logger.info("Simulation background worker started.")

    def pause(self):
        self.is_running = False
        logger.info("Simulation paused.")

    def resume(self):
        self.is_running = True
        logger.info("Simulation resumed.")

    def stop(self):
        self.is_running = False
        if self._task and not self._task.done():
            self._task.cancel()
            self._task = None
        logger.info("Simulation stopped.")

    def reset(self, new_seed: Optional[int] = None):
        """Resets simulator telemetry state, wear accumulators, and active scenarios."""
        if new_seed is not None:
            self.seed = new_seed
        self.generator = PhysicalSensorSimulator(seed=self.seed)
        self.tick_count = 0
        logger.info(f"Simulation reset with seed {self.seed}.")

    def trigger_scenario(self, asset_id: str, scenario: str, intensity: float = 1.0):
        self.generator.set_scenario(asset_id, scenario, intensity)
        logger.info(f"Triggered scenario '{scenario}' for asset {asset_id} (intensity={intensity})")

    def get_status(self) -> Dict[str, Any]:
        active_scenarios = {
            asset_id: info["name"]
            for asset_id, info in self.generator.active_scenarios.items()
        }
        return {
            "is_running": self.is_running,
            "interval_seconds": self.interval_seconds,
            "seed": self.seed,
            "tick_count": self.tick_count,
            "active_scenarios": active_scenarios,
            "total_assets_simulated": len(self.generator.current_values),
        }

    async def _run_loop(self):
        """Periodic simulation tick generator."""
        while True:
            try:
                if self.is_running:
                    await self._step()
                await asyncio.sleep(self.interval_seconds)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error during simulation tick: {e}", exc_info=True)
                await asyncio.sleep(self.interval_seconds)

    async def _step(self):
        """Executes a single simulation tick across all registered assets."""
        self.tick_count += 1
        now = utc_now()
        broadcast_payload = {
            "type": "telemetry_update",
            "timestamp": now.isoformat(),
            "tick": self.tick_count,
            "assets": {},
        }

        db = SessionLocal()
        try:
            assets = db.query(Asset).all()
            for asset in assets:
                # Generate realistic physics reading
                metrics = self.generator.generate_next(asset, delta_t=self.interval_seconds)

                # Compute explainable health diagnostics
                assessment = calculate_health_assessment(asset, metrics)

                # Update asset record in database
                asset.health_score = assessment.health_score
                asset.health_condition = assessment.health_condition
                asset.degradation_indicator = assessment.degradation_indicator
                asset.maintenance_priority = assessment.maintenance_priority
                asset.recommended_action = assessment.recommended_action
                asset.last_telemetry_timestamp = now
                if asset.operational_status == "running":
                    asset.operating_hours += (self.interval_seconds / 3600.0)

                # Process violation alerts (with deduplication)
                process_violations(db, asset.id, assessment.critical_violations, assessment.warning_violations)

                # Save historical telemetry reading
                reading = TelemetryReading(
                    asset_id=asset.id,
                    timestamp=now,
                    metrics=metrics,
                    calculated_health_score=assessment.health_score,
                    is_simulated=True,
                )
                db.add(reading)

                # Populate WebSocket payload
                active_sc = self.generator.get_active_scenario(asset.id)
                broadcast_payload["assets"][asset.id] = {
                    "asset_id": asset.id,
                    "name": asset.name,
                    "operational_status": asset.operational_status,
                    "metrics": metrics,
                    "health_score": assessment.health_score,
                    "health_condition": assessment.health_condition,
                    "degradation_indicator": assessment.degradation_indicator,
                    "maintenance_priority": assessment.maintenance_priority,
                    "recommended_action": assessment.recommended_action,
                    "sensor_statuses": assessment.sensor_statuses,
                    "detected_anomalies": assessment.detected_anomalies,
                    "active_scenario": active_sc,
                }

            db.commit()

            # Broadcast live to connected clients
            await ws_manager.broadcast_json(broadcast_payload)

        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()


simulation_engine = SimulationEngine()
