-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 01, 2026 at 06:32 AM
-- Server version: 8.4.3
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `zaralis_catering`
--

-- --------------------------------------------------------

--
-- Table structure for table `addresses`
--

CREATE TABLE `addresses` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `street_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `house_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rt` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rw` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kelurahan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kecamatan` enum('Beji','Bojongsari','Cilodong','Cimanggis','Cinere','Cipayung','Limo','Pancoran Mas','Sawangan','Sukmajaya','Tapos') COLLATE utf8mb4_unicode_ci NOT NULL,
  `postal_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `landmark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_main` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `business_settings`
--

CREATE TABLE `business_settings` (
  `id` int UNSIGNED NOT NULL,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `business_settings`
--

INSERT INTO `business_settings` (`id`, `setting_key`, `setting_value`, `updated_at`) VALUES
(1, 'business_name', 'Zarali\'s Catering', '2026-04-30 07:50:56'),
(2, 'business_phone', '08123456789', '2026-04-30 07:50:56'),
(3, 'business_address', 'Kota Depok, Jawa Barat', '2026-04-30 07:50:56'),
(4, 'bank_name', 'BCA', '2026-04-30 07:50:56'),
(5, 'bank_account', '8921234567', '2026-04-30 07:50:56'),
(6, 'bank_holder', 'Zarali', '2026-04-30 07:50:56'),
(7, 'shipping_rate_per_km', '7000', '2026-04-30 07:50:56'),
(8, 'origin_latitude', '-6.3683159', '2026-04-30 07:50:56'),
(9, 'origin_longitude', '106.8461364', '2026-04-30 07:50:56');

-- --------------------------------------------------------

--
-- Table structure for table `financial_transactions`
--

CREATE TABLE `financial_transactions` (
  `id` int UNSIGNED NOT NULL,
  `order_id` int UNSIGNED DEFAULT NULL,
  `type` enum('income','expense') COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `receipt_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int UNSIGNED NOT NULL,
  `order_number` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int UNSIGNED DEFAULT NULL,
  `customer_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending_payment','pending_verification','processing','shipped','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_payment',
  `subtotal` decimal(12,2) NOT NULL,
  `shipping_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL,
  `shipping_distance_km` decimal(8,2) NOT NULL,
  `delivery_street` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_house_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_rt` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_rw` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_kelurahan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_kecamatan` enum('Beji','Bojongsari','Cilodong','Cimanggis','Cinere','Cipayung','Limo','Pancoran Mas','Sawangan','Sukmajaya','Tapos') COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_postal_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_landmark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dest_latitude` decimal(10,7) NOT NULL,
  `dest_longitude` decimal(10,7) NOT NULL,
  `delivery_date` date NOT NULL,
  `delivery_time` time NOT NULL,
  `order_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `user_id`, `customer_name`, `customer_email`, `customer_phone`, `status`, `subtotal`, `shipping_cost`, `total_amount`, `shipping_distance_km`, `delivery_street`, `delivery_house_number`, `delivery_rt`, `delivery_rw`, `delivery_kelurahan`, `delivery_kecamatan`, `delivery_postal_code`, `delivery_landmark`, `dest_latitude`, `dest_longitude`, `delivery_date`, `delivery_time`, `order_notes`, `created_at`, `updated_at`) VALUES
(5, 'CTR-20260501-0001', NULL, 'Budi Santoso', 'brianjonatan95@gmail.com', '081234567890', 'pending_verification', 350000.00, 42000.00, 392000.00, 5.35, 'Kampus D Universitas Gunadarma', 'No. 100', '', '', 'Pondok Cina', 'Beji', '', '', -6.3684936, 106.8331522, '2026-05-04', '02:27:00', '', '2026-04-30 19:27:51', '2026-05-01 05:53:09'),
(6, 'CTR-20260501-0002', NULL, 'Budi Santoso', 'brianjonatan95@gmail.com', '081234567890', 'pending_payment', 90000.00, 42000.00, 132000.00, 5.35, 'Kampus D Universitas Gunadarma', 'No. 100', '', '', 'Pondok Cina', 'Beji', '', '', -6.3684936, 106.8331522, '2026-05-04', '03:13:00', '', '2026-04-30 20:13:43', '2026-04-30 20:13:43'),
(7, 'CTR-20260501-0003', NULL, 'Budi Santoso', 'brianjonatan95@gmail.com', '081234567890', 'pending_payment', 350000.00, 37800.00, 387800.00, 5.35, 'Kampus D Universitas Gunadarma', 'No. 100', '', '', 'Pondok Cina', 'Beji', '', '', -6.3684936, 106.8331522, '2026-05-04', '03:22:00', '', '2026-04-30 20:23:32', '2026-04-30 20:23:32');

-- --------------------------------------------------------

--
-- Table structure for table `order_counter`
--

CREATE TABLE `order_counter` (
  `counter_date` date NOT NULL,
  `last_counter` smallint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_counter`
--

INSERT INTO `order_counter` (`counter_date`, `last_counter`) VALUES
('2026-05-01', 3);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int UNSIGNED NOT NULL,
  `order_id` int UNSIGNED NOT NULL,
  `product_id` int UNSIGNED DEFAULT NULL,
  `product_name_snapshot` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_price_snapshot` decimal(12,2) NOT NULL,
  `quantity` smallint NOT NULL DEFAULT '1',
  `subtotal` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name_snapshot`, `product_price_snapshot`, `quantity`, `subtotal`) VALUES
(1, 5, 1, 'KUE TAMPAH UKURAN SEDANG', 350000.00, 1, 350000.00),
(2, 7, 3, 'KUE TAMPAH JAJAN PASAR', 350000.00, 1, 350000.00);

-- --------------------------------------------------------

--
-- Table structure for table `order_packages`
--

CREATE TABLE `order_packages` (
  `id` int UNSIGNED NOT NULL,
  `order_id` int UNSIGNED NOT NULL,
  `package_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` tinyint NOT NULL DEFAULT '1',
  `package_price` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_packages`
--

INSERT INTO `order_packages` (`id`, `order_id`, `package_name`, `quantity`, `package_price`) VALUES
(1, 6, 'Paket 1', 10, 9000.00);

-- --------------------------------------------------------

--
-- Table structure for table `order_package_items`
--

CREATE TABLE `order_package_items` (
  `id` int UNSIGNED NOT NULL,
  `order_package_id` int UNSIGNED NOT NULL,
  `product_id` int UNSIGNED DEFAULT NULL,
  `product_name_snapshot` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_price_snapshot` decimal(12,2) NOT NULL,
  `quantity` tinyint NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_package_items`
--

INSERT INTO `order_package_items` (`id`, `order_package_id`, `product_id`, `product_name_snapshot`, `product_price_snapshot`, `quantity`) VALUES
(1, 1, 23, 'BOLU KUKUS GULA MERAH', 3000.00, 1),
(2, 1, 5, 'KLEPON', 3000.00, 1),
(3, 1, 31, 'PIE BUAH', 3000.00, 1);

-- --------------------------------------------------------

--
-- Table structure for table `order_status_logs`
--

CREATE TABLE `order_status_logs` (
  `id` int UNSIGNED NOT NULL,
  `order_id` int UNSIGNED NOT NULL,
  `old_status` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `changed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_status_logs`
--

INSERT INTO `order_status_logs` (`id`, `order_id`, `old_status`, `new_status`, `changed_by`, `notes`, `changed_at`) VALUES
(1, 5, 'pending_payment', 'pending_verification', 'system', 'Pelanggan mengunggah bukti pembayaran', '2026-05-01 05:53:09');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int UNSIGNED NOT NULL,
  `order_id` int UNSIGNED NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('uploaded','verified','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'uploaded',
  `verified_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `verified_at` timestamp NULL DEFAULT NULL,
  `admin_notes` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `order_id`, `file_path`, `status`, `verified_by`, `uploaded_at`, `verified_at`, `admin_notes`) VALUES
(1, 5, 'uploads/payments/CTR-20260501-0001_1777614789.png', 'uploaded', NULL, '2026-05-01 05:53:09', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(12,2) NOT NULL,
  `category` enum('kue_satuan','paket_besar') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `price`, `category`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Kue Tampah Ukuran Sedang', 'Berbagai macam kue campuran (Pie Buah, Apem Jawa, Onde Onde, Sus Eclair, Kue Ku/Thok)', 350000.00, 'paket_besar', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(2, 'Kue Nampan Ukuran Besar', 'Kue dengan berbagai macam aneka rasa', 130000.00, 'paket_besar', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(3, 'Kue Tampah Jajan Pasar', 'Berbagai macam kue olahan singkong dan beras ketan', 350000.00, 'paket_besar', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(4, 'Puding Telur Ceplok', 'Puding dengan berbentuk telur ceplok dari ager ager dan nutrijel', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(5, 'Klepon', 'Tepung ketan dengan isian gula merah dan taburan kelapa parut', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(6, 'Klappetart', 'Perpaduan antara tepung maizena, kelapa muda, kismis, kacang almond dan kayu manis', 5000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(7, 'Kue Bugis Ketan Hitam', 'Tepung ketan hitam dengan isian unti kelapa gula putih', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(8, 'Pie Brownies', 'Pie dengan isian brownies manis didalam nya', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(9, 'Lapis Cokelat', 'Olahan tepung beras, santan dan cokelat bubuk', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(10, 'Talam Gurih', 'Tepung beras yg diolah dengan santen dan ebi dan abon', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(11, 'Apem Jawa', 'Perpaduan antara tepung beras dan tape singkong, dan dihias dengan potongan nangka diatasnya', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(12, 'Lapis Pepe', 'Tepung sagu diolah dengan santan dan susu kental manis', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(13, 'Cream Cheese', 'Vla berpadu dengan keju parut, selai blueberry dan nutrijel', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(14, 'Kue Ku/Thok', 'Tepung ketan dengan isian kacang hijau kupas', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(15, 'Talam Ubi', 'Olahan ubi perpaduan antara santen dan tepung beras', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(16, 'Onde Onde', 'Onde onde isian kacang hijau kupas dibalut dengan wijen', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(17, 'Panada', 'Panada dengan isian cakalang pedas manis', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(18, 'Semar Mendem', 'Adonan ketan putih diisi dengan ayam suir manis gurih', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(19, 'Sus Bunga', 'Sus berbentuk bunga dengan isi vla dan perpaduan antar ptongan buah', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(20, 'Singkong Pelangi', 'Adonan singkong dengan perpaduan warna warni yang terbalut dengan kelapa parut', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(21, 'Sus Eclair', 'Sus isi vla dengan krim coklat diatasnya', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(22, 'Kue Lumpur Kentang', 'Kue Lumpur terbuat dari olahan kentang', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(23, 'Bolu Kukus Gula Merah', 'Bolu kukus perpaduan antara gula merah dan susu kental manis', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(24, 'Pastel', 'Pastel dengan isi sayuran kentang wortel dan irisan telur rebus', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(25, 'Arem Arem', 'Arem arem isi sayuran, kentang, wortel dan ayam suir serta cabe rawit hijau', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(26, 'Risol Mayonnaise', 'Risol dengan isi mayonnaise, keju parut, daging asap dan irisan telur rebus', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(27, 'Sosis Solo', 'Sosis solo dengan isi ayam suir manis gurih', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(28, 'Risol Ragout', 'Risoles dengan isi ragout ayam dengan sayuran kentang dan wortel', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(29, 'Risoles Segita Ikan Cakalang', 'Risoles segitiga dengan isi ikan cakalang pedas manis', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(30, 'Lemper Bakar', 'Lemper bakar isi ayam suir manis gurih', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34'),
(31, 'Pie Buah', 'Pie Buah kue manis dengan isi vla dan aneka potongan buah', 3000.00, 'kue_satuan', 1, '2026-04-30 13:06:34', '2026-04-30 13:06:34');

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

CREATE TABLE `product_images` (
  `id` int UNSIGNED NOT NULL,
  `product_id` int UNSIGNED NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `file_path`, `is_primary`, `sort_order`) VALUES
(1, 1, 'assets/images/KUE TAMPAH UKURAN SEDANG.jpg', 1, 0),
(2, 2, 'assets/images/KUE TAMPAH UKURAN BESAR.jpg', 1, 0),
(3, 3, 'assets/images/KUE TAMPAH JAJAN PASAR.jpg', 1, 0),
(4, 4, 'assets/images/PUDING TELUR CEPLOK.jpg', 1, 0),
(5, 5, 'assets/images/KLEPON.jpg', 1, 0),
(6, 6, 'assets/images/KLAPPETART.jpg', 1, 0),
(7, 7, 'assets/images/KUE BUGIS KETAN HITAM.jpg', 1, 0),
(8, 8, 'assets/images/PIE BROWNIES.jpg', 1, 0),
(9, 9, 'assets/images/LAPIS COKELAT.jpg', 1, 0),
(10, 10, 'assets/images/TALAM GURIH.jpg', 1, 0),
(11, 11, 'assets/images/APEM JAWA.jpg', 1, 0),
(12, 12, 'assets/images/LAPIS PEPE.jpg', 1, 0),
(13, 13, 'assets/images/CREAM CHEESE.jpg', 1, 0),
(14, 14, 'assets/images/KUE KU-THOK.jpg', 1, 0),
(15, 15, 'assets/images/TALAM UBI.jpg', 1, 0),
(16, 16, 'assets/images/ONDE ONDE.jpg', 1, 0),
(17, 17, 'assets/images/PANADA.jpg', 1, 0),
(18, 18, 'assets/images/SEMAR MENDEM.jpg', 1, 0),
(19, 19, 'assets/images/SUS BUNGA.jpg', 1, 0),
(20, 20, 'assets/images/SINGKONG PELANGI.jpg', 1, 0),
(21, 21, 'assets/images/SUS ECLAIR.jpg', 1, 0),
(22, 22, 'assets/images/KUE LUMPUR KENTANG.jpg', 1, 0),
(23, 23, 'assets/images/BOLU KUKUS GULA MERAH.jpg', 1, 0),
(24, 24, 'assets/images/PASTEL.jpg', 1, 0),
(25, 25, 'assets/images/AREM AREM.jpg', 1, 0),
(26, 26, 'assets/images/RISOL MAYONNAISE.jpg', 1, 0),
(27, 27, 'assets/images/SOSIS SOLO.jpg', 1, 0),
(28, 28, 'assets/images/RISOL RAGOUT.jpg', 1, 0),
(29, 29, 'assets/images/RISOLES SEGITA IKAN CAKALANG.jpg', 1, 0),
(30, 30, 'assets/images/LEMPER BAKAR.jpg', 1, 0),
(31, 31, 'assets/images/PIE BUAH.jpg', 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int UNSIGNED NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('customer','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password_hash`, `phone`, `role`, `created_at`, `updated_at`) VALUES
(1, 'Brian', 'Jonathan', 'brianjonatan95@gmail.com', '$2y$12$W8eGiTp4IP1okXlKbANeXe3swocqN0aPkPn408jDn3ux5hvt4fDnq', '089659595969', 'customer', '2026-04-30 08:32:12', '2026-04-30 08:40:59'),
(2, 'Admin', 'Zaralis', 'admin@zaralis.com', '$2y$12$GINJLfNKznl/9Y2RF0FiTODc68fRhWZ65UHm7TWyFBWLXnHhvNXdS', '08123456789', 'admin', '2026-04-30 08:41:40', '2026-04-30 08:41:50');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addresses`
--
ALTER TABLE `addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_addr_user` (`user_id`);

--
-- Indexes for table `business_settings`
--
ALTER TABLE `business_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `idx_settings_key` (`setting_key`);

--
-- Indexes for table `financial_transactions`
--
ALTER TABLE `financial_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_fin_type` (`type`),
  ADD KEY `idx_fin_date` (`transaction_date`),
  ADD KEY `idx_fin_order` (`order_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `idx_orders_user` (`user_id`),
  ADD KEY `idx_orders_status` (`status`),
  ADD KEY `idx_orders_email` (`customer_email`),
  ADD KEY `idx_orders_number` (`order_number`),
  ADD KEY `idx_orders_delivery` (`delivery_date`);

--
-- Indexes for table `order_counter`
--
ALTER TABLE `order_counter`
  ADD PRIMARY KEY (`counter_date`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_item_product` (`product_id`),
  ADD KEY `idx_item_order` (`order_id`);

--
-- Indexes for table `order_packages`
--
ALTER TABLE `order_packages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pkg_order` (`order_id`);

--
-- Indexes for table `order_package_items`
--
ALTER TABLE `order_package_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_pkgitem_product` (`product_id`),
  ADD KEY `idx_pkgitem_pkg` (`order_package_id`);

--
-- Indexes for table `order_status_logs`
--
ALTER TABLE `order_status_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_log_order` (`order_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_payment_order` (`order_id`),
  ADD KEY `idx_payment_status` (`status`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_products_category` (`category`),
  ADD KEY `idx_products_is_active` (`is_active`);

--
-- Indexes for table `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_img_product` (`product_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_role` (`role`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addresses`
--
ALTER TABLE `addresses`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `business_settings`
--
ALTER TABLE `business_settings`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `financial_transactions`
--
ALTER TABLE `financial_transactions`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `order_packages`
--
ALTER TABLE `order_packages`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `order_package_items`
--
ALTER TABLE `order_package_items`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `order_status_logs`
--
ALTER TABLE `order_status_logs`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `addresses`
--
ALTER TABLE `addresses`
  ADD CONSTRAINT `fk_addr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `financial_transactions`
--
ALTER TABLE `financial_transactions`
  ADD CONSTRAINT `fk_fin_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_item_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_item_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_packages`
--
ALTER TABLE `order_packages`
  ADD CONSTRAINT `fk_pkg_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_package_items`
--
ALTER TABLE `order_package_items`
  ADD CONSTRAINT `fk_pkgitem_pkg` FOREIGN KEY (`order_package_id`) REFERENCES `order_packages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pkgitem_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_status_logs`
--
ALTER TABLE `order_status_logs`
  ADD CONSTRAINT `fk_log_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_img_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
