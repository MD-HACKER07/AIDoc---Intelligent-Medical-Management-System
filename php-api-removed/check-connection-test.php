<?php
// Simple test file for MySQL connectivity

// Database configuration
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'aidoc_db';

// Set content type to JSON
header('Content-Type: application/json');

// Initialize response
$response = [
    'test' => 'MySQL Connection Test',
    'success' => false,
    'message' => ''
];

// Try to connect to MySQL
try {
    // Connect to MySQL server
    $conn = mysqli_connect($host, $username, $password);
    
    // Check connection
    if (!$conn) {
        $response['message'] = 'Failed to connect to MySQL server: ' . mysqli_connect_error();
    } else {
        $response['mysql_server'] = 'Connected';
        
        // Try to select the database
        if (!mysqli_select_db($conn, $database)) {
            $response['message'] = "Connected to MySQL, but database '$database' does not exist";
        } else {
            $response['success'] = true;
            $response['message'] = "Successfully connected to MySQL database '$database'";
            
            // Get server info
            $response['server_info'] = mysqli_get_server_info($conn);
            
            // Close connection
            mysqli_close($conn);
        }
    }
} catch (Exception $e) {
    $response['message'] = 'Exception: ' . $e->getMessage();
}

// Output response as JSON
echo json_encode($response);
?> 