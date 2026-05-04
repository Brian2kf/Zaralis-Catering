<?php
// ============================================================
// helpers/admin_middleware.php
// Middleware untuk mencegah admin mengakses halaman publik pelanggan
// ============================================================

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/session.php';

// -------------------------------------------------------
// Redirect admin yang mencoba mengakses halaman publik
// ke dashboard admin
// -------------------------------------------------------
function redirect_admin_from_public(): void
{
    if (is_admin()) {
        header('Location: ' . APP_URL . '/admin/index.php');
        exit;
    }
}
