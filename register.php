<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/helpers/session.php';

session_init();

if (is_logged_in()) {
    header('Location: ' . APP_URL . '/index.php');
    exit;
}

$csrfToken = csrf_token();
?>
<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daftar -
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
        <div class="auth-header" style="padding-bottom:1rem;">
            <h1 class="auth-title">
                <?= htmlspecialchars(APP_NAME) ?>
            </h1>
            <p class="text-muted mb-0">Buat akun untuk mulai memesan</p>
        </div>

        <div class="auth-tabs">
            <a href="login.php" class="auth-tab">Login</a>
            <a href="register.php" class="auth-tab active">Daftar</a>
        </div>

        <div class="auth-body">

            <div id="alertBox" class="alert d-none mb-3" role="alert"></div>

            <form id="registerForm" novalidate>
                <input type="hidden" id="csrfToken" value="<?= htmlspecialchars($csrfToken) ?>">

                <div class="mb-3">
                    <label class="form-label small fw-bold text-dark mb-1">Nama Depan</label>
                    <div class="auth-input-group">
                        <span class="material-symbols-outlined auth-input-icon">person</span>
                        <input type="text" class="form-control auth-input py-2" id="first_name" placeholder="Nama Depan"
                            required>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label small fw-bold text-dark mb-1">Nama Belakang</label>
                    <div class="auth-input-group">
                        <span class="material-symbols-outlined auth-input-icon">person</span>
                        <input type="text" class="form-control auth-input py-2" id="last_name"
                            placeholder="Nama Belakang" required>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label small fw-bold text-dark mb-1">Email</label>
                    <div class="auth-input-group">
                        <span class="material-symbols-outlined auth-input-icon">mail</span>
                        <input type="email" class="form-control auth-input py-2" id="email"
                            placeholder="contoh@email.com" autocomplete="email" required>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label small fw-bold text-dark mb-1">Nomor Telepon / WA</label>
                    <div class="auth-input-group">
                        <span class="material-symbols-outlined auth-input-icon">call</span>
                        <input type="tel" class="form-control auth-input py-2" id="phone" placeholder="08123456789"
                            required>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label small fw-bold text-dark mb-1">Password</label>
                    <div class="auth-input-group">
                        <span class="material-symbols-outlined auth-input-icon">lock</span>
                        <input type="password" class="form-control auth-input py-2" id="password"
                            placeholder="Minimal 8 karakter" autocomplete="new-password" required>
                    </div>
                </div>

                <!-- Password strength indicator -->
                <div class="mb-4">
                    <div class="progress" style="height:4px;">
                        <div id="strengthBar" class="progress-bar"
                            style="width:0%;transition:width .3s,background .3s;"></div>
                    </div>
                    <small id="strengthText" class="text-muted d-block mt-1"></small>
                </div>

                <button type="submit" id="btnRegister"
                    class="btn btn-primary-custom w-100 py-3 fw-bold rounded-3 shadow-sm mb-4">
                    DAFTAR SEKARANG
                </button>

                <div class="text-center">
                    <p class="small text-muted mb-2">
                        Sudah punya akun?
                        <a href="login.php" class="text-primary-custom fw-bold text-decoration-none">Login</a>
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
        // Password strength checker
        document.getElementById('password').addEventListener('input', function () {
            const val = this.value;
            const bar = document.getElementById('strengthBar');
            const txt = document.getElementById('strengthText');
            let score = 0;

            if (val.length >= 8) score++;
            if (/[A-Z]/.test(val)) score++;
            if (/[0-9]/.test(val)) score++;
            if (/[^A-Za-z0-9]/.test(val)) score++;

            const levels = [
                { w: '25%', bg: '#dc3545', label: 'Sangat lemah' },
                { w: '50%', bg: '#fd7e14', label: 'Lemah' },
                { w: '75%', bg: '#ffc107', label: 'Sedang' },
                { w: '100%', bg: '#2D6A4F', label: 'Kuat' },
            ];

            if (val.length === 0) {
                bar.style.width = '0%';
                txt.textContent = '';
            } else {
                const lvl = levels[score - 1] || levels[0];
                bar.style.width = lvl.w;
                bar.style.background = lvl.bg;
                txt.textContent = lvl.label;
            }
        });

        // Submit handler
        document.getElementById('registerForm').addEventListener('submit', async function (e) {
            e.preventDefault();

            const btn = document.getElementById('btnRegister');
            const alertBox = document.getElementById('alertBox');
            const first_name = document.getElementById('first_name').value.trim();
            const last_name = document.getElementById('last_name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const password = document.getElementById('password').value;
            const csrfToken = document.getElementById('csrfToken').value;

            // Validasi sisi klien
            if (!first_name || !last_name || !email || !phone || !password) {
                showAlert('danger', 'Semua field wajib diisi.');
                return;
            }
            if (password.length < 8) {
                showAlert('danger', 'Password minimal 8 karakter.');
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mendaftarkan...';
            alertBox.classList.add('d-none');

            try {
                const res = await fetch('api/auth/register.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ first_name, last_name, email, phone, password, csrf_token: csrfToken }),
                });
                const data = await res.json();

                if (data.success) {
                    showAlert('success', data.message);
                    setTimeout(() => { window.location.href = data.redirect; }, 800);
                } else {
                    showAlert('danger', data.message);
                    btn.disabled = false;
                    btn.innerHTML = 'DAFTAR SEKARANG';
                }
            } catch (err) {
                showAlert('danger', 'Terjadi kesalahan jaringan. Silakan coba lagi.');
                btn.disabled = false;
                btn.innerHTML = 'DAFTAR SEKARANG';
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