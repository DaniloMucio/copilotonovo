
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getMessaging, isSupported } from "firebase/messaging";

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
    
    // Em desenvolvimento ou durante build, usar valores padrão se disponíveis
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
        // Apenas falhar em produção no cliente (não durante build)
        throw new Error(errorMessage);
    } else {
        console.warn("⚠️  Modo de desenvolvimento/build: usando configurações padrão");
        // Em desenvolvimento ou durante build, usar valores padrão se as variáveis não estiverem configuradas
        if (!firebaseConfig.apiKey) {
            firebaseConfig.apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
        }
        if (!firebaseConfig.authDomain) {
            firebaseConfig.authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "";
        }
        if (!firebaseConfig.projectId) {
            firebaseConfig.projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
        }
        if (!firebaseConfig.storageBucket) {
            firebaseConfig.storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "";
        }
        if (!firebaseConfig.messagingSenderId) {
            firebaseConfig.messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "";
        }
        if (!firebaseConfig.appId) {
            firebaseConfig.appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "";
        }
    }
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');

// Initialize Firebase Cloud Messaging
let messaging: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

// Em desenvolvimento, conecte ao emulador de funções se ele estiver rodando
// if (process.env.NODE_ENV === 'development') {
//     try {
//         connectFunctionsEmulator(functions, 'localhost', 5001);
//     } catch (e) {
//         console.log("Function emulator not running.")
//     }
// }


export { app, auth, db, functions, messaging };
