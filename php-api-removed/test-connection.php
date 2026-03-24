<?php
// Include database configuration
require_once 'config.php';

// Check if the connection is established
if ($conn) {
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Database connection successful',
        'server_info' => $conn->server_info,
        'database' => DB_NAME
    ]);
} else {
    // Return error response
    handle_error('Database connection failed');
}

// Close the connection
$conn->close();
?> 