
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, where, query } from "firebase/firestore"; 
import { db, auth } from "@/lib/firebase";
import type { User } from 'firebase/auth';

export interface UserData {
  displayName: string;
  email: string;
  userType: 'motorista' | 'cliente';
  cpf?: string;
  cnpj?: string;
  cnh?: string;
  phone?: string;
  companyName?: string;
  isOnline?: boolean;
}

/**
 * Cria um documento do usuário no Firestore durante o cadastro.
 * @param userId - O ID do usuário.
 * @param userData - Os dados iniciais do usuário.
 */
export const createUserDocument = async (userId: string, userData: Partial<UserData>) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, userData);
  } catch (error) {
    console.error("Erro ao criar documento do usuário: ", error);
    throw error;
  }
};

/**
 * Salva os dados do usuário no Firestore.
 * @param userId - O ID do usuário.
 * @param userData - Os dados do usuário a serem salvos.
 */
export const saveUserData = async (userId: string, userData: UserData) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, userData);
  } catch (error) {
    console.error("Erro ao salvar dados do usuário: ", error);
    throw error;
  }
};

/**
 * Busca os dados de um usuário no Firestore.
 * @param userId - O ID do usuário.
 * @returns Os dados do usuário ou null se não encontrado.
 */
export const getUserDocument = async (userId: string): Promise<UserData | null> => {
    try {
        const userRef = doc(db, "users", userId);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            return docSnap.data() as UserData;
        } else {
            console.log("Nenhum documento encontrado para este usuário!");
            return null;
        }
    } catch (error) {
        console.error("Erro ao buscar documento do usuário:", error);
        throw error;
    }
};

/**
 * Atualiza os dados de um usuário no Firestore.
 * @param user - O objeto do usuário do Firebase Auth.
 * @param data - Os dados a serem atualizados.
 */
export const updateUserProfile = async (user: User, data: Partial<UserData>) => {
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }
  
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, data);
    } catch (error) {
      console.error('Erro ao atualizar o perfil do usuário:', error);
      throw error;
    }
};

/**
 * Atualiza os dados de um usuário no Firestore (alias para compatibilidade).
 * @param user - O objeto do usuário do Firebase Auth.
 * @param data - Os dados a serem atualizados.
 */
export const updateUserDocument = updateUserProfile;

/**
 * Busca todos os motoristas cadastrados.
 * @returns Uma lista de motoristas.
 */
export const getDrivers = async (): Promise<(UserData & { uid: string })[]> => {
    try {
        const q = query(collection(db, "users"), where("userType", "==", "motorista"));
        const querySnapshot = await getDocs(q);
        const drivers = querySnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        })) as (UserData & { uid: string })[];
        return drivers;
    } catch (error) {
        console.error("Erro ao buscar motoristas:", error);
        throw error;
    }
}

/**
 * Busca apenas motoristas online.
 * @returns Uma lista de motoristas online.
 */
export const getOnlineDrivers = async (): Promise<(UserData & { uid: string })[]> => {
    try {
        const q = query(
            collection(db, "users"), 
            where("userType", "==", "motorista"),
            where("isOnline", "==", true)
        );
        const querySnapshot = await getDocs(q);
        const drivers = querySnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        })) as (UserData & { uid: string })[];
        return drivers;
    } catch (error) {
        console.error("Erro ao buscar motoristas online:", error);
        throw error;
    }
}



/**
 * Atualiza o status online/offline de um motorista.
 * @param userId - ID do usuário
 * @param isOnline - Status online (true) ou offline (false)
 */
export const updateDriverStatus = async (userId: string, isOnline: boolean): Promise<void> => {
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { isOnline });
        console.log(`Status do motorista ${userId} atualizado para: ${isOnline ? 'online' : 'offline'}`);
        
        // Verificar se foi salvo corretamente
        const updatedDoc = await getDoc(userRef);
        if (updatedDoc.exists()) {
            const data = updatedDoc.data();
            console.log(`✅ Verificação: Status salvo no Firebase:`, {
                userId,
                isOnline: data.isOnline,
                userType: data.userType,
                displayName: data.displayName
            });
        }
    } catch (error) {
        console.error("Erro ao atualizar status do motorista:", error);
        throw error;
    }
}

/**
 * Salva as anotações de um usuário no Firestore.
 * @param userId - O ID do usuário.
 * @param notes - As anotações a serem salvas.
 */
export const saveUserNotes = async (userId: string, notes: string): Promise<void> => {
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { notes: notes });
    } catch (error) {
        // Se o documento não existir, podemos criá-lo com as notas
        if ((error as any).code === 'not-found') {
            const userRef = doc(db, "users", userId);
            await setDoc(userRef, { notes: notes }, { merge: true });
        } else {
            console.error("Erro ao salvar anotações do usuário:", error);
            throw error;
        }
    }
};

/**
 * Busca as anotações de um usuário no Firestore.
 * @param userId - O ID do usuário.
 * @returns As anotações do usuário ou uma string vazia se não houver.
 */
export const getUserNotes = async (userId: string): Promise<string> => {
    try {
        const userRef = doc(db, "users", userId);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists() && docSnap.data().notes) {
            return docSnap.data().notes;
        }
        return "";
    } catch (error) {
        console.error("Erro ao buscar anotações do usuário:", error);
        return ""; // Retorna string vazia em caso de erro
    }
};
