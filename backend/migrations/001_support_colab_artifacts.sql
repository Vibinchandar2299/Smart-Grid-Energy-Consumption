-- Migration: 001_support_colab_artifacts.sql
-- Description: Supports Colab probability distribution fits and day-based EVT return periods.
-- Enables nullable ad_statistic, nullable CIs, and adds return_period_days with index.
-- Preserves legacy quarantine table for historical records.

BEGIN;

-- 1. distribution_fits: allow NULL ad_statistic
ALTER TABLE distribution_fits ALTER COLUMN ad_statistic DROP NOT NULL;

-- 2. extreme_value_results: add return_period_days and relax constraints
ALTER TABLE extreme_value_results ADD COLUMN IF NOT EXISTS return_period_days INTEGER;
ALTER TABLE extreme_value_results ALTER COLUMN return_period_years DROP NOT NULL;
ALTER TABLE extreme_value_results ALTER COLUMN ci_lower_95 DROP NOT NULL;
ALTER TABLE extreme_value_results ALTER COLUMN ci_upper_95 DROP NOT NULL;

-- Index for day-based lookups
CREATE INDEX IF NOT EXISTS ix_extreme_value_results_return_period_days 
ON extreme_value_results(return_period_days);

-- 3. Quarantine table to ensure legacy annual/monthly results cannot mix with daily EVT
CREATE TABLE IF NOT EXISTS extreme_value_results_quarantine (
    id SERIAL PRIMARY KEY,
    original_id INTEGER,
    block_type VARCHAR(50),
    sample_maxima_count INTEGER,
    shape_xi DOUBLE PRECISION,
    loc_mu DOUBLE PRECISION,
    scale_sigma DOUBLE PRECISION,
    return_period_years INTEGER,
    return_period_days INTEGER,
    return_level_kwh DOUBLE PRECISION,
    ci_lower_95 DOUBLE PRECISION,
    ci_upper_95 DOUBLE PRECISION,
    quarantine_reason VARCHAR(255),
    quarantined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Move any legacy records without return_period_days or monthly_maxima to quarantine
INSERT INTO extreme_value_results_quarantine (
    original_id, block_type, sample_maxima_count, shape_xi, loc_mu, scale_sigma,
    return_period_years, return_period_days, return_level_kwh, ci_lower_95, ci_upper_95,
    quarantine_reason
)
SELECT 
    id, block_type, sample_maxima_count, shape_xi, loc_mu, scale_sigma,
    return_period_years, return_period_days, return_level_kwh, ci_lower_95, ci_upper_95,
    'Legacy record quarantined to prevent mixing with active day-based EVT'
FROM extreme_value_results
WHERE return_period_days IS NULL OR block_type = 'monthly_maxima';

DELETE FROM extreme_value_results
WHERE return_period_days IS NULL OR block_type = 'monthly_maxima';

COMMIT;
