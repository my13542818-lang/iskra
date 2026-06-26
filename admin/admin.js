// ========================================
// admin.js — ОБЩИЕ ФУНКЦИИ ДЛЯ ВСЕХ СТРАНИЦ
// ========================================

// ========================================
// FIREBASE
// ========================================
const firebaseConfig = {
    apiKey: "AIzaSyBLN8XTBFl8cKWfnjsc0h_2ZSuZeKc7dhQ",
    authDomain: "kyki-5e91a.firebaseapp.com",
    projectId: "kyki-5e91a",
    storageBucket: "kyki-5e91a.firebasestorage.app",
    messagingSenderId: "315986487804",
    appId: "1:315986487804:web:29f131e8a57bffadac2a79",
    measurementId: "G-ETWXCGL9HK"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// ========================================
// STATE
// ========================================
let currentUser = null;
let userData = {};

// ========================================
// AUTH — ПРОВЕРКА ДОСТУПА
// ========================================
function checkAdminAccess() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = '../login.html';
                return reject();
            }

            const doc = await db.collection("users").doc(user.uid).get();
            userData = doc.data() || {};
            currentUser = user;

            if (userData.role !== 'admin') {
                document.body.innerHTML = `
                    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--bg-dark);color:var(--text-primary);text-align:center;padding:20px;">
                        <div>
                            <div style="font-size:64px;margin-bottom:16px;">⛔</div>
                            <h1 style="font-size:28px;margin-bottom:8px;">Доступ запрещён</h1>
                            <p style="color:var(--text-muted);margin-bottom:20px;">У вас нет прав администратора</p>
                            <a href="../index.html" class="btn btn-primary">На главную</a>
                        </div>
                    </div>
                `;
                return reject();
            }

            setupHeader();
            resolve();
        });
    });
}

// ========================================
// HEADER
// ========================================
function setupHeader() {
    const headerActions = document.getElementById('headerActions');
    if (!headerActions) return;

    headerActions.innerHTML = `
        <div class="balance-badge" onclick="window.location.href='../wallet.html'">💰 ${(userData.balance || 0).toLocaleString()} ₽</div>
        <div class="header-user" onclick="window.location.href='../profile/index.html'">
            <img src="${userData.photoURL || 'https://ui-avatars.com/api/?name=' + (userData.name || 'Admin') + '&background=6C3B8E&color=fff'}" class="avatar">
            <span class="name">👑 ${userData.name?.split(' ')[0] || 'Admin'}</span>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="auth.signOut().then(()=>window.location.href='../login.html')">🚪 Выйти</button>
    `;
}

// ========================================
// NAVIGATION
// ========================================
function setupNavigation() {
    const menuItems = document.querySelectorAll('.admin-sidebar .menu-item');
    const currentPage = window.location.pathname.split('/').pop();

    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href === currentPage) {
            item.classList.add('active');
        } else if (!href && currentPage === 'index.html' && item.dataset.tab === 'dashboard') {
            item.classList.add('active');
        }

        item.onclick = () => {
            if (item.getAttribute('href')) {
                window.location.href = item.getAttribute('href');
            }
        };
    });
}

// ========================================
// ADD LOG
// ========================================
async function addLog(userId, action, type = 'admin') {
    try {
        const safeUserId = userId || 'system';
        let userName = 'Система';

        if (userId && userId !== 'system') {
            try {
                const userDoc = await db.collection("users").doc(safeUserId).get();
                if (userDoc.exists) {
                    userName = userDoc.data().name || safeUserId;
                }
            } catch (e) {
                userName = safeUserId;
            }
        }

        await db.collection("logs").add({
            userId: safeUserId,
            userName: userName,
            action: action,
            type: type,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error adding log:', error);
    }
}

// ========================================
// NOTIFICATION
// ========================================
function showNotification(message, type = 'info') {
    document.querySelectorAll('.notification').forEach(el => el.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        setTimeout(() => notification.remove(), 300);
    }, 3500);
}

// ========================================
// UTILITY
// ========================================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
}

function getStatusText(status) {
    const map = {
        'pending': '⏳ Ожидает',
        'paid': '✅ Оплачен',
        'shipped': '🚚 Отправлен',
        'delivered': '📦 Доставлен',
        'completed': '🎉 Завершён',
        'cancelled': '❌ Отменён'
    };
    return map[status] || status;
}