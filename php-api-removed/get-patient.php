<?php
// Include database configuration
require_once 'config.php';

// Only allow GET requests for this endpoint
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    handle_error('Only GET method is allowed', 405);
}

// Check if ID parameter is provided
if (!isset($_GET['id'])) {
    handle_error('Patient ID is required', 400);
}

// Get and sanitize the ID parameter
$id = sanitize_input($_GET['id']);

// Prepare the SQL statement
// First, check if the ID is numeric (direct ID) or a patient_id (string identifier)
if (is_numeric($id)) {
    $query = "SELECT * FROM patients WHERE id = ? LIMIT 1";
} else {
    $query = "SELECT * FROM patients WHERE patient_id = ? LIMIT 1";
}

$stmt = $conn->prepare($query);
$stmt->bind_param('s', $id);

// Execute the query
if ($stmt->execute()) {
    $result = $stmt->get_result();
    
    // Check if patient exists
    if ($result->num_rows === 0) {
        handle_error('Patient not found', 404);
    }
    
    // Fetch patient data
    $row = $result->fetch_assoc();
    
    // Format the data for JSON response
    $patient = [
        'id' => $row['id'],
        'patientId' => $row['patient_id'],
        'firstName' => $row['first_name'],
        'lastName' => $row['last_name'],
        'dateOfBirth' => $row['date_of_birth'],
        'gender' => $row['gender'],
        'email' => $row['email'],
        'phone' => $row['phone'],
        'address' => $row['address'],
        'medicalHistory' => $row['medical_history'],
        'allergies' => $row['allergies'],
        'medications' => $row['medications'],
        'emergencyContactName' => $row['emergency_contact_name'],
        'emergencyContactPhone' => $row['emergency_contact_phone'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at']
    ];
    
    // Return success response
    echo json_encode([
        'success' => true,
        'patient' => $patient
    ]);
} else {
    // Log error and return error response
    error_log("Error fetching patient: " . $stmt->error);
    handle_error('Failed to fetch patient: ' . $stmt->error);
}

// Close statement and connection
$stmt->close();
$conn->close();
?> 