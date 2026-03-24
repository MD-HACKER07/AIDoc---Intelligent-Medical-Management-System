-- Use the AIDoc database
USE AIDoc;

-- Create medical reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS medical_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT,
  report_date DATE NOT NULL,
  report_type VARCHAR(100) NOT NULL,
  diagnosis TEXT,
  treatment TEXT,
  notes TEXT,
  doctor_name VARCHAR(100),
  hospital_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Add indexes for faster queries
CREATE INDEX idx_report_patient ON medical_reports(patient_id);
CREATE INDEX idx_report_date ON medical_reports(report_date);
CREATE INDEX idx_report_type ON medical_reports(report_type);

-- Insert sample reports data if reports table is empty
INSERT INTO medical_reports (
  patient_id, report_date, report_type, diagnosis, 
  treatment, notes, doctor_name, hospital_name
)
SELECT 
  p.id, 
  '2023-06-15', 
  'Annual Checkup', 
  'Patient is in good health overall. Blood pressure slightly elevated.',
  'Recommended lifestyle changes including diet modification and regular exercise.',
  'Follow up in 6 months to check blood pressure.',
  'Dr. Michael Chen',
  'General Hospital'
FROM patients p
WHERE p.firstName = 'John' AND p.lastName = 'Doe'
AND NOT EXISTS (SELECT 1 FROM medical_reports);

-- Add a prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT,
  medication_name VARCHAR(100) NOT NULL,
  dosage VARCHAR(50) NOT NULL,
  frequency VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  prescribing_doctor VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Add indexes for prescriptions
CREATE INDEX idx_prescription_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescription_medication ON prescriptions(medication_name);

-- Insert sample prescription
INSERT INTO prescriptions (
  patient_id, medication_name, dosage, frequency,
  start_date, end_date, prescribing_doctor, notes
)
SELECT 
  p.id,
  'Lisinopril',
  '10mg',
  'Once daily',
  '2023-06-15',
  '2023-12-15',
  'Dr. Michael Chen',
  'Take in the morning with food'
FROM patients p
WHERE p.firstName = 'John' AND p.lastName = 'Doe'
AND NOT EXISTS (SELECT 1 FROM prescriptions);

-- Output success message
SELECT 'Schema update completed successfully!' AS 'Message'; 