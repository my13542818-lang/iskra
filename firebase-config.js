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

// Отключаем персистентность для избежания ошибок
db.settings({ persistence: false });

console.log("✅ Firebase инициализирован");