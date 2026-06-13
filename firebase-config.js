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

// Сервисы
const auth = firebase.auth();
const db = firebase.firestore();

// Включаем кэширование для ускорения загрузки
db.enablePersistence()
    .catch(err => console.log("Ошибка кэша (не критично):", err));

// Коллекции
const USERS_COLLECTION = "users";
const LISTINGS_COLLECTION = "listings";
const FAVORITES_COLLECTION = "favorites";
const ORDERS_COLLECTION = "orders";
const CHATS_COLLECTION = "chats";
const MESSAGES_COLLECTION = "messages";
const NOTIFICATIONS_COLLECTION = "notifications";
const PROMOCODES_COLLECTION = "promocodes";

console.log("✅ Firebase инициализирован");

// Экспорт для использования в других файлах (через глобальный объект)
window.firebaseApp = {
    auth,
    db,
    USERS_COLLECTION,
    LISTINGS_COLLECTION,
    FAVORITES_COLLECTION,
    ORDERS_COLLECTION,
    CHATS_COLLECTION,
    MESSAGES_COLLECTION,
    NOTIFICATIONS_COLLECTION,
    PROMOCODES_COLLECTION
};
