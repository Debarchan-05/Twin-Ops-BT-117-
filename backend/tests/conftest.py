import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.models.asset import Asset, SensorDefinition

# Use an in-memory SQLite database for isolated automated testing
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Provides a fresh database schema and session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Provides a FastAPI test client with mocked DB session dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_motor(db_session):
    """Creates a sample industrial electric motor asset with sensors."""
    motor = Asset(
        id="test-motor-01",
        name="Test Feed Motor",
        asset_type="electric_motor",
        location="Shop Floor 1",
        manufacturer="Siemens",
        model_number="1LA7096",
        operational_status="running",
        health_score=95.0,
        health_condition="healthy",
        degradation_indicator=10.0,
        maintenance_priority="low",
        recommended_action="Optimal operation",
        operating_hours=500.0,
    )
    db_session.add(motor)
    db_session.flush()

    temp_sensor = SensorDefinition(
        asset_id="test-motor-01",
        sensor_key="temperature",
        name="Stator Temperature",
        unit="°C",
        min_valid=-20.0,
        max_valid=150.0,
        warning_threshold=75.0,
        critical_threshold=85.0,
        nominal_value=60.0,
        weight=1.0,
    )
    vib_sensor = SensorDefinition(
        asset_id="test-motor-01",
        sensor_key="vibration",
        name="Vibration Velocity",
        unit="mm/s",
        min_valid=0.0,
        max_valid=25.0,
        warning_threshold=4.5,
        critical_threshold=7.0,
        nominal_value=1.5,
        weight=1.0,
    )
    db_session.add(temp_sensor)
    db_session.add(vib_sensor)
    db_session.commit()
    db_session.refresh(motor)
    return motor
