
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};
// Verificação de configuração obrigatória
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    const errorMessage = "❌ ERRO: Configuração Firebase incompleta! Configure todas as variáveis de ambiente.";
    console.error(errorMessage);
    
    if (process.env.NODE_ENV === 'production') {
        throw new Error(errorMessage);
    }
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
