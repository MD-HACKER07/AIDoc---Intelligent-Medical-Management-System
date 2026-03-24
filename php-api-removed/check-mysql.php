<?php
// Include the database configuration
require_once 'config.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Log this check
logApiActivity('MySQL connectivity check');

try {
    // Initialize response data
    $response = [
        'success' => false,
        'status' => 'unknown',
        'message' => '',
        'timestamp' => date('Y-m-d H:i:s'),
        'details' => [
            'php_version' => PHP_VERSION,
            'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'database_host' => $dbConfig['host']
        ]
    ];
    
    // Try to connect to the database
    $conn = new mysqli($dbConfig['host'], $dbConfig['user'], $dbConfig['password']);
    
    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    // If we got here, connection was successful
    $response['status'] = 'connected';
    $response['success'] = true;
    $response['message'] = 'Successfully connected to MySQL server';
    
    // Next, check if the database exists
    $dbExists = $conn->select_db($dbConfig['database']);
    
    if (!$dbExists) {
        $response['message'] .= ', but database does not exist';
        $response['details']['database_exists'] = false;
    } else {
        $response['message'] .= ' and database exists';
        $response['details']['database_exists'] = true;
        
        // Check if the patients table exists
        $tableCheckQuery = "SHOW TABLES LIKE 'patients'";
        $tableCheckResult = $conn->query($tableCheckQuery);
        
        if ($tableCheckResult && $tableCheckResult->num_rows > 0) {
            $response['details']['patients_table_exists'] = true;
            
            // Count patients
            $countQuery = "SELECT COUNT(*) as count FROM patients";
            $countResult = $conn->query($countQuery);
            
            if ($countResult) {
                $row = $countResult->fetch_assoc();
                $response['details']['patient_count'] = $row['count'];
            }
        } else {
            $response['details']['patients_table_exists'] = false;
        }
    }
    
    // Add MySQL server info to response
    $response['details']['mysql_version'] = $conn->server_info;
    $response['details']['mysql_connection_id'] = $conn->thread_id;
    
    // Close the connection
    $conn->close();
    
} catch (Exception $e) {
    // Set failure response
    $response['status'] = 'error';
    $response['message'] = 'Connection failed: ' . $e->getMessage();
    $response['details']['error'] = $e->getMessage();
    
    // Log the error
    error_log("MySQL connection check failed: " . $e->getMessage());
}

// Return the response
echo json_encode($response, JSON_PRETTY_PRINT); 