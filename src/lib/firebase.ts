
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB2pVLfo_GUrMRNM7G16PhYlEzdbJ4sEVA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "co-pilotogit.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "co-pilotogit",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "co-pilotogit.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1004254989892",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1004254989892:web:68309b7b10918886743611"
};
// Verificação de configuração
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "your_api_key_here") {
    console.warn("Firebase API Key não configurada. Para produção, configure as variáveis de ambiente no arquivo .env.local");
}

// Verificação se está usando valores de fallback em produção
if (process.env.NODE_ENV === 'production' && firebaseConfig.apiKey === "AIzaSyB2pVLfo_GUrMRNM7G16PhYlEzdbJ4sEVA") {
    console.warn("⚠️  ATENÇÃO: Usando credenciais Firebase de desenvolvimento em produção!");
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');

// Em desenvolvimento, conecte ao emulador de funções se ele estiver rodando
// if (process.env.NODE_ENV === 'development') {
//     try {
//         connectFunctionsEmulator(functions, 'localhost', 5001);
//     } catch (e) {
//         console.log("Function emulator not running.")
//     }
// }


export { app, auth, db, functions };
