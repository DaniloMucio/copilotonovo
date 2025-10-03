import { auth } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { createUserDocument, getUserDocument } from './firestore';
import { AppErrorHandler } from '@/lib/errors';

export type UserType = "motorista" | "cliente" | "admin";

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
      isActive: true, // Novos usuários são criados ativos por padrão
      createdAt: new Date(),
      updatedAt: new Date(),
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Verificar se o usuário está ativo
    const userData = await getUserDocument(user.uid);
    
    if (!userData) {
      // Se não encontrar dados do usuário, deslogar
      await signOut(auth);
      throw new Error('USER_NOT_FOUND');
    }
    
    // Verificar se o usuário está ativo
    // REGRA: Apenas CLIENTES podem ser bloqueados por inatividade
    // Admins e Motoristas sempre podem fazer login
    const isUserActive = userData.userType === 'cliente' 
      ? userData.isActive === true // Apenas clientes são bloqueados quando inativos
      : true; // Admins e motoristas sempre podem fazer login
    
    // Log apenas em desenvolvimento ou para usuários inativos
    if (process.env.NODE_ENV === 'development' || !isUserActive) {
      console.log(`🔍 [AUTH] Verificando ${userData.userType}: ${userData.email}`);
      console.log(`🔍 [AUTH] isActive: ${userData.isActive}, isOnline: ${userData.isOnline}`);
      console.log(`🎯 [AUTH] Login ${isUserActive ? 'PERMITIDO' : 'BLOQUEADO'}`);
      
      if (userData.userType === 'motorista') {
        console.log(`🚛 [AUTH] Motorista pode fazer login independente do status (inatividade só afeta recebimento de entregas)`);
      }
    }
      
    if (!isUserActive) {
      // Usuário inativo - deslogar e mostrar erro
      await signOut(auth);
      throw new Error('USER_INACTIVE');
    }
    
    return userCredential;
  } catch (error: any) {
    if (error.message === 'USER_INACTIVE') {
      // Erro personalizado para usuário inativo
      const customError = new Error('USER_INACTIVE');
      customError.name = 'UserInactiveError';
      throw customError;
    } else if (error.message === 'USER_NOT_FOUND') {
      const customError = new Error('USER_NOT_FOUND');
      customError.name = 'UserNotFoundError';
      throw customError;
    } else {
      const appError = AppErrorHandler.handleFirebaseAuthError(error);
      AppErrorHandler.logError(appError);
      throw appError;
    }
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

/**
 * Envia um email de recuperação de senha para o usuário.
 * @param email - O email do usuário que deseja recuperar a senha.
 */
export const sendPasswordReset = async (email: string) => {
    try {
        await sendPasswordResetEmail(auth, email);
        console.log('✅ Email de recuperação de senha enviado com sucesso');
    } catch (error: any) {
        console.error("Erro ao enviar email de recuperação:", error);
        
        // Tratar erros específicos do Firebase
        if (error.code === 'auth/user-not-found') {
            throw new Error('Usuário não encontrado. Verifique o email informado.');
        }
        
        if (error.code === 'auth/invalid-email') {
            throw new Error('Email inválido. Verifique o formato do email.');
        }
        
        if (error.code === 'auth/too-many-requests') {
            throw new Error('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
        }
        
        if (error.code === 'auth/network-request-failed') {
            throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
        }
        
        throw new Error("Não foi possível enviar o email de recuperação. Tente novamente mais tarde.");
    }
};
