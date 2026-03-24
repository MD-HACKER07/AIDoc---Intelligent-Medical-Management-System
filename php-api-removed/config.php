<?php
/**
 * Database Configuration
 * 
 * This file contains the configuration settings for the MySQL database connection.
 */

// Enable error reporting for debugging (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database connection parameters
$dbConfig = [
    'host'     => 'localhost',  // Database host
    'user'     => 'admin', // Default XAMPP username
    'password' => 'admin123', // Default XAMPP password is empty
    'database' => 'AIDoc',   // Database name
];

// Set the content type for API responses
header('Content-Type: application/json');

// Enable CORS for development (configure more strictly in production)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Function to log API activity
function logApiActivity($action, $details = '') {
    $logMessage = date('Y-m-d H:i:s') . " - $action";
    if (!empty($details)) {
        $logMessage .= " - $details";
    }
    error_log($logMessage, 3, __DIR__ . '/api.log');
}

// Function to sanitize inputs
function sanitizeInput($input) {
    if (is_array($input)) {
        foreach ($input as $key => $value) {
            $input[$key] = sanitizeInput($value);
        }
        return $input;
    }
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

// Log each API request
$requestUri = $_SERVER['REQUEST_URI'] ?? 'Unknown URI';
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'Unknown Method';
logApiActivity("$requestMethod request to $requestUri", "Remote IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'Unknown'));

/**
 * MySQL Database Schema
 * 
 * If you need to create the database and table manually:
 * 
 * 1. Create the database:
 *    CREATE DATABASE IF NOT EXISTS aidoc_db;
 *    USE aidoc_db;
 * 
 * 2. Create the patients table:
 *    CREATE TABLE IF NOT EXISTS patients (
 *      id INT AUTO_INCREMENT PRIMARY KEY,
 *      patient_id VARCHAR(50) UNIQUE NOT NULL,
 *      first_name VARCHAR(100) NOT NULL,
 *      last_name VARCHAR(100) NOT NULL,
 *      date_of_birth DATE,
 *      gender VARCHAR(20),
 *      email VARCHAR(100),
 *      phone VARCHAR(20),
 *      address TEXT,
 *      medical_history TEXT,
 *      allergies TEXT,
 *      medications TEXT,
 *      emergency_contact_name VARCHAR(100),
 *      emergency_contact_phone VARCHAR(20),
 *      notes TEXT,
 *      insurance_provider VARCHAR(100),
 *      insurance_number VARCHAR(50),
 *      created_at DATETIME NOT NULL,
 *      updated_at DATETIME
 *    );
 */

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USERNAME', 'root'); // Default XAMPP username
define('DB_PASSWORD', '');     // Default XAMPP password is empty
define('DB_NAME', 'aidoc_db');  // Changed to match $dbConfig above

// Create database connection
$conn = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Check connection
if ($conn->connect_error) {
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]));
}

// Set charset to ensure proper encoding
$conn->set_charset("utf8");

// Function to handle errors
function handle_error($message, $status_code = 500) {
    http_response_code($status_code);
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    exit;
}
?> 