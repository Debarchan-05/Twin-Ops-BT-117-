import random
import math
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from backend.app.models.asset import Asset


class PhysicalSensorSimulator:
    """
    Simulates physical sensor telemetry using Ornstein-Uhlenbeck mean-reverting stochastic process.
    Produces smooth, inertia-driven physical fluctuations rather than random white noise.
    Supports fault scenario injections and progressive mechanical wear.
    """

    def __init__(self, seed: int = 42):
        self.rng = random.Random(seed)
        self.current_values: Dict[str, Dict[str, float]] = {}  # asset_id -> {sensor_key: current_val}
        self.active_scenarios: Dict[str, Dict[str, Any]] = {}  # asset_id -> {name, intensity, start_time}
        self.wear_accumulator: Dict[str, float] = {}  # asset_id -> cumulative wear points

    def set_seed(self, seed: int):
        self.rng = random.Random(seed)

    def set_scenario(self, asset_id: str, scenario: str, intensity: float = 1.0):
        if scenario == "clear" or scenario == "normal":
            self.active_scenarios.pop(asset_id, None)
        else:
            self.active_scenarios[asset_id] = {
                "name": scenario,
                "intensity": intensity,
                "start_time": datetime.now(timezone.utc),
            }

    def get_active_scenario(self, asset_id: str) -> Optional[str]:
        sc = self.active_scenarios.get(asset_id)
        return sc["name"] if sc else None

    def reset_asset(self, asset_id: str):
        self.current_values.pop(asset_id, None)
        self.active_scenarios.pop(asset_id, None)
        self.wear_accumulator.pop(asset_id, None)

    def generate_next(self, asset: Asset, delta_t: float = 2.0) -> Dict[str, float]:
        """
        Calculates next sensor telemetry reading for given asset using physics models,
        scenario injections, and wear-and-tear degradation.
        """
        asset_id = asset.id
        if asset_id not in self.current_values:
            self.current_values[asset_id] = {}

        if asset_id not in self.wear_accumulator:
            self.wear_accumulator[asset_id] = asset.degradation_indicator

        state = self.current_values[asset_id]
        scenario_info = self.active_scenarios.get(asset_id)
        scenario = scenario_info["name"] if scenario_info else "normal"
        intensity = scenario_info["intensity"] if scenario_info else 1.0

        metrics = {}

        # If asset is stopped or offline
        if asset.operational_status == "offline":
            for s in asset.sensors:
                metrics[s.sensor_key] = 0.0
            return metrics

        if asset.operational_status == "stopped":
            for s in asset.sensors:
                # Ambient temperature (e.g. 24°C), zero vibration/current/flow/rpm
                if "temp" in s.sensor_key:
                    metrics[s.sensor_key] = round(24.0 + self.rng.gauss(0, 0.2), 2)
                else:
                    metrics[s.sensor_key] = 0.0
            return metrics

        # Accumulate progressive mechanical wear over runtime
        # Standard rate: +0.02% per tick, accelerated if scenario is wear_acceleration
        wear_increment = 0.02 if scenario != "wear_acceleration" else (0.8 * intensity)
        self.wear_accumulator[asset_id] = min(100.0, self.wear_accumulator[asset_id] + wear_increment)
        degradation = self.wear_accumulator[asset_id]

        # Generate each sensor reading
        for sensor in asset.sensors:
            key = sensor.sensor_key
            nom = sensor.nominal_value
            crit = sensor.critical_threshold
            warn = sensor.warning_threshold

            # Mean reversion parameters
            theta = 0.25  # Reversion speed
            sigma = (warn - nom) * 0.08  # Volatility scale

            # Baseline target adjustment based on wear
            target_mean = nom
            if "temp" in key:
                target_mean += (degradation * 0.12)  # up to +12°C from wear
            elif "vibrat" in key:
                target_mean += (degradation * 0.04)  # up to +4 mm/s from wear
            elif "current" in key:
                target_mean += (degradation * 0.05)  # motor draws more under friction

            # Scenario modifications
            if scenario == "overheating" and ("temp" in key or key == "temperature"):
                target_mean = crit + (crit - warn) * 0.3 * intensity
                sigma *= 1.5
            elif scenario == "excessive_vibration" and ("vibrat" in key or key == "vibration"):
                target_mean = crit + (crit - warn) * 0.4 * intensity
                sigma *= 3.0
            elif scenario == "abnormal_current" and ("current" in key or key == "current_amp"):
                target_mean = crit + (crit - warn) * 0.35 * intensity
                sigma *= 2.0
            elif scenario == "sensor_failure" and key == "temperature":
                # Simulated hardware failure: erratic out-of-bounds spikes or zero
                metrics[key] = -99.9 if self.rng.random() < 0.5 else 999.0
                state[key] = metrics[key]
                continue

            # Prior value or start from target_mean
            current = state.get(key, target_mean)

            # Ornstein-Uhlenbeck step: x_{t+1} = x_t + theta*(mu - x_t)*dt + sigma*sqrt(dt)*dW
            dW = self.rng.gauss(0.0, 1.0)
            drift = theta * (target_mean - current) * delta_t
            diffusion = sigma * math.sqrt(delta_t) * dW
            next_val = current + drift + diffusion

            # Physical floor
            if next_val < sensor.min_valid:
                next_val = sensor.min_valid + abs(self.rng.gauss(0, 0.1))

            metrics[key] = round(next_val, 2)
            state[key] = next_val

        return metrics
