// js/admin/chat.js
document.addEventListener('DOMContentLoaded', () => {
    const sessionListEl = document.getElementById('chat-session-list');
    const messagesContainer = document.getElementById('chat-messages-container');
    const inputWrapper = document.getElementById('chat-input-wrapper');
    const chatForm = document.getElementById('admin-chat-form');
    const chatInput = document.getElementById('admin-chat-input');
    const headerName = document.getElementById('chat-header-name');
    const headerEmail = document.getElementById('chat-header-email');
    const btnCloseSession = document.getElementById('btn-close-session');
    
    // Mobile handling
    const sessionPanel = document.getElementById('session-panel');
    const chatPanel = document.getElementById('chat-panel');
    const btnBack = document.getElementById('btn-back-to-sessions');
    const mobileTitle = document.getElementById('mobile-chat-title');

    let currentSessionId = null;
    let lastMessageId = 0;
    let activeSessions = [];
    let pollInterval = null;

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const loadSessions = async () => {
        try {
            const res = await fetch('../api/admin/chat/sessions.php');
            const data = await res.json();
            
            if (data.success) {
                activeSessions = data.sessions;
                renderSessions();
            }
        } catch (e) {
            console.error('Error loading sessions', e);
        }
    };

    const renderSessions = () => {
        if (activeSessions.length === 0) {
            sessionListEl.innerHTML = '<div class="text-center py-4 text-muted small">Tidak ada obrolan aktif.</div>';
            return;
        }

        let html = '';
        activeSessions.forEach(session => {
            const isSelected = session.id === currentSessionId;
            const unreadBadge = session.unread_count > 0 ? `<span class="badge bg-danger rounded-pill">${session.unread_count}</span>` : '';
            const lastMsg = session.last_message || 'Belum ada pesan';
            
            html += `
                <div class="session-item p-3 border-bottom ${isSelected ? 'active' : ''}" data-id="${session.id}">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <strong class="text-truncate">${session.customer_name}</strong>
                        ${unreadBadge}
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted text-truncate d-block" style="max-width: 75%;">${lastMsg}</small>
                        <small class="text-muted" style="font-size: 0.7rem;">${formatTime(session.last_message_time)}</small>
                    </div>
                </div>
            `;
        });
        
        sessionListEl.innerHTML = html;

        // Attach events
        document.querySelectorAll('.session-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.getAttribute('data-id'));
                openSession(id);
            });
        });
    };

    const renderMessage = (msg) => {
        const isAdmin = msg.sender_type === 'admin';
        const bubbleClass = isAdmin ? 'chat-bubble-admin' : 'chat-bubble-customer';
        
        const div = document.createElement('div');
        div.className = `d-flex flex-column w-100`;
        div.innerHTML = `
            <div class="chat-bubble ${bubbleClass}">
                ${msg.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
                <span class="chat-time">${formatTime(msg.created_at)}</span>
            </div>
        `;
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        if (msg.id > lastMessageId) {
            lastMessageId = msg.id;
        }
    };

    const loadMessages = async (sessionId) => {
        try {
            const res = await fetch(`../api/admin/chat/messages.php?session_id=${sessionId}&last_id=${lastMessageId}`);
            const data = await res.json();
            
            if (data.success && data.messages.length > 0) {
                data.messages.forEach(renderMessage);
            }
        } catch (e) {
            console.error('Error loading messages', e);
        }
    };

    const openSession = (id) => {
        const session = activeSessions.find(s => s.id === id);
        if (!session) return;

        currentSessionId = id;
        lastMessageId = 0;
        
        // Update UI
        headerName.textContent = session.customer_name;
        headerEmail.textContent = session.customer_email || 'Guest';
        mobileTitle.textContent = session.customer_name;
        btnCloseSession.classList.remove('d-none');
        inputWrapper.classList.remove('d-none');
        messagesContainer.innerHTML = '';
        
        // Mobile panel switch
        if (window.innerWidth < 768) {
            sessionPanel.classList.add('d-none');
            sessionPanel.classList.remove('d-flex');
            chatPanel.classList.remove('d-none');
            chatPanel.classList.add('d-flex');
        }

        renderSessions(); // Re-render to show active state
        loadMessages(id);
    };

    btnBack?.addEventListener('click', () => {
        sessionPanel.classList.remove('d-none');
        sessionPanel.classList.add('d-flex');
        chatPanel.classList.add('d-none');
        chatPanel.classList.remove('d-flex');
        currentSessionId = null;
        renderSessions();
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = chatInput.value.trim();
        if (!msg || !currentSessionId) return;

        chatInput.value = '';
        chatInput.disabled = true;

        try {
            await fetch('../api/admin/chat/send.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: currentSessionId, message: msg })
            });
            await loadMessages(currentSessionId);
            loadSessions(); // update last message in sidebar
        } catch (e) {
            console.error('Send error', e);
        } finally {
            chatInput.disabled = false;
            chatInput.focus();
        }
    });

    btnCloseSession.addEventListener('click', async () => {
        if (!currentSessionId) return;
        if (!confirm('Apakah Anda yakin ingin menutup sesi obrolan ini?')) return;

        try {
            const res = await fetch('../api/admin/chat/close.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: currentSessionId })
            });
            const data = await res.json();
            
            if (data.success) {
                currentSessionId = null;
                headerName.textContent = 'Sesi Ditutup';
                headerEmail.textContent = '';
                btnCloseSession.classList.add('d-none');
                inputWrapper.classList.add('d-none');
                messagesContainer.innerHTML = '<div class="d-flex align-items-center justify-content-center h-100 text-muted">Sesi telah ditutup.</div>';
                loadSessions();
            }
        } catch (e) {
            console.error('Close error', e);
        }
    });

    const pollData = async () => {
        await loadSessions();
        if (currentSessionId) {
            await loadMessages(currentSessionId);
        }
    };

    // Initial load and poll every 3s
    pollData();
    pollInterval = setInterval(pollData, 3000);
});
