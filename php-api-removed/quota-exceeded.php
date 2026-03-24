<?php
// Include the database configuration
require_once 'config.php';

// Only allow POST requests for this endpoint
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get JSON data from the request
$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($data['service']) || !isset($data['errorMessage'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields (service, errorMessage)']);
    exit;
}

// Sanitize inputs
$service = sanitizeInput($data['service']);
$errorMessage = sanitizeInput($data['errorMessage']); 
$details = isset($data['details']) ? json_encode($data['details']) : '{}';
$timestamp = date('Y-m-d H:i:s');

// Log this event
logApiActivity('Firebase quota exceeded reported', "Service: $service");

try {
    // Connect to the database
    $conn = new mysqli($dbConfig['host'], $dbConfig['user'], $dbConfig['password'], $dbConfig['database']);
    
    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }
    
    // Check if the quota_events table exists, create it if not
    $checkTable = $conn->query("SHOW TABLES LIKE 'quota_events'");
    if ($checkTable->num_rows == 0) {
        $createTableSql = "CREATE TABLE quota_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            service VARCHAR(50) NOT NULL,
            error_message TEXT NOT NULL,
            details TEXT,
            created_at DATETIME NOT NULL,
            status VARCHAR(20) DEFAULT 'new'
        )";
        
        if (!$conn->query($createTableSql)) {
            throw new Exception("Failed to create table: " . $conn->error);
        }
    }
    
    // Prepare statement
    $stmt = $conn->prepare("INSERT INTO quota_events (service, error_message, details, created_at) VALUES (?, ?, ?, ?)");
    
    if (!$stmt) {
        throw new Exception("Prepare statement failed: " . $conn->error);
    }
    
    $stmt->bind_param("ssss", $service, $errorMessage, $details, $timestamp);
    
    // Execute the query
    if (!$stmt->execute()) {
        throw new Exception("Execute statement failed: " . $stmt->error);
    }
    
    $id = $stmt->insert_id;
    $stmt->close();
    
    // Check for quota patterns (multiple occurrences in last hour)
    $query = "SELECT COUNT(*) as count FROM quota_events WHERE service = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)";
    $countStmt = $conn->prepare($query);
    $countStmt->bind_param("s", $service);
    $countStmt->execute();
    $result = $countStmt->get_result();
    $row = $result->fetch_assoc();
    $recentCount = $row['count'];
    $countStmt->close();
    
    // Get total quota events for today
    $todayQuery = "SELECT COUNT(*) as count FROM quota_events WHERE DATE(created_at) = CURDATE()";
    $result = $conn->query($todayQuery);
    $row = $result->fetch_assoc();
    $todayCount = $row['count'];
    
    // Close the connection
    $conn->close();
    
    // Return success response with stats
    echo json_encode([
        'success' => true,
        'message' => 'Quota exceeded event logged',
        'id' => $id,
        'stats' => [
            'recent_hour' => $recentCount,
            'today_total' => $todayCount
        ],
        'recommendation' => $recentCount > 5 ? 'switch_to_mysql' : 'retry_later'
    ]);
    
} catch (Exception $e) {
    // Log the error
    error_log("Error logging quota exceeded: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to log quota exceeded: ' . $e->getMessage()]);
} 