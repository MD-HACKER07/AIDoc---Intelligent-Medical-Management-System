<?php
// Include database configuration
require_once 'config.php';

// Only allow POST requests for this endpoint
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    handle_error('Only POST method is allowed', 405);
}

// Get the posted data
$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($data['firstName']) || !isset($data['lastName'])) {
    handle_error('First name and last name are required', 400);
}

// Prepare patient data with validation
$patient_id = isset($data['patientId']) ? sanitize_input($data['patientId']) : 'P' . time();
$first_name = sanitize_input($data['firstName']);
$last_name = sanitize_input($data['lastName']);
$date_of_birth = isset($data['dateOfBirth']) ? sanitize_input($data['dateOfBirth']) : '';
$gender = isset($data['gender']) ? sanitize_input($data['gender']) : '';
$email = isset($data['email']) ? sanitize_input($data['email']) : '';
$phone = isset($data['phone']) ? sanitize_input($data['phone']) : '';
$address = isset($data['address']) ? sanitize_input($data['address']) : '';
$medical_history = isset($data['medicalHistory']) ? sanitize_input($data['medicalHistory']) : '';
$allergies = isset($data['allergies']) ? sanitize_input($data['allergies']) : '';
$medications = isset($data['medications']) ? sanitize_input($data['medications']) : '';
$emergency_contact_name = isset($data['emergencyContactName']) ? sanitize_input($data['emergencyContactName']) : '';
$emergency_contact_phone = isset($data['emergencyContactPhone']) ? sanitize_input($data['emergencyContactPhone']) : '';

// Prepare SQL statement with parameterized query for security
$stmt = $conn->prepare("
    INSERT INTO patients 
    (patient_id, first_name, last_name, date_of_birth, gender, email, phone, address, 
     medical_history, allergies, medications, emergency_contact_name, emergency_contact_phone) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");

// Bind parameters
$stmt->bind_param(
    "sssssssssssss",
    $patient_id,
    $first_name,
    $last_name,
    $date_of_birth,
    $gender,
    $email,
    $phone,
    $address,
    $medical_history,
    $allergies,
    $medications,
    $emergency_contact_name,
    $emergency_contact_phone
);

// Execute the query
if ($stmt->execute()) {
    // Get the inserted ID
    $id = $stmt->insert_id;
    
    // Log the successful insertion
    error_log("Patient created: ID=$id, PatientID=$patient_id, Name=$first_name $last_name");
    
    // Return success response
    echo json_encode([
        'success' => true,
        'id' => $id,
        'patient_id' => $patient_id,
        'message' => 'Patient created successfully'
    ]);
} else {
    // Log error and return error response
    error_log("Error creating patient: " . $stmt->error);
    handle_error('Failed to create patient: ' . $stmt->error);
}

// Close statement and connection
$stmt->close();
$conn->close();
?> 