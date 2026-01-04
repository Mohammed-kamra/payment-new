<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get settings
            $stmt = $pdo->prepare("SELECT * FROM settings WHERE id = 1");
            $stmt->execute();
            $settings = $stmt->fetch();
            
            if ($settings) {
                // If data is stored as JSONB, decode it
                if (isset($settings['data']) && is_string($settings['data'])) {
                    $settings['data'] = json_decode($settings['data'], true);
                }
                echo json_encode($settings['data'] ?? $settings);
            } else {
                echo json_encode([]);
            }
            break;

        case 'POST':
        case 'PUT':
            // Update or create settings
            $data = json_decode(file_get_contents('php://input'), true);
            $jsonData = json_encode($data);
            
            $stmt = $pdo->prepare("
                INSERT INTO settings (id, data, updated_at)
                VALUES (1, :data::jsonb, NOW())
                ON CONFLICT (id) 
                DO UPDATE SET 
                    data = :data::jsonb,
                    updated_at = NOW()
                RETURNING *
            ");
            
            $stmt->execute([':data' => $jsonData]);
            $result = $stmt->fetch();
            
            echo json_encode($result);
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

