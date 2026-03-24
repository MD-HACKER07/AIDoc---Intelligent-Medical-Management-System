<?php
// Include database configuration
require_once 'config.php';

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Initialize response
$response = [
    'success' => false,
    'message' => '',
    'table_created' => false
];

try {
    // Create database connection
    $conn = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME);
    
    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    // SQL to create patients table
    $sql = "CREATE TABLE IF NOT EXISTS `patients` (
        `id` INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `patient_id` VARCHAR(50) UNIQUE NOT NULL,
        `firstName` VARCHAR(100) NOT NULL,
        `lastName` VARCHAR(100) NOT NULL,
        `dateOfBirth` DATE,
        `gender` VARCHAR(20),
        `email` VARCHAR(100),
        `phone` VARCHAR(20),
        `address` TEXT,
        `medicalHistory` TEXT,
        `allergies` TEXT,
        `medications` TEXT,
        `emergencyContactName` VARCHAR(100),
        `emergencyContactPhone` VARCHAR(20),
        `notes` TEXT,
        `insuranceProvider` VARCHAR(100),
        `insuranceNumber` VARCHAR(50),
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_patient_id (patient_id),
        INDEX idx_name (firstName, lastName)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($conn->query($sql) === TRUE) {
        $response['success'] = true;
        $response['table_created'] = true;
        $response['message'] = "Patients table created successfully or already exists";
        
        // Check if the table is empty
        $result = $conn->query("SELECT COUNT(*) as count FROM patients");
        $row = $result->fetch_assoc();
        
        if ($row['count'] == 0) {
            // Add a sample patient
            $patientId = 'PAT' . date('Ymd') . rand(1000, 9999);
            $sampleSql = "INSERT INTO patients (
                patient_id, firstName, lastName, gender, email, phone, address, 
                medicalHistory, created_at, updated_at
            ) VALUES (
                '$patientId', 'Sample', 'Patient', 'Male', 'sample@example.com', '123-456-7890',
                '123 Main St, Sample City', 'This is a sample patient record.', NOW(), NOW()
            )";
            
            if ($conn->query($sampleSql) === TRUE) {
                $response['sample_added'] = true;
                $response['sample_patient_id'] = $patientId;
            } else {
                $response['sample_added'] = false;
                $response['sample_error'] = $conn->error;
            }
        } else {
            $response['sample_added'] = false;
            $response['table_empty'] = false;
        }
    } else {
        $response['message'] = "Error creating table: " . $conn->error;
    }
    
    $conn->close();
    
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = 'Error: ' . $e->getMessage();
}

// Return result
echo json_encode($response, JSON_PRETTY_PRINT);
?> 