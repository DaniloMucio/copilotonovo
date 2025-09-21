
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, where, query, deleteDoc, writeBatch } from "firebase/firestore"; 
import { db, auth } from "@/lib/firebase";
import type { User } from 'firebase/auth';

export interface UserData {
  displayName: string;
  email: string;
  userType: 'motorista' | 'cliente' | 'admin';
  cpf?: string;
  cnpj?: string;
  cnh?: string;
  phone?: string;
  companyName?: string;
  isOnline?: boolean;
  isActive?: boolean; // Flag para indicar se a conta está ativa
  tempPassword?: string; // Senha temporária para usuários criados pelo admin
  needsAuthSetup?: boolean; // Flag para indicar que precisa configurar autenticação
  createdAt?: Date; // Data de criação do usuário
  updatedAt?: Date; // Data da última atualização
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
 * Cria dados básicos para um usuário que não possui documento no Firestore.
 * @param userId - O ID do usuário.
 * @param userType - O tipo do usuário.
 * @param displayName - Nome do usuário.
 * @param email - Email do usuário.
 */
export const createBasicUserData = async (
    userId: string, 
    userType: 'motorista' | 'cliente' | 'admin',
    displayName: string,
    email: string
): Promise<UserData> => {
    try {
        console.log(`🔄 Criando dados básicos para usuário ${userId} (${userType})`);
        
        const basicUserData: UserData = {
            displayName,
            email,
            userType,
            isOnline: false,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await createUserDocument(userId, basicUserData);
        console.log(`✅ Dados básicos criados para usuário ${userId}`);
        
        return basicUserData;
    } catch (error) {
        console.error("❌ Erro ao criar dados básicos do usuário:", error);
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
        console.log("🔍 Buscando motoristas online...");
        
        // Buscar todos os usuários
        const allUsersQuery = query(collection(db, "users"));
        const allUsersSnapshot = await getDocs(allUsersQuery);
        
        console.log(`📊 Total de usuários encontrados: ${allUsersSnapshot.size}`);
        
        // Filtrar apenas motoristas online
        const allUsers = allUsersSnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        })) as (UserData & { uid: string })[];
        
        console.log("🔍 Todos os usuários encontrados:", allUsers.map(user => ({
            uid: user.uid,
            displayName: user.displayName,
            userType: user.userType,
            isOnline: user.isOnline
        })));
        
        // Filtrar motoristas
        const motoristas = allUsers.filter(user => user.userType === 'motorista');
        console.log(`🚛 Total de motoristas encontrados: ${motoristas.length}`);
        console.log("🔍 Motoristas:", motoristas.map(driver => ({
            uid: driver.uid,
            displayName: driver.displayName,
            isOnline: driver.isOnline
        })));
        
        // Filtrar apenas motoristas online
        const onlineDrivers = motoristas.filter(user => user.isOnline === true);
        
        console.log(`✅ Motoristas online encontrados: ${onlineDrivers.length}`);
        console.log("🔍 Motoristas online:", onlineDrivers.map(driver => ({
            uid: driver.uid,
            displayName: driver.displayName,
            isOnline: driver.isOnline
        })));
        
        return onlineDrivers;
    } catch (error) {
        console.error("❌ Erro ao buscar motoristas online:", error);
        console.log("⚠️ Erro detectado, retornando lista vazia");
        return [];
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
 * Inicializa o campo isOnline para usuários que não possuem este campo.
 * Esta função deve ser executada apenas por administradores.
 */
export const initializeIsOnlineField = async (): Promise<void> => {
    try {
        console.log("🔄 Inicializando campo isOnline para usuários existentes...");
        
        // Buscar todos os usuários
        const usersQuery = query(collection(db, "users"));
        const usersSnapshot = await getDocs(usersQuery);
        
        const batch = writeBatch(db);
        let updateCount = 0;
        
        usersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            
            // Se o campo isOnline não existir, inicializar como false
            if (data.isOnline === undefined) {
                batch.update(doc.ref, { isOnline: false });
                updateCount++;
                console.log(`📝 Marcado para atualização: ${doc.id} (${data.userType})`);
            }
        });
        
        if (updateCount > 0) {
            await batch.commit();
            console.log(`✅ Campo isOnline inicializado para ${updateCount} usuários`);
        } else {
            console.log("ℹ️ Todos os usuários já possuem o campo isOnline");
        }
        
    } catch (error) {
        console.error("❌ Erro ao inicializar campo isOnline:", error);
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

/**
 * Remove todos os dados de um usuário do Firestore.
 * Esta função deve ser chamada ANTES de excluir a conta do Firebase Auth.
 * @param userId - O ID do usuário.
 * @param userType - O tipo do usuário (motorista, cliente ou admin).
 */
export const deleteUserData = async (userId: string, userType: 'motorista' | 'cliente' | 'admin'): Promise<void> => {
    try {
        console.log(`🗑️ Iniciando exclusão de dados para usuário ${userId} (${userType})`);
        
        const batch = writeBatch(db);
        let deletedCount = 0;

        // 1. Excluir dados do usuário
        try {
            const userRef = doc(db, "users", userId);
            batch.delete(userRef);
            deletedCount++;
            console.log(`✅ Marcado para exclusão: documento do usuário`);
        } catch (error) {
            console.warn("⚠️ Erro ao marcar usuário para exclusão:", error);
        }

        // 2. Excluir transações do usuário
        try {
            const transactionsQuery = query(collection(db, "transactions"), where("userId", "==", userId));
            const transactionsSnapshot = await getDocs(transactionsQuery);
            transactionsSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
                deletedCount++;
            });
            console.log(`✅ Marcado para exclusão: ${transactionsSnapshot.size} transações`);
        } catch (error) {
            console.warn("⚠️ Erro ao buscar transações:", error);
        }

        // 3. Excluir agendamentos (se for cliente)
        if (userType === 'cliente') {
            try {
                const appointmentsQuery = query(collection(db, "appointments"), where("clientId", "==", userId));
                const appointmentsSnapshot = await getDocs(appointmentsQuery);
                appointmentsSnapshot.forEach((doc) => {
                    batch.delete(doc.ref);
                    deletedCount++;
                });
                console.log(`✅ Marcado para exclusão: ${appointmentsSnapshot.size} agendamentos`);
            } catch (error) {
                console.warn("⚠️ Erro ao buscar agendamentos:", error);
            }
        }

        // 4. Excluir jornadas de trabalho (se for motorista)
        if (userType === 'motorista') {
            try {
                const shiftsQuery = query(collection(db, "workShifts"), where("userId", "==", userId));
                const shiftsSnapshot = await getDocs(shiftsQuery);
                shiftsSnapshot.forEach((doc) => {
                    batch.delete(doc.ref);
                    deletedCount++;
                });
                console.log(`✅ Marcado para exclusão: ${shiftsSnapshot.size} jornadas de trabalho`);
            } catch (error) {
                console.warn("⚠️ Erro ao buscar jornadas:", error);
            }

            // 5. Excluir dados de veículos (se for motorista)
            try {
                const vehiclesQuery = query(collection(db, "vehicles"), where("userId", "==", userId));
                const vehiclesSnapshot = await getDocs(vehiclesQuery);
                vehiclesSnapshot.forEach((doc) => {
                    batch.delete(doc.ref);
                    deletedCount++;
                });
                console.log(`✅ Marcado para exclusão: ${vehiclesSnapshot.size} veículos`);
            } catch (error) {
                console.warn("⚠️ Erro ao buscar veículos:", error);
            }
        }

        // 6. Excluir notificações do usuário
        try {
            const notificationsQuery = query(collection(db, "notifications"), where("userId", "==", userId));
            const notificationsSnapshot = await getDocs(notificationsQuery);
            notificationsSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
                deletedCount++;
            });
            console.log(`✅ Marcado para exclusão: ${notificationsSnapshot.size} notificações`);
        } catch (error) {
            console.warn("⚠️ Erro ao buscar notificações:", error);
        }

        // 7. Excluir configurações de notificação
        try {
            const notificationSettingsQuery = query(collection(db, "notificationSettings"), where("userId", "==", userId));
            const notificationSettingsSnapshot = await getDocs(notificationSettingsQuery);
            notificationSettingsSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
                deletedCount++;
            });
            console.log(`✅ Marcado para exclusão: ${notificationSettingsSnapshot.size} configurações de notificação`);
        } catch (error) {
            console.warn("⚠️ Erro ao buscar configurações de notificação:", error);
        }

        // Executar todas as exclusões em lote
        if (deletedCount > 0) {
            try {
                await batch.commit();
                console.log(`✅ Exclusão concluída: ${deletedCount} documentos removidos`);
            } catch (error) {
                console.error("❌ Erro ao executar batch de exclusão:", error);
                throw new Error("Não foi possível excluir todos os dados do usuário. Tente novamente.");
            }
        } else {
            console.log(`ℹ️ Nenhum documento encontrado para exclusão`);
        }

    } catch (error) {
        console.error("❌ Erro ao excluir dados do usuário:", error);
        throw new Error("Não foi possível excluir todos os dados do usuário. Tente novamente.");
    }
};

/**
 * EXCLUSÃO COMPLETA DE USUÁRIO - Remove TODOS os dados relacionados
 * Esta função remove completamente um usuário e todos os seus dados do sistema.
 * Após esta exclusão, o email poderá ser reutilizado para criar uma nova conta.
 * 
 * @param userId - O ID do usuário a ser excluído
 * @param userType - O tipo do usuário (motorista, cliente ou admin)
 * @param isAdminAction - Se true, indica que é uma exclusão feita por admin
 * @returns Promise<{ success: boolean; deletedCount: number; errors: string[] }>
 */
export const deleteUserCompletely = async (
    userId: string, 
    userType: 'motorista' | 'cliente' | 'admin',
    isAdminAction: boolean = false
): Promise<{ success: boolean; deletedCount: number; errors: string[] }> => {
    const errors: string[] = [];
    let deletedCount = 0;
    
    try {
        console.log(`🗑️ INICIANDO EXCLUSÃO COMPLETA DO USUÁRIO ${userId} (${userType})`);
        console.log(`📋 Tipo de exclusão: ${isAdminAction ? 'ADMIN' : 'AUTO-EXCLUSÃO'}`);
        
        // Lista de todas as coleções que podem conter dados do usuário
        const collectionsToCheck = [
            { name: 'users', field: '__name__', value: userId },
            { name: 'transactions', field: 'userId', value: userId },
            { name: 'appointments', field: 'userId', value: userId },
            { name: 'workShifts', field: 'userId', value: userId },
            { name: 'vehicles', field: 'userId', value: userId },
            { name: 'notifications', field: 'userId', value: userId },
            { name: 'notificationSettings', field: 'userId', value: userId },
            { name: 'subscriptions', field: 'userId', value: userId },
            { name: 'deliveries', field: 'userId', value: userId },
            { name: 'deliveries', field: 'clientId', value: userId },
            { name: 'deliveries', field: 'driverId', value: userId },
            { name: 'transactions', field: 'clientId', value: userId },
            { name: 'transactions', field: 'driverId', value: userId },
            { name: 'transactions', field: 'assignedDriverId', value: userId }
        ];

        // Processar exclusões em lotes para evitar limites do Firestore
        const batchSize = 500; // Limite do Firestore
        let currentBatch = writeBatch(db);
        let currentBatchCount = 0;

        for (const collectionInfo of collectionsToCheck) {
            try {
                console.log(`🔍 Verificando coleção: ${collectionInfo.name} (campo: ${collectionInfo.field})`);
                
                const q = query(
                    collection(db, collectionInfo.name), 
                    where(collectionInfo.field, "==", collectionInfo.value)
                );
                const snapshot = await getDocs(q);
                
                if (snapshot.size > 0) {
                    console.log(`📄 Encontrados ${snapshot.size} documentos em ${collectionInfo.name}`);
                    
                    for (const docSnapshot of snapshot.docs) {
                        // Se o lote atual está cheio, executar e criar novo
                        if (currentBatchCount >= batchSize) {
                            try {
                                await currentBatch.commit();
                                console.log(`✅ Lote executado: ${currentBatchCount} documentos excluídos`);
                                deletedCount += currentBatchCount;
                                currentBatchCount = 0;
                                currentBatch = writeBatch(db);
                            } catch (error) {
                                console.error(`❌ Erro ao executar lote:`, error);
                                errors.push(`Erro ao executar lote de exclusão: ${error}`);
                            }
                        }
                        
                        currentBatch.delete(docSnapshot.ref);
                        currentBatchCount++;
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Erro ao processar coleção ${collectionInfo.name}:`, error);
                errors.push(`Erro na coleção ${collectionInfo.name}: ${error}`);
            }
        }

        // Executar o último lote se houver documentos
        if (currentBatchCount > 0) {
            try {
                await currentBatch.commit();
                console.log(`✅ Lote final executado: ${currentBatchCount} documentos excluídos`);
                deletedCount += currentBatchCount;
            } catch (error) {
                console.error(`❌ Erro ao executar lote final:`, error);
                errors.push(`Erro ao executar lote final: ${error}`);
            }
        }

        // Log final da exclusão
        console.log(`🎯 EXCLUSÃO COMPLETA FINALIZADA:`);
        console.log(`📊 Total de documentos excluídos: ${deletedCount}`);
        console.log(`⚠️ Erros encontrados: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log(`❌ Lista de erros:`, errors);
        }

        return {
            success: errors.length === 0,
            deletedCount,
            errors
        };

    } catch (error) {
        console.error("❌ ERRO CRÍTICO na exclusão completa:", error);
        errors.push(`Erro crítico: ${error}`);
        
        return {
            success: false,
            deletedCount,
            errors
        };
    }
};
