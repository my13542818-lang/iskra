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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// ========================================
// ЭКСПОРТЫ — ВСЁ ЧТО НУЖНО
// ========================================
export {
    auth,
    db,
    getCurrentUser,
    getUserData,
    updateUserData,
    signOutUser,
    getListings,
    getListingById,
    getUserListings,
    deleteListing,
    getCart,
    addToCart,
    removeFromCart,
    clearCart,
    toggleFavorite,
    getFavorites,
    createOrder,
    getUserOrders,
    getStatusText,
    createTransaction,
    applyPromoCode,
    getChats,
    sendMessage
};

// ========================================
// ФУНКЦИИ
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
    } catch (error) {
        console.error('Error updating user data:', error);
        throw error;
    }
};

const signOutUser = () => {
    auth.signOut();
    window.location.href = 'index.html';
};

const getListings = async (filters = {}) => {
    try {
        let query = db.collection("listings").where("status", "==", "active");
        if (filters.category && filters.category !== 'all') {
            query = query.where("category", "==", filters.category);
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

const deleteListing = async (id) => {
    try {
        await db.collection("listings").doc(id).delete();
        return true;
    } catch (error) {
        console.error('Error deleting listing:', error);
        return false;
    }
};

// ========================================
// КОРЗИНА
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
    if (!cart.some(item => item.id === listingId)) {
        cart.push({ id: listingId, qty: 1 });
        localStorage.setItem('cart', JSON.stringify(cart));
    }
};

const removeFromCart = (listingId) => {
    const cart = getCart().filter(item => item.id !== listingId);
    localStorage.setItem('cart', JSON.stringify(cart));
};

const clearCart = () => {
    localStorage.removeItem('cart');
};

// ========================================
// ИЗБРАННОЕ
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

// ========================================
// ЗАКАЗЫ
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
// ТРАНЗАКЦИИ
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

// ========================================
// ПРОМОКОДЫ
// ========================================
const applyPromoCode = async (code) => {
    try {
        const snapshot = await db.collection("promocodes")
            .where("code", "==", code.toUpperCase())
            .where("active", "==", true)
            .get();
        if (snapshot.empty) {
            throw new Error('Промокод не найден');
        }
        return snapshot.docs[0].data();
    } catch (error) {
        console.error('Error applying promo:', error);
        throw error;
    }
};

// ========================================
// ЧАТЫ
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
