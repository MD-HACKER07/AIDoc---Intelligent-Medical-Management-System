# AIDoc MySQL Integration

This directory contains the PHP API scripts needed to connect the AIDoc application to a MySQL database. This integration provides an alternative to Firebase when you need a local database or when Firebase quota limits are exceeded.

## Setup Instructions

### Prerequisites

1. A working PHP server (version 7.4+ recommended)
2. MySQL server (version 5.7+ recommended)
3. PDO PHP extension enabled

### Quick Setup Steps

1. **Copy configuration file**
   - Copy `config.example.php` to `config.php`
   - Edit `config.php` with your MySQL server details:
     ```php
     $db_host = 'localhost'; // Your MySQL host
     $db_name = 'aidoc_patients'; // Database name
     $db_user = 'your_username'; // MySQL username
     $db_pass = 'your_password'; // MySQL password
     ```

2. **Initialize the database**
   - Open `setup-database.php` in your browser (e.g., http://localhost/path/to/php-api/setup-database.php)
   - This script will:
     - Create the database if it doesn't exist
     - Create all required tables
     - Add a sample patient for testing

3. **Verify the connection**
   - Open `check-connection.php` in your browser
   - You should see a JSON response with connection details

4. **Configure the frontend**
   - In the AIDoc application, go to Settings
   - Under "Database Settings", switch to "MySQL" 
   - Alternatively, keep "Auto" setting to use MySQL as a fallback

## API Endpoints

The following PHP API endpoints are available:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `add-patient.php` | POST | Add a new patient |
| `get-patients.php` | GET | Get list of patients with pagination |
| `get-patient.php` | GET | Get details of a single patient |
| `update-patient.php` | POST | Update an existing patient |
| `delete-patient.php` | POST | Delete a patient |
| `check-connection.php` | GET | Check MySQL connection |
| `setup-database.php` | GET | Initialize database and tables |
| `database-backup.php` | GET | Backup database to SQL file |

## Patient Schema

The database uses the following schema for the patients table:

```sql
CREATE TABLE patients (
  id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id VARCHAR(20) NOT NULL UNIQUE,
  firstName VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  dateOfBirth DATE NULL,
  gender VARCHAR(20) NULL,
  email VARCHAR(100) NULL,
  phone VARCHAR(20) NULL,
  address TEXT NULL,
  medicalHistory TEXT NULL,
  allergies TEXT NULL,
  medications TEXT NULL,
  emergencyContactName VARCHAR(100) NULL,
  emergencyContactPhone VARCHAR(20) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify MySQL is running
   - Check credentials in `config.php`
   - Ensure the MySQL user has appropriate permissions

2. **Database Not Created**
   - Run `setup-database.php` again
   - Check if the MySQL user has CREATE DATABASE permission
   - Try creating the database manually

3. **Missing Tables**
   - Check database permissions
   - Run `setup-database.php` again

4. **PHP Errors**
   - Enable error display in `config.php` by setting `$debug = true;`
   - Check your PHP error logs

### Debug Mode

In `config.php`, set `$debug = true;` to enable detailed error information. Remember to set it to `false` in production environments.

## Backup and Restore

- Use `database-backup.php` to create a backup of your database
- The backup files are stored in the `backups` directory
- You can download backups directly from the web interface

## Security Notes

- This API has minimal security measures and should be properly secured before production use
- Consider adding authentication to the PHP endpoints
- Move the `config.php` file outside the web root in production
- Set `$debug = false;` in production environments 