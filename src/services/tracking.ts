// Serviço para sistema de rastreamento de entregas
import { Transaction } from './transactions';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Interface para dados de rastreamento
export interface TrackingData {
  id: string;
  trackingCode: string;
  status: 'Pendente' | 'Confirmada' | 'A caminho' | 'Entregue' | 'Recusada';
  recipientName: string;
  recipientAddress: string;
  recipientPhone?: string;
  senderCompany?: string; // Nome da empresa remetente
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  driverName?: string;
  driverPhone?: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    description?: string;
  }>;
  clientId: string;
  driverId?: string;
}

// Interface para histórico de status
export interface StatusHistoryItem {
  status: string;
  timestamp: string;
  description?: string;
  updatedBy?: string;
}

// Função para gerar código de rastreamento único
export function generateTrackingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Gerar código de 8 caracteres
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// Função para verificar se código já existe
export async function isTrackingCodeUnique(code: string): Promise<boolean> {
  try {
    const trackingRef = collection(db, 'tracking');
    const q = query(trackingRef, where('trackingCode', '==', code));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  } catch (error) {
    console.error('Erro ao verificar código único:', error);
    return false;
  }
}

// Função para gerar código único (verifica se já existe)
export async function generateUniqueTrackingCode(): Promise<string> {
  let code: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateTrackingCode();
    isUnique = await isTrackingCodeUnique(code);
    attempts++;
    
    if (attempts >= maxAttempts) {
      throw new Error('Não foi possível gerar código único após várias tentativas');
    }
  } while (!isUnique);

  return code;
}

// Função para criar dados de rastreamento para uma entrega
export async function createTrackingData(transaction: Transaction | any): Promise<TrackingData> {
  try {
    console.log('🔍 Criando dados de rastreamento para transação:', {
      id: transaction.id,
      category: transaction.category,
      deliveryStatus: transaction.deliveryStatus,
      recipientCompany: transaction.recipientCompany
    });

    const trackingCode = await generateUniqueTrackingCode();
    console.log('🎯 Código de rastreamento gerado:', trackingCode);
    
    const now = new Date().toISOString();
    
    const trackingData: TrackingData = {
      id: transaction.id,
      trackingCode,
      status: transaction.deliveryStatus || 'Pendente',
      recipientName: transaction.recipientCompany || 'N/A',
      recipientAddress: transaction.recipientAddress ? 
        `${transaction.recipientAddress.street}, ${transaction.recipientAddress.number} - ${transaction.recipientAddress.neighborhood}, ${transaction.recipientAddress.city} - ${transaction.recipientAddress.state}` : 
        'N/A',
      recipientPhone: transaction.recipientPhone,
      senderCompany: transaction.senderCompany, // Nome da empresa remetente
      createdAt: transaction.date ? (transaction.date instanceof Date ? transaction.date.toISOString() : transaction.date.toDate().toISOString()) : now,
      updatedAt: now,
      statusHistory: [
        {
          status: transaction.deliveryStatus || 'Pendente',
          timestamp: now,
          description: 'Entrega criada'
        }
      ],
      clientId: transaction.clientId || transaction.userId,
      driverId: transaction.assignedDriverId || null // Usar null em vez de undefined
    };

    console.log('📝 Dados de rastreamento preparados:', {
      id: trackingData.id,
      trackingCode: trackingData.trackingCode,
      status: trackingData.status,
      recipientName: trackingData.recipientName
    });

    // Limpar dados removendo campos undefined
    const cleanTrackingData = Object.fromEntries(
      Object.entries(trackingData).filter(([_, value]) => value !== undefined)
    );

    console.log('🧹 Dados limpos (removendo undefined):', cleanTrackingData);

    // Salvar no Firestore
    const trackingRef = doc(db, 'tracking', transaction.id);
    await setDoc(trackingRef, cleanTrackingData);
    console.log('💾 Dados salvos no Firestore com sucesso');

    return trackingData;
  } catch (error) {
    console.error('❌ Erro ao criar dados de rastreamento:', error);
    if (error instanceof Error) {
      console.error('❌ Stack trace:', error.stack);
    }
    throw error;
  }
}

// Função para buscar dados de rastreamento por código
export async function getTrackingDataByCode(trackingCode: string): Promise<TrackingData | null> {
  try {
    const trackingRef = collection(db, 'tracking');
    const q = query(trackingRef, where('trackingCode', '==', trackingCode.toUpperCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return doc.data() as TrackingData;
  } catch (error) {
    console.error('Erro ao buscar dados de rastreamento:', error);
    return null;
  }
}

// Função para atualizar status de rastreamento
export async function updateTrackingStatus(
  trackingCode: string, 
  newStatus: string, 
  description?: string,
  updatedBy?: string
): Promise<boolean> {
  try {
    const trackingData = await getTrackingDataByCode(trackingCode);
    if (!trackingData) {
      return false;
    }

    const now = new Date().toISOString();
    const newHistoryItem: StatusHistoryItem = {
      status: newStatus,
      timestamp: now,
      description: description || `Status alterado para ${newStatus}`,
      updatedBy
    };

    // Atualizar dados de rastreamento
    const trackingRef = doc(db, 'tracking', trackingData.id);
    await updateDoc(trackingRef, {
      status: newStatus,
      updatedAt: now,
      statusHistory: [...trackingData.statusHistory, newHistoryItem]
    });

    return true;
  } catch (error) {
    console.error('Erro ao atualizar status de rastreamento:', error);
    return false;
  }
}

// Função para buscar dados de rastreamento por ID da transação
export async function getTrackingDataById(transactionId: string): Promise<TrackingData | null> {
  try {
    const trackingRef = doc(db, 'tracking', transactionId);
    const docSnap = await getDoc(trackingRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return docSnap.data() as TrackingData;
  } catch (error) {
    console.error('Erro ao buscar dados de rastreamento por ID:', error);
    return null;
  }
}

// Função para sincronizar dados de rastreamento com transação
export async function syncTrackingWithTransaction(transaction: Transaction): Promise<void> {
  try {
    const trackingData = await getTrackingDataById(transaction.id);
    
    if (!trackingData) {
      // Se não existe, criar dados de rastreamento
      await createTrackingData(transaction);
    } else {
      // Se existe, atualizar dados
      const trackingRef = doc(db, 'tracking', transaction.id);
      await updateDoc(trackingRef, {
        status: transaction.deliveryStatus,
        recipientName: transaction.recipientCompany,
        recipientAddress: transaction.recipientAddress ? 
          `${transaction.recipientAddress.street}, ${transaction.recipientAddress.number} - ${transaction.recipientAddress.neighborhood}, ${transaction.recipientAddress.city} - ${transaction.recipientAddress.state}` : 
          'N/A',
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erro ao sincronizar dados de rastreamento:', error);
  }
}

// Função para adicionar item ao histórico de status
export async function addStatusHistoryItem(
  trackingCode: string,
  status: string,
  description?: string,
  updatedBy?: string
): Promise<boolean> {
  try {
    const trackingData = await getTrackingDataByCode(trackingCode);
    if (!trackingData) {
      return false;
    }

    const now = new Date().toISOString();
    const newHistoryItem: StatusHistoryItem = {
      status,
      timestamp: now,
      description,
      updatedBy
    };

    const trackingRef = doc(db, 'tracking', trackingData.id);
    await updateDoc(trackingRef, {
      statusHistory: [...trackingData.statusHistory, newHistoryItem],
      updatedAt: now
    });

    return true;
  } catch (error) {
    console.error('Erro ao adicionar item ao histórico:', error);
    return false;
  }
}

// Função para formatar código de rastreamento para exibição
export function formatTrackingCode(code: string): string {
  return code.toUpperCase().replace(/(.{4})/g, '$1-').slice(0, -1);
}

// Função para validar formato do código de rastreamento
export function isValidTrackingCode(code: string): boolean {
  const cleanCode = code.replace(/[^A-Z0-9]/g, '');
  return cleanCode.length === 8 && /^[A-Z0-9]{8}$/.test(cleanCode);
}

// Função para migrar entregas existentes que não possuem código de rastreamento
export async function migrateExistingDeliveriesWithoutTracking(): Promise<{ migrated: number; errors: number }> {
  try {
    console.log('🚀 Iniciando migração de entregas existentes...');
    
    // Buscar todas as transações que são entregas
    const transactionsRef = collection(db, 'transactions');
    const q = query(transactionsRef, where('category', '==', 'Entrega'));
    const querySnapshot = await getDocs(q);
    
    console.log(`📦 Encontradas ${querySnapshot.size} entregas para verificar`);
    
    let migrated = 0;
    let errors = 0;
    
    for (const doc of querySnapshot.docs) {
      try {
        const transaction = doc.data();
        const transactionId = doc.id;
        
        // Verificar se já existe dados de rastreamento
        const trackingData = await getTrackingDataById(transactionId);
        
        if (trackingData) {
          console.log(`⏭️  Entrega ${transactionId} já possui dados de rastreamento, pulando...`);
          continue;
        }
        
        // Criar dados de rastreamento para esta entrega
        await createTrackingData({ ...transaction, id: transactionId });
        
        console.log(`✅ Entrega ${transactionId} migrada com sucesso`);
        migrated++;
        
      } catch (error) {
        console.error(`❌ Erro ao migrar entrega ${doc.id}:`, error);
        errors++;
      }
    }
    
    console.log(`\n🎉 Migração concluída!`);
    console.log(`✅ Entregas migradas: ${migrated}`);
    console.log(`❌ Erros: ${errors}`);
    
    return { migrated, errors };
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  }
}
