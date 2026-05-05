<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/session.php';
require_once __DIR__ . '/helpers/admin_middleware.php';
session_init();

// Proteksi halaman pelanggan
require_login();

// Admin tidak boleh akses halaman publik pelanggan (Poin 2A)
redirect_admin_from_public();

$db = Database::getInstance();
$stmt = $db->prepare("SELECT first_name, last_name, email, phone FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

$fullName = htmlspecialchars($user['first_name'] . ' ' . $user['last_name']);
$firstName = htmlspecialchars($user['first_name']);
$lastName = htmlspecialchars($user['last_name']);
$email = htmlspecialchars($user['email']);
$phone = htmlspecialchars($user['phone']);

?><!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profil Saya - Zarali's Catering</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600;700&display=swap" rel="stylesheet">
    <!-- Material Symbols -->
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/custom.css">
    <link rel="stylesheet" href="css/pages/profile.css">
</head>
<body class="d-flex flex-column min-vh-100" style="background-color: #FFF8F0;">
    <!-- Navbar Placeholder -->
    <div id="navbar-placeholder"></div>

    <!-- Main Content -->
    <main class="container py-5 flex-grow-1">
        
        <!-- Profile Header -->
        <div class="profile-header-card d-flex align-items-center gap-4">
            <img src="https://ui-avatars.com/api/?name=<?= urlencode($fullName) ?>&background=fff&color=2D6A4F" alt="User Avatar" class="profile-avatar-large shadow-sm" id="profileHeaderAvatar">
            <div class="position-relative z-1">
                <h1 class="display-6 fw-bold mb-1" style="font-family: 'Outfit', sans-serif;" id="profileHeaderName"><?= $fullName ?></h1>
                <p class="mb-0 opacity-75 d-flex align-items-center gap-1">
                    <span class="material-symbols-outlined fs-6">mail</span>
                    <span id="profileHeaderEmail"><?= $email ?></span>
                </p>
            </div>
        </div>

        <div class="row g-4">
            <div class="col-lg-12">
                <!-- Toast Notification for Success -->
                <div class="toast-container position-fixed bottom-0 end-0 p-3">
                    <div id="profileToast" class="toast align-items-center text-bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
                        <div class="d-flex">
                            <div class="toast-body d-flex align-items-center gap-2">
                                <span class="material-symbols-outlined">check_circle</span>
                                <span id="toastMessage">Perubahan berhasil disimpan!</span>
                            </div>
                            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                        </div>
                    </div>
                </div>

                <!-- Detail Pelanggan Form -->
                <form id="profileForm" novalidate>
                    <div class="form-section">
                        <h2 class="form-section-title d-flex justify-content-between align-items-center">
                            <div>
                                <span class="material-symbols-outlined align-middle me-2 text-primary-custom">person</span>
                                Informasi Pribadi
                            </div>
                        </h2>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label for="firstName" class="form-label small fw-bold text-dark">Nama Depan *</label>
                                <input type="text" class="form-control bg-light-input py-2" id="firstName" placeholder="Nama Depan" value="<?= $firstName ?>" required>
                                <div class="invalid-feedback">Nama depan wajib diisi.</div>
                            </div>
                            <div class="col-md-6">
                                <label for="lastName" class="form-label small fw-bold text-dark">Nama Belakang *</label>
                                <input type="text" class="form-control bg-light-input py-2" id="lastName" placeholder="Nama Belakang" value="<?= $lastName ?>" required>
                                <div class="invalid-feedback">Nama belakang wajib diisi.</div>
                            </div>
                            <div class="col-md-6">
                                <label for="email" class="form-label small fw-bold text-dark">Email *</label>
                                <input type="email" class="form-control bg-light-input py-2" id="email" placeholder="email@contoh.com" value="<?= $email ?>" required disabled>
                                <small class="text-muted d-block mt-1">Email digunakan sebagai identitas utama akun dan tidak dapat diubah.</small>
                            </div>
                            <div class="col-md-6">
                                <label for="phone" class="form-label small fw-bold text-dark">No. WhatsApp / Telepon *</label>
                                <input type="tel" class="form-control bg-light-input py-2" id="phone" placeholder="08xx..." value="<?= $phone ?>" required>
                                <div class="invalid-feedback">Nomor telepon wajib diisi.</div>
                            </div>
                            <div class="col-12 mt-4 text-end">
                                <button type="submit" class="btn btn-primary-custom px-4 py-2 rounded-2 fw-semibold">
                                    Simpan Perubahan
                                </button>
                            </div>
                        </div>
                    </div>
                </form>

                <!-- Daftar Alamat Pengiriman -->
                <div class="form-section">
                    <h2 class="form-section-title d-flex justify-content-between align-items-center">
                        <div>
                            <span class="material-symbols-outlined align-middle me-2 text-primary-custom">location_on</span>
                            Alamat Pengiriman Tersimpan
                        </div>
                        <span class="badge bg-secondary rounded-pill" id="addressCountBadge">0/3</span>
                    </h2>
                    
                    <p class="text-muted small mb-4">Anda dapat menyimpan maksimal 3 alamat pengiriman untuk mempermudah proses checkout.</p>
                    
                    <div class="row g-3" id="addressCardsContainer">
                        <!-- Address cards will be dynamically injected here -->
                    </div>

                    <div id="addressLimitMessage" class="alert alert-info mt-3 d-none d-flex align-items-center gap-2">
                        <span class="material-symbols-outlined">info</span>
                        Anda telah mencapai batas maksimal 3 alamat. Hapus salah satu untuk menambah alamat baru.
                    </div>
                </div>

            </div>
        </div>
    </main>

    <!-- Address Modal -->
    <div class="modal fade" id="addressModal" tabindex="-1" aria-labelledby="addressModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content border-0 shadow">
                <div class="modal-header bg-light">
                    <h5 class="modal-title fw-bold" id="addressModalLabel" style="font-family: 'Outfit', sans-serif;">Tambah Alamat Baru</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <form id="addressForm" novalidate>
                        <input type="hidden" id="addressId">
                        <div class="row g-3">
                            <div class="col-12">
                                <label for="streetName" class="form-label small fw-bold text-dark">Nama Jalan / Alamat Tujuan *</label>
                                <input type="text" class="form-control bg-light-input py-2" id="streetName" placeholder="contoh: Jl. Margonda Raya, Perumahan Bukit Indah" required>
                                <div class="invalid-feedback">Nama jalan wajib diisi.</div>
                            </div>
                            <div class="col-md-6">
                                <label for="houseNumber" class="form-label small fw-bold text-dark">Nomor Rumah *</label>
                                <input type="text" class="form-control bg-light-input py-2" id="houseNumber" placeholder="contoh: No. 12A / Blok B3" required>
                                <div class="invalid-feedback">Nomor rumah wajib diisi.</div>
                            </div>
                            <div class="col-3">
                                <label for="rt" class="form-label small fw-bold text-dark">RT</label>
                                <input type="text" class="form-control bg-light-input py-2" id="rt" placeholder="0xx">
                                <div class="invalid-feedback">RT.</div>
                            </div>
                            <div class="col-3">
                                <label for="rw" class="form-label small fw-bold text-dark">RW</label>
                                <input type="text" class="form-control bg-light-input py-2" id="rw" placeholder="0xx">
                                <div class="invalid-feedback">RW.</div>
                            </div>
                            <div class="col-md-6">
                                <label for="kelurahan" class="form-label small fw-bold text-dark">Kelurahan *</label>
                                <input type="text" class="form-control bg-light-input py-2" id="kelurahan" placeholder="contoh: Kemiri Muka" required>
                                <div class="invalid-feedback">Kelurahan wajib diisi.</div>
                            </div>
                            <div class="col-md-6">
                                <label for="kecamatan" class="form-label small fw-bold text-dark">Kecamatan *</label>
                                <select class="form-select bg-light-input py-2" id="kecamatan" required>
                                    <option value="" selected disabled>Pilih Kecamatan</option>
                                    <option value="Beji">Beji</option>
                                    <option value="Bojongsari">Bojongsari</option>
                                    <option value="Cilodong">Cilodong</option>
                                    <option value="Cimanggis">Cimanggis</option>
                                    <option value="Cinere">Cinere</option>
                                    <option value="Cipayung">Cipayung</option>
                                    <option value="Limo">Limo</option>
                                    <option value="Pancoran Mas">Pancoran Mas</option>
                                    <option value="Sawangan">Sawangan</option>
                                    <option value="Sukmajaya">Sukmajaya</option>
                                    <option value="Tapos">Tapos</option>
                                </select>
                                <div class="invalid-feedback">Pilih kecamatan.</div>
                            </div>
                            <div class="col-md-6">
                                <label for="postalCode" class="form-label small fw-bold text-dark">Kode Pos</label>
                                <input type="text" class="form-control bg-light-input py-2" id="postalCode" placeholder="contoh: 16424">
                                <div class="invalid-feedback">Kode Pos.</div>
                            </div>
                            <div class="col-md-6">
                                <label for="landmark" class="form-label small fw-bold text-dark">Patokan Lokasi <span class="text-muted fw-normal">(opsional)</span></label>
                                <input type="text" class="form-control bg-light-input py-2" id="landmark" placeholder="contoh: Dekat Indomaret Margonda, sebelah kanan jalan">
                            </div>
                            <div class="col-12 mt-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="isMainAddress">
                                    <label class="form-check-label text-dark fw-medium" for="isMainAddress">
                                        Jadikan sebagai alamat utama
                                    </label>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer border-0 p-4 pt-0">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Batal</button>
                    <button type="button" class="btn btn-primary-custom px-4" id="btnSaveAddress">Simpan Alamat</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer Placeholder -->
    <div id="footer-placeholder"></div>

    <!-- Bootstrap 5 JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/app.js"></script>
    <script src="js/load-components.js"></script>
    <!-- Profile Page JS -->
    <script src="js/profile.js"></script>
</body>
</html>

