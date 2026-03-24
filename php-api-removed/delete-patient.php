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
$check_stmt = $conn->prepare("SELECT id, first_name, last_name FROM patients WHERE id = ? LIMIT 1");
$check_stmt->bind_param("s", $id);
$check_stmt->execute();
$check_result = $check_stmt->get_result();

if ($check_result->num_rows === 0) {
    handle_error('Patient not found', 404);
}

// Get patient details for logging
$patient = $check_result->fetch_assoc();
$patient_name = $patient['first_name'] . ' ' . $patient['last_name'];
$check_stmt->close();

// Prepare the SQL statement
$stmt = $conn->prepare("DELETE FROM patients WHERE id = ?");
$stmt->bind_param("s", $id);

// Execute the query
if ($stmt->execute()) {
    // Check if any rows were affected
    if ($stmt->affected_rows > 0) {
        // Log the deletion
        error_log("Patient deleted: ID=$id, Name=$patient_name");
        
        // Return success response
        echo json_encode([
            'success' => true,
            'message' => 'Patient deleted successfully',
            'id' => $id
        ]);
    } else {
        // No rows were affected (should not happen after our check)
        handle_error('Patient could not be deleted', 500);
    }
} else {
    // Log error and return error response
    error_log("Error deleting patient: " . $stmt->error);
    handle_error('Failed to delete patient: ' . $stmt->error);
}

// Close statement and connection
$stmt->close();
$conn->close();
?> 