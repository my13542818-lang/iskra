// Firebase конфигурация
const firebaseConfig = {
    apiKey: "AIzaSyBLN8XTBFl8cKWfnjsc0h_2ZSuZeKc7dhQ",
    authDomain: "kyki-5e91a.firebaseapp.com",
    projectId: "kyki-5e91a",
    storageBucket: "kyki-5e91a.firebasestorage.app",
    messagingSenderId: "315986487804",
    appId: "1:315986487804:web:29f131e8a57bffadac2a79",
    measurementId: "G-ETWXCGL9HK"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Коллекции
const USERS_COLLECTION = "users";
const LISTINGS_COLLECTION = "listings";
const FAVORITES_COLLECTION = "favorites";
const CHATS_COLLECTION = "chats";
const MESSAGES_COLLECTION = "messages";
const ORDERS_COLLECTION = "orders";
const NOTIFICATIONS_COLLECTION = "notifications";
const SUPPORT_TICKETS_COLLECTION = "support_tickets";

// ============ АВТОРИЗАЦИЯ ============
window.signInWithGoogle = async function() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        const userRef = db.collection(USERS_COLLECTION).doc(user.uid);
        const userSnap = await userRef.get();
        
        if (!userSnap.exists) {
            await userRef.set({
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                role: "user",
                createdAt: new Date().toISOString(),
                rating: 0,
                completedDeals: 0,
                phone: "",
                location: ""
            });
        }
        
        localStorage.setItem("currentUser", JSON.stringify({ uid: user.uid, name: user.displayName }));
        window.location.href = "index.html";
    } catch (error) {
        console.error("Ошибка входа:", error);
        alert("Ошибка: " + error.message);
    }
};

window.signOutUser = async function() {
    try {
        await auth.signOut();
        localStorage.removeItem("currentUser");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Ошибка выхода:", error);
    }
};

window.onAuthStateChanged = function(callback) {
    return auth.onAuthStateChanged(callback);
};

// ============ ОБЪЯВЛЕНИЯ ============
window.getListings = async function(filters = {}) {
    try {
        let query = db.collection(LISTINGS_COLLECTION).where("status", "==", "active");
        const snapshot = await query.get();
        let listings = [];
        snapshot.forEach(doc => listings.push({ id: doc.id, ...doc.data() }));
        listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (filters.category && filters.category !== "all") {
            listings = listings.filter(l => l.category === filters.category);
        }
        if (filters.maxPrice && filters.maxPrice !== Infinity) {
            listings = listings.filter(l => l.price <= filters.maxPrice);
        }
        return listings;
    } catch (error) {
        console.error("Ошибка:", error);
        return [];
    }
};

window.getListingById = async function(id) {
    try {
        const docSnap = await db.collection(LISTINGS_COLLECTION).doc(id).get();
        return docSnap.exists ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
        console.error("Ошибка:", error);
        return null;
    }
};

window.getUserListings = async function(userId) {
    try {
        const snapshot = await db.collection(LISTINGS_COLLECTION).where("sellerId", "==", userId).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Ошибка:", error);
        return [];
    }
};

window.deleteListing = async function(id) {
    try {
        await db.collection(LISTINGS_COLLECTION).doc(id).delete();
        return true;
    } catch (error) {
        console.error("Ошибка:", error);
        return false;
    }
};

// ============ ИЗБРАННОЕ ============
window.addToFavorites = async function(listingId) {
    const user = auth.currentUser;
    if (!user) return false;
    try {
        await db.collection(FAVORITES_COLLECTION).add({ userId: user.uid, listingId, addedAt: new Date().toISOString() });
        return true;
    } catch (error) {
        console.error("Ошибка:", error);
        return false;
    }
};

window.removeFromFavorites = async function(listingId) {
    const user = auth.currentUser;
    if (!user) return false;
    try {
        const snapshot = await db.collection(FAVORITES_COLLECTION).where("userId", "==", user.uid).where("listingId", "==", listingId).get();
        snapshot.forEach(async (doc) => { await doc.ref.delete(); });
        return true;
    } catch (error) {
        console.error("Ошибка:", error);
        return false;
    }
};

window.getFavorites = async function() {
    const user = auth.currentUser;
    if (!user) return [];
    try {
        const snapshot = await db.collection(FAVORITES_COLLECTION).where("userId", "==", user.uid).get();
        const favorites = [];
        for (const favDoc of snapshot.docs) {
            const listing = await window.getListingById(favDoc.data().listingId);
            if (listing) favorites.push(listing);
        }
        return favorites;
    } catch (error) {
        console.error("Ошибка:", error);
        return [];
    }
};

// ============ ЗАКАЗЫ ============
window.createOrder = async function(orderData) {
    const user = auth.currentUser;
    if (!user) return null;
    try {
        const orderRef = await db.collection(ORDERS_COLLECTION).add({
            ...orderData,
            buyerId: user.uid,
            buyerName: user.displayName || user.phoneNumber,
            status: "pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        return orderRef.id;
    } catch (error) {
        console.error("Ошибка:", error);
        return null;
    }
};

window.getUserOrders = async function(userId) {
    try {
        const snapshot = await db.collection(ORDERS_COLLECTION).where("buyerId", "==", userId).orderBy("createdAt", "desc").get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Ошибка:", error);
        return [];
    }
};

window.getSellerOrders = async function(sellerId) {
    try {
        const snapshot = await db.collection(ORDERS_COLLECTION).where("sellerId", "==", sellerId).orderBy("createdAt", "desc").get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Ошибка:", error);
        return [];
    }
};

window.updateOrderStatus = async function(orderId, status, trackingNumber = null) {
    try {
        const updateData = { status: status, updatedAt: new Date().toISOString() };
        if (trackingNumber) updateData.trackingNumber = trackingNumber;
        await db.collection(ORDERS_COLLECTION).doc(orderId).update(updateData);
        return true;
    } catch (error) {
        console.error("Ошибка:", error);
        return false;
    }
};

// ============ ЧАТЫ ============
window.getUserChats = async function() {
    const user = auth.currentUser;
    if (!user) return [];
    try {
        const snapshot = await db.collection(CHATS_COLLECTION).where("participants", "array-contains", user.uid).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Ошибка:", error);
        return [];
    }
};

// ============ УВЕДОМЛЕНИЯ ============
window.getUserNotifications = async function(userId) {
    try {
        const snapshot = await db.collection(NOTIFICATIONS_COLLECTION).where("userId", "==", userId).orderBy("createdAt", "desc").get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Ошибка:", error);
        return [];
    }
};

window.markNotificationAsRead = async function(notificationId) {
    try {
        await db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId).update({ read: true });
        return true;
    } catch (error) {
        console.error("Ошибка:", error);
        return false;
    }
};

console.log("✅ Firebase загружен");
