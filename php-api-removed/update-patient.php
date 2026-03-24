<?php
// Include database configuration
require_once 'config.php';

// Only allow POST requests for this endpoint
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    handle_error('Only POST method is allowed', 405);
}

// Get the posted data
$data = json_decode(file_get_contents('php://input'), true);

// Check if ID is provided
if (!isset($data['id'])) {
    handle_error('Patient ID is required', 400);
}

// Get and sanitize the ID
$id = sanitize_input($data['id']);

// Validate that the patient exists
$check_stmt = $conn->prepare("SELECT id FROM patients WHERE id = ? LIMIT 1");
$check_stmt->bind_param("s", $id);
$check_stmt->execute();
$check_result = $check_stmt->get_result();

if ($check_result->num_rows === 0) {
    handle_error('Patient not found', 404);
}
$check_stmt->close();

// Prepare the data to update
$updates = [];
$types = "";
$params = [];

// Define fields that can be updated
$allowed_fields = [
    'firstName' => ['field' => 'first_name', 'type' => 's'],
    'lastName' => ['field' => 'last_name', 'type' => 's'],
    'dateOfBirth' => ['field' => 'date_of_birth', 'type' => 's'],
    'gender' => ['field' => 'gender', 'type' => 's'],
    'email' => ['field' => 'email', 'type' => 's'],
    'phone' => ['field' => 'phone', 'type' => 's'],
    'address' => ['field' => 'address', 'type' => 's'],
    'medicalHistory' => ['field' => 'medical_history', 'type' => 's'],
    'allergies' => ['field' => 'allergies', 'type' => 's'],
    'medications' => ['field' => 'medications', 'type' => 's'],
    'emergencyContactName' => ['field' => 'emergency_contact_name', 'type' => 's'],
    'emergencyContactPhone' => ['field' => 'emergency_contact_phone', 'type' => 's'],
    'patientId' => ['field' => 'patient_id', 'type' => 's']
];

// Build the update query dynamically
foreach ($allowed_fields as $input_field => $db_info) {
    if (isset($data[$input_field])) {
        $updates[] = "{$db_info['field']} = ?";
        $types .= $db_info['type'];
        $params[] = sanitize_input($data[$input_field]);
    }
}

// If no fields to update
if (empty($updates)) {
    handle_error('No fields to update', 400);
}

// Prepare the SQL statement
$query = "UPDATE patients SET " . implode(", ", $updates) . " WHERE id = ?";
$types .= "s"; // Add type for the WHERE clause parameter
$params[] = $id; // Add the ID parameter

$stmt = $conn->prepare($query);

// Bind parameters dynamically
if ($params) {
    $stmt->bind_param($types, ...$params);
}

// Execute the query
if ($stmt->execute()) {
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Patient updated successfully',
        'id' => $id
    ]);
} else {
    // Log error and return error response
    error_log("Error updating patient: " . $stmt->error);
    handle_error('Failed to update patient: ' . $stmt->error);
}

// Close statement and connection
$stmt->close();
$conn->close();
?> 