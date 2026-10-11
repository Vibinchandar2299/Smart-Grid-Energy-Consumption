# Colab Statistical Artifacts Transformation Report
**Generated:** 2026-10-11T21:45:00+05:30

## 1. Source Files Processed
| File Name | Size (Bytes) | Full Path |
| :--- | :--- | :--- |
| `distribution_results.json` | 24,174 | `C:\Users\VIBIN\Downloads\distribution_results.json` |
| `distribution_results.csv` | 802 | `C:\Users\VIBIN\Downloads\distribution_results.csv` |
| `segment_statistics.csv` | 2,880 | `C:\Users\VIBIN\Downloads\segment_statistics.csv` |
| `extreme_value_results.csv` | 464 | `C:\Users\VIBIN\Downloads\extreme_value_results.csv` |

## 2. Consistency & Validation Results
- [x] Overall best distribution MATCH: Both JSON and CSV agree on 'Log-normal' as Rank #1.
- [x] Numerical metrics (AIC, BIC, KS_statistic, KS_pvalue) match perfectly between JSON and CSV.
- [x] Segment consistency verified: 15/15 segment rows matched perfectly with JSON.
- [x] Extreme value parameters match between CSV and JSON: GEV(shape_c=-0.0443, loc_xi=64.1015, scale_beta=21.1282).
- [x] No discrepancies found between Colab JSON and CSV result files.

## 3. Parameter Conversion & Rankings
Ranked distribution fits derived from `overall.all_fits` by AIC ascending:
1. **Log-normal** (AIC: 79,049.24, BIC: 79,070.87, KS: 0.0116, p=0.1346) -> `s=0.8498`, `loc=0.0`, `scale=14.820`
2. **Weibull** (AIC: 79,249.89, BIC: 79,271.52, KS: 0.0381, p=4.64e-13) -> `c=1.0876`, `loc=1.6034`, `scale=20.1357`
3. **Normal** (AIC: 87,919.98, BIC: 87,934.40, KS: 0.1619, p=2.35e-229) -> `loc=21.0603`, `scale=19.6261`
4. **Gamma** (AIC: 203,813.17, BIC: 203,834.80, KS: 0.8471, p=0.0) -> `a=0.2429`, `loc=1.6037`, `scale=2.8954`

## 4. Missing Fields & Unfabricated Statistics
- **descriptive_statistics (count, mean, std, variance, min, q25, median, q75, max, skewness, kurtosis)** (`distribution_results.json`): Descriptive statistics cannot be seeded without either calculating them from the 1M dataset (tamil_nadu_synthetic_smart_grid_energy_v2_1M.csv) or providing an authentic source summary.
  - *Resolution:* Recorded as missing. No fabrication performed.
- **Segment empirical moments: count, mean_kwh, std_kwh, median_kwh, min_kwh, max_kwh, skewness, kurtosis** (`segment_statistics.csv`): Segment statistics table currently lacks sample counts and consumption moments.
  - *Resolution:* Recorded as missing; dist_shape, dist_loc, dist_scale, and KS/AIC metrics preserved.

## 5. Segment Category Display Mappings
| Original Category | Original Value | Display Alias | Target Group |
| :--- | :--- | :--- | :--- |
| `sector` | `Domestic` | `Residential` | Sector Analysis |
| `sector` | `Agriculture` | `Agricultural` | Sector Analysis |
| `sector` | `Miscellaneous` | `Miscellaneous` | Sector Analysis (New) |
| `peak_period_flag` | `0` | `Non-Peak` | Peak vs Non-Peak |
| `peak_period_flag` | `1` | `Peak` | Peak vs Non-Peak |
| `season` | `Southwest_Monsoon` | `Monsoon (SW)` | Seasonal Analysis |
| `season` | `Northeast_Monsoon` | `Post-Monsoon (NE)` | Seasonal Analysis |
| `hour_segment` | `Night/Morning/Afternoon/Evening` | 4-Diurnal Strata | Hourly Analysis |

## 6. Extreme Value Schema Incompatibilities
- [!] Current DB model ExtremeValueResult defines return_period_years as Integer (cannot store 7, 30, 90, 180 day periods without truncation).
- [!] Current DB model defines ci_lower_95 and ci_upper_95 as non-nullable Float, but Colab export does not contain bootstrap confidence intervals.
- [!] Colab export contains only Daily Maxima (41,667 daily blocks); Monthly Maxima is not present.

## 7. Staged Files Generated
| Staged File | Path | Records / Rows |
| :--- | :--- | :--- |
| `distribution_results.json` | `C:\Users\VIBIN\Vibin Projects\Smart Grid Energy\data\staged_artifacts\distribution_results.json` | 4 |
| `distribution_results.csv` | `C:\Users\VIBIN\Vibin Projects\Smart Grid Energy\data\staged_artifacts\distribution_results.csv` | 4 |
| `segment_statistics.csv` | `C:\Users\VIBIN\Vibin Projects\Smart Grid Energy\data\staged_artifacts\segment_statistics.csv` | 15 |
| `segment_display_mappings.json` | `C:\Users\VIBIN\Vibin Projects\Smart Grid Energy\data\staged_artifacts\segment_display_mappings.json` | ['sector', 'peak_period_flag', 'season', 'hour_segment'] |
| `extreme_value_results.json` | `C:\Users\VIBIN\Vibin Projects\Smart Grid Energy\data\staged_artifacts\extreme_value_results.json` | 6 |
| `extreme_value_results.csv` | `C:\Users\VIBIN\Vibin Projects\Smart Grid Energy\data\staged_artifacts\extreme_value_results.csv` | 6 |