<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$db_url = getenv('DATABASE_URL') ?: getenv('NETLIFY_DATABASE_URL');

if (!$db_url) {
    http_response_code(500);
    echo json_encode(['error' => 'Database URL not configured']);
    exit();
}

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

// Ensure default admin user exists
function ensureDefaultAdmin($pdo) {
    try {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = :username");
        $stmt->execute([':username' => 'admin']);
        $admin = $stmt->fetch();
        
        if (!$admin) {
            $stmt = $pdo->prepare("
                INSERT INTO users (username, password, role, created_at)
                VALUES (:username, :password, :role, NOW())
            ");
            $stmt->execute([
                ':username' => 'admin',
                ':password' => '777',
                ':role' => 'admin'
            ]);
        }
    } catch (PDOException $e) {
        // Silently fail - admin might already exist or table might not be ready
    }
}

// Check and create default admin user
ensureDefaultAdmin($pdo);

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get user by username for login
            if (isset($_GET['username'])) {
                $stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username");
                $stmt->execute([':username' => $_GET['username']]);
                $user = $stmt->fetch();
                echo json_encode($user ?: null);
            } else {
                // Get all users (without passwords)
                $stmt = $pdo->query("SELECT id, username, role, created_at FROM users ORDER BY id DESC");
                $users = $stmt->fetchAll();
                echo json_encode($users);
            }
            break;

        case 'POST':
            // Create new user
            $data = json_decode(file_get_contents('php://input'), true);
            $username = $data['username'] ?? '';
            $password = $data['password'] ?? '';
            $role = $data['role'] ?? 'user';
            
            $stmt = $pdo->prepare("
                INSERT INTO users (username, password, role, created_at)
                VALUES (:username, :password, :role, NOW())
                RETURNING id, username, role, created_at
            ");
            
            $stmt->execute([
                ':username' => $username,
                ':password' => $password,
                ':role' => $role
            ]);
            
            $result = $stmt->fetch();
            http_response_code(201);
            echo json_encode($result);
            break;

        case 'PUT':
            // Update user
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
            
            $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id RETURNING id, username, role, created_at";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($values);
            $result = $stmt->fetch();
            
            echo json_encode($result);
            break;

        case 'DELETE':
            // Delete user
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = $data['userId'] ?? null;
            
            if (!$userId) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID is required']);
                exit();
            }
            
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
            $stmt->execute([':id' => $userId]);
            
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

