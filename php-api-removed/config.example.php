<?php
/**
 * Database Configuration
 * 
 * This file contains the configuration for connecting to the MySQL database.
 * Rename this file to 'config.php' and update the values below with your own database credentials.
 */

// MySQL database connection settings
$db_host = 'localhost'; // Database host
$db_name = 'aidoc_patients';  // Database name
$db_user = 'root';      // Database username
$db_pass = '';          // Database password

// Optional database port (usually 3306 for MySQL)
$db_port = 3306;

// PHP-MySQL connection charset
$db_charset = 'utf8mb4';

// Debug mode - set to false in production
$debug = true; 

// If debug mode is enabled, display errors
if ($debug) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    error_reporting(0);
}

// Log file settings
$log_file = __DIR__ . '/mysql_errors.log';
ini_set('log_errors', 1);
ini_set('error_log', $log_file);

// Timezone setting
date_default_timezone_set('UTC');

// Security: Validate database connection settings
if (empty($db_host) || empty($db_name) || empty($db_user)) {
    die('Database configuration error: Missing required database settings.');
}

// Test database connection
if ($debug) {
    try {
        $test_conn = new PDO("mysql:host=$db_host;dbname=$db_name;charset=$db_charset", $db_user, $db_pass);
        $test_conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } catch (PDOException $e) {
        error_log("Database connection error: " . $e->getMessage());
        // Don't show error details to the client in production
        if (strpos($_SERVER['SCRIPT_NAME'], 'setup-database.php') === false &&
            strpos($_SERVER['SCRIPT_NAME'], 'check-connection.php') === false) {
            die('Database connection error. Check error log for details.');
        }
    }
}

/**
 * Function to check if the config.php file has been properly configured
 * 
 * @return bool True if the configuration appears valid, false otherwise
 */
function isConfigured() {
    global $db_host, $db_name, $db_user;
    
    // Check if the values are still the default example values
    if ($db_host === 'localhost' && $db_name === 'aidoc_patients' && $db_user === 'root') {
        // This might be the default configuration
        // Only return false if we're confident it's not been configured
        if (empty($db_pass)) {
            return false;
        }
    }
    
    return true;
} 