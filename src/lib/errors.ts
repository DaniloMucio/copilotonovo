// Sistema de tratamento de erros personalizado

export enum ErrorCode {
  // Erros de autenticação
  AUTH_INVALID_CREDENTIALS = 'auth/invalid-credentials',
  AUTH_USER_NOT_FOUND = 'auth/user-not-found',
  AUTH_WRONG_PASSWORD = 'auth/wrong-password',
  AUTH_EMAIL_ALREADY_IN_USE = 'auth/email-already-in-use',
  AUTH_WEAK_PASSWORD = 'auth/weak-password',
  AUTH_NETWORK_REQUEST_FAILED = 'auth/network-request-failed',

  // Erros de Firestore
  FIRESTORE_PERMISSION_DENIED = 'firestore/permission-denied',
  FIRESTORE_NOT_FOUND = 'firestore/not-found',
  FIRESTORE_NETWORK_ERROR = 'firestore/network-error',
  FIRESTORE_QUOTA_EXCEEDED = 'firestore/quota-exceeded',

  // Erros da aplicação
  APP_VALIDATION_ERROR = 'app/validation-error',
  APP_UNKNOWN_ERROR = 'app/unknown-error',
  APP_NETWORK_ERROR = 'app/network-error',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp: Date;
}

export class AppErrorHandler {
  static createError(code: ErrorCode, message: string, details?: any): AppError {
    return {
      code,
      message,
      details,
      timestamp: new Date(),
    };
  }

  static handleFirebaseAuthError(error: any): AppError {
    const errorCode = error.code;
    
    switch (errorCode) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return this.createError(
          ErrorCode.AUTH_INVALID_CREDENTIALS,
          'Email ou senha incorretos. Verifique suas credenciais.',
          error
        );
      
      case 'auth/user-not-found':
        return this.createError(
          ErrorCode.AUTH_USER_NOT_FOUND,
          'Usuário não encontrado. Verifique o email informado.',
          error
        );
      
      case 'auth/email-already-in-use':
        return this.createError(
          ErrorCode.AUTH_EMAIL_ALREADY_IN_USE,
          'Este email já está sendo usado por outra conta.',
          error
        );
      
      case 'auth/weak-password':
        return this.createError(
          ErrorCode.AUTH_WEAK_PASSWORD,
          'A senha deve ter pelo menos 6 caracteres.',
          error
        );
      
      case 'auth/network-request-failed':
        return this.createError(
          ErrorCode.AUTH_NETWORK_REQUEST_FAILED,
          'Erro de conexão. Verifique sua internet e tente novamente.',
          error
        );
      
      default:
        return this.createError(
          ErrorCode.APP_UNKNOWN_ERROR,
          'Erro de autenticação inesperado. Tente novamente.',
          error
        );
    }
  }

  static handleFirestoreError(error: any): AppError {
    const errorCode = error.code;
    
    switch (errorCode) {
      case 'permission-denied':
        return this.createError(
          ErrorCode.FIRESTORE_PERMISSION_DENIED,
          'Você não tem permissão para realizar esta operação.',
          error
        );
      
      case 'not-found':
        return this.createError(
          ErrorCode.FIRESTORE_NOT_FOUND,
          'Documento não encontrado.',
          error
        );
      
      case 'unavailable':
      case 'deadline-exceeded':
        return this.createError(
          ErrorCode.FIRESTORE_NETWORK_ERROR,
          'Erro de conexão com o banco de dados. Tente novamente.',
          error
        );
      
      case 'resource-exhausted':
        return this.createError(
          ErrorCode.FIRESTORE_QUOTA_EXCEEDED,
          'Limite de uso excedido. Tente novamente mais tarde.',
          error
        );
      
      default:
        return this.createError(
          ErrorCode.APP_UNKNOWN_ERROR,
          'Erro inesperado no banco de dados.',
          error
        );
    }
  }

  static handleGenericError(error: any): AppError {
    if (error instanceof Error) {
      return this.createError(
        ErrorCode.APP_UNKNOWN_ERROR,
        error.message || 'Erro inesperado.',
        error
      );
    }
    
    return this.createError(
      ErrorCode.APP_UNKNOWN_ERROR,
      'Erro inesperado. Tente novamente.',
      error
    );
  }

  static logError(error: AppError) {
    console.error('AppError:', {
      code: error.code,
      message: error.message,
      timestamp: error.timestamp,
      details: error.details,
    });

    // Aqui você pode enviar para serviços de monitoramento
    // como Sentry, LogRocket, etc.
  }
}

// Hook para usar em componentes React
export const useErrorHandler = () => {
  const handleError = (error: any): AppError => {
    let appError: AppError;

    // Determinar o tipo de erro e tratá-lo adequadamente
    if (error?.code?.startsWith('auth/')) {
      appError = AppErrorHandler.handleFirebaseAuthError(error);
    } else if (error?.code && !error.code.startsWith('auth/')) {
      appError = AppErrorHandler.handleFirestoreError(error);
    } else {
      appError = AppErrorHandler.handleGenericError(error);
    }

    AppErrorHandler.logError(appError);
    return appError;
  };

  return { handleError };
};
