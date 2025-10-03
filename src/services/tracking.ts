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
    const trackingCode = await generateUniqueTrackingCode();
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
      driverId: transaction.assignedDriverId
    };

    // Salvar no Firestore
    const trackingRef = doc(db, 'tracking', transaction.id);
    await setDoc(trackingRef, trackingData);

    return trackingData;
  } catch (error) {
    console.error('Erro ao criar dados de rastreamento:', error);
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
