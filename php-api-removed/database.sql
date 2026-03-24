-- Create the patients table
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  date_of_birth VARCHAR(255),
  gender VARCHAR(50),
  email VARCHAR(255),
  phone VARCHAR(255),
  address TEXT,
  medical_history TEXT,
  allergies TEXT,
  medications TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create an index on patient_id for faster lookups
CREATE INDEX idx_patient_id ON patients(patient_id);

-- Create a test patient record
INSERT INTO patients 
(patient_id, first_name, last_name, date_of_birth, gender, email, phone) 
VALUES 
('TEST001', 'Test', 'Patient', '1990-01-01', 'Male', 'test@example.com', '123-456-7890');

-- Create a table to track quota exceeded events
CREATE TABLE IF NOT EXISTS quota_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service VARCHAR(255) NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a backup history table to track backup operations
CREATE TABLE IF NOT EXISTS backup_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source VARCHAR(255) NOT NULL,
  record_count INT DEFAULT 0,
  status VARCHAR(50) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 