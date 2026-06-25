// firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyBLN8XTBFl8cKWfnjsc0h_2ZSuZeKc7dhQ",
    authDomain: "kyki-5e91a.firebaseapp.com",
    projectId: "kyki-5e91a",
    storageBucket: "kyki-5e91a.firebasestorage.app",
    messagingSenderId: "315986487804",
    appId: "1:315986487804:web:29f131e8a57bffadac2a79",
    measurementId: "G-ETWXCGL9HK"
};

// Инициализация Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// ===== ИНИЦИАЛИЗАЦИЯ СЕРВИСОВ =====
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Включаем офлайн-поддержку (без предупреждений)
try {
    db.enablePersistence({ synchronizeTabs: true })
        .catch(err => {
            if (err.code === 'failed-precondition') {
                console.warn('Firestore persistence: multiple tabs open, persistence disabled');
            } else if (err.code === 'unimplemented') {
                console.warn('Firestore persistence: browser not supported');
            }
        });
} catch (e) {
    console.warn('Firestore persistence error:', e.message);
}

// ========================================
// ===== USER FUNCTIONS =====
// ========================================

const getCurrentUser = () => auth.currentUser;

const getUserData = async (uid) => {
    try {
        const doc = await db.collection("users").doc(uid).get();
        return doc.exists ? doc.data() : {};
    } catch (error) {
        console.error('Error getting user data:', error);
        return {};
    }
};

const updateUserData = async (uid, data) => {
    try {
        await db.collection("users").doc(uid).update(data);
        return true;
    } catch (error) {
        console.error('Error updating user data:', error);
        throw error;
    }
};

const createUser = async (uid, data) => {
    try {
        await db.collection("users").doc(uid).set({
            ...data,
            createdAt: new Date().toISOString(),
            balance: 0,
            rating: 0,
            completedDeals: 0,
            role: 'user'
        });
        return true;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

const signOutUser = () => {
    auth.signOut()
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch(err => console.error('Sign out error:', err));
};

// ========================================
// ===== LISTINGS FUNCTIONS =====
// ========================================

const getListings = async (filters = {}) => {
    try {
        let query = db.collection("listings").where("status", "==", "active");
        
        if (filters.category && filters.category !== 'all') {
            query = query.where("category", "==", filters.category);
        }
        if (filters.minPrice) {
            query = query.where("price", ">=", filters.minPrice);
        }
        if (filters.maxPrice) {
            query = query.where("price", "<=", filters.maxPrice);
        }
        
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting listings:', error);
        return [];
    }
};

const getListingById = async (id) => {
    try {
        const doc = await db.collection("listings").doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
        console.error('Error getting listing:', error);
        return null;
    }
};

const getUserListings = async (userId) => {
    try {
        const snapshot = await db.collection("listings")
            .where("sellerId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting user listings:', error);
        return [];
    }
};

const createListing = async (data) => {
    try {
        const docRef = await db.collection("listings").add({
            ...data,
            createdAt: new Date().toISOString(),
            views: 0,
            status: 'active'
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating listing:', error);
        throw error;
    }
};

const updateListing = async (id, data) => {
    try {
        await db.collection("listings").doc(id).update({
            ...data,
            updatedAt: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error('Error updating listing:', error);
        throw error;
    }
};

const deleteListing = async (id) => {
    try {
        await db.collection("listings").doc(id).delete();
        return true;
    } catch (error) {
        console.error('Error deleting listing:', error);
        throw error;
    }
};

const incrementViews = async (id) => {
    try {
        await db.collection("listings").doc(id).update({
            views: firebase.firestore.FieldValue.increment(1)
        });
    } catch (error) {
        console.error('Error incrementing views:', error);
    }
};

// ========================================
// ===== CART FUNCTIONS =====
// ========================================

const getCart = () => {
    try {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch {
        return [];
    }
};

const addToCart = (listingId) => {
    const cart = getCart();
    const existing = cart.find(item => item.id === listingId);
    if (existing) {
        existing.qty = (existing.qty || 1) + 1;
    } else {
        cart.push({ id: listingId, qty: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
};

const removeFromCart = (listingId) => {
    const cart = getCart().filter(item => item.id !== listingId);
    localStorage.setItem('cart', JSON.stringify(cart));
};

const updateCartQty = (listingId, qty) => {
    const cart = getCart();
    const item = cart.find(i => i.id === listingId);
    if (item) {
        if (qty <= 0) {
            removeFromCart(listingId);
        } else {
            item.qty = qty;
            localStorage.setItem('cart', JSON.stringify(cart));
        }
    }
};

const clearCart = () => {
    localStorage.removeItem('cart');
};

const getCartTotal = () => {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);
};

// ========================================
// ===== FAVORITES FUNCTIONS =====
// ========================================

const toggleFavorite = async (userId, listingId) => {
    try {
        const snapshot = await db.collection("favorites")
            .where("userId", "==", userId)
            .where("listingId", "==", listingId)
            .get();
        
        if (!snapshot.empty) {
            await snapshot.docs[0].ref.delete();
            return false;
        } else {
            await db.collection("favorites").add({
                userId,
                listingId,
                addedAt: new Date().toISOString()
            });
            return true;
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        return false;
    }
};

const getFavorites = async (userId) => {
    try {
        const snapshot = await db.collection("favorites")
            .where("userId", "==", userId)
            .get();
        return snapshot.docs.map(doc => doc.data().listingId);
    } catch (error) {
        console.error('Error getting favorites:', error);
        return [];
    }
};

const isFavorite = async (userId, listingId) => {
    try {
        const snapshot = await db.collection("favorites")
            .where("userId", "==", userId)
            .where("listingId", "==", listingId)
            .get();
        return !snapshot.empty;
    } catch (error) {
        return false;
    }
};

// ========================================
// ===== ORDERS FUNCTIONS =====
// ========================================

const createOrder = async (orderData) => {
    try {
        const docRef = await db.collection("orders").add({
            ...orderData,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

const getUserOrders = async (userId) => {
    try {
        const snapshot = await db.collection("orders")
            .where("buyerId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting orders:', error);
        return [];
    }
};

const getSellerOrders = async (sellerId) => {
    try {
        const snapshot = await db.collection("orders")
            .where("sellerId", "==", sellerId)
            .orderBy("createdAt", "desc")
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting seller orders:', error);
        return [];
    }
};

const updateOrderStatus = async (orderId, status) => {
    try {
        await db.collection("orders").doc(orderId).update({
            status,
            updatedAt: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error('Error updating order:', error);
        return false;
    }
};

const getStatusText = (status) => {
    const map = {
        'pending': '⏳ Ожидает',
        'paid': '✅ Оплачен',
        'shipped': '🚚 Отправлен',
        'delivered': '📦 Доставлен',
        'completed': '🎉 Завершён',
        'cancelled': '❌ Отменён'
    };
    return map[status] || status;
};

// ========================================
// ===== TRANSACTIONS FUNCTIONS =====
// ========================================

const createTransaction = async (userId, amount, description, status = 'completed') => {
    try {
        await db.collection("transactions").add({
            userId,
            amount,
            description,
            status,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error creating transaction:', error);
    }
};

const getUserTransactions = async (userId, limit = 50) => {
    try {
        const snapshot = await db.collection("transactions")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting transactions:', error);
        return [];
    }
};

const updateBalance = async (userId, amount, description) => {
    try {
        const userRef = db.collection("users").doc(userId);
        const doc = await userRef.get();
        const currentBalance = doc.exists ? doc.data().balance || 0 : 0;
        const newBalance = currentBalance + amount;
        
        await userRef.update({ balance: newBalance });
        await createTransaction(userId, amount, description);
        
        return newBalance;
    } catch (error) {
        console.error('Error updating balance:', error);
        throw error;
    }
};

// ========================================
// ===== PROMO FUNCTIONS =====
// ========================================

const applyPromoCode = async (code) => {
    try {
        const snapshot = await db.collection("promocodes")
            .where("code", "==", code.toUpperCase())
            .where("active", "==", true)
            .get();
        
        if (snapshot.empty) {
            throw new Error('Промокод не найден или неактивен');
        }
        return snapshot.docs[0].data();
    } catch (error) {
        console.error('Error applying promo:', error);
        throw error;
    }
};

// ========================================
// ===== CHAT FUNCTIONS =====
// ========================================

const getChats = async (userId) => {
    try {
        const snapshot = await db.collection("chats")
            .where("participants", "array-contains", userId)
            .orderBy("lastMessageTime", "desc")
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting chats:', error);
        return [];
    }
};

const sendMessage = async (chatId, senderId, senderName, text, imageUrl = null, videoUrl = null) => {
    try {
        await db.collection("messages").add({
            chatId,
            senderId,
            senderName,
            text,
            imageUrl,
            videoUrl,
            timestamp: new Date().toISOString()
        });
        
        await db.collection("chats").doc(chatId).update({
            lastMessage: text || (imageUrl ? '📷 Фото' : '🎥 Видео'),
            lastMessageTime: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

const getMessages = async (chatId) => {
    try {
        const snapshot = await db.collection("messages")
            .where("chatId", "==", chatId)
            .orderBy("timestamp", "asc")
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting messages:', error);
        return [];
    }
};

// ========================================
// ===== NOTIFICATIONS =====
// ========================================

const createNotification = async (userId, message, type = 'info') => {
    try {
        await db.collection("notifications").add({
            userId,
            message,
            type,
            read: false,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

const getNotifications = async (userId) => {
    try {
        const snapshot = await db.collection("notifications")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting notifications:', error);
        return [];
    }
};

const markNotificationRead = async (notificationId) => {
    try {
        await db.collection("notifications").doc(notificationId).update({
            read: true
        });
    } catch (error) {
        console.error('Error marking notification read:', error);
    }
};

// ========================================
// ===== WITHDRAWAL FUNCTIONS =====
// ========================================

const createWithdrawal = async (userId, amount, method, details) => {
    try {
        const docRef = await db.collection("withdrawals").add({
            userId,
            amount,
            method,
            details,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating withdrawal:', error);
        throw error;
    }
};

const getUserWithdrawals = async (userId) => {
    try {
        const snapshot = await db.collection("withdrawals")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting withdrawals:', error);
        return [];
    }
};

// ========================================
// ===== ЭКСПОРТЫ =====
// ========================================

export {
    // Firebase сервисы
    auth,
    db,
    storage,
    
    // User
    getCurrentUser,
    getUserData,
    updateUserData,
    createUser,
    signOutUser,
    
    // Listings
    getListings,
    getListingById,
    getUserListings,
    createListing,
    updateListing,
    deleteListing,
    incrementViews,
    
    // Cart
    getCart,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    getCartTotal,
    
    // Favorites
    toggleFavorite,
    getFavorites,
    isFavorite,
    
    // Orders
    createOrder,
    getUserOrders,
    getSellerOrders,
    updateOrderStatus,
    getStatusText,
    
    // Transactions
    createTransaction,
    getUserTransactions,
    updateBalance,
    
    // Promo
    applyPromoCode,
    
    // Chat
    getChats,
    sendMessage,
    getMessages,
    
    // Notifications
    createNotification,
    getNotifications,
    markNotificationRead,
    
    // Withdrawals
    createWithdrawal,
    getUserWithdrawals
};
