<?php
// ============================================================
// helpers/session.php
// Fungsi-fungsi helper untuk autentikasi & session
// ============================================================

require_once __DIR__ . '/../config/config.php';

// -------------------------------------------------------
// Inisialisasi session dengan pengaturan yang aman
// Panggil ini DI PALING ATAS setiap file PHP yang butuh session
// -------------------------------------------------------
function session_init(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_name(SESSION_NAME);
        session_set_cookie_params([
            'lifetime' => SESSION_LIFETIME,
            'path'     => '/',
            'secure'   => false,   // set true jika pakai HTTPS
            'httponly' => true,    // lindungi dari XSS
            'samesite' => 'Lax',
        ]);
        session_start();
    }
}

// -------------------------------------------------------
// Simpan data user ke session setelah login berhasil
// -------------------------------------------------------
function session_login(array $user): void
{
    session_regenerate_id(true); // cegah session fixation attack
    $_SESSION['user_id']   = $user['id'];
    $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
    $_SESSION['user_email']= $user['email'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['logged_in'] = true;
    $_SESSION['login_at']  = time();
}

// -------------------------------------------------------
// Hapus session (logout)
// -------------------------------------------------------
function session_logout(): void
{
    session_init();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 3600,
            $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

// -------------------------------------------------------
// Cek apakah user sudah login
// -------------------------------------------------------
function is_logged_in(): bool
{
    session_init();
    return !empty($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
}

// -------------------------------------------------------
// Cek apakah user yang login adalah admin
// -------------------------------------------------------
function is_admin(): bool
{
    return is_logged_in() && strtolower($_SESSION['user_role'] ?? '') === 'admin';
}

// -------------------------------------------------------
// Ambil data user dari session
// -------------------------------------------------------
function current_user(): array
{
    if (!is_logged_in()) return [];
    return [
        'id'    => $_SESSION['user_id']    ?? null,
        'name'  => $_SESSION['user_name']  ?? '',
        'email' => $_SESSION['user_email'] ?? '',
        'role'  => $_SESSION['user_role']  ?? '',
    ];
}

// -------------------------------------------------------
// Paksa redirect jika belum login (untuk halaman protected)
// -------------------------------------------------------
function require_login(string $redirect = '/login.php'): void
{
    if (!is_logged_in()) {
        header('Location: ' . APP_URL . $redirect);
        exit;
    }
}

// -------------------------------------------------------
// Paksa redirect jika bukan admin
// -------------------------------------------------------
function require_admin(): void
{
    if (!is_admin()) {
        header('Location: ' . APP_URL . '/index.php');
        exit;
    }
}

// -------------------------------------------------------
// CSRF Token — generate & simpan ke session
// -------------------------------------------------------
function csrf_token(): string
{
    session_init();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// -------------------------------------------------------
// Verifikasi CSRF token dari form submission
// -------------------------------------------------------
function csrf_verify(string $token): bool
{
    session_init();
    $stored = $_SESSION['csrf_token'] ?? '';
    return hash_equals($stored, $token);
}

// -------------------------------------------------------
// Flash message — simpan pesan sekali pakai ke session
// -------------------------------------------------------
function flash_set(string $type, string $message): void
{
    session_init();
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function flash_get(): ?array
{
    session_init();
    if (!empty($_SESSION['flash'])) {
        $flash = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $flash;
    }
    return null;
}
