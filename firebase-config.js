// Firebase конфигурация для GitHub Pages (НЕ использует import/export)
// Подключается через обычные script теги

// Конфигурация Firebase
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
firebase.initializeApp(firebaseConfig);

// Сервисы
const auth = firebase.auth();
const db = firebase.firestore();

// Провайдер Google
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Коллекции
const USERS_COLLECTION = "users";
const LISTINGS_COLLECTION = "listings";
const FAVORITES_COLLECTION = "favorites";
const ORDERS_COLLECTION = "orders";

let currentUser = null;

// ============ АВТОРИЗАЦИЯ ============
window.signInWithGoogle = async function() {
    try {
        const result = await auth.signInWithPopup(googleProvider);
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
        return true;
    } catch (error) {
        console.error("Ошибка входа:", error);
        alert("Ошибка: " + error.message);
        return false;
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
        const snapshot = await db.collection(LISTINGS_COLLECTION).where("status", "==", "active").get();
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
        console.error("Ошибка получения:", error);
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

window.addToFavorites = async function(listingId) {
    const user = auth.currentUser;
    if (!user) return false;
    try {
        await db.collection(FAVORITES_COLLECTION).add({
            userId: user.uid,
            listingId: listingId,
            addedAt: new Date().toISOString()
        });
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
        const snapshot = await db.collection(FAVORITES_COLLECTION)
            .where("userId", "==", user.uid)
            .where("listingId", "==", listingId).get();
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

console.log("✅ Firebase загружен (GitHub Pages версия)");
