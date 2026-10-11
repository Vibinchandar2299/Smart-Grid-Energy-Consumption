# Frozen Statistical Artifacts

This directory contains the authoritative, validated statistical results generated from the final execution in Google Colab for the research project:
**"Statistical Modeling of Smart Grid Energy Consumption Patterns Using Probability Distribution Metrics"**

## Core Rule
> **The FastAPI backend must NOT refit probability distributions on every API request.**
> All final fitted parameters, goodness-of-fit metrics, and segment calculations are pre-computed in Google Colab and frozen in these artifact files. The application server ingests these artifacts into PostgreSQL on initial startup/seeding and serves them deterministically.

## Artifact Manifest

1. **`distribution_results.json`**
   - Contains fitted distribution parameters (Normal, Log-normal, Gamma, Weibull), goodness-of-fit metrics (AIC, BIC, Kolmogorov-Smirnov test statistic & p-value, Anderson-Darling statistic), descriptive statistics (mean, std, skewness, kurtosis), and sample metadata.

2. **`distribution_results.csv`**
   - Tabular format of the fitted distribution comparisons across models.

3. **`segment_statistics.csv`**
   - Segment-wise statistics and distribution parameters broken down by:
     - Sector (Residential, Commercial, Industrial, Agricultural)
     - Day Type / Period (Peak vs Non-Peak, Weekend vs Weekday)
     - Seasonal (Summer, Monsoon, Post-Monsoon, Winter)
     - Hourly profiles (0 - 23)

4. **`extreme_value_results.csv`**
   - Generalized Extreme Value (GEV) distribution parameters fitted to block maxima (e.g., daily / monthly maxima of `energy_consumption_kwh`):
     - Shape ($\xi$), Scale ($\sigma$), Location ($\mu$)
     - Calculated Return Levels for standard return periods (e.g., 2-year, 5-year, 10-year, 25-year, 50-year, 100-year).
