import { toast } from '@/hooks/use-toast';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  duration?: number;
  actionLabel?: string;
  actionHandler?: () => void;
  persistent?: boolean; // Não auto-dismiss
}

export interface ToastQueueItem extends ToastOptions {
  id: string;
  timestamp: number;
}

class ToastManager {
  private queue: ToastQueueItem[] = [];
  private maxQueue = 3; // Máximo de toasts simultâneos
  private defaultDuration = 5000;

  // Gerar ID único para toast
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Mostrar toast básico
  show(options: ToastOptions) {
    const toastItem: ToastQueueItem = {
      ...options,
      id: this.generateId(),
      timestamp: Date.now(),
      duration: options.duration || this.defaultDuration,
    };

    this.queue.push(toastItem);
    this.processQueue();
    
    return toastItem.id;
  }

  // Processar fila de toasts
  private processQueue() {
    if (this.queue.length === 0) return;

    // Remover toasts expirados
    this.queue = this.queue.filter(item => {
      if (item.persistent) return true;
      return Date.now() - item.timestamp < (item.duration || this.defaultDuration);
    });

    // Mostrar apenas os toasts mais recentes
    const toastsToShow = this.queue.slice(-this.maxQueue);
    
    toastsToShow.forEach(item => {
      toast({
        title: item.title,
        description: item.description,
        variant: item.variant,
        duration: item.persistent ? Infinity : item.duration,
      });
    });
  }

  // Toasts tipados para diferentes cenários
  success(title: string, description?: string, options?: Partial<ToastOptions>) {
    return this.show({
      title,
      description,
      variant: 'success',
      ...options,
    });
  }

  error(title: string, description?: string, options?: Partial<ToastOptions>) {
    return this.show({
      title,
      description,
      variant: 'destructive',
      duration: 8000, // Erros ficam mais tempo visíveis
      ...options,
    });
  }

  warning(title: string, description?: string, options?: Partial<ToastOptions>) {
    return this.show({
      title,
      description,
      variant: 'warning',
      duration: 6000,
      ...options,
    });
  }

  info(title: string, description?: string, options?: Partial<ToastOptions>) {
    return this.show({
      title,
      description,
      variant: 'info',
      ...options,
    });
  }

  // Toasts para ações específicas
  loading(title: string, description?: string) {
    return this.show({
      title,
      description,
      variant: 'default',
      persistent: true,
    });
  }

  // Atualizar toast existente (útil para loading -> success/error)
  update(id: string, options: Partial<ToastOptions>) {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.queue[index] = { ...this.queue[index], ...options };
      this.processQueue();
    }
  }

  // Remover toast específico
  dismiss(id: string) {
    this.queue = this.queue.filter(item => item.id !== id);
  }

  // Limpar todos os toasts
  clear() {
    this.queue = [];
  }

  // Toasts para operações assíncronas
  async withAsyncFeedback<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
    options?: {
      loadingDescription?: string;
      successDescription?: string;
      errorDescription?: string;
    }
  ): Promise<T> {
    const loadingId = this.loading(messages.loading, options?.loadingDescription);

    try {
      const result = await promise;
      
      this.dismiss(loadingId);
      this.success(messages.success, options?.successDescription);
      
      return result;
    } catch (error) {
      this.dismiss(loadingId);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado';
      this.error(
        messages.error,
        options?.errorDescription || errorMessage
      );
      
      throw error;
    }
  }

  // Toasts para operações de CRUD
  crud = {
    create: (entity: string) => ({
      loading: () => this.loading(`Criando ${entity}...`),
      success: () => this.success(`${entity} criado com sucesso!`),
      error: (error?: string) => this.error(
        `Erro ao criar ${entity}`,
        error || `Não foi possível criar o ${entity}. Tente novamente.`
      ),
    }),

    update: (entity: string) => ({
      loading: () => this.loading(`Atualizando ${entity}...`),
      success: () => this.success(`${entity} atualizado com sucesso!`),
      error: (error?: string) => this.error(
        `Erro ao atualizar ${entity}`,
        error || `Não foi possível atualizar o ${entity}. Tente novamente.`
      ),
    }),

    delete: (entity: string) => ({
      loading: () => this.loading(`Excluindo ${entity}...`),
      success: () => this.success(`${entity} excluído com sucesso!`),
      error: (error?: string) => this.error(
        `Erro ao excluir ${entity}`,
        error || `Não foi possível excluir o ${entity}. Tente novamente.`
      ),
    }),
  };

  // Toasts para autenticação
  auth = {
    loginSuccess: () => this.success('Login realizado', 'Bem-vindo de volta!'),
    loginError: () => this.error('Erro no login', 'Credenciais inválidas. Tente novamente.'),
    logoutSuccess: () => this.success('Logout realizado', 'Você foi desconectado com segurança.'),
    signupSuccess: () => this.success('Conta criada', 'Sua conta foi criada com sucesso!'),
    signupError: (error?: string) => this.error('Erro no cadastro', error || 'Não foi possível criar a conta.'),
  };

  // Toasts para conexão/sincronização
  connection = {
    online: () => this.success('Conectado', 'Conexão com internet restaurada.'),
    offline: () => this.warning('Sem conexão', 'Você está trabalhando offline.'),
    syncSuccess: () => this.success('Sincronizado', 'Dados sincronizados com sucesso.'),
    syncError: () => this.error('Erro de sincronização', 'Não foi possível sincronizar os dados.'),
  };

  // Toasts para validação
  validation = {
    required: (field: string) => this.warning('Campo obrigatório', `O campo "${field}" é obrigatório.`),
    invalid: (field: string) => this.warning('Campo inválido', `O campo "${field}" contém um valor inválido.`),
    success: () => this.success('Validação concluída', 'Todos os campos estão corretos.'),
  };
}

// Instância global do gerenciador de toast
export const toastManager = new ToastManager();

// Hook React para usar o toast manager
export function useToastManager() {
  return toastManager;
}

// Utilitários para casos específicos
export const toastUtils = {
  // Toast com opção de desfazer
  withUndo: (
    title: string,
    description: string,
    undoAction: () => void,
    duration = 8000
  ) => {
    return toastManager.show({
      title,
      description: `${description} (Pressione Ctrl+Z para desfazer)`,
      duration,
    });
  },

  // Toast para confirmação de ação destrutiva
  confirmDelete: (
    entityName: string,
    onConfirm: () => void
  ) => {
    return toastManager.show({
      title: `Excluir ${entityName}?`,
      description: 'Esta ação não pode ser desfeita. Clique novamente para confirmar.',
      variant: 'destructive',
      persistent: true,
    });
  },

  // Toast para progresso de upload/download
  progress: (
    operation: string,
    progress: number,
    total: number
  ) => {
    const percentage = Math.round((progress / total) * 100);
    return toastManager.show({
      title: operation,
      description: `${percentage}% concluído (${progress}/${total})`,
      persistent: progress < total,
    });
  },
};
