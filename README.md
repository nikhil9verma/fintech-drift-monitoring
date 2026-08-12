# FinTech Drift Monitoring System

A production-style **ML data drift monitoring pipeline** built using Python, Evidently AI, APScheduler, and NumPy 2.x compatible APIs.

This project simulates real-world customer data drift in a banking churn prediction system and automatically detects distribution shifts using **PSI (Population Stability Index)**.

---

## Features

- Simulates realistic production data drift
- Detects feature-level drift using PSI
- Generates HTML drift reports
- Logs monitoring history
- Automated scheduled monitoring every 24 hours
- Slack alert integration support
- Compatible with:
  - Python 3.14
  - NumPy 2.x
  - Latest Evidently API

---

## Tech Stack

- Python
- Pandas
- NumPy 2.x
- Evidently AI
- APScheduler
- Requests

---

## Project Structure

```bash
Evidently_AI/
│
├── simulate_drift.py       # Simulates production drift
├── monitor.py              # Runs drift detection
├── scheduler.py            # Automates monitoring
│
├── reference_data.csv      # Baseline/reference dataset
├── current_data.csv        # Simulated production dataset
│
├── drift_report.html       # Evidently visual report
├── drift_log.jsonl         # Historical monitoring logs
│
└── README.md
```

---

## What is Data Drift?

Data drift occurs when the statistical properties of incoming production data change over time compared to the training data.

This can silently degrade ML model performance in production.

Examples:
- Customer age distribution changes
- Balance/income patterns shift
- Regional customer composition changes

This project monitors such shifts automatically.

---

## Drift Simulation

The script `simulate_drift.py` creates synthetic production drift.

### Simulated Changes

| Feature | Drift Applied |
|---|---|
| Age | Increased by ~12 years |
| Balance | Increased by 30–80% |
| Geography | Germany customer share increased |

---

## Drift Detection Method

This project uses:

### PSI — Population Stability Index

PSI measures how much a feature distribution changes between:
- Reference data
- Current production data

### PSI Interpretation

| PSI Score | Meaning |
|---|---|
| < 0.1 | Stable |
| 0.1 – 0.25 | Moderate drift |
| > 0.25 | Significant drift |

---

## Installation

Clone the repository:

```bash
git clone https://github.com/your-username/fintech-drift-monitoring.git
cd fintech-drift-monitoring
```

Install dependencies:

```bash
pip install evidently
pip install apscheduler
pip install pandas numpy requests kagglehub
```

---

## Running the Project

### 1. Generate Drifted Data

```bash
python simulate_drift.py
```

This creates:

- `reference_data.csv`
- `current_data.csv`

---

### 2. Run Drift Monitoring

```bash
python monitor.py
```

Example Output:

```bash
[2026-05-16 17:29:07] Running drift check...

Report saved: drift_report.html

CreditScore            ✓ stable  (PSI=0.0119)
Age                    ⚠️ DRIFT  (PSI=1.6796)
Tenure                 ✓ stable  (PSI=0.0103)
Balance                ⚠️ DRIFT  (PSI=2.0406)
EstimatedSalary        ✓ stable  (PSI=0.0181)
NumOfProducts          ✓ stable  (PSI=0.0003)
HasCrCard              ✓ stable  (PSI=0.0001)
IsActiveMember         ✓ stable  (PSI=0.0013)
Exited                 ✓ stable  (PSI=0.0005)

Drifted: 2/9 (22.2%)
Dataset drift detected: False

✓ Logged to drift_log.jsonl
```

---

## Automated Monitoring

Run scheduler:

```bash
python scheduler.py
```

This:
- Runs drift checks automatically every 24 hours
- Generates updated reports
- Logs monitoring history

---

## HTML Drift Report

The project generates:

```bash
drift_report.html
```

This contains:
- Feature distributions
- PSI scores
- Drift visualizations
- Statistical summaries

Open it in a browser for full analysis.

---

## Drift Logging

Each monitoring run appends logs to:

```bash
drift_log.jsonl
```

Example:

```json
{
  "timestamp": "2026-05-16T17:29:07",
  "drift_detected": false,
  "drift_share": 0.2222,
  "n_drifted": 2,
  "n_total": 9,
  "drifted_features": ["Age", "Balance"]
}
```

---

## Slack Alert Support

`monitor.py` includes optional Slack webhook integration.

Add your webhook URL:

```python
SLACK_WEBHOOK = "YOUR_WEBHOOK_URL"
```

Alerts are triggered when dataset drift exceeds threshold.

---

## Learning Outcomes

This project demonstrates:

- ML production monitoring
- Data drift detection
- PSI interpretation
- Production automation
- Monitoring pipelines
- Model reliability engineering
- MLOps fundamentals

---

## Future Improvements

- Auto retraining pipeline
- Email alerts
- Dashboard integration
- Docker deployment
- Kubernetes scheduling
- Drift trend visualization
- Feature importance correlation

---

## Author

**Nikhil Verma**

Data Science / ML Engineering Project
