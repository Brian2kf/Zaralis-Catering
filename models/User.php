<?php
// ============================================================
// models/User.php
// Semua operasi database untuk tabel users & addresses
// ============================================================

require_once __DIR__ . '/../config/database.php';

class User
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // -------------------------------------------------------
    // Cari user berdasarkan email
    // -------------------------------------------------------
    public function findByEmail(string $email): array|false
    {
        $stmt = $this->db->prepare(
            'SELECT id, first_name, last_name, email, password_hash, phone, role
             FROM users WHERE email = ? LIMIT 1'
        );
        $stmt->execute([strtolower(trim($email))]);
        return $stmt->fetch();
    }

    // -------------------------------------------------------
    // Cari user berdasarkan ID
    // -------------------------------------------------------
    public function findById(int $id): array|false
    {
        $stmt = $this->db->prepare(
            'SELECT id, first_name, last_name, email, phone, role, created_at
             FROM users WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    // -------------------------------------------------------
    // Daftarkan user baru
    // Mengembalikan ID user yang baru dibuat, atau false jika gagal
    // -------------------------------------------------------
    public function create(array $data): int|false
    {
        // Cek email sudah terdaftar
        if ($this->findByEmail($data['email'])) {
            return false;
        }

        $stmt = $this->db->prepare(
            'INSERT INTO users (first_name, last_name, email, password_hash, phone, role)
             VALUES (:first_name, :last_name, :email, :password_hash, :phone, :role)'
        );

        $success = $stmt->execute([
            'first_name'    => trim($data['first_name']),
            'last_name'     => trim($data['last_name']),
            'email'         => strtolower(trim($data['email'])),
            'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]),
            'phone'         => trim($data['phone']),
            'role'          => 'customer',
        ]);

        if (!$success) return false;

        $newUserId = (int) $this->db->lastInsertId();

        // Fitur: klaim pesanan lama (guest pakai email yang sama)
        $this->claimGuestOrders($data['email'], $newUserId);

        return $newUserId;
    }

    // -------------------------------------------------------
    // Verifikasi password saat login
    // -------------------------------------------------------
    public function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    // -------------------------------------------------------
    // Update profil user
    // -------------------------------------------------------
    public function updateProfile(int $id, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE users
             SET first_name = :first_name,
                 last_name  = :last_name,
                 phone      = :phone
             WHERE id = :id'
        );
        return $stmt->execute([
            'first_name' => trim($data['first_name']),
            'last_name'  => trim($data['last_name']),
            'phone'      => trim($data['phone']),
            'id'         => $id,
        ]);
    }

    // -------------------------------------------------------
    // Klaim pesanan lama dari guest ke akun baru
    // Dipanggil otomatis saat register
    // -------------------------------------------------------
    private function claimGuestOrders(string $email, int $userId): void
    {
        $stmt = $this->db->prepare(
            'UPDATE orders
             SET user_id = :user_id
             WHERE customer_email = :email AND user_id IS NULL'
        );
        $stmt->execute([
            'user_id' => $userId,
            'email'   => strtolower(trim($email)),
        ]);
    }

    // -------------------------------------------------------
    // ALAMAT: ambil semua alamat milik user
    // -------------------------------------------------------
    public function getAddresses(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_main DESC, id ASC'
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    // -------------------------------------------------------
    // ALAMAT: tambah alamat baru (maks 3)
    // -------------------------------------------------------
    public function addAddress(int $userId, array $data): bool
    {
        // Cek batas maksimal 3 alamat
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM addresses WHERE user_id = ?'
        );
        $stmt->execute([$userId]);
        if ($stmt->fetchColumn() >= 3) {
            return false;
        }

        // Jika ini alamat pertama, jadikan utama
        $isMain = ($data['is_main'] ?? false) ? 1 : 0;

        // Jika is_main = 1, unset alamat utama yang lain dulu
        if ($isMain) {
            $this->db->prepare(
                'UPDATE addresses SET is_main = 0 WHERE user_id = ?'
            )->execute([$userId]);
        }

        $stmt = $this->db->prepare(
            'INSERT INTO addresses
             (user_id, street_name, house_number, rt, rw, kelurahan,
              kecamatan, postal_code, landmark, is_main)
             VALUES
             (:user_id, :street_name, :house_number, :rt, :rw, :kelurahan,
              :kecamatan, :postal_code, :landmark, :is_main)'
        );

        return $stmt->execute([
            'user_id'      => $userId,
            'street_name'  => trim($data['street_name']),
            'house_number' => trim($data['house_number']),
            'rt'           => trim($data['rt']),
            'rw'           => trim($data['rw']),
            'kelurahan'    => trim($data['kelurahan']),
            'kecamatan'    => $data['kecamatan'],
            'postal_code'  => trim($data['postal_code']),
            'landmark'     => trim($data['landmark'] ?? ''),
            'is_main'      => $isMain,
        ]);
    }

    // -------------------------------------------------------
    // ALAMAT: hapus alamat
    // -------------------------------------------------------
    public function deleteAddress(int $addressId, int $userId): bool
    {
        $stmt = $this->db->prepare(
            'DELETE FROM addresses WHERE id = ? AND user_id = ?'
        );
        return $stmt->execute([$addressId, $userId]);
    }
}
