// firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAWT5tl37LV6WsMKO4WU-hHmm9BpBq1HpM",
    authDomain: "quiz-app-firebase-620b9.firebaseapp.com",
    projectId: "quiz-app-firebase-620b9",
    storageBucket: "quiz-app-firebase-620b9.firebasestorage.app",
    messagingSenderId: "65990542112",
    appId: "1:65990542112:web:ec5d9b4469bde40daecd45",
    measurementId: "G-TVRYCLFY3T"
  };

// Firebaseアプリの初期化
const app = initializeApp(firebaseConfig);

// Firestoreインスタンスを取得
const db: Firestore = getFirestore(app);

export { db };