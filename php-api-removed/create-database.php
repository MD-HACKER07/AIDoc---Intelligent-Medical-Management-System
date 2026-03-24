<?php
// Simple script to create the database

// Database configuration
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'aidoc_db';

// Set content type to JSON
header('Content-Type: application/json');

// Initialize response
$response = [
    'action' => 'Create Database',
    'success' => false,
    'message' => ''
];

try {
    // Connect to MySQL server without database selection
    $conn = mysqli_connect($host, $username, $password);
    
    // Check connection
    if (!$conn) {
        $response['message'] = 'Failed to connect to MySQL server: ' . mysqli_connect_error();
    } else {
        $response['mysql_server'] = 'Connected';
        
        // Create the database if it doesn't exist
        $sql = "CREATE DATABASE IF NOT EXISTS `$database`";
        
        if (mysqli_query($conn, $sql)) {
            $response['success'] = true;
            $response['message'] = "Database '$database' created successfully or already exists";
            
            // Select the database
            if (mysqli_select_db($conn, $database)) {
                // Create patients table
                $createTable = "
                CREATE TABLE IF NOT EXISTS `patients` (
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
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                
                if (mysqli_query($conn, $createTable)) {
                    $response['table_created'] = true;
                    
                    // Check if table is empty
                    $result = mysqli_query($conn, "SELECT COUNT(*) as count FROM patients");
                    $row = mysqli_fetch_assoc($result);
                    
                    if ($row['count'] == 0) {
                        // Add a sample patient
                        $patientId = 'PAT' . date('Ymd') . rand(1000, 9999);
                        $sampleSql = "INSERT INTO patients (
                            patient_id, firstName, lastName, gender, email, phone
                        ) VALUES (
                            '$patientId', 'Sample', 'Patient', 'Male', 'sample@example.com', '123-456-7890'
                        )";
                        
                        if (mysqli_query($conn, $sampleSql)) {
                            $response['sample_added'] = true;
                            $response['sample_patient_id'] = $patientId;
                        }
                    }
                }
            }
        } else {
            $response['message'] = 'Error creating database: ' . mysqli_error($conn);
        }
        
        // Close connection
        mysqli_close($conn);
    }
} catch (Exception $e) {
    $response['message'] = 'Exception: ' . $e->getMessage();
}

// Output response as JSON
echo json_encode($response);
?> 