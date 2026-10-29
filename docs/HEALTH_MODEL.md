# TwinOps Asset Health Scoring & Diagnostic Model

## 1. Executive Summary & Disclaimer

> [!NOTE]
> The current version of TwinOps utilizes a transparent, rule-based diagnostic model and synthetic sensor telemetry for research, academic demonstration, and workflow prototyping.
> It does **not** represent a certified physical industrial Remaining Useful Life (RUL) calculation. It is explicitly designed to be explainable, deterministic, and easily auditable.

---

## 2. Health Score Formulation

The asset health score $H(t) \in [0, 100]$ reflects the operational integrity of an industrial asset at time $t$.

### Mathematical Equation

$$H(t) = \max\left(0, \min\left(100, 100 - P_{\text{sensors}}(t) - P_{\text{wear}}(t)\right)\right)$$

Where:
- $P_{\text{sensors}}(t)$ is the aggregate weighted sensor penalty across all registered asset sensors.
- $P_{\text{wear}}(t)$ is the progressive mechanical wear penalty.

### Aggregate Sensor Penalty

$$P_{\text{sensors}}(t) = \frac{\sum_{i=1}^{N} w_i \cdot p_i(x_i(t))}{\sum_{i=1}^{N} w_i}$$

- $N$ is the number of sensors registered for the asset.
- $w_i$ is the configured weighting factor for sensor $i$ (default: $1.0$).
- $x_i(t)$ is the current measured telemetry reading for sensor $i$.
- $p_i(x_i(t))$ is the penalty function for sensor $i$.

---

## 3. Sensor Penalty Function & Hysteresis

For each individual sensor, the penalty $p_i(x)$ is determined by comparing measured value $x$ to its configured envelope:

- **Nominal ($x \le \text{Warn}$):**
  $$p_i(x) = 0$$
- **Warning Zone ($\text{Warn} < x < \text{Crit}$):**
  $$p_i(x) = 20.0 + 25.0 \times \left(\frac{x - \text{Warn}}{\text{Crit} - \text{Warn}}\right)$$
  *(Penalty ranges from 20 to 45 points)*
- **Critical Zone ($x \ge \text{Crit}$):**
  $$p_i(x) = 55.0 + 35.0 \times \min\left(1.0, \frac{x - \text{Crit}}{\max(1, \text{MaxValid} - \text{Crit})}\right)$$
  *(Penalty ranges from 55 to 90 points)*
- **Out of Sensor Range ($x < \text{MinValid}$ or $x > \text{MaxValid}$):**
  $$p_i(x) = 70.0 \quad \text{(Hardware / Telemetry Failure Anomaly)}$$

### Hysteresis Threshold Buffer

To eliminate **alarm flapping** (rapid oscillation between warning and normal states when a sensor hovers near a boundary), TwinOps enforces a 5% hysteresis buffer:

$$\Delta_{\text{hyst}} = 0.05 \times (\text{Thresh} - \text{Nominal})$$

- When transitioning from **Normal $\to$ Warning/Critical**, the actual threshold is used.
- When de-escalating from **Critical/Warning $\to$ Normal**, the measured value must drop strictly below $\text{Thresh} - \Delta_{\text{hyst}}$.

---

## 4. Critical Sensor Override Rule

In mission-critical industrial assets, an extreme anomaly on a single component (e.g. bearing catastrophic thermal runaway) cannot be masked by 4 other normal sensors having an aggregate score of 85%.

**The Override Logic:**
```python
if len(critical_violations) > 0:
    if health_score >= 50.0:
        health_score = min(health_score, 45.0)
    health_condition = "critical"
```
This guarantees that **any critical sensor violation triggers immediate critical alarm status** regardless of baseline weighting.

---

## 5. Condition Bands & Maintenance Priority

| Health Score Range | Operational Condition | Action Level | Description |
|:---|:---|:---|:---|
| **80.0 – 100.0** | `healthy` | Low | Optimal performance. Continue scheduled standard maintenance. |
| **50.0 – 79.9** | `degraded` | Medium / High | Moderate performance deviation or threshold warning. Inspect at next planned interval. |
| **< 50.0** | `critical` | Critical | Severe violation or critical temperature/vibration. Immediate intervention required. |

---

## 6. Progressive Mechanical Degradation Model

The degradation indicator $D(t) \in [0, 100]\%$ represents cumulative wear-and-tear:

$$D(t) = D(t-1) + \delta_{\text{runtime}} + \delta_{\text{stress}}$$

- Under normal steady running, wear increments by $+0.02\%$ per tick.
- During thermal or vibration fault injection scenarios, wear compounds rapidly by $+0.80\%$ per tick.
- As $D(t)$ increases, baseline operating temperatures and vibration RMS experience progressive upward baseline drift, simulating real mechanical aging.
