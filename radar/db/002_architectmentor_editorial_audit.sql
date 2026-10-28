-- ArchitectMentor editorial decisions v0.2. Apply manually to the isolated
-- ArchitectMentor radar DB only, after backup and SELECT DATABASE().
-- Do not apply to production HLD or WRYCUT databases.
ALTER TABLE amr_decisions
 ADD COLUMN revision INT UNSIGNED NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS amr_decision_audit (
 audit_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
 item_id CHAR(64) NOT NULL,
 revision INT UNSIGNED NOT NULL,
 saved_at_utc DATETIME NOT NULL,
 editor_label VARCHAR(100) NOT NULL,
 snapshot_json TEXT NOT NULL,
 PRIMARY KEY (audit_id),
 UNIQUE KEY uk_amr_audit_item_revision (item_id,revision),
 KEY idx_amr_audit_time (saved_at_utc),
 CONSTRAINT fk_amr_audit_item FOREIGN KEY (item_id)
  REFERENCES amr_items(item_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
