import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { 
    getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
    RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { 
    getFirestore, collection, addDoc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, doc, 
    query, where, orderBy, onSnapshot, increment 
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBLN8XTBFl8cKWfnjsc0h_2ZSuZeKc7dhQ",
    authDomain: "kyki-5e91a.firebaseapp.com",
    projectId: "kyki-5e91a",
    storageBucket: "kyki-5e91a.firebasestorage.app",
    messagingSenderId: "315986487804",
    appId: "1:315986487804:web:29f131e8a57bffadac2a79",
    measurementId: "G-ETWXCGL9HK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Коллекции
const USERS_COLLECTION = "users";
const LISTINGS_COLLECTION = "listings";
const FAVORITES_COLLECTION = "favorites";
const REVIEWS_COLLECTION = "reviews";
const REPORTS_COLLECTION = "reports";
const CHATS_COLLECTION = "chats";
const MESSAGES_COLLECTION = "messages";
const ORDERS_COLLECTION = "orders";
const NOTIFICATIONS_COLLECTION = "notifications";
const SUPPORT_TICKETS_COLLECTION = "support_tickets";

let currentUser = null;

// ============ АВТОРИЗАЦИЯ ============
async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        const userRef = doc(db, USERS_COLLECTION, user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            await setDoc(userRef, {
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
        
        currentUser = user;
        localStorage.setItem("currentUser", JSON.stringify({ uid: user.uid, name: user.displayName, email: user.email, photoURL: user.photoURL }));
        window.location.href = "index.html";
        return true;
    } catch (error) {
        console.error("Ошибка входа:", error);
        alert("Ошибка: " + error.message);
        return false;
    }
}

async function signOutUser() {
    try {
        await signOut(auth);
        currentUser = null;
        localStorage.removeItem("currentUser");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Ошибка выхода:", error);
    }
}

// ============ ОБЪЯВЛЕНИЯ ============
async function addListing(listing) {
    const user = currentUser || auth.currentUser;
    if (!user) { alert("Войдите в аккаунт!"); return null; }
    try {
        const docRef = await addDoc(collection(db, LISTINGS_COLLECTION), {
            ...listing,
            sellerId: user.uid,
            sellerName: user.displayName || user.phoneNumber,
            sellerPhoto: user.photoURL || "",
            createdAt: new Date().toISOString(),
            views: 0,
            status: "active"
        });
        return docRef.id;
    } catch (error) {
        console.error("Ошибка добавления:", error);
        return null;
    }
}

async function getListings(filters = {}) {
    try {
        const q = query(collection(db, LISTINGS_COLLECTION), where("status", "==", "active"));
        const snapshot = await getDocs(q);
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
}

async function getListingById(id) {
    try {
        const docRef = doc(db, LISTINGS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
        console.error("Ошибка:", error);
        return null;
    }
}

async function getUserListings(userId) {
    try {
        const q = query(collection(db, LISTINGS_COLLECTION), where("sellerId", "==", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Ошибка:", error);
        return [];
    }
}

async function deleteListing(id) {
    try {
        await deleteDoc(doc(db, LISTINGS_COLLECTION, id));
        return true;
    } catch (error) {
        console.error("Ошибка удаления:", error);
        return false;
    }
}

// ============ ИЗБРАННОЕ ============
async function addToFavorites(listingId) {
    const user = currentUser || auth.currentUser;
    if (!user) return false;
    try {
        await addDoc(collection(db, FAVORITES_COLLECTION), { userId: user.uid, listingId, addedAt: new Date().toISOString() });
        return true;
    } catch (error) {
        console.error("Ошибка:", error);
        return false;
    }
}

async function removeFromFavorites(listingId) {
    const user = currentUser || auth.currentUser;
    if (!user) return false;
    try {
        const q = query(collection(db, FAVORITES_COLLECTION), where("userId", "==", user.uid), where("listingId", "==", listingId));
        const snapshot = await getDocs(q);
        snapshot.forEach(async (doc) => { await deleteDoc(doc.ref); });
        return true;
    } catch (error) {
        console.error("Ошибка:", error);
        return false;
    }
}

async function getFavorites() {
    const user = currentUser || auth.currentUser;
    if (!user) return [];
    try {
        const q = query(collection(db, FAVORITES_COLLECTION), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const favorites = [];
        for (const favDoc of snapshot.docs) {
            const listing = await getListingById(favDoc.data().listingId);
            if (listing) favorites.push(listing);
        }
        return favorites;
    } catch (error) {
        console.error("Ошибка:", error);
        return [];
    }
}

// ============ ЗАКАЗЫ ============
async function createOrder(orderData) {
    const user = currentUser || auth.currentUser;
    if (!user) return null;
    try {
        const orderRef = await addDoc(collection(db, ORDERS_COLLECTION), {
            ...orderData,
            buyerId: user.uid,
            buyerName: user.displayName || user.phoneNumber,
            status: "pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        return orderRef.id;
    } catch (error) {
        console.error("Ошибка создания заказа:", error);
        return null;
    }
}

// ============ ЭКСПОРТ ============
export {
    auth, db,
    collection, addDoc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, increment,
    signInWithGoogle, signOutUser, onAuthStateChanged,
    RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider,
    addListing, getListings, getListingById, getUserListings, deleteListing,
    addToFavorites, removeFromFavorites, getFavorites,
    createOrder,
    USERS_COLLECTION, LISTINGS_COLLECTION, FAVORITES_COLLECTION, ORDERS_COLLECTION
};