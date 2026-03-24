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
    'patients' => [],
    'total' => 0,
    'page' => 1,
    'totalPages' => 1
];

// Get query parameters
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$search = isset($_GET['search']) ? trim($_GET['search']) : '';

// Ensure valid pagination values
$page = max(1, $page);
$limit = max(1, min(100, $limit));
$offset = ($page - 1) * $limit;

try {
    // Create database connection
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Build the query based on search parameter
    $whereClause = '';
    $params = [];
    
    if (!empty($search)) {
        $whereClause = "WHERE 
            patient_id LIKE :search OR 
            firstName LIKE :search OR 
            lastName LIKE :search OR 
            email LIKE :search OR 
            phone LIKE :search";
        $params[':search'] = "%$search%";
    }
    
    // Get total count for pagination
    $countSql = "SELECT COUNT(*) FROM patients $whereClause";
    $stmt = $pdo->prepare($countSql);
    
    if (!empty($search)) {
        $stmt->bindParam(':search', $params[':search']);
    }
    
    $stmt->execute();
    $totalRecords = $stmt->fetchColumn();
    
    // Main query with pagination
    $sql = "SELECT 
                id, 
                patient_id, 
                firstName, 
                lastName, 
                dateOfBirth, 
                gender, 
                email, 
                phone, 
                created_at 
            FROM patients 
            $whereClause 
            ORDER BY created_at DESC 
            LIMIT :offset, :limit";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    
    if (!empty($search)) {
        $stmt->bindParam(':search', $params[':search']);
    }
    
    $stmt->execute();
    $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Update response
    $response['success'] = true;
    $response['message'] = 'Patients retrieved successfully';
    $response['patients'] = $patients;
    $response['total'] = $totalRecords;
    $response['page'] = $page;
    $response['totalPages'] = ceil($totalRecords / $limit);
    
} catch (PDOException $e) {
    // Handle database errors
    $response['message'] = 'Database error: ' . $e->getMessage();
    error_log("MySQL Error in get-patients.php: " . $e->getMessage());
    
    // Check if the error is about missing table
    if (strpos($e->getMessage(), "Table '$db_name.patients' doesn't exist") !== false) {
        $response['message'] = "The patients table does not exist. Please run the database setup script.";
        $response['needsSetup'] = true;
    }
} catch (Exception $e) {
    // Handle other errors
    $response['message'] = 'Error: ' . $e->getMessage();
    error_log("General Error in get-patients.php: " . $e->getMessage());
}

// Return response
echo json_encode($response); 