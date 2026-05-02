<?php
require 'config/database.php';
$db = Database::getInstance();
$stmt = $db->prepare('SELECT * FROM products WHERE id = ?');
$stmt->execute([25]);
print_r($stmt->fetch(PDO::FETCH_ASSOC));
