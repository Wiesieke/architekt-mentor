CREATE TABLE IF NOT EXISTS mentor_hld_generations (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  brief MEDIUMTEXT NOT NULL,
  hld MEDIUMTEXT NOT NULL,
  model VARCHAR(60) NOT NULL,
  mode VARCHAR(16) NOT NULL,
  diagram VARCHAR(8) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  INDEX idx_hld_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentor_puzzle_assessments (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  attempt_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  puzzle_id VARCHAR(120) NOT NULL,
  stage VARCHAR(8) NOT NULL,
  answer TEXT NOT NULL,
  feedback TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  INDEX idx_puzzle_attempt (attempt_id),
  INDEX idx_puzzle_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
