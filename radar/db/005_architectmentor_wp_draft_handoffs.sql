-- ArchitectMentor Desk v0.6: one-shot handoff of APPROVED articles to WordPress drafts.
-- BACK UP the isolated database first. Verify SELECT DATABASE() = serwer428682_architectradar.
-- Run ONCE in phpMyAdmin before uploading the WordPress handoff PHP/JS files.
-- Does not change or publish any WordPress content.
CREATE TABLE amr_wp_draft_handoffs (
 handoff_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
 draft_id BIGINT UNSIGNED NOT NULL,
 draft_revision INT UNSIGNED NOT NULL,
 state VARCHAR(16) NOT NULL COMMENT 'PENDING|CREATED|UNKNOWN; no automatic retries',
 wp_post_id BIGINT UNSIGNED NULL,
 requested_by VARCHAR(100) NOT NULL,
 requested_at_utc DATETIME NOT NULL,
 completed_at_utc DATETIME NULL,
 PRIMARY KEY (handoff_id),
 UNIQUE KEY uk_amr_wp_handoff_draft (draft_id),
 KEY idx_amr_wp_handoff_state (state,requested_at_utc),
 CONSTRAINT fk_amr_wp_handoff_draft FOREIGN KEY (draft_id)
  REFERENCES amr_article_drafts(draft_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify separately:
-- SHOW TABLES LIKE 'amr_wp_draft_handoffs'; -- one row (name)
-- SELECT COUNT(*) FROM amr_wp_draft_handoffs; -- zero before first transfer
