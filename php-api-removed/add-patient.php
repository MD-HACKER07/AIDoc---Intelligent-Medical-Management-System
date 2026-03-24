<?php
// Include database configuration
require_once 'config.php';

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode([
        'success' => false,
        'message' => 'Only POST requests are allowed'
    ]);
    exit;
}

// Get patient data from POST
$firstName = isset($_POST['firstName']) ? trim($_POST['firstName']) : '';
$lastName = isset($_POST['lastName']) ? trim($_POST['lastName']) : '';
$dateOfBirth = isset($_POST['dateOfBirth']) ? trim($_POST['dateOfBirth']) : null;
$gender = isset($_POST['gender']) ? trim($_POST['gender']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$address = isset($_POST['address']) ? trim($_POST['address']) : '';
$medicalHistory = isset($_POST['medicalHistory']) ? trim($_POST['medicalHistory']) : '';
$allergies = isset($_POST['allergies']) ? trim($_POST['allergies']) : '';
$medications = isset($_POST['medications']) ? trim($_POST['medications']) : '';
$emergencyContactName = isset($_POST['emergencyContactName']) ? trim($_POST['emergencyContactName']) : '';
$emergencyContactPhone = isset($_POST['emergencyContactPhone']) ? trim($_POST['emergencyContactPhone']) : '';

// Validate required fields
if (empty($firstName) || empty($lastName)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'First name and last name are required'
    ]);
    exit;
}

// Generate a unique patient ID
$patient_id = 'P' . date('Ymd') . substr(uniqid(), -6);

try {
    // Create database connection
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Start transaction
    $pdo->beginTransaction();
    
    // Prepare SQL statement
    $sql = "INSERT INTO patients (
                patient_id, 
                firstName, 
                lastName, 
                dateOfBirth, 
                gender, 
                email, 
                phone, 
                address, 
                medicalHistory, 
                allergies, 
                medications, 
                emergencyContactName, 
                emergencyContactPhone,
                created_at, 
                updated_at
            ) VALUES (
                :patient_id,
                :firstName, 
                :lastName, 
                :dateOfBirth, 
                :gender, 
                :email, 
                :phone, 
                :address, 
                :medicalHistory, 
                :allergies, 
                :medications, 
                :emergencyContactName, 
                :emergencyContactPhone,
                NOW(), 
                NOW()
            )";
    
    $stmt = $pdo->prepare($sql);
    
    // Bind parameters
    $stmt->bindParam(':patient_id', $patient_id);
    $stmt->bindParam(':firstName', $firstName);
    $stmt->bindParam(':lastName', $lastName);
    $stmt->bindParam(':dateOfBirth', $dateOfBirth);
    $stmt->bindParam(':gender', $gender);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':phone', $phone);
    $stmt->bindParam(':address', $address);
    $stmt->bindParam(':medicalHistory', $medicalHistory);
    $stmt->bindParam(':allergies', $allergies);
    $stmt->bindParam(':medications', $medications);
    $stmt->bindParam(':emergencyContactName', $emergencyContactName);
    $stmt->bindParam(':emergencyContactPhone', $emergencyContactPhone);
    
    // Execute query
    $stmt->execute();
    
    // Get the last insert ID
    $lastInsertId = $pdo->lastInsertId();
    
    // Commit transaction
    $pdo->commit();
    
    // Log successful patient creation
    error_log("Patient added successfully: $patient_id - $firstName $lastName (ID: $lastInsertId)");
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Patient added successfully',
        'patientId' => $patient_id,
        'id' => $lastInsertId
    ]);
    
} catch (PDOException $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Log the error but don't expose details to client
    error_log("Database error adding patient: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred while adding patient'
    ]);
    exit;
} catch (Exception $e) {
    // Rollback transaction on error
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    error_log("General error adding patient: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while adding the patient'
    ]);
    exit;
} 