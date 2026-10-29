from datetime import datetime, timezone, timedelta
from backend.app.database import SessionLocal, init_db
from backend.app.models.asset import Asset, SensorDefinition
from backend.app.models.telemetry import TelemetryReading
from backend.app.models.alert import Alert
from backend.app.models.maintenance import MaintenanceRecord


def utc_now():
    return datetime.now(timezone.utc)


def seed_database():
    init_db()
    db = SessionLocal()
    try:
        # Check if assets already exist
        if db.query(Asset).count() > 0:
            print("Database already contains assets. Skipping seed.")
            return

        print("Seeding initial industrial assets, sensors, and baseline records...")
        now = utc_now()

        # 1. Industrial Electric Motor
        motor = Asset(
            id="asset-motor-01",
            name="Main Drive Induction Motor M-101",
            asset_type="electric_motor",
            location="Plant 1 - Rolling Mill Bay A",
            manufacturer="ABB Industrial Systems",
            model_number="M3BP 280SMB 4",
            operational_status="running",
            installation_date=now - timedelta(days=420),
            health_score=94.5,
            health_condition="healthy",
            degradation_indicator=12.5,
            maintenance_priority="low",
            recommended_action="Optimal operation. Routine vibration sweep at next monthly interval.",
            operating_hours=3280.0,
            last_telemetry_timestamp=now,
        )

        motor_sensors = [
            SensorDefinition(
                asset_id="asset-motor-01",
                sensor_key="temperature",
                name="Stator Core Temperature",
                unit="°C",
                min_valid=-10.0,
                max_valid=150.0,
                warning_threshold=78.0,
                critical_threshold=88.0,
                nominal_value=62.0,
                weight=1.2,
            ),
            SensorDefinition(
                asset_id="asset-motor-01",
                sensor_key="vibration",
                name="Drive-End Vibration RMS",
                unit="mm/s",
                min_valid=0.0,
                max_valid=30.0,
                warning_threshold=4.5,
                critical_threshold=7.0,
                nominal_value=1.8,
                weight=1.5,
            ),
            SensorDefinition(
                asset_id="asset-motor-01",
                sensor_key="rotational_speed",
                name="Rotor Speed",
                unit="RPM",
                min_valid=0.0,
                max_valid=2200.0,
                warning_threshold=1520.0,
                critical_threshold=1580.0,
                nominal_value=1485.0,
                lower_warning_threshold=1420.0,
                lower_critical_threshold=1360.0,
                weight=1.0,
            ),
            SensorDefinition(
                asset_id="asset-motor-01",
                sensor_key="electrical_current",
                name="Phase RMS Current",
                unit="A",
                min_valid=0.0,
                max_valid=80.0,
                warning_threshold=32.0,
                critical_threshold=42.0,
                nominal_value=24.5,
                weight=1.3,
            ),
        ]

        # 2. Industrial Water Pump
        pump = Asset(
            id="asset-pump-01",
            name="Primary Feed Water Pump P-204",
            asset_type="water_pump",
            location="Boiler Room - Feed Loop B",
            manufacturer="Sulzer Pumps Ltd",
            model_number="CP-150-315 Multistage",
            operational_status="running",
            installation_date=now - timedelta(days=610),
            health_score=88.2,
            health_condition="healthy",
            degradation_indicator=18.0,
            maintenance_priority="low",
            recommended_action="Hydraulic pressure and discharge flow are within nominal limits.",
            operating_hours=4950.0,
            last_telemetry_timestamp=now,
        )

        pump_sensors = [
            SensorDefinition(
                asset_id="asset-pump-01",
                sensor_key="temperature",
                name="Thrust Bearing Temperature",
                unit="°C",
                min_valid=-10.0,
                max_valid=120.0,
                warning_threshold=65.0,
                critical_threshold=78.0,
                nominal_value=48.0,
                weight=1.1,
            ),
            SensorDefinition(
                asset_id="asset-pump-01",
                sensor_key="vibration",
                name="Casing Vibration Velocity",
                unit="mm/s",
                min_valid=0.0,
                max_valid=25.0,
                warning_threshold=4.2,
                critical_threshold=6.5,
                nominal_value=1.6,
                weight=1.4,
            ),
            SensorDefinition(
                asset_id="asset-pump-01",
                sensor_key="flow_rate",
                name="Discharge Flow Rate",
                unit="m³/h",
                min_valid=0.0,
                max_valid=220.0,
                warning_threshold=150.0,
                critical_threshold=170.0,
                nominal_value=122.0,
                lower_warning_threshold=95.0,
                lower_critical_threshold=75.0,
                weight=1.3,
            ),
            SensorDefinition(
                asset_id="asset-pump-01",
                sensor_key="pressure",
                name="Discharge Head Pressure",
                unit="bar",
                min_valid=0.0,
                max_valid=16.0,
                warning_threshold=8.0,
                critical_threshold=9.2,
                nominal_value=6.4,
                lower_warning_threshold=4.8,
                lower_critical_threshold=3.5,
                weight=1.2,
            ),
            SensorDefinition(
                asset_id="asset-pump-01",
                sensor_key="electrical_current",
                name="Driver Motor Current",
                unit="A",
                min_valid=0.0,
                max_valid=60.0,
                warning_threshold=26.0,
                critical_threshold=34.0,
                nominal_value=18.5,
                weight=1.0,
            ),
        ]

        # 3. Industrial Ventilation Fan
        fan = Asset(
            id="asset-fan-01",
            name="Centrifugal Exhaust Fan F-302",
            asset_type="industrial_fan",
            location="Building 4 - Roof Ventilation Deck",
            manufacturer="FläktGroup Industrial",
            model_number="JM Aerofoil 1200",
            operational_status="running",
            installation_date=now - timedelta(days=280),
            health_score=91.0,
            health_condition="healthy",
            degradation_indicator=14.0,
            maintenance_priority="low",
            recommended_action="Airflow volume and blade balance nominal.",
            operating_hours=2100.0,
            last_telemetry_timestamp=now,
        )

        fan_sensors = [
            SensorDefinition(
                asset_id="asset-fan-01",
                sensor_key="temperature",
                name="Shaft Journal Temperature",
                unit="°C",
                min_valid=-10.0,
                max_valid=110.0,
                warning_threshold=62.0,
                critical_threshold=75.0,
                nominal_value=43.0,
                weight=1.1,
            ),
            SensorDefinition(
                asset_id="asset-fan-01",
                sensor_key="vibration",
                name="Bearing Housing Vibration",
                unit="mm/s",
                min_valid=0.0,
                max_valid=30.0,
                warning_threshold=4.8,
                critical_threshold=7.2,
                nominal_value=2.0,
                weight=1.5,
            ),
            SensorDefinition(
                asset_id="asset-fan-01",
                sensor_key="rotational_speed",
                name="Impeller Fan RPM",
                unit="RPM",
                min_valid=0.0,
                max_valid=1600.0,
                warning_threshold=1080.0,
                critical_threshold=1180.0,
                nominal_value=960.0,
                lower_warning_threshold=860.0,
                lower_critical_threshold=750.0,
                weight=1.2,
            ),
            SensorDefinition(
                asset_id="asset-fan-01",
                sensor_key="electrical_current",
                name="Fan Drive Current",
                unit="A",
                min_valid=0.0,
                max_valid=45.0,
                warning_threshold=19.5,
                critical_threshold=25.0,
                nominal_value=13.8,
                weight=1.0,
            ),
        ]

        db.add(motor)
        db.add(pump)
        db.add(fan)
        db.flush()

        for s in motor_sensors:
            db.add(s)
        for s in pump_sensors:
            db.add(s)
        for s in fan_sensors:
            db.add(s)

        # Seed realistic historical telemetry (past 15 time points, every 10 seconds)
        for i in range(15, 0, -1):
            t = now - timedelta(seconds=i * 10)

            db.add(TelemetryReading(
                asset_id="asset-motor-01",
                timestamp=t,
                metrics={
                    "temperature": round(62.0 + (i % 3) * 0.4, 2),
                    "vibration": round(1.8 + (i % 2) * 0.1, 2),
                    "rotational_speed": round(1485.0 + (i % 4) * 1.5, 1),
                    "electrical_current": round(24.5 + (i % 3) * 0.2, 2),
                },
                calculated_health_score=round(94.5 - (i % 2) * 0.3, 1),
                is_simulated=True,
            ))

            db.add(TelemetryReading(
                asset_id="asset-pump-01",
                timestamp=t,
                metrics={
                    "temperature": round(48.0 + (i % 3) * 0.3, 2),
                    "vibration": round(1.6 + (i % 2) * 0.1, 2),
                    "flow_rate": round(122.0 + (i % 5) * 0.8, 2),
                    "pressure": round(6.4 + (i % 3) * 0.05, 2),
                    "electrical_current": round(18.5 + (i % 2) * 0.2, 2),
                },
                calculated_health_score=round(88.2 + (i % 3) * 0.2, 1),
                is_simulated=True,
            ))

            db.add(TelemetryReading(
                asset_id="asset-fan-01",
                timestamp=t,
                metrics={
                    "temperature": round(43.0 + (i % 2) * 0.4, 2),
                    "vibration": round(2.0 + (i % 3) * 0.1, 2),
                    "rotational_speed": round(960.0 + (i % 4) * 2.0, 1),
                    "electrical_current": round(13.8 + (i % 2) * 0.1, 2),
                },
                calculated_health_score=round(91.0 - (i % 2) * 0.4, 1),
                is_simulated=True,
            ))

        # Seed sample maintenance records
        db.add(MaintenanceRecord(
            asset_id="asset-motor-01",
            maintenance_type="preventive",
            priority="low",
            description="Semi-annual lubrication of drive and non-drive end ball bearings with synthetic grease.",
            scheduled_date=now + timedelta(days=14),
            status="scheduled",
            technician="Marcus Vance (Level II Tech)",
            notes="Use Mobil Polyrex EM grease as per OEM specification.",
        ))

        db.add(MaintenanceRecord(
            asset_id="asset-pump-01",
            maintenance_type="inspection",
            priority="medium",
            description="Mechanical seal flush plan inspection and impeller axial play measurement.",
            scheduled_date=now - timedelta(days=25),
            completed_date=now - timedelta(days=24),
            status="completed",
            technician="Sarah Chen (Hydraulics Specialist)",
            notes="Shaft runout verified within 0.03mm. Seal flush piping cleaned.",
            actions_taken="Replaced primary O-ring seals, flushed barrier fluid line.",
        ))

        db.add(MaintenanceRecord(
            asset_id="asset-fan-01",
            maintenance_type="preventive",
            priority="low",
            description="V-belt tension check and blade cleaning.",
            scheduled_date=now + timedelta(days=28),
            status="scheduled",
            technician="David Thorne",
            notes="Check static deflection on tensioner arm.",
        ))

        db.commit()
        print("Seed data successfully created.")
    except Exception as e:
        db.rollback()
        print(f"Error during database seed: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
