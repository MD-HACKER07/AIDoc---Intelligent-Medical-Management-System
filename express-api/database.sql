-- Create the AIDoc database if it doesn't exist
CREATE DATABASE IF NOT EXISTS AIDoc;

-- Use the AIDoc database
USE AIDoc;

-- Drop existing tables if they exist to avoid foreign key constraint issues
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS prescriptions;
DROP TABLE IF EXISTS medical_reports;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS hospitals;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100),
  role ENUM('admin', 'doctor', 'nurse', 'staff') NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
);

-- Create hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id VARCHAR(50) UNIQUE,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(100),
  license_number VARCHAR(50),
  established_date DATE,
  type VARCHAR(50),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id VARCHAR(50) UNIQUE,
  hospital_id INT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  head_doctor VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id VARCHAR(50) UNIQUE,
  hospital_id INT,
  department_id INT,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  specialization VARCHAR(100),
  qualification VARCHAR(100),
  experience_years INT,
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  license_number VARCHAR(50),
  status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Create patients table with additional fields
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id VARCHAR(50) UNIQUE,
  hospital_id INT,
  referred_by INT, -- doctor who referred
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  gender VARCHAR(50),
  date_of_birth DATE,
  blood_group VARCHAR(10),
  height FLOAT,
  weight FLOAT,
  contact_number VARCHAR(20),
  emergency_contact VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  occupation VARCHAR(100),
  marital_status VARCHAR(50),
  medical_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  emergency_contact_name VARCHAR(100),
  emergency_contact_relationship VARCHAR(50),
  insurance_provider VARCHAR(100),
  insurance_policy_number VARCHAR(50),
  insurance_expiry_date DATE,
  notes TEXT,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_visit_date DATE,
  status ENUM('active', 'inactive', 'deceased') DEFAULT 'active',
  created_by INT, -- user who created the record
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
  FOREIGN KEY (referred_by) REFERENCES doctors(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id VARCHAR(50) UNIQUE,
  patient_id INT NOT NULL,
  doctor_id INT,
  hospital_id INT,
  department_id INT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration INT DEFAULT 30, -- in minutes
  reason VARCHAR(255),
  status ENUM('scheduled', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Create medical reports table
CREATE TABLE IF NOT EXISTS medical_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id VARCHAR(50) UNIQUE,
  patient_id INT NOT NULL,
  doctor_id INT,
  hospital_id INT,
  appointment_id INT,
  report_date DATE NOT NULL,
  report_type VARCHAR(100) NOT NULL,
  chief_complaint TEXT,
  diagnosis TEXT,
  treatment TEXT,
  vital_signs TEXT,
  lab_results TEXT,
  imaging_results TEXT,
  recommendations TEXT,
  follow_up_instructions TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prescription_id VARCHAR(50) UNIQUE,
  patient_id INT NOT NULL,
  doctor_id INT,
  hospital_id INT,
  report_id INT,
  medication_name VARCHAR(100) NOT NULL,
  dosage VARCHAR(50) NOT NULL,
  frequency VARCHAR(50) NOT NULL,
  duration VARCHAR(50),
  quantity INT,
  refill INT DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  route VARCHAR(50), -- oral, topical, etc.
  instructions TEXT,
  pharmacist_notes TEXT,
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
  FOREIGN KEY (report_id) REFERENCES medical_reports(id) ON DELETE SET NULL
);

-- Insert sample data for users
INSERT INTO users (user_id, email, name, role) VALUES
('U001', 'admin@aidoc.com', 'Admin User', 'admin'),
('U002', 'doctor@aidoc.com', 'Doctor User', 'doctor'),
('U003', 'nurse@aidoc.com', 'Nurse User', 'nurse'),
('U004', 'staff@aidoc.com', 'Staff User', 'staff');

-- Insert sample data for hospitals
INSERT INTO hospitals (hospital_id, name, address, city, state, zip_code, phone, email, website) VALUES
('H001', 'General Hospital', '123 Main St', 'Anytown', 'Anystate', '12345', '555-123-4567', 'info@generalhospital.com', 'www.generalhospital.com'),
('H002', 'Community Medical Center', '456 Oak Ave', 'Somewhere', 'Somestate', '67890', '555-987-6543', 'info@communitymedical.com', 'www.communitymedical.com');

-- Insert sample data for departments
INSERT INTO departments (department_id, hospital_id, name, description, head_doctor) VALUES
(1, 1, 'Cardiology', 'Cardiac care and heart disease treatment', 'Dr. James Wilson'),
(2, 1, 'Neurology', 'Diagnosis and treatment of nervous system disorders', 'Dr. Elizabeth Chen'),
(3, 1, 'Pediatrics', 'Medical care for infants, children, and adolescents', 'Dr. Michael Johnson'),
(4, 2, 'Orthopedics', 'Treatment of musculoskeletal system', 'Dr. Sarah Thompson');

-- Insert sample data for doctors
INSERT INTO doctors (doctor_id, hospital_id, department_id, first_name, last_name, specialization, qualification, experience_years) VALUES
('D001', 1, 1, 'James', 'Wilson', 'Cardiologist', 'MD, FACC', 15),
('D002', 1, 2, 'Elizabeth', 'Chen', 'Neurologist', 'MD, PhD', 12),
('D003', 1, 3, 'Michael', 'Johnson', 'Pediatrician', 'MD', 10),
('D004', 2, 4, 'Sarah', 'Thompson', 'Orthopedic Surgeon', 'MD, FAAOS', 14);

-- Insert sample data for patients
INSERT INTO patients (
  patient_id, hospital_id, referred_by, first_name, last_name, gender, date_of_birth,
  blood_group, contact_number, email, address, medical_history, allergies,
  insurance_provider, insurance_policy_number, created_by
) VALUES
('P001', 1, 1, 'John', 'Doe', 'Male', '1980-01-15', 'O+', '555-123-4567', 'john.doe@example.com', 
 '123 Main St, Anytown', 'Hypertension, diagnosed in 2015', 'Penicillin', 'BlueCross', 'BC123456', 1),
('P002', 1, 2, 'Jane', 'Smith', 'Female', '1985-05-22', 'A-', '555-987-6543', 'jane.smith@example.com', 
 '456 Oak Ave, Somewhere', 'Migraine headaches', 'None', 'Aetna', 'AE789012', 1),
('P003', 2, 4, 'Robert', 'Johnson', 'Male', '1970-11-30', 'B+', '555-456-7890', 'robert.johnson@example.com', 
 '789 Pine St, Elsewhere', 'Type 2 diabetes, diagnosed in 2010', 'Sulfa drugs', 'UnitedHealth', 'UH345678', 2);

-- Insert sample appointments
INSERT INTO appointments (
  appointment_id, patient_id, doctor_id, hospital_id, department_id,
  appointment_date, appointment_time, reason, status
) VALUES
('A001', 1, 1, 1, 1, '2023-06-15', '09:00:00', 'Annual cardiac checkup', 'completed'),
('A002', 2, 2, 1, 2, '2023-06-20', '10:30:00', 'Migraine follow-up', 'completed'),
('A003', 3, 4, 2, 4, '2023-07-05', '14:00:00', 'Knee pain evaluation', 'completed'),
('A004', 1, 1, 1, 1, '2023-12-15', '11:00:00', 'Follow-up checkup', 'scheduled');

-- Insert sample data for medical reports
INSERT INTO medical_reports (
  report_id, patient_id, doctor_id, hospital_id, appointment_id,
  report_date, report_type, chief_complaint, diagnosis, treatment, recommendations
) VALUES
('R001', 1, 1, 1, 1, '2023-06-15', 'Annual Checkup', 
 'Patient reports occasional chest discomfort', 
 'Mild hypertension, otherwise good cardiac health', 
 'Continue current medications with adjusted dosage', 
 'Maintain low-sodium diet, regular exercise, follow-up in 6 months'),
('R002', 2, 2, 1, 2, '2023-06-20', 'Follow-up', 
 'Recurring migraine headaches, 2-3 per month', 
 'Chronic migraine, possibly triggered by stress', 
 'Prescribed sumatriptan for acute episodes', 
 'Keep headache journal, practice stress reduction techniques'),
('R003', 3, 4, 2, 3, '2023-07-05', 'Initial Consultation', 
 'Left knee pain for past 3 months, worse with activity', 
 'Osteoarthritis of the left knee', 
 'Prescribed anti-inflammatory medication, knee brace', 
 'Physical therapy 2x weekly, weight management, follow-up in 1 month');

-- Insert sample data for prescriptions
INSERT INTO prescriptions (
  prescription_id, patient_id, doctor_id, hospital_id, report_id,
  medication_name, dosage, frequency, duration, start_date, end_date, instructions
) VALUES
('Rx001', 1, 1, 1, 1, 'Lisinopril', '10mg', 'Once daily', '90 days', '2023-06-15', '2023-09-15', 
 'Take in the morning with food'),
('Rx002', 2, 2, 1, 2, 'Sumatriptan', '50mg', 'As needed for migraine', '30 days', '2023-06-20', '2023-07-20', 
 'Take at first sign of migraine, may repeat after 2 hours if needed, not to exceed 200mg per day'),
('Rx003', 3, 4, 2, 3, 'Naproxen', '500mg', 'Twice daily', '14 days', '2023-07-05', '2023-07-19', 
 'Take with food or milk to prevent stomach upset');

-- Create indexes for faster searches
CREATE INDEX idx_patient_name ON patients(first_name, last_name);
CREATE INDEX idx_patient_contact ON patients(contact_number, email);
CREATE INDEX idx_hospital_name ON hospitals(name);
CREATE INDEX idx_doctor_name ON doctors(first_name, last_name);
CREATE INDEX idx_appointment_date ON appointments(appointment_date);
CREATE INDEX idx_report_date ON medical_reports(report_date);
CREATE INDEX idx_prescription_medication ON prescriptions(medication_name);

-- Output success message
SELECT 'Database setup completed successfully!' AS 'Message'; 