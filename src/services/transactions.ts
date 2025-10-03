
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    Timestamp,
    orderBy,
    doc,
    updateDoc,
    deleteDoc,
    setDoc,
    onSnapshot,
    getDoc,
} from "firebase/firestore";
import { startOfMonth, endOfMonth } from "date-fns";
import { db } from "@/lib/firebase";
import { firestoreCache, CacheStrategies } from "@/lib/firestore-cache";
import { notificationService } from "./notifications";
import { createTrackingData, syncTrackingWithTransaction } from "./tracking";

// Estrutura de dados para transação no Firestore
export interface Transaction {
    id: string;
    userId: string;
    type: 'receita' | 'despesa' | 'informativo';
    description: string;
    amount: number;
    category: string;
    date: Timestamp;
    observations?: string;
    
    // Campos específicos para despesas
    km?: number;
    pricePerLiter?: number;
    
    // Campos de entrega
    paymentType?: 'À vista' | 'A receber';
    deliveryStatus?: 'Pendente' | 'Confirmada' | 'A caminho' | 'Entregue' | 'Recusada';
    paymentStatus?: 'Pendente' | 'Pago'; 
    senderCompany?: string;
    recipientCompany?: string;
    recipientPhone?: string;
    senderAddress?: Address;
    recipientAddress?: Address;
    driverId?: string;
    clientId?: string; // ID do cliente que criou a entrega
    assignedDriverId?: string; // ID do motorista selecionado pelo cliente
}

export interface Address {
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
}

export type TransactionInput = Omit<Transaction, 'id' | 'date'> & { date: Date };
export type TransactionUpdateInput = Partial<Omit<TransactionInput, 'userId'>>;

// Função auxiliar para remover campos indefinidos de um objeto
const cleanData = (data: Record<string, any>) => {
    return Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
            acc[key] = value;
        }
        return acc;
    }, {} as { [key: string]: any });
};

/**
 * Adiciona uma nova transação no Firestore.
 * @param transactionData - Os dados da transação.
 */
export const addTransaction = async (transactionData: TransactionInput) => {
    try {
        const dataToSave = {
            ...transactionData,
            date: Timestamp.fromDate(transactionData.date),
        };

        const cleanedData = cleanData(dataToSave);
        const docRef = await addDoc(collection(db, "transactions"), cleanedData);
        
        // Enviar notificação se for uma entrega
        if (transactionData.category === 'Entrega' && transactionData.clientId && transactionData.assignedDriverId) {
            try {
                await notificationService.notifyDeliveryCreated(
                    docRef.id,
                    transactionData.clientId,
                    transactionData.assignedDriverId
                );
            } catch (error) {
                console.error('Erro ao enviar notificação de entrega criada:', error);
            }
        }

        // Criar dados de rastreamento se for uma entrega
        if (transactionData.category === 'Entrega') {
            try {
                console.log('🚀 Iniciando criação de dados de rastreamento para entrega:', docRef.id);
                const transactionWithId = { ...transactionData, id: docRef.id };
                const trackingData = await createTrackingData(transactionWithId);
                console.log('✅ Dados de rastreamento criados com sucesso:', {
                    id: trackingData.id,
                    trackingCode: trackingData.trackingCode,
                    status: trackingData.status
                });
            } catch (error) {
                console.error('❌ Erro ao criar dados de rastreamento:', error);
                console.error('❌ Detalhes do erro:', {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                    transactionData: transactionData
                });
                // Não falhar a transação por causa do rastreamento
            }
        }
        
        // Invalidar cache do usuário
        firestoreCache.invalidate(`transactions_{"userId":"${transactionData.userId}"}`);
        
        return docRef.id;
    } catch (error) {
        console.error("Erro ao adicionar transação: ", error);
        throw error;
    }
};

/**
 * Atualiza uma transação existente no Firestore.
 * @param transactionId - O ID da transação a ser atualizada.
 * @param transactionData - Os dados a serem atualizados.
 */
export const updateTransaction = async (transactionId: string, transactionData: TransactionUpdateInput) => {
    try {
        console.log('🔄 Atualizando transação:', {
            transactionId,
            transactionData
        });

        const transactionRef = doc(db, "transactions", transactionId);
        
        const dataToUpdate: Record<string, any> = { ...transactionData };
        if (transactionData.date) {
            dataToUpdate.date = Timestamp.fromDate(transactionData.date);
            console.log('📅 Data convertida para Timestamp:', dataToUpdate.date);
        }

        const cleanedData = cleanData(dataToUpdate);
        console.log('🧹 Dados limpos para atualização:', cleanedData);
        
        await updateDoc(transactionRef, cleanedData);
        console.log('✅ Transação atualizada no Firestore com sucesso');
        
        // Enviar notificações baseadas no tipo de atualização
        if (transactionData.deliveryStatus) {
            try {
                // Buscar dados da transação para obter clientId e driverId
                const transactionDoc = await getDoc(transactionRef);
                if (transactionDoc.exists()) {
                    const transaction = transactionDoc.data() as Transaction;
                    
                    if (transaction.clientId && transaction.assignedDriverId) {
                        switch (transactionData.deliveryStatus) {
                            case 'Confirmada':
                                await notificationService.notifyDeliveryAccepted(
                                    transactionId,
                                    transaction.clientId,
                                    transaction.assignedDriverId
                                );
                                break;
                            case 'Recusada':
                                await notificationService.notifyDeliveryRejected(
                                    transactionId,
                                    transaction.clientId,
                                    transaction.assignedDriverId
                                );
                                break;
                            case 'Entregue':
                                await notificationService.notifyDeliveryCompleted(
                                    transactionId,
                                    transaction.clientId,
                                    transaction.assignedDriverId
                                );
                                break;
                        }
                    }
                }
            } catch (error) {
                console.error('Erro ao enviar notificação de atualização de entrega:', error);
            }
        }

        // Sincronizar dados de rastreamento se for uma entrega
        if (transactionData.category === 'Entrega' || transactionData.deliveryStatus) {
            try {
                const transactionDoc = await getDoc(transactionRef);
                if (transactionDoc.exists()) {
                    const transaction = transactionDoc.data() as Transaction;
                    await syncTrackingWithTransaction(transaction);
                    console.log('✅ Dados de rastreamento sincronizados para entrega:', transactionId);
                }
            } catch (error) {
                console.error('Erro ao sincronizar dados de rastreamento:', error);
                // Não falhar a atualização por causa do rastreamento
            }
        }
        
        // Invalidar cache relacionado (pode ser de qualquer usuário)
        firestoreCache.invalidate('transactions');
        
    } catch (error) {
        console.error("Erro ao atualizar transação: ", error);
        throw error;
    }
}

/**
 * Exclui uma transação do Firestore.
 * IMPORTANTE: Esta função remove APENAS a transação da entrega.
 * Os destinatários permanecem salvos na coleção 'recipients' para uso futuro.
 * @param transactionId - O ID da transação a ser excluída.
 */
export const deleteTransaction = async (transactionId: string) => {
    try {
        const transactionRef = doc(db, "transactions", transactionId);
        
        // Log para debug: verificar se está removendo apenas a transação
        console.log('🗑️ Excluindo apenas a transação:', transactionId);
        console.log('✅ DESTINATÁRIOS PRESERVADOS: Destinatários permanecem salvos para reuso');
        
        await deleteDoc(transactionRef);
        
        // Invalidar cache relacionado
        firestoreCache.invalidate('transactions');
        
        console.log('✅ Transação excluída com sucesso. Destinatários mantidos.');
    } catch (error) {
        console.error("Erro ao excluir transação: ", error);
        throw error;
    }
}

/**
 * Busca entregas pendentes atribuídas a um motorista específico.
 * @param driverId - O ID do motorista.
 * @returns Lista de entregas pendentes.
 */
export const getPendingDeliveriesForDriver = async (driverId: string): Promise<Transaction[]> => {
    try {
        const q = query(
            collection(db, "transactions"),
            where("category", "==", "Entrega"),
            where("assignedDriverId", "==", driverId),
            where("deliveryStatus", "==", "Pendente"),
            orderBy("date", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Transaction[];
    } catch (error) {
        console.error("Erro ao buscar entregas pendentes para motorista: ", error);
        throw error;
    }
}

/**
 * Busca todas as entregas atribuídas a um motorista (qualquer status).
 * @param driverId - O ID do motorista.
 * @returns Lista de todas as entregas do motorista.
 */
export const getAllDeliveriesForDriver = async (driverId: string): Promise<Transaction[]> => {
    try {
        const q = query(
            collection(db, "transactions"),
            where("category", "==", "Entrega"),
            where("assignedDriverId", "==", driverId),
            orderBy("date", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Transaction[];
    } catch (error) {
        console.error("Erro ao buscar todas as entregas do motorista: ", error);
        throw error;
    }
}


/**
 * Busca todas as transações de um usuário específico com cache.
 * @param userId - O ID do usuário.
 * @param useCache - Se deve usar cache (padrão: true).
 * @returns Um array com as transações do usuário.
 */
export const getTransactions = async (userId: string, useCache: boolean = true): Promise<Transaction[]> => {
    const cacheKey = firestoreCache.generateKey('transactions', { userId });
    
    // Verificar cache primeiro
    if (useCache) {
        const cached = firestoreCache.get<Transaction[]>(cacheKey);
        if (cached) {
            return cached;
        }
    }

    try {
        // Primeiro tenta a query otimizada com orderBy
        let q = query(
            collection(db, "transactions"), 
            where("userId", "==", userId),
            orderBy("date", "desc") // Ordenar no servidor para melhor performance
        );

        let querySnapshot;
        let transactions: Transaction[] = [];
        
        try {
            querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                transactions.push({ id: doc.id, ...doc.data() } as Transaction);
            });
        } catch (indexError: any) {
            // Se falhar por falta de índice, usa query simples
            if (indexError.code === 'failed-precondition') {
                console.warn("Índice não encontrado, usando query simples e ordenando no cliente");
                q = query(
                    collection(db, "transactions"), 
                    where("userId", "==", userId)
                );
                
                querySnapshot = await getDocs(q);
                querySnapshot.forEach((doc) => {
                    transactions.push({ id: doc.id, ...doc.data() } as Transaction);
                });
                
                // Ordenar no cliente como fallback
                transactions.sort((a, b) => {
                    const dateA = a.date instanceof Date ? a.date : a.date.toDate();
                    const dateB = b.date instanceof Date ? b.date : b.date.toDate();
                    return dateB.getTime() - dateA.getTime();
                });
            } else {
                throw indexError;
            }
        }
        
        // Armazenar no cache
        if (useCache) {
            firestoreCache.set(cacheKey, transactions, CacheStrategies.SHORT);
        }
        
        return transactions;
    } catch (error: any) {
        console.error("Erro ao buscar transações: ", error);
        
        // Verificar se é erro de permissão
        if (error.code === 'permission-denied') {
            throw new Error("Permissão insuficiente para acessar os dados.");
        }
        
        // Erro genérico
        throw new Error(`Erro ao carregar transações: ${error.message}`);
    }
};

/**
 * Busca todas as entregas de um cliente específico.
 * @param clientId - O ID do cliente.
 * @param callback - A função de callback para receber as entregas.
 * @returns Uma função para cancelar a inscrição.
 */
export const getDeliveriesByClient = (clientId: string, callback: (deliveries: Transaction[]) => void) => {
    const q = query(
        collection(db, "transactions"),
        where("clientId", "==", clientId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const deliveries: Transaction[] = [];
        querySnapshot.forEach((doc) => {
            deliveries.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        
        // Ordenar no cliente por data (mais recente primeiro)
        deliveries.sort((a, b) => {
            const dateA = a.date instanceof Date ? a.date : a.date.toDate();
            const dateB = b.date instanceof Date ? b.date : b.date.toDate();
            return dateB.getTime() - dateA.getTime();
        });
        
        callback(deliveries);
    }, (error) => {
        console.error("Erro ao buscar entregas do cliente:", error);
        callback([]);
    });

    return unsubscribe;
};

/**
 * Busca todas as entregas de um cliente específico (versão síncrona).
 * @param clientId - O ID do cliente.
 * @returns Uma Promise com as entregas do cliente.
 */
export const getDeliveriesByClientSync = async (clientId: string): Promise<Transaction[]> => {
    try {
        // Query sem orderBy para evitar necessidade de índice
        const q = query(
            collection(db, "transactions"),
            where("clientId", "==", clientId)
        );

        const querySnapshot = await getDocs(q);
        const deliveries: Transaction[] = [];
        querySnapshot.forEach((doc) => {
            deliveries.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        
        // Ordenar no cliente por data (mais recente primeiro)
        deliveries.sort((a, b) => {
            const dateA = a.date instanceof Date ? a.date : a.date.toDate();
            const dateB = b.date instanceof Date ? b.date : b.date.toDate();
            return dateB.getTime() - dateA.getTime();
        });
        
        return deliveries;
    } catch (error) {
        console.error("Erro ao buscar entregas do cliente:", error);
        return [];
    }
};

/**
 * Busca uma transação específica por ID.
 * @param transactionId - O ID da transação.
 * @returns Uma Promise com a transação ou null se não encontrada.
 */
export const getTransactionById = async (transactionId: string): Promise<Transaction | null> => {
  try {
    const transactionRef = doc(db, "transactions", transactionId);
    const transactionDoc = await getDoc(transactionRef);
    
    if (!transactionDoc.exists()) {
      return null;
    }
    
    return { id: transactionDoc.id, ...transactionDoc.data() } as Transaction;
  } catch (error) {
    console.error("Erro ao buscar transação por ID:", error);
    return null;
  }
};

/**
 * Busca usuários por tipo.
 * @param userType - O tipo de usuário a ser buscado.
 * @returns Um array com os usuários do tipo especificado.
 */
export const getUsers = async (userType: string) => {
    try {
        const q = query(collection(db, "users"), where("userType", "==", userType));
        const querySnapshot = await getDocs(q);
        const users: any[] = [];
        querySnapshot.forEach((doc) => {
            users.push({ uid: doc.id, ...doc.data() });
        });
        return users;
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        throw error;
    }
}


/**
 * Salva o valor da ajuda de custo para um usuário.
 * @param userId O ID do usuário.
 * @param amount O valor da ajuda de custo.
 */
export const saveCostAllowance = async (userId: string, amount: number) => {
    try {
        const configRef = doc(db, 'configurations', userId);
        await setDoc(configRef, { costAllowance: amount }, { merge: true });
    } catch (error) {
        console.error("Erro ao salvar ajuda de custo:", error);
        throw error;
    }
};

/**
 * Busca o valor da ajuda de custo para um usuário.
 * @param userId O ID do usuário.
 * @returns O valor da ajuda de custo ou null se não estiver definido.
 */
export const getCostAllowance = async (userId: string): Promise<number | null> => {
    try {
        const configRef = doc(db, 'configurations', userId);
        const docSnap = await getDoc(configRef);
        if (docSnap.exists() && docSnap.data().costAllowance) {
            return docSnap.data().costAllowance;
        }
        return null;
    } catch (error) {
        console.error("Erro ao buscar ajuda de custo:", error);
        return null; // Retorna null em caso de erro para não quebrar a aplicação
    }
};

/**
 * Verifica se a taxa diária de ajuda de custo já foi cobrada para uma empresa.
 * @param userId O ID do usuário.
 * @param senderCompany O nome da empresa remetente.
 * @returns `true` se a taxa já foi cobrada hoje, `false` caso contrário.
 */
export const hasDailyFeeBeenCharged = async (userId: string, senderCompany: string): Promise<boolean> => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startOfDayTimestamp = Timestamp.fromDate(startOfDay);
    const endOfDayTimestamp = Timestamp.fromDate(endOfDay);

    const q = query(
        collection(db, "transactions"),
        where("userId", "==", userId),
        where("senderCompany", "==", senderCompany),
        where("category", "==", "Ajuda de Custo"),
        where("date", ">=", startOfDayTimestamp),
        where("date", "<=", endOfDayTimestamp)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
};

// Função para filtrar transações do mês atual
export const getCurrentMonthTransactions = (transactions: Transaction[]): Transaction[] => {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    
    return transactions.filter(transaction => {
        const transactionDate = transaction.date.toDate();
        return transactionDate >= startOfCurrentMonth && transactionDate <= endOfCurrentMonth;
    });
};

// Função para buscar transações do mês atual (otimizada)
export const getCurrentMonthTransactionsSync = async (userId: string): Promise<Transaction[]> => {
    const cacheKey = firestoreCache.generateKey('currentMonthTransactions', { userId });
    
    // Verificar cache primeiro
    const cached = firestoreCache.get<Transaction[]>(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);
        const endOfCurrentMonth = endOfMonth(now);
        
        // Query otimizada para buscar apenas transações do mês atual
        let q = query(
            collection(db, "transactions"), 
            where("userId", "==", userId),
            where("date", ">=", Timestamp.fromDate(startOfCurrentMonth)),
            where("date", "<=", Timestamp.fromDate(endOfCurrentMonth)),
            orderBy("date", "desc")
        );

        let querySnapshot;
        let transactions: Transaction[] = [];
        
        try {
            querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                transactions.push({ id: doc.id, ...doc.data() } as Transaction);
            });
        } catch (indexError: any) {
            // Se falhar por falta de índice, busca todas e filtra no cliente
            if (indexError.code === 'failed-precondition') {
                console.warn("⚠️ Índice não encontrado, buscando todas as transações e filtrando no cliente");
                const allTransactions = await getTransactions(userId, false);
                transactions = getCurrentMonthTransactions(allTransactions);
            } else {
                throw indexError;
            }
        }

        // Cachear resultado por 5 minutos
        firestoreCache.set(cacheKey, transactions, 5 * 60 * 1000);
        
        return transactions;
    } catch (error) {
        console.error("❌ Erro ao buscar transações do mês atual:", error);
        throw error;
    }
};

// Função para buscar entregas do cliente do mês atual
export const getCurrentMonthDeliveriesByClient = async (clientId: string): Promise<Transaction[]> => {
    console.log('🔍 getCurrentMonthDeliveriesByClient: Iniciando busca para clientId:', clientId);
    
    const cacheKey = firestoreCache.generateKey('currentMonthClientDeliveries', { clientId });
    
    // Verificar cache primeiro
    const cached = firestoreCache.get<Transaction[]>(cacheKey);
    if (cached) {
        console.log('📋 getCurrentMonthDeliveriesByClient: Usando cache, encontradas:', cached.length, 'entregas');
        return cached;
    }

    try {
        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);
        const endOfCurrentMonth = endOfMonth(now);
        
        console.log('📅 getCurrentMonthDeliveriesByClient: Buscando entregas entre', startOfCurrentMonth, 'e', endOfCurrentMonth);
        
        // Estratégia dupla: buscar por clientId E por userId (caso o cliente tenha criado entregas)
        console.log('🔍 getCurrentMonthDeliveriesByClient: Tentando busca por clientId...');
        const deliveriesByClientId = await getDeliveriesByClientSync(clientId);
        console.log('📦 getCurrentMonthDeliveriesByClient: Encontradas', deliveriesByClientId.length, 'entregas por clientId');
        
        console.log('🔍 getCurrentMonthDeliveriesByClient: Tentando busca por userId (fallback)...');
        const deliveriesByUserId = await getTransactions(clientId);
        console.log('📦 getCurrentMonthDeliveriesByClient: Encontradas', deliveriesByUserId.length, 'transações por userId');
        
        // Combinar ambas as buscas e remover duplicatas
        const allPossibleDeliveries = [...deliveriesByClientId, ...deliveriesByUserId];
        const uniqueDeliveries = allPossibleDeliveries.filter((delivery, index, self) => 
            index === self.findIndex(d => d.id === delivery.id)
        );
        
        console.log('📦 getCurrentMonthDeliveriesByClient: Total único de entregas encontradas:', uniqueDeliveries.length);
        
        // Filtrar por categoria, data e mês atual
        const transactions = uniqueDeliveries.filter(t => {
            const isDelivery = t.category === 'Entrega';
            const isCurrentMonth = t.date && (
                (t.date instanceof Timestamp ? t.date.toDate() : t.date) >= startOfCurrentMonth &&
                (t.date instanceof Timestamp ? t.date.toDate() : t.date) <= endOfCurrentMonth
            );
            return isDelivery && isCurrentMonth;
        });

        console.log('✅ getCurrentMonthDeliveriesByClient: Entregas filtradas do mês atual:', transactions.length);
        console.log('📋 getCurrentMonthDeliveriesByClient: Detalhes das entregas:', transactions.map(t => ({
            id: t.id,
            description: t.description,
            clientId: t.clientId,
            userId: t.userId,
            deliveryStatus: t.deliveryStatus,
            date: t.date instanceof Timestamp ? t.date.toDate() : t.date
        })));

        // Cachear resultado por 5 minutos
        firestoreCache.set(cacheKey, transactions, 5 * 60 * 1000);
        
        return transactions;
    } catch (error) {
        console.error("❌ Erro ao buscar entregas do cliente do mês atual:", error);
        throw error;
    }
};

// Função para buscar todas as entregas do cliente (incluindo pendentes de meses anteriores)
export const getAllDeliveriesByClient = async (clientId: string): Promise<Transaction[]> => {
    console.log('🔍 getAllDeliveriesByClient: Iniciando busca para clientId:', clientId);
    
    const cacheKey = firestoreCache.generateKey('allClientDeliveries', { clientId });
    
    // Verificar cache primeiro
    const cached = firestoreCache.get<Transaction[]>(cacheKey);
    if (cached) {
        console.log('📋 getAllDeliveriesByClient: Usando cache, encontradas:', cached.length, 'entregas');
        return cached;
    }

    try {
        // Estratégia dupla: buscar por clientId E por userId (caso o cliente tenha criado entregas)
        console.log('🔍 getAllDeliveriesByClient: Tentando busca por clientId...');
        const deliveriesByClientId = await getDeliveriesByClientSync(clientId);
        console.log('📦 getAllDeliveriesByClient: Encontradas', deliveriesByClientId.length, 'entregas por clientId');
        
        console.log('🔍 getAllDeliveriesByClient: Tentando busca por userId (fallback)...');
        const deliveriesByUserId = await getTransactions(clientId);
        console.log('📦 getAllDeliveriesByClient: Encontradas', deliveriesByUserId.length, 'transações por userId');
        
        // Combinar ambas as buscas e remover duplicatas
        const allPossibleDeliveries = [...deliveriesByClientId, ...deliveriesByUserId];
        const uniqueDeliveries = allPossibleDeliveries.filter((delivery, index, self) => 
            index === self.findIndex(d => d.id === delivery.id)
        );
        
        console.log('📦 getAllDeliveriesByClient: Total único de entregas encontradas:', uniqueDeliveries.length);
        
        // Filtrar apenas por categoria (sem filtro de data)
        const transactions = uniqueDeliveries.filter(t => t.category === 'Entrega');

        console.log('✅ getAllDeliveriesByClient: Entregas filtradas:', transactions.length);
        console.log('📋 getAllDeliveriesByClient: Detalhes das entregas:', transactions.map(t => ({
            id: t.id,
            description: t.description,
            clientId: t.clientId,
            userId: t.userId,
            deliveryStatus: t.deliveryStatus,
            paymentStatus: t.paymentStatus,
            date: t.date instanceof Timestamp ? t.date.toDate() : t.date
        })));

        // Cachear resultado por 5 minutos
        firestoreCache.set(cacheKey, transactions, 5 * 60 * 1000);
        
        return transactions;
    } catch (error) {
        console.error("❌ Erro ao buscar todas as entregas do cliente:", error);
        throw error;
    }
};
