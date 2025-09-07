import { auth } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser
} from 'firebase/auth';
import { createUserDocument } from './firestore';
import { AppErrorHandler } from '@/lib/errors';

export type UserType = "motorista" | "cliente";

export const signUp = async (email: string, password: string, displayName: string, userType: UserType) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Atualiza o perfil do usuário no Firebase Auth
    await updateProfile(user, { displayName });
    
    // Cria um documento para o usuário no Firestore com informações adicionais
    await createUserDocument(user.uid, {
      displayName,
      email,
      userType,
    });

    return userCredential;
  } catch (error) {
    const appError = AppErrorHandler.handleFirebaseAuthError(error);
    AppErrorHandler.logError(appError);
    throw appError;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    const appError = AppErrorHandler.handleFirebaseAuthError(error);
    AppErrorHandler.logError(appError);
    throw appError;
  }
};

export const reauthenticateUser = async (password: string) => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error("Usuário não está logado ou não tem email.");
    }
  
    const credential = EmailAuthProvider.credential(user.email, password);
    try {
      await reauthenticateWithCredential(user, credential);
    } catch (error: any) {
        // Firebase retorna um código de erro específico para senha incorreta
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
             throw new Error('wrong-password');
        }
        console.error("Erro ao reautenticar:", error);
        throw new Error("Ocorreu um erro durante a reautenticação.");
    }
}

/**
 * Atualiza a senha do usuário no Firebase Auth.
 * @param currentPassword - A senha atual do usuário para reautenticação.
 * @param newPassword - A nova senha a ser definida.
 */
export const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Usuário não está logado.");
    }

    try {
        await reauthenticateUser(currentPassword);
        await updatePassword(user, newPassword);
    } catch (error: any) {
        console.error("Erro ao atualizar a senha:", error);
        // Propaga o erro de senha incorreta para ser tratado na UI
        if(error.message === 'wrong-password') {
            throw error;
        }
        throw new Error("Não foi possível atualizar a senha.");
    }
};


/**
 * Atualiza o perfil do usuário no Firebase Auth.
 * @param displayName - O novo nome de exibição do usuário.
 */
export const updateUserProfile = async (displayName: string) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Usuário não está logado.");
    }

    try {
        await updateProfile(user, { displayName });
    } catch (error) {
        console.error("Erro ao atualizar o perfil do usuário:", error);
        throw new Error("Não foi possível atualizar o perfil.");
    }
};

/**
 * Exclui a conta do usuário do Firebase Auth.
 * IMPORTANTE: Esta função remove APENAS a autenticação do usuário.
 * Os dados do Firestore devem ser removidos separadamente.
 * @param password - A senha atual do usuário para reautenticação.
 */
export const deleteUserAccount = async (password: string) => {
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error("Usuário não está logado ou não tem email.");
    }

    try {
        // Reautenticar o usuário antes de excluir
        await reauthenticateUser(password);
        
        // Excluir a conta do Firebase Auth
        await deleteUser(user);
        
        console.log('✅ Conta do usuário excluída com sucesso do Firebase Auth');
    } catch (error: any) {
        console.error("Erro ao excluir conta do usuário:", error);
        
        // Tratar erros específicos
        if (error.message === 'wrong-password') {
            throw new Error('Senha incorreta. Tente novamente.');
        }
        
        if (error.code === 'auth/requires-recent-login') {
            throw new Error('Por segurança, faça login novamente antes de excluir sua conta.');
        }
        
        throw new Error("Não foi possível excluir sua conta. Tente novamente mais tarde.");
    }
};
