-- ArchitectMentor Desk v0.4: private article drafts, review and explicit human approval.
-- MANUAL ONE-TIME migration, ONLY for the isolated ArchitectMentor database.
-- BACK UP DATABASE first. Verify SELECT DATABASE() = serwer428682_architectradar.
-- Prerequisites: migrations 001, 002, 003; do not apply to WRYCUT.
-- Run when both tables below are absent. This script never publishes content.
CREATE TABLE amr_article_drafts (
 draft_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
 item_id CHAR(64) NOT NULL,
 title VARCHAR(240) NOT NULL,
 lead_text TEXT NOT NULL,
 body_text MEDIUMTEXT NOT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT|IN_REVIEW|APPROVED',
 revision INT UNSIGNED NOT NULL DEFAULT 1,
 editor_label VARCHAR(100) NOT NULL,
 approved_by VARCHAR(100) NULL,
 created_at_utc DATETIME NOT NULL,
 updated_at_utc DATETIME NOT NULL,
 approved_at_utc DATETIME NULL,
 PRIMARY KEY (draft_id),
 UNIQUE KEY uk_amr_article_draft_item (item_id),
 KEY idx_amr_article_draft_queue (status,updated_at_utc),
 CONSTRAINT fk_amr_article_draft_item FOREIGN KEY (item_id)
  REFERENCES amr_items(item_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE amr_article_draft_audit (
 audit_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
 draft_id BIGINT UNSIGNED NOT NULL,
 revision INT UNSIGNED NOT NULL,
 saved_at_utc DATETIME NOT NULL,
 editor_label VARCHAR(100) NOT NULL,
 action_label VARCHAR(24) NOT NULL COMMENT 'SAVE|SUBMIT|APPROVE|REOPEN',
 snapshot_json MEDIUMTEXT NOT NULL,
 PRIMARY KEY (audit_id),
 UNIQUE KEY uk_amr_article_audit_revision (draft_id,revision),
 KEY idx_amr_article_audit_time (saved_at_utc),
 CONSTRAINT fk_amr_article_audit_draft FOREIGN KEY (draft_id)
  REFERENCES amr_article_drafts(draft_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verification (run separately):
-- SHOW TABLES LIKE 'amr_article_drafts';
-- SHOW TABLES LIKE 'amr_article_draft_audit';
-- SELECT COUNT(*) FROM amr_article_drafts; -- expected 0 before first use
