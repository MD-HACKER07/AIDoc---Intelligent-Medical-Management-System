<?php
/**
 * Database Setup Script
 * 
 * This script initializes the MySQL database and creates necessary tables.
 * Run this script once to set up the database structure.
 */

// Include the database configuration
require_once 'config.php';

// Log this action
logApiActivity('Database setup script started');

try {
    // Connect to MySQL server (without selecting a database)
    $conn = new mysqli($dbConfig['host'], $dbConfig['user'], $dbConfig['password']);
    
    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    echo "Connected to MySQL successfully.<br>";
    
    // Create database if it doesn't exist
    $dbName = $dbConfig['database'];
    $sql = "CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
    
    if ($conn->query($sql) === TRUE) {
        echo "Database '{$dbName}' created or already exists.<br>";
    } else {
        throw new Exception("Error creating database: " . $conn->error);
    }
    
    // Select the database
    $conn->select_db($dbName);
    
    // Create patients table
    $sql = "CREATE TABLE IF NOT EXISTS patients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id VARCHAR(50) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(20),
        email VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        medical_history TEXT,
        allergies TEXT,
        medications TEXT,
        emergency_contact_name VARCHAR(100),
        emergency_contact_phone VARCHAR(20),
        notes TEXT,
        insurance_provider VARCHAR(100),
        insurance_number VARCHAR(50),
        created_at DATETIME NOT NULL,
        updated_at DATETIME,
        INDEX idx_patient_id (patient_id),
        INDEX idx_name (last_name, first_name)
    )";
    
    if ($conn->query($sql) === TRUE) {
        echo "Table 'patients' created or already exists.<br>";
    } else {
        throw new Exception("Error creating table: " . $conn->error);
    }
    
    // Create appointments table
    $sql = "CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT,
        appointment_date DATETIME NOT NULL,
        reason VARCHAR(255),
        status VARCHAR(20) DEFAULT 'scheduled',
        notes TEXT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        INDEX idx_appointment_date (appointment_date),
        INDEX idx_status (status)
    )";
    
    if ($conn->query($sql) === TRUE) {
        echo "Table 'appointments' created or already exists.<br>";
    } else {
        throw new Exception("Error creating table: " . $conn->error);
    }
    
    // Create medical_records table
    $sql = "CREATE TABLE IF NOT EXISTS medical_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT,
        record_date DATETIME NOT NULL,
        record_type VARCHAR(50) NOT NULL,
        description TEXT,
        doctor_name VARCHAR(100),
        attachments TEXT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        INDEX idx_record_date (record_date),
        INDEX idx_record_type (record_type)
    )";
    
    if ($conn->query($sql) === TRUE) {
        echo "Table 'medical_records' created or already exists.<br>";
    } else {
        throw new Exception("Error creating table: " . $conn->error);
    }
    
    // Insert sample data (only if patients table is empty)
    $result = $conn->query("SELECT COUNT(*) as count FROM patients");
    $row = $result->fetch_assoc();
    
    if ($row['count'] == 0) {
        // Insert a sample patient
        $patientId = 'SAMPLE-' . date('Ymd') . '-' . mt_rand(1000, 9999);
        $now = date('Y-m-d H:i:s');
        
        $sql = "INSERT INTO patients (
            patient_id, first_name, last_name, date_of_birth, gender, 
            email, phone, created_at
        ) VALUES (
            '$patientId', 'John', 'Doe', '1980-01-15', 'Male',
            'john.doe@example.com', '555-123-4567', '$now'
        )";
        
        if ($conn->query($sql) === TRUE) {
            echo "Sample patient data inserted.<br>";
        } else {
            echo "Note: Could not insert sample data: " . $conn->error . "<br>";
        }
    } else {
        echo "Patient data already exists, skipping sample data.<br>";
    }
    
    // Close the connection
    $conn->close();
    
    echo "<br>Database setup completed successfully!";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
    error_log("Database setup error: " . $e->getMessage());
} 