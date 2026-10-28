-- ArchitectMentor Desk v0.3: manual editorial scoring and priority.
-- Apply ONCE only to the isolated serwer428682_architectradar database.
-- BEFORE applying: back up the DB, SELECT DATABASE(), verify migration 002,
-- and check that neither column exists. Never apply to WRYCUT.
ALTER TABLE amr_decisions
 ADD COLUMN priority TINYINT UNSIGNED NOT NULL DEFAULT 0
  COMMENT '0=unrated; 1=P3 observe; 2=P2 important; 3=P1 urgent',
 ADD COLUMN impact_score TINYINT UNSIGNED NOT NULL DEFAULT 0
  COMMENT '0=unrated; 1..5 manual architecture impact',
 ADD KEY idx_amr_decisions_priority (priority,decision);
