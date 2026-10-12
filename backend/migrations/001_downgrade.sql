-- Migration: 001_downgrade.sql
-- Description: Downgrades schema back to baseline schema.
-- Drops return_period_days, restores NOT NULL constraints, drops quarantine table.

BEGIN;

-- Restore quarantined records if any were saved
INSERT INTO extreme_value_results (
    id, block_type, sample_maxima_count, shape_xi, loc_mu, scale_sigma,
    return_period_years, return_level_kwh, ci_lower_95, ci_upper_95
)
SELECT 
    original_id, block_type, sample_maxima_count, shape_xi, loc_mu, scale_sigma,
    COALESCE(return_period_years, 1), return_level_kwh, 
    COALESCE(ci_lower_95, 0.0), COALESCE(ci_upper_95, 0.0)
FROM extreme_value_results_quarantine
ON CONFLICT (id) DO NOTHING;

DROP TABLE IF EXISTS extreme_value_results_quarantine;

-- Drop index and column
DROP INDEX IF EXISTS ix_extreme_value_results_return_period_days;

-- Clean up any nulls before setting NOT NULL
UPDATE extreme_value_results SET ci_lower_95 = 0.0 WHERE ci_lower_95 IS NULL;
UPDATE extreme_value_results SET ci_upper_95 = 0.0 WHERE ci_upper_95 IS NULL;
UPDATE extreme_value_results SET return_period_years = 1 WHERE return_period_years IS NULL;

ALTER TABLE extreme_value_results DROP COLUMN IF EXISTS return_period_days;
ALTER TABLE extreme_value_results ALTER COLUMN return_period_years SET NOT NULL;
ALTER TABLE extreme_value_results ALTER COLUMN ci_lower_95 SET NOT NULL;
ALTER TABLE extreme_value_results ALTER COLUMN ci_upper_95 SET NOT NULL;

UPDATE distribution_fits SET ad_statistic = 0.0 WHERE ad_statistic IS NULL;
ALTER TABLE distribution_fits ALTER COLUMN ad_statistic SET NOT NULL;

COMMIT;
