<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get database connection from environment variable
$db_url = getenv('DATABASE_URL') ?: getenv('NETLIFY_DATABASE_URL');

if (!$db_url) {
    http_response_code(500);
    echo json_encode(['error' => 'Database URL not configured']);
    exit();
}

// Parse database URL
$url = parse_url($db_url);
$host = $url['host'] ?? 'localhost';
$port = $url['port'] ?? 5432;
$dbname = ltrim($url['path'] ?? '/postgres', '/');
$username = $url['user'] ?? 'postgres';
$password = $url['pass'] ?? '';

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get all registrations
            $stmt = $pdo->query("SELECT * FROM registrations ORDER BY id DESC");
            $registrations = $stmt->fetchAll();
            echo json_encode($registrations);
            break;

        case 'POST':
            // Create new registration
            $data = json_decode(file_get_contents('php://input'), true);
            $name = $data['name'] ?? '';
            $company = $data['company'] ?? null;
            $phone = $data['phone'] ?? null;
            $group = $data['group'] ?? null;
            $day = $data['day'] ?? null;
            $date = $data['date'] ?? null;
            $time = $data['time'] ?? null;
            $paid = $data['paid'] ?? false;

            $stmt = $pdo->prepare("
                INSERT INTO registrations (name, company, phone, group_name, day, date, time, paid, created_at)
                VALUES (:name, :company, :phone, :group, :day, :date, :time, :paid, NOW())
                RETURNING *
            ");
            
            $stmt->execute([
                ':name' => $name,
                ':company' => $company,
                ':phone' => $phone,
                ':group' => $group,
                ':day' => $day,
                ':date' => $date,
                ':time' => $time,
                ':paid' => $paid
            ]);
            
            $result = $stmt->fetch();
            http_response_code(201);
            echo json_encode($result);
            break;

        case 'PUT':
            // Update registration
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $data['id'] ?? null;
            
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID is required']);
                exit();
            }

            unset($data['id']);
            $fields = [];
            $values = [':id' => $id];
            
            foreach ($data as $key => $value) {
                $fields[] = "$key = :$key";
                $values[":$key"] = $value;
            }
            
            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                exit();
            }
            
            $sql = "UPDATE registrations SET " . implode(', ', $fields) . " WHERE id = :id RETURNING *";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($values);
            $result = $stmt->fetch();
            
            echo json_encode($result);
            break;

        case 'DELETE':
            // Delete registration(s)
            $data = json_decode(file_get_contents('php://input'), true);
            $ids = $data['ids'] ?? [];
            
            if (is_array($ids) && count($ids) > 0) {
                $placeholders = implode(',', array_fill(0, count($ids), '?'));
                $stmt = $pdo->prepare("DELETE FROM registrations WHERE id IN ($placeholders)");
                $stmt->execute($ids);
            } elseif (is_numeric($ids)) {
                $stmt = $pdo->prepare("DELETE FROM registrations WHERE id = ?");
                $stmt->execute([$ids]);
            } else {
                // Delete all
                $pdo->exec("DELETE FROM registrations");
            }
            
            echo json_encode(['success' => true]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>

