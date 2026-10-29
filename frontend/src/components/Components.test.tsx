import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthBadge } from './HealthBadge';
import { StatusBadge } from './StatusBadge';
import { StatCard } from './StatCard';
import { AssetSchematic } from './AssetSchematic';
import { Activity } from 'lucide-react';

describe('Frontend Component Tests', () => {
  it('renders HealthBadge correctly for healthy condition', () => {
    render(<HealthBadge condition="healthy" score={94.5} />);
    expect(screen.getByText(/healthy/i)).toBeInTheDocument();
    expect(screen.getByText('94.5%')).toBeInTheDocument();
  });

  it('renders HealthBadge correctly for critical condition', () => {
    render(<HealthBadge condition="critical" score={38.2} />);
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
    expect(screen.getByText('38.2%')).toBeInTheDocument();
  });

  it('renders StatusBadge correctly', () => {
    render(<StatusBadge status="running" />);
    expect(screen.getByText(/running/i)).toBeInTheDocument();
  });

  it('renders StatCard with title and value', () => {
    render(
      <StatCard
        title="Fleet Health Index"
        value="92.4%"
        subtitle="3 of 3 nominal"
        icon={Activity}
      />
    );
    expect(screen.getByText('Fleet Health Index')).toBeInTheDocument();
    expect(screen.getByText('92.4%')).toBeInTheDocument();
    expect(screen.getByText('3 of 3 nominal')).toBeInTheDocument();
  });

  it('renders AssetSchematic for electric motor with live metrics', () => {
    render(
      <AssetSchematic
        assetType="electric_motor"
        operationalStatus="running"
        healthCondition="healthy"
        metrics={{ temperature: 64.2, vibration: 1.8, rotational_speed: 1485 }}
      />
    );
    expect(screen.getByText(/3-Phase Induction Motor Assembly/i)).toBeInTheDocument();
    expect(screen.getByText('64.2')).toBeInTheDocument();
    expect(screen.getByText('1.80')).toBeInTheDocument();
  });

  it('renders AssetSchematic for water pump with live metrics', () => {
    render(
      <AssetSchematic
        assetType="water_pump"
        operationalStatus="running"
        healthCondition="healthy"
        metrics={{ temperature: 48.0, vibration: 1.5, flow_rate: 122.5, pressure: 6.4 }}
      />
    );
    expect(screen.getByText(/Centrifugal Multistage Pump Architecture/i)).toBeInTheDocument();
    expect(screen.getByText('122.5')).toBeInTheDocument();
    expect(screen.getByText('6.40')).toBeInTheDocument();
  });
});
