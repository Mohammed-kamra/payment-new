-- Database schema for Neon PostgreSQL

-- Registrations table
CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(20),
    group_name VARCHAR(10),
    day VARCHAR(50),
    date DATE,
    time TIME,
    paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    data JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registrations_date ON registrations(date);
CREATE INDEX IF NOT EXISTS idx_registrations_group ON registrations(group_name);
CREATE INDEX IF NOT EXISTS idx_registrations_company ON registrations(company);
CREATE INDEX IF NOT EXISTS idx_registrations_paid ON registrations(paid);

-- Insert default admin user
INSERT INTO users (username, password, role) 
VALUES ('admin', '777', 'admin')
ON CONFLICT (username) DO NOTHING;

