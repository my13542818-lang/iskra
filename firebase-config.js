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

// Инициализация Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Проверяем, не объявлены ли уже глобальные переменные
if (typeof window.firebaseAuth === 'undefined') {
    window.firebaseAuth = firebase.auth();
    window.firebaseDb = firebase.firestore();
    
    // Отключаем персистентность, чтобы избежать ошибок с несколькими вкладками
    window.firebaseDb.settings({ persistence: false });
}

console.log("✅ Firebase инициализирован");

// Коллекции
window.USERS_COLLECTION = "users";
window.LISTINGS_COLLECTION = "listings";
window.FAVORITES_COLLECTION = "favorites";
window.ORDERS_COLLECTION = "orders";
window.CHATS_COLLECTION = "chats";
window.MESSAGES_COLLECTION = "messages";
window.NOTIFICATIONS_COLLECTION = "notifications";
window.PROMOCODES_COLLECTION = "promocodes";
