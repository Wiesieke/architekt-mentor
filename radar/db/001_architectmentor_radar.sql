-- ArchitectMentor Radar v0.1. New DEDICATED MySQL database only.
-- Manually apply AFTER checking SELECT DATABASE() and a backup; never to WRYCUT DB.
-- No automatic migrations on deployment. Timestamps use UTC.
CREATE TABLE IF NOT EXISTS amr_sources (
 source_id VARCHAR(48) NOT NULL,
 display_name VARCHAR(180) NOT NULL,
 feed_url VARCHAR(512) NOT NULL,
 rights_gate VARCHAR(32) NOT NULL DEFAULT 'needs_review',
 enabled TINYINT(1) NOT NULL DEFAULT 0,
 created_at_utc DATETIME NOT NULL,
 updated_at_utc DATETIME NOT NULL,
 PRIMARY KEY (source_id),
 KEY idx_sources_active (enabled,rights_gate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS amr_items (
 item_id CHAR(64) NOT NULL,
 source_id VARCHAR(48) NOT NULL,
 title VARCHAR(512) NOT NULL,
 original_url TEXT NOT NULL,
 published_at_utc DATETIME NULL,
 first_seen_at_utc DATETIME NOT NULL,
 last_seen_at_utc DATETIME NOT NULL,
 topic VARCHAR(48) NOT NULL,
 fact_check_status VARCHAR(32) NOT NULL DEFAULT 'unverified',
 PRIMARY KEY (item_id),
 KEY idx_items_newest (first_seen_at_utc),
 KEY idx_items_topic (topic,first_seen_at_utc),
 CONSTRAINT fk_amr_items_source FOREIGN KEY (source_id) REFERENCES amr_sources(source_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS amr_decisions (
 item_id CHAR(64) NOT NULL,
 decision VARCHAR(32) NOT NULL DEFAULT 'UNREVIEWED' COMMENT 'UNREVIEWED|SELECTED|HOLD|REJECTED|REQUEST_RESEARCH',
 intended_edition VARCHAR(24) NULL COMMENT 'daily|weekly|none',
 reviewer_label VARCHAR(100) NULL,
 note TEXT NULL,
 decided_at_utc DATETIME NULL,
 PRIMARY KEY (item_id),
 KEY idx_decision_queue (decision,decided_at_utc),
 CONSTRAINT fk_amr_decisions_item FOREIGN KEY (item_id) REFERENCES amr_items(item_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS amr_ingest_runs (
 run_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
 source_id VARCHAR(48) NOT NULL,
 started_at_utc DATETIME NOT NULL,
 completed_at_utc DATETIME NULL,
 outcome VARCHAR(24) NOT NULL DEFAULT 'started',
 candidates_seen INT UNSIGNED NOT NULL DEFAULT 0,
 new_items INT UNSIGNED NOT NULL DEFAULT 0,
 error_label VARCHAR(160) NULL,
 PRIMARY KEY (run_id),
 KEY idx_amr_runs_source (source_id,started_at_utc),
 CONSTRAINT fk_amr_run_source FOREIGN KEY (source_id) REFERENCES amr_sources(source_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS amr_cycles (
 cycle_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
 started_at_utc DATETIME NOT NULL,
 completed_at_utc DATETIME NULL,
 outcome VARCHAR(32) NOT NULL DEFAULT 'started',
 sources_attempted INT UNSIGNED NOT NULL DEFAULT 0,
 sources_succeeded INT UNSIGNED NOT NULL DEFAULT 0,
 candidates_seen INT UNSIGNED NOT NULL DEFAULT 0,
 new_items INT UNSIGNED NOT NULL DEFAULT 0,
 error_label VARCHAR(160) NULL,
 PRIMARY KEY (cycle_id),
 KEY idx_amr_cycles_time (started_at_utc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
