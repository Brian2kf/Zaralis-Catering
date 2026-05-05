<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../helpers/session.php';
session_init();
require_admin();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Chat - Admin Dashboard</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600;700&display=swap" rel="stylesheet">
    <!-- Material Symbols -->
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../css/custom.css">
    <link rel="stylesheet" href="../css/admin.css">
    <style>
        .chat-container {
            height: calc(100vh - 150px);
            min-height: 500px;
        }
        .session-list {
            overflow-y: auto;
            border-right: 1px solid #dee2e6;
        }
        .session-item {
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .session-item:hover, .session-item.active {
            background-color: #f8f9fa;
        }
        .chat-area {
            display: flex;
            flex-direction: column;
            background-color: #f8f9fa;
        }
        .chat-messages {
            flex-grow: 1;
            overflow-y: auto;
            padding: 1rem;
        }
        .chat-bubble {
            max-width: 75%;
            padding: 10px 14px;
            border-radius: 14px;
            font-size: 0.95rem;
            margin-bottom: 8px;
            word-break: break-word;
        }
        .chat-bubble-admin {
            background-color: #d1e8dd;
            color: #1b4332;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
        }
        .chat-bubble-customer {
            background-color: #ffffff;
            border: 1px solid #e9ecef;
            color: #333;
            align-self: flex-start;
            border-bottom-left-radius: 4px;
        }
        .chat-time {
            font-size: 0.75rem;
            color: #888;
            margin-top: 4px;
            display: block;
        }
        .chat-bubble-admin .chat-time {
            text-align: right;
            color: rgba(27, 67, 50, 0.7);
        }
    </style>
</head>
<body class="admin-body">
    <!-- Mobile Header -->
    <div class="d-md-none bg-white border-bottom p-3 d-flex justify-content-between align-items-center w-100 position-fixed top-0 z-3">
        <div class="d-flex align-items-center gap-2">
            <button class="btn btn-link text-dark p-0" id="sidebarToggle">
                <span class="material-symbols-outlined fs-2">menu</span>
            </button>
            <h1 class="h5 fw-bold mb-0" style="font-family: 'Outfit', sans-serif;">Zarali's</h1>
        </div>
    </div>

    <!-- Sidebar Placeholder -->
    <div id="admin-sidebar-placeholder"></div>

    <!-- Main Content -->
    <main class="admin-main mt-5 mt-md-0">
        <div class="d-flex justify-content-between align-items-end mb-4">
            <div>
                <h2 class="display-6 fw-bold text-dark tracking-tight mb-1" style="font-family: 'Outfit', sans-serif;">Live Chat</h2>
                <p class="text-muted mb-0">Kelola pesan dari pelanggan</p>
            </div>
        </div>

        <div class="content-card p-0 overflow-hidden chat-container d-flex flex-column flex-md-row">
            <!-- Left Panel: Session List -->
            <div class="col-12 col-md-4 session-list bg-white d-flex flex-column h-100" id="session-panel">
                <div class="p-3 border-bottom bg-light">
                    <h5 class="mb-0 fw-bold fs-6">Obrolan Aktif</h5>
                </div>
                <div id="chat-session-list" class="flex-grow-1 overflow-auto">
                    <div class="text-center py-4 text-muted small">Memuat sesi chat...</div>
                </div>
            </div>

            <!-- Right Panel: Chat Area -->
            <div class="col-12 col-md-8 chat-area h-100 d-none d-md-flex flex-column position-relative" id="chat-panel">
                <!-- Mobile back button to sessions -->
                <div class="d-md-none p-2 border-bottom bg-white d-flex align-items-center gap-2">
                    <button class="btn btn-sm btn-light" id="btn-back-to-sessions">
                        <span class="material-symbols-outlined align-middle">arrow_back</span> Kembali
                    </button>
                    <span class="fw-bold" id="mobile-chat-title">Chat</span>
                </div>

                <div class="p-3 border-bottom bg-white d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-0 fw-bold fs-6" id="chat-header-name">Pilih sesi chat</h5>
                        <small class="text-muted" id="chat-header-email"></small>
                    </div>
                    <button id="btn-close-session" class="btn btn-sm btn-outline-danger d-none">
                        Tutup Sesi
                    </button>
                </div>
                
                <div class="chat-messages d-flex flex-column" id="chat-messages-container">
                    <div class="d-flex align-items-center justify-content-center h-100 text-muted">
                        Pilih pelanggan dari daftar di sebelah kiri untuk mulai mengobrol.
                    </div>
                </div>

                <div class="p-3 bg-white border-top d-none" id="chat-input-wrapper">
                    <form id="admin-chat-form" class="d-flex gap-2">
                        <input type="text" id="admin-chat-input" class="form-control" placeholder="Ketik pesan balasan..." autocomplete="off">
                        <button type="submit" class="btn btn-primary-custom d-flex align-items-center gap-1">
                            <span>Kirim</span>
                            <span class="material-symbols-outlined fs-6">send</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="../js/admin.js"></script>
    <script src="../js/admin/chat.js"></script>
</body>
</html>
