<?php
// Include database configuration
require_once 'config.php';

// Set response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Initialize response array
$response = [
    'connected' => false,
    'message' => '',
    'details' => null
];

try {
    // Get database configuration
    $host = DB_HOST;
    $username = DB_USERNAME;
    $password = DB_PASSWORD;
    $database = DB_NAME;
    
    // Connect to MySQL server (without specifying database)
    $conn = new mysqli($host, $username, $password);
    
    // Check connection to MySQL server
    if ($conn->connect_error) {
        $response['message'] = 'MySQL connection failed: ' . $conn->connect_error;
        $response['error_code'] = $conn->connect_errno;
    } else {
        // Try to select the database
        $dbExists = $conn->select_db($database);
        
        if (!$dbExists) {
            $response['message'] = "Connected to MySQL, but database '$database' does not exist.";
            $response['mysql_connected'] = true;
            $response['db_exists'] = false;
        } else {
            // Connection and database selection successful
            $response['connected'] = true;
            $response['message'] = 'Successfully connected to MySQL database';
            
            // Get server information
            $details = [
                'server_info' => $conn->server_info,
                'host_info' => $conn->host_info,
                'database' => $database
            ];
            
            // Check tables
            $result = $conn->query("SHOW TABLES");
            $tables = [];
            
            if ($result) {
                while ($row = $result->fetch_array()) {
                    $tables[] = $row[0];
                }
                $details['tables'] = $tables;
                
                // Get row counts for each table
                $counts = [];
                foreach ($tables as $table) {
                    $countResult = $conn->query("SELECT COUNT(*) AS count FROM `$table`");
                    if ($countResult) {
                        $row = $countResult->fetch_assoc();
                        $counts[$table] = intval($row['count']);
                    }
                }
                $details['row_counts'] = $counts;
            }
            
            $response['details'] = $details;
        }
        
        // Close the connection
        $conn->close();
    }
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
    $response['error_code'] = $e->getCode();
}

// Return JSON response
echo json_encode($response, JSON_PRETTY_PRINT);
exit; 