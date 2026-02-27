-- Create all tables with proper constraints and indexes

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  head_authority_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('citizen', 'authority', 'admin')),
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  civic_points INTEGER NOT NULL DEFAULT 0,
  badge VARCHAR(50) DEFAULT NULL,
  language_preference VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from departments to users after users table exists
ALTER TABLE departments ADD CONSTRAINT fk_dept_head FOREIGN KEY (head_authority_id) REFERENCES users(id) ON DELETE SET NULL;

-- Issues table
CREATE TABLE IF NOT EXISTS issues (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  image_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  priority_score INTEGER NOT NULL DEFAULT 0,
  priority_label VARCHAR(20) NOT NULL DEFAULT 'Low' CHECK (priority_label IN ('Low', 'Medium', 'High', 'Critical')),
  severity_level INTEGER NOT NULL DEFAULT 1 CHECK (severity_level BETWEEN 1 AND 4),
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  escalation_count INTEGER NOT NULL DEFAULT 0,
  reports_count INTEGER NOT NULL DEFAULT 1,
  upvotes_count INTEGER NOT NULL DEFAULT 0,
  is_clustered BOOLEAN NOT NULL DEFAULT FALSE,
  parent_issue_id INTEGER REFERENCES issues(id) ON DELETE SET NULL,
  sla_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Issue upvotes (deduplication)
CREATE TABLE IF NOT EXISTS issue_upvotes (
  issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (issue_id, user_id)
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  citizen_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status logs table
CREATE TABLE IF NOT EXISTS status_logs (
  id SERIAL PRIMARY KEY,
  issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points ledger table
CREATE TABLE IF NOT EXISTS points_ledger (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason VARCHAR(255) NOT NULL,
  issue_id INTEGER REFERENCES issues(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority_label);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_reporter ON issues(reporter_id);
CREATE INDEX IF NOT EXISTS idx_issues_department ON issues(department_id);
CREATE INDEX IF NOT EXISTS idx_issues_location ON issues(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_reports_issue ON reports(issue_id);
CREATE INDEX IF NOT EXISTS idx_status_logs_issue ON status_logs(issue_id);
CREATE INDEX IF NOT EXISTS idx_points_user ON points_ledger(user_id);

-- Default departments seed data
INSERT INTO departments (name, description) VALUES
  ('Roads & Infrastructure', 'Manages road maintenance, potholes, and infrastructure'),
  ('Water Supply', 'Handles water supply and drainage issues'),
  ('Electricity', 'Manages power supply and street lighting'),
  ('Sanitation', 'Garbage collection and cleanliness'),
  ('Public Safety', 'Police, fire, and emergency services'),
  ('Environment', 'Parks, trees, and environmental issues')
ON CONFLICT (name) DO NOTHING;
