-- ResolvIt Database Schema
-- Run this against your PostgreSQL database before starting the server.

CREATE TABLE IF NOT EXISTS departments (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(255) NOT NULL,
  description       TEXT,
  head_authority_id INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id                  SERIAL PRIMARY KEY,
  name                VARCHAR(255) NOT NULL,
  email               VARCHAR(255) NOT NULL UNIQUE,
  password_hash       TEXT NOT NULL,
  role                VARCHAR(20) NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'authority', 'admin')),
  department_id       INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  civic_points        INTEGER NOT NULL DEFAULT 0,
  badge               VARCHAR(50) NOT NULL DEFAULT 'newcomer',
  language_preference VARCHAR(10) NOT NULL DEFAULT 'en',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE departments
  ADD CONSTRAINT fk_dept_head FOREIGN KEY (head_authority_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS issues (
  id               SERIAL PRIMARY KEY,
  title            VARCHAR(500) NOT NULL,
  description      TEXT NOT NULL,
  category         VARCHAR(50) NOT NULL,
  location_lat     DOUBLE PRECISION,
  location_lng     DOUBLE PRECISION,
  location_address TEXT,
  image_url        TEXT,
  status           VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  priority_score   INTEGER NOT NULL DEFAULT 0,
  priority_label   VARCHAR(20) NOT NULL DEFAULT 'Low',
  severity_level   INTEGER NOT NULL DEFAULT 1 CHECK (severity_level BETWEEN 1 AND 4),
  reporter_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  department_id    INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  escalation_count INTEGER NOT NULL DEFAULT 0,
  reports_count    INTEGER NOT NULL DEFAULT 0,
  upvotes_count    INTEGER NOT NULL DEFAULT 0,
  is_clustered     BOOLEAN NOT NULL DEFAULT FALSE,
  parent_issue_id  INTEGER REFERENCES issues(id) ON DELETE SET NULL,
  sla_deadline     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_issues_status       ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category     ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_department   ON issues(department_id);
CREATE INDEX IF NOT EXISTS idx_issues_reporter     ON issues(reporter_id);
CREATE INDEX IF NOT EXISTS idx_issues_priority     ON issues(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_issues_location     ON issues(location_lat, location_lng)
  WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

CREATE TABLE IF NOT EXISTS reports (
  id          SERIAL PRIMARY KEY,
  issue_id    INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  citizen_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_issue ON reports(issue_id);

CREATE TABLE IF NOT EXISTS status_logs (
  id          SERIAL PRIMARY KEY,
  issue_id    INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  old_status  VARCHAR(20),
  new_status  VARCHAR(20) NOT NULL,
  changed_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_logs_issue ON status_logs(issue_id);

CREATE TABLE IF NOT EXISTS points_ledger (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points     INTEGER NOT NULL,
  reason     VARCHAR(100) NOT NULL,
  issue_id   INTEGER REFERENCES issues(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_ledger_user ON points_ledger(user_id);

-- Tracks which users have upvoted which issues (prevents duplicate upvotes)
CREATE TABLE IF NOT EXISTS issue_upvotes (
  issue_id   INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (issue_id, user_id)
);
