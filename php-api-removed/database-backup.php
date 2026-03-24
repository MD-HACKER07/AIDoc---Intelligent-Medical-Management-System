<?php
// Include database configuration
require_once 'config.php';

// Set headers
header('Content-Type: text/plain');
header('Access-Control-Allow-Origin: *');

// Check if the request includes a download parameter
$download = isset($_GET['download']) && $_GET['download'] === 'true';

// Create backup directory if it doesn't exist
$backupDir = __DIR__ . '/backups';
if (!file_exists($backupDir)) {
    mkdir($backupDir, 0755, true);
}

// Generate filename with timestamp
$timestamp = date('Y-m-d_H-i-s');
$filename = "patient_db_backup_{$timestamp}.sql";
$filepath = "{$backupDir}/{$filename}";

// Construct the mysqldump command
$command = "mysqldump --user={$db_user} --password={$db_pass} --host={$db_host} {$db_name} > {$filepath}";

// Check if we're on Windows or Unix-like system
if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    // On Windows, we need to escape the command differently
    $command = "mysqldump --user={$db_user} --password={$db_pass} --host={$db_host} {$db_name} > \"{$filepath}\"";
}

// Execute the command
$output = [];
$return_var = 0;
exec($command, $output, $return_var);

// Check if the command was successful
if ($return_var !== 0) {
    // Log the error
    error_log("Database backup failed: " . implode("\n", $output));
    
    // Try alternative approach using PHP
    try {
        $pdo = new PDO("mysql:host={$db_host};dbname={$db_name}", $db_user, $db_pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Get all tables
        $tables = [];
        $stmt = $pdo->query("SHOW TABLES");
        while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
            $tables[] = $row[0];
        }
        
        // Start output buffering
        ob_start();
        
        // Add header
        echo "-- AIDoc MySQL Database Backup\n";
        echo "-- Generated: " . date('Y-m-d H:i:s') . "\n";
        echo "-- Server version: " . $pdo->getAttribute(PDO::ATTR_SERVER_VERSION) . "\n\n";
        
        // Process each table
        foreach ($tables as $table) {
            // Get create table statement
            $stmt = $pdo->query("SHOW CREATE TABLE `{$table}`");
            $row = $stmt->fetch(PDO::FETCH_NUM);
            
            echo "-- Table structure for table `{$table}`\n";
            echo "DROP TABLE IF EXISTS `{$table}`;\n";
            echo $row[1] . ";\n\n";
            
            // Get table data
            $stmt = $pdo->query("SELECT * FROM `{$table}`");
            $columnCount = $stmt->columnCount();
            
            if ($stmt->rowCount() > 0) {
                echo "-- Dumping data for table `{$table}`\n";
                echo "INSERT INTO `{$table}` VALUES\n";
                
                $first = true;
                while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                    if (!$first) {
                        echo ",\n";
                    } else {
                        $first = false;
                    }
                    
                    echo "(";
                    for ($i = 0; $i < $columnCount; $i++) {
                        if ($i > 0) {
                            echo ", ";
                        }
                        
                        if ($row[$i] === null) {
                            echo "NULL";
                        } else {
                            echo "'" . addslashes($row[$i]) . "'";
                        }
                    }
                    echo ")";
                }
                echo ";\n\n";
            }
        }
        
        // Get the content from the output buffer
        $content = ob_get_clean();
        
        // Write to file
        file_put_contents($filepath, $content);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo "Database backup failed: " . $e->getMessage();
        exit;
    }
}

// Check if the file was created
if (!file_exists($filepath)) {
    http_response_code(500);
    echo "Failed to create backup file.";
    exit;
}

// Get the file size
$filesize = filesize($filepath);
$formatted_size = formatBytes($filesize);

// If download requested, serve the file
if ($download) {
    header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Transfer-Encoding: binary');
    header('Expires: 0');
    header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
    header('Pragma: public');
    header('Content-Length: ' . $filesize);
    ob_clean();
    flush();
    readfile($filepath);
    exit;
}

// Otherwise return information about the backup
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Backup</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .alert {
            background-color: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            background-color: #f8f9fa;
        }
        .btn {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 10px 15px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 10px;
        }
        .btn:hover {
            background-color: #0069d9;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        table th, table td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
            text-align: left;
        }
    </style>
</head>
<body>
    <h1>MySQL Database Backup</h1>
    
    <div class="alert">
        Database backup was successfully created!
    </div>
    
    <div class="card">
        <h2>Backup Details</h2>
        <table>
            <tr>
                <th>Filename</th>
                <td><?php echo htmlspecialchars($filename); ?></td>
            </tr>
            <tr>
                <th>Size</th>
                <td><?php echo $formatted_size; ?></td>
            </tr>
            <tr>
                <th>Date</th>
                <td><?php echo date('Y-m-d H:i:s'); ?></td>
            </tr>
            <tr>
                <th>Location</th>
                <td><?php echo htmlspecialchars($filepath); ?></td>
            </tr>
        </table>
        
        <a href="?download=true" class="btn">Download Backup</a>
    </div>
    
    <div class="card">
        <h2>Previous Backups</h2>
        <?php
        $backups = glob($backupDir . '/*.sql');
        if (count($backups) > 0) {
            echo '<table>';
            echo '<tr><th>Filename</th><th>Size</th><th>Date</th><th>Action</th></tr>';
            
            // Sort by modification time, newest first
            usort($backups, function($a, $b) {
                return filemtime($b) - filemtime($a);
            });
            
            foreach ($backups as $backup) {
                $bFilename = basename($backup);
                $bFilesize = filesize($backup);
                $bFormatted_size = formatBytes($bFilesize);
                $bDate = date('Y-m-d H:i:s', filemtime($backup));
                
                echo '<tr>';
                echo '<td>' . htmlspecialchars($bFilename) . '</td>';
                echo '<td>' . $bFormatted_size . '</td>';
                echo '<td>' . $bDate . '</td>';
                echo '<td><a href="?download=true&file=' . urlencode($bFilename) . '">Download</a></td>';
                echo '</tr>';
            }
            
            echo '</table>';
        } else {
            echo '<p>No previous backups found.</p>';
        }
        ?>
    </div>
</body>
</html>

<?php
// Helper function to format bytes to a readable format
function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    
    $bytes /= (1 << (10 * $pow));
    
    return round($bytes, $precision) . ' ' . $units[$pow];
} 