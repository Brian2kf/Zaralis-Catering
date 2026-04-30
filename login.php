<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/helpers/session.php';

session_init();

// Jika sudah login, redirect sesuai role
if (is_logged_in()) {
    $dest = is_admin() ? APP_URL . '/admin/index.php' : APP_URL . '/index.php';
    header('Location: ' . $dest);
    exit;
}

$csrfToken = csrf_token();
?>
<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login -
        <?= htmlspecialchars(APP_NAME) ?>
    </title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600;700&display=swap"
        rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="css/custom.css">
    <link rel="stylesheet" href="css/pages/auth.css">
</head>

<body class="auth-page">
    <div class="auth-bg-decor-1"></div>
    <div class="auth-bg-decor-2"></div>

    <div class="auth-card">
        <div class="auth-header">
            <h1 class="auth-title">
                <?= htmlspecialchars(APP_NAME) ?>
            </h1>
            <p class="text-muted mb-0">Selamat datang kembali</p>
        </div>

        <div class="auth-tabs">
            <a href="login.php" class="auth-tab active">Login</a>
            <a href="register.php" class="auth-tab">Daftar</a>
        </div>

        <div class="auth-body">

            <!-- Alert error / success (diisi oleh JS) -->
            <div id="alertBox" class="alert d-none mb-3" role="alert"></div>

            <form id="loginForm" novalidate>
                <!-- CSRF token tersembunyi -->
                <input type="hidden" id="csrfToken" value="<?= htmlspecialchars($csrfToken) ?>">

                <div class="mb-3">
                    <label class="form-label small fw-bold text-dark mb-1">Email</label>
                    <div class="auth-input-group">
                        <span class="material-symbols-outlined auth-input-icon">mail</span>
                        <input type="email" class="form-control auth-input py-2" id="email" name="email"
                            placeholder="contoh@email.com" autocomplete="email" required>
                    </div>
                </div>

                <div class="mb-4">
                    <label class="form-label small fw-bold text-dark mb-1">Password</label>
                    <div class="auth-input-group">
                        <span class="material-symbols-outlined auth-input-icon">lock</span>
                        <input type="password" class="form-control auth-input py-2" id="password" name="password"
                            placeholder="Password" autocomplete="current-password" required>
                    </div>
                </div>

                <button type="submit" id="btnLogin"
                    class="btn btn-primary-custom w-100 py-3 fw-bold rounded-3 shadow-sm mb-4">
                    MASUK
                </button>

                <div class="text-center">
                    <p class="small text-muted mb-2">
                        Belum punya akun?
                        <a href="register.php" class="text-primary-custom fw-bold text-decoration-none">Daftar</a>
                    </p>
                    <a href="index.php"
                        class="small text-muted text-decoration-none d-inline-flex align-items-center gap-1">
                        <span class="material-symbols-outlined" style="font-size:16px;">arrow_back</span>
                        Kembali ke Beranda
                    </a>
                </div>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        document.getElementById('loginForm').addEventListener('submit', async function (e) {
            e.preventDefault();

            const btn = document.getElementById('btnLogin');
            const alertBox = document.getElementById('alertBox');
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const csrfToken = document.getElementById('csrfToken').value;

            // Validasi sisi klien
            if (!email || !password) {
                showAlert('danger', 'Email dan password wajib diisi.');
                return;
            }

            // Loading state
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memproses...';
            alertBox.classList.add('d-none');

            try {
                const res = await fetch('api/auth/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, csrf_token: csrfToken }),
                });
                const data = await res.json();

                if (data.success) {
                    showAlert('success', data.message);
                    setTimeout(() => { window.location.href = data.redirect; }, 800);
                } else {
                    showAlert('danger', data.message);
                    btn.disabled = false;
                    btn.innerHTML = 'MASUK';
                }
            } catch (err) {
                showAlert('danger', 'Terjadi kesalahan jaringan. Silakan coba lagi.');
                btn.disabled = false;
                btn.innerHTML = 'MASUK';
            }
        });

        function showAlert(type, message) {
            const box = document.getElementById('alertBox');
            box.className = `alert alert-${type} mb-3`;
            box.textContent = message;
        }
    </script>
</body>

</html>