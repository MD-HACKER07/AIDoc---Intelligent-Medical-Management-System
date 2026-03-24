# AIDoc Express API

This is the Express.js backend API for the AIDoc application, providing MySQL database access.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with your MySQL configuration:
   ```
   # Database Configuration
   DB_HOST=localhost
   DB_USER=admin
   DB_PASSWORD=admin123
   DB_NAME=AIDoc

   # Server Configuration
   PORT=3000
   ```

3. Initialize the database using one of these methods:
   
   **Method 1: SQL Script (Recommended)**
   ```
   GET http://localhost:3000/run-sql-setup
   ```
   This approach uses the `database.sql` file to set up the database structure with indexes and sample data.
   
   **Method 2: Express Endpoint**
   ```
   GET http://localhost:3000/setup-database
   ```
   This creates a basic database structure without sample data.

## Database Schema

The database includes the following tables:

### users
- `id` - Auto-incrementing primary key
- `user_id` - Unique user identifier
- `email` - User's email (unique)
- `name` - User's full name
- `role` - User role (admin, doctor, nurse, staff)
- `created_at`, `updated_at` - Timestamps

### hospitals
- `id` - Auto-incrementing primary key
- `hospital_id` - Unique hospital identifier
- `name` - Hospital name
- `address`, `city`, `state`, `zip_code` - Location information
- `phone`, `email`, `website` - Contact information
- `license_number`, `established_date` - Hospital details
- `type` - Type of hospital
- `status` - Active or inactive
- `created_at`, `updated_at` - Timestamps

### departments
- `id` - Auto-incrementing primary key
- `department_id` - Unique department identifier
- `hospital_id` - Foreign key to hospitals table
- `name` - Department name
- `description` - Department description
- `head_doctor` - Name of the department head
- `phone` - Contact phone number
- `created_at`, `updated_at` - Timestamps

### doctors
- `id` - Auto-incrementing primary key
- `doctor_id` - Unique doctor identifier
- `hospital_id` - Foreign key to hospitals table
- `department_id` - Foreign key to departments table
- `first_name`, `last_name` - Doctor's name
- `specialization` - Doctor's specialty
- `qualification` - Doctor's qualifications
- `experience_years` - Years of experience
- `email`, `phone`, `address` - Contact information
- `license_number` - Medical license number
- `status` - Active, inactive, or on leave
- `created_at`, `updated_at` - Timestamps

### patients
- `id` - Auto-incrementing primary key
- `patient_id` - Unique patient identifier
- `hospital_id` - Foreign key to hospitals table
- `referred_by` - Foreign key to doctors table
- `first_name`, `last_name` - Patient's name
- `gender`, `date_of_birth` - Basic demographic information
- `blood_group`, `height`, `weight` - Physical attributes
- `contact_number`, `email`, `address` - Contact information
- `city`, `state`, `zip_code` - Location information
- `occupation`, `marital_status` - Additional demographic information
- `medical_history`, `allergies`, `current_medications` - Medical information
- `emergency_contact_name`, `emergency_contact_relationship`, `emergency_contact` - Emergency contacts
- `insurance_provider`, `insurance_policy_number`, `insurance_expiry_date` - Insurance details
- `notes` - Additional notes
- `registration_date`, `last_visit_date` - Important dates
- `status` - Active, inactive, or deceased
- `created_by` - Foreign key to users table
- `created_at`, `updated_at` - Timestamps

### appointments
- `id` - Auto-incrementing primary key
- `appointment_id` - Unique appointment identifier
- `patient_id` - Foreign key to patients table
- `doctor_id` - Foreign key to doctors table
- `hospital_id` - Foreign key to hospitals table
- `department_id` - Foreign key to departments table
- `appointment_date`, `appointment_time` - Appointment date and time
- `duration` - Duration in minutes
- `reason` - Reason for appointment
- `status` - Scheduled, completed, cancelled, or no-show
- `notes` - Additional notes
- `created_at`, `updated_at` - Timestamps

### medical_reports
- `id` - Auto-incrementing primary key
- `report_id` - Unique report identifier
- `patient_id` - Foreign key to patients table
- `doctor_id` - Foreign key to doctors table
- `hospital_id` - Foreign key to hospitals table
- `appointment_id` - Foreign key to appointments table
- `report_date` - Date of the report
- `report_type` - Type of report
- `chief_complaint` - Patient's main complaint
- `diagnosis` - Diagnosis information
- `treatment` - Treatment plan
- `vital_signs` - Patient's vital signs
- `lab_results` - Laboratory results
- `imaging_results` - Imaging results
- `recommendations` - Doctor's recommendations
- `follow_up_instructions` - Follow-up instructions
- `notes` - Additional notes
- `created_at`, `updated_at` - Timestamps

### prescriptions
- `id` - Auto-incrementing primary key
- `prescription_id` - Unique prescription identifier
- `patient_id` - Foreign key to patients table
- `doctor_id` - Foreign key to doctors table
- `hospital_id` - Foreign key to hospitals table
- `report_id` - Foreign key to medical_reports table
- `medication_name` - Name of the medication
- `dosage` - Dosage amount
- `frequency` - How often to take the medication
- `duration` - Duration of the medication
- `quantity` - Quantity prescribed
- `refill` - Number of refills allowed
- `start_date` - When to start taking the medication
- `end_date` - When to stop taking the medication
- `route` - Method of taking the medication
- `instructions` - Special instructions
- `pharmacist_notes` - Notes for the pharmacist
- `status` - Active, completed, or cancelled
- `created_at`, `updated_at` - Timestamps

## Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with hot reloading

## API Endpoints

### Database Setup and Connection
- `GET /setup-database` - Initialize database and tables
- `GET /run-sql-setup` - Initialize database using SQL script with sample data
- `GET /update-schema` - Update database schema with new tables
- `GET /check-connection` - Check MySQL connection

### Hospital Management
- `GET /hospitals` - Get all hospitals
- `GET /hospitals/:id` - Get a specific hospital with its departments and doctors
- `POST /hospitals` - Add a new hospital
- `PUT /hospitals/:id` - Update hospital information

### Department Management
- `GET /departments` - Get all departments (filter by hospital_id with query parameter)
- `GET /departments/:id` - Get a specific department with its doctors
- `POST /departments` - Add a new department

### Doctor Management
- `GET /doctors` - Get all doctors (filter by hospital_id or department_id with query parameters)
- `GET /doctors/:id` - Get a specific doctor with upcoming appointments
- `POST /doctors` - Add a new doctor

### Patient Management
- `GET /get-patients?page=1&limit=10&search=query` - Get paginated list of patients with optional search
- `GET /get-patient/:id` - Get a single patient by ID
- `POST /add-patient` - Add a new patient
- `PUT /update-patient/:id` - Update patient information
- `DELETE /delete-patient/:id` - Delete a patient

### Appointment Management
- `GET /appointments` - Get all appointments (filter with query parameters)
- `GET /appointments/:id` - Get a specific appointment with related medical reports
- `POST /appointments` - Schedule a new appointment
- `PATCH /appointments/:id/status` - Update appointment status

### Medical Reports
- `GET /patient/:id/reports` - Get all medical reports for a patient
- `GET /reports/:id` - Get a specific medical report by ID
- `POST /patient/:id/reports` - Add a new medical report for a patient
- `PUT /reports/:id` - Update a medical report
- `DELETE /reports/:id` - Delete a medical report

### Prescriptions
- `GET /patient/:id/prescriptions` - Get all prescriptions for a patient
- `POST /patient/:id/prescriptions` - Add a new prescription for a patient
- `PUT /prescriptions/:id` - Update a prescription
- `DELETE /prescriptions/:id` - Delete a prescription

## Request/Response Examples

### Get Patients

**Request:**
```
GET /get-patients?page=1&limit=10&search=john
```

**Response:**
```json
{
  "success": true,
  "patients": [
    {
      "id": 1,
      "patient_id": "P123456",
      "firstName": "John",
      "lastName": "Doe",
      "gender": "Male",
      "dateOfBirth": "1980-01-15",
      "contactNumber": "555-123-4567",
      "email": "john.doe@example.com"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Add Patient

**Request:**
```
POST /add-patient
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "gender": "Female",
  "dateOfBirth": "1985-06-22",
  "contactNumber": "555-987-6543",
  "email": "jane.smith@example.com",
  "address": "123 Main St",
  "patientId": "P234567"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Patient added successfully",
  "patient_id": 2
}
```

### Get Patient Medical Reports

**Request:**
```
GET /patient/1/reports
```

**Response:**
```json
{
  "success": true,
  "reports": [
    {
      "id": 1,
      "patient_id": 1,
      "report_date": "2023-06-15",
      "report_type": "Annual Checkup",
      "diagnosis": "Patient is in good health overall. Blood pressure slightly elevated.",
      "treatment": "Recommended lifestyle changes including diet modification and regular exercise.",
      "notes": "Follow up in 6 months to check blood pressure.",
      "doctor_name": "Dr. Michael Chen",
      "hospital_name": "General Hospital",
      "created_at": "2023-06-15T10:30:00Z",
      "updated_at": "2023-06-15T10:30:00Z"
    }
  ]
}
```

### Add Medical Report

**Request:**
```
POST /patient/1/reports
Content-Type: application/json

{
  "report_date": "2023-08-22",
  "report_type": "Follow-up",
  "diagnosis": "Blood pressure now normal. Patient following diet and exercise regimen.",
  "treatment": "Continue current lifestyle changes.",
  "notes": "Patient reports feeling better with more energy.",
  "doctor_name": "Dr. Michael Chen",
  "hospital_name": "General Hospital"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Medical report added successfully",
  "report_id": 2
}
```

### Get Patient Prescriptions

**Request:**
```
GET /patient/1/prescriptions
```

**Response:**
```json
{
  "success": true,
  "prescriptions": [
    {
      "id": 1,
      "patient_id": 1,
      "medication_name": "Lisinopril",
      "dosage": "10mg",
      "frequency": "Once daily",
      "start_date": "2023-06-15",
      "end_date": "2023-12-15",
      "prescribing_doctor": "Dr. Michael Chen",
      "notes": "Take in the morning with food",
      "created_at": "2023-06-15T10:45:00Z"
    }
  ]
}
```

### Add Prescription

**Request:**
```
POST /patient/1/prescriptions
Content-Type: application/json

{
  "medication_name": "Atorvastatin",
  "dosage": "20mg",
  "frequency": "Once daily",
  "start_date": "2023-08-22",
  "end_date": "2024-02-22",
  "prescribing_doctor": "Dr. Michael Chen",
  "notes": "Take in the evening"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Prescription added successfully",
  "prescription_id": 2
}
```

### Get All Hospitals

**Request:**
```
GET /hospitals
```

**Response:**
```json
{
  "success": true,
  "hospitals": [
    {
      "id": 1,
      "hospital_id": "H001",
      "name": "General Hospital",
      "address": "123 Main St",
      "city": "Anytown",
      "state": "Anystate",
      "zip_code": "12345",
      "phone": "555-123-4567",
      "email": "info@generalhospital.com",
      "website": "www.generalhospital.com",
      "status": "active",
      "created_at": "2023-06-01T10:00:00Z",
      "updated_at": "2023-06-01T10:00:00Z"
    },
    {
      "id": 2,
      "hospital_id": "H002",
      "name": "Community Medical Center",
      "address": "456 Oak Ave",
      "city": "Somewhere",
      "state": "Somestate",
      "zip_code": "67890",
      "phone": "555-987-6543",
      "email": "info@communitymedical.com",
      "website": "www.communitymedical.com",
      "status": "active",
      "created_at": "2023-06-01T10:00:00Z",
      "updated_at": "2023-06-01T10:00:00Z"
    }
  ]
}
```

### Add Hospital

**Request:**
```
POST /hospitals
Content-Type: application/json

{
  "hospital_id": "H003",
  "name": "City Medical Center",
  "address": "789 Pine St",
  "city": "Metropolis",
  "state": "Metrostate",
  "zip_code": "54321",
  "phone": "555-456-7890",
  "email": "info@citymedical.com",
  "website": "www.citymedical.com",
  "license_number": "MED123456",
  "established_date": "1995-03-15",
  "type": "General"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hospital added successfully",
  "hospital_id": 3
}
```

### Get All Departments

**Request:**
```
GET /departments?hospital_id=1
```

**Response:**
```json
{
  "success": true,
  "departments": [
    {
      "id": 1,
      "department_id": "D001",
      "hospital_id": 1,
      "name": "Cardiology",
      "description": "Cardiac care and heart disease treatment",
      "head_doctor": "Dr. James Wilson",
      "hospital_name": "General Hospital",
      "created_at": "2023-06-01T10:00:00Z",
      "updated_at": "2023-06-01T10:00:00Z"
    },
    {
      "id": 2,
      "department_id": "D002",
      "hospital_id": 1,
      "name": "Neurology",
      "description": "Diagnosis and treatment of nervous system disorders",
      "head_doctor": "Dr. Elizabeth Chen",
      "hospital_name": "General Hospital",
      "created_at": "2023-06-01T10:00:00Z",
      "updated_at": "2023-06-01T10:00:00Z"
    }
  ]
}
```

### Get All Doctors

**Request:**
```
GET /doctors?hospital_id=1&department_id=1
```

**Response:**
```json
{
  "success": true,
  "doctors": [
    {
      "id": 1,
      "doctor_id": "D001",
      "hospital_id": 1,
      "department_id": 1,
      "first_name": "James",
      "last_name": "Wilson",
      "specialization": "Cardiologist",
      "qualification": "MD, FACC",
      "experience_years": 15,
      "email": "james.wilson@generalhospital.com",
      "phone": "555-111-2222",
      "hospital_name": "General Hospital",
      "department_name": "Cardiology",
      "created_at": "2023-06-01T10:00:00Z",
      "updated_at": "2023-06-01T10:00:00Z"
    }
  ]
}
```

### Schedule Appointment

**Request:**
```
POST /appointments
Content-Type: application/json

{
  "appointment_id": "A005",
  "patient_id": 1,
  "doctor_id": 1,
  "hospital_id": 1,
  "department_id": 1,
  "appointment_date": "2023-12-20",
  "appointment_time": "10:00:00",
  "duration": 30,
  "reason": "Follow-up checkup for hypertension"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment scheduled successfully",
  "appointment_id": 5
}
```

### Get Appointments for a Doctor

**Request:**
```
GET /appointments?doctor_id=1&status=scheduled
```

**Response:**
```json
{
  "success": true,
  "appointments": [
    {
      "id": 4,
      "appointment_id": "A004",
      "patient_id": 1,
      "doctor_id": 1,
      "hospital_id": 1,
      "department_id": 1,
      "appointment_date": "2023-12-15",
      "appointment_time": "11:00:00",
      "duration": 30,
      "reason": "Follow-up checkup",
      "status": "scheduled",
      "patient_first_name": "John",
      "patient_last_name": "Doe",
      "doctor_first_name": "James",
      "doctor_last_name": "Wilson",
      "hospital_name": "General Hospital",
      "department_name": "Cardiology",
      "created_at": "2023-06-01T10:00:00Z",
      "updated_at": "2023-06-01T10:00:00Z"
    }
  ]
}
```

## Integration with React Frontend

To integrate this Express API with your React frontend, update the API base URL in your frontend code to point to this Express server instead of the PHP endpoints.

For example, if you're using an API service in your React app:

```javascript
// Old PHP endpoint
const response = await fetch('php-api/get-patients.php?page=1');

// New Express endpoint
const response = await fetch('http://localhost:3000/get-patients?page=1');
``` 