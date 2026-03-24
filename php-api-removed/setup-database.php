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
    'tables_created' => []
];

try {
    // Use the database configuration from config.php
    $db_host = DB_HOST;
    $db_user = DB_USERNAME;
    $db_pass = DB_PASSWORD;
    $db_name = DB_NAME;
    
    // Create database connection
    $pdo = new PDO("mysql:host=$db_host;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check if database exists, if not create it
    $stmt = $pdo->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$db_name'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec("CREATE DATABASE `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $response['message'] = "Database '$db_name' created successfully.";
    } else {
        $response['message'] = "Database '$db_name' already exists.";
    }
    
    // Connect to the specified database
    $pdo->exec("USE `$db_name`");
    
    // Create patients table if it doesn't exist
    $patientsSql = "CREATE TABLE IF NOT EXISTS `patients` (
        `id` INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `patient_id` VARCHAR(20) NOT NULL UNIQUE,
        `firstName` VARCHAR(50) NOT NULL,
        `lastName` VARCHAR(50) NOT NULL,
        `dateOfBirth` DATE NULL,
        `gender` VARCHAR(20) NULL,
        `email` VARCHAR(100) NULL,
        `phone` VARCHAR(20) NULL,
        `address` TEXT NULL,
        `medicalHistory` TEXT NULL,
        `allergies` TEXT NULL,
        `medications` TEXT NULL,
        `emergencyContactName` VARCHAR(100) NULL,
        `emergencyContactPhone` VARCHAR(20) NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_patient_id (patient_id),
        INDEX idx_name (firstName, lastName),
        INDEX idx_email (email),
        INDEX idx_phone (phone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($patientsSql);
    $response['tables_created'][] = 'patients';
    
    // Create appointments table if it doesn't exist
    $appointmentsSql = "CREATE TABLE IF NOT EXISTS `appointments` (
        `id` INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `appointment_id` VARCHAR(20) NOT NULL UNIQUE,
        `patient_id` VARCHAR(20) NOT NULL,
        `title` VARCHAR(100) NOT NULL,
        `description` TEXT NULL,
        `appointment_date` DATETIME NOT NULL,
        `status` ENUM('scheduled', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'scheduled',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_patient_id (patient_id),
        INDEX idx_appointment_date (appointment_date),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($appointmentsSql);
    $response['tables_created'][] = 'appointments';
    
    // Create consultations table if it doesn't exist
    $consultationsSql = "CREATE TABLE IF NOT EXISTS `consultations` (
        `id` INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `consultation_id` VARCHAR(20) NOT NULL UNIQUE,
        `patient_id` VARCHAR(20) NOT NULL,
        `title` VARCHAR(100) NOT NULL,
        `summary` TEXT NULL,
        `notes` TEXT NULL,
        `status` ENUM('in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'in_progress',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_patient_id (patient_id),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($consultationsSql);
    $response['tables_created'][] = 'consultations';
    
    // Create messages table if it doesn't exist
    $messagesSql = "CREATE TABLE IF NOT EXISTS `messages` (
        `id` INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `consultation_id` VARCHAR(20) NOT NULL,
        `sender` ENUM('patient', 'ai', 'doctor') NOT NULL,
        `content` TEXT NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_consultation_id (consultation_id),
        INDEX idx_sender (sender)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($messagesSql);
    $response['tables_created'][] = 'messages';
    
    // Create a sample patient if patients table is empty
    $stmt = $pdo->query("SELECT COUNT(*) FROM patients");
    $patientCount = $stmt->fetchColumn();
    
    if ($patientCount == 0) {
        $patientId = 'P' . date('Ymd') . substr(uniqid(), -6);
        $insertSql = "INSERT INTO patients (
            patient_id, firstName, lastName, gender, email, phone, 
            medicalHistory, created_at, updated_at
        ) VALUES (
            :patient_id, 'Sample', 'Patient', 'Male', 'sample@example.com', '123-456-7890',
            'This is a sample patient record for testing.', NOW(), NOW()
        )";
        
        $stmt = $pdo->prepare($insertSql);
        $stmt->bindParam(':patient_id', $patientId);
        $stmt->execute();
        
        $response['sample_patient_created'] = true;
        $response['sample_patient_id'] = $patientId;
    } else {
        $response['sample_patient_created'] = false;
    }
    
    $response['success'] = true;
    $response['database'] = $db_name;
    
} catch (PDOException $e) {
    $response['success'] = false;
    $response['error'] = "Database Error: " . $e->getMessage();
    error_log("Database setup error: " . $e->getMessage());
} catch (Exception $e) {
    $response['success'] = false;
    $response['error'] = "Error: " . $e->getMessage();
    error_log("General error during database setup: " . $e->getMessage());
}

// Return JSON response
echo json_encode($response, JSON_PRETTY_PRINT); 