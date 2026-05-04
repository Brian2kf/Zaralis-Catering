<?php
require_once 'config/database.php';
$db = Database::getInstance();
echo "Tables:\n";
$stmt = $db->query('SHOW TABLES');
print_r($stmt->fetchAll(PDO::FETCH_COLUMN));

echo "\nUsers Schema:\n";
$stmt = $db->query('DESCRIBE users');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "\nAddresses Table Schema:\n";
try {
    $stmt = $db->query('DESCRIBE addresses');
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "addresses table does not exist.\n";
}
