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

CREATE TABLE IF NOT EXISTS mentor_comments (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  article_path VARCHAR(240) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  locale CHAR(2) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  display_name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL,
  body TEXT NOT NULL,
  source_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  verification_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  verification_expires_at DATETIME DEFAULT NULL,
  status ENUM('email_pending','pending','approved','rejected') NOT NULL DEFAULT 'email_pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_at DATETIME DEFAULT NULL,
  published_at DATETIME DEFAULT NULL,
  INDEX idx_comments_article (article_path, status, published_at),
  INDEX idx_comments_status (status, created_at),
  INDEX idx_comments_source (source_hash, created_at),
  INDEX idx_comments_email (email, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
