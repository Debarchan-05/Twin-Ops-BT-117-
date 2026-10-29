import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TelemetryReading, SensorDefinition } from '../types';

interface TelemetryChartProps {
  data: TelemetryReading[];
  metricKey: string;
  metricLabel: string;
  unit: string;
  strokeColor?: string;
  sensor?: SensorDefinition;
  showThresholds?: boolean;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  data,
  metricKey,
  metricLabel,
  unit,
  strokeColor = '#06b6d4',
  sensor,
  showThresholds = true,
}) => {
  // Format data for chart
  const chartData = data.map((reading) => {
    const val =
      metricKey === 'health_score'
        ? reading.calculated_health_score
        : reading.metrics?.[metricKey];

    const timeDate = new Date(reading.timestamp);
    const timeStr = timeDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return {
      timestamp: reading.timestamp,
      displayTime: timeStr,
      value: val !== undefined ? Number(val.toFixed(2)) : null,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center rounded-xl bg-industrial-900/60 border border-slate-800 text-slate-400">
        <p className="text-sm">No telemetry records available for this range</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="displayTime"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            dy={8}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            domain={['auto', 'auto']}
            dx={-4}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              fontSize: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
            labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
            formatter={(value: any) => [`${value} ${unit}`, metricLabel]}
          />

          {/* Reference thresholds */}
          {showThresholds && sensor && (
            <>
              {sensor.warning_threshold && (
                <ReferenceLine
                  y={sensor.warning_threshold}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{
                    value: `Warn (${sensor.warning_threshold})`,
                    fill: '#f59e0b',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
              )}
              {sensor.critical_threshold && (
                <ReferenceLine
                  y={sensor.critical_threshold}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  label={{
                    value: `Crit (${sensor.critical_threshold})`,
                    fill: '#f43f5e',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
              )}
            </>
          )}

          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: strokeColor, stroke: '#fff', strokeWidth: 1.5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
