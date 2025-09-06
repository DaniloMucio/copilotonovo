import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import type { Address } from './transactions';

export interface Recipient {
    id: string;
    userId: string;
    name: string;
    address: Address;
    createdAt: Date;
    updatedAt: Date;
}

export type RecipientInput = Omit<Recipient, 'id' | 'createdAt' | 'updatedAt'>;

// Função para criar um novo destinatário
export async function createRecipient(userId: string, name: string, address: Address): Promise<Recipient> {
    try {
        const now = new Date();
        const recipientToCreate = {
            userId,
            name,
            address,
            createdAt: now,
            updatedAt: now,
        };

        const docRef = await addDoc(collection(db, 'recipients'), recipientToCreate);
        
        return {
            id: docRef.id,
            ...recipientToCreate,
        };
    } catch (error) {
        console.error('Erro ao criar destinatário:', error);
        throw new Error('Falha ao criar destinatário');
    }
}

// Função para buscar destinatários por usuário
export async function getRecipientsByUser(userId: string): Promise<Recipient[]> {
    try {
        const q = query(
            collection(db, 'recipients'),
            where('userId', '==', userId),
            orderBy('name', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const recipients: Recipient[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            recipients.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            } as Recipient);
        });

        console.log(`📋 Destinatários encontrados para o usuário ${userId}:`, recipients.length);
        console.log('📋 Lista de destinatários:', recipients.map(r => r.name));

        return recipients;
    } catch (error) {
        console.error('Erro ao buscar destinatários:', error);
        throw new Error('Falha ao buscar destinatários');
    }
}

// Função para buscar um destinatário por nome e usuário
export async function findRecipientByName(userId: string, name: string): Promise<Recipient | null> {
    try {
        const q = query(
            collection(db, 'recipients'),
            where('userId', '==', userId),
            where('name', '==', name)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return null;
        }
        
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Recipient;
    } catch (error) {
        console.error('Erro ao buscar destinatário por nome:', error);
        throw new Error('Falha ao buscar destinatário');
    }
}

// Função para buscar ou criar destinatário automaticamente
export async function findOrCreateRecipient(
    userId: string, 
    name: string, 
    address: Address
): Promise<Recipient> {
    try {
        console.log(`🔍 Buscando destinatário "${name}" para o usuário ${userId}`);
        
        // Primeiro, tenta encontrar um destinatário existente
        const existingRecipient = await findRecipientByName(userId, name);
        
        if (existingRecipient) {
            console.log(`✅ Destinatário "${name}" encontrado nos registros!`);
            return existingRecipient;
        }
        
        console.log(`➕ Destinatário "${name}" não encontrado. Criando novo...`);
        
        // Se não encontrou, cria um novo destinatário
        const newRecipient = await createRecipient(userId, name, address);
        
        console.log(`✅ Novo destinatário "${name}" criado com sucesso! ID: ${newRecipient.id}`);
        
        return newRecipient;
    } catch (error) {
        console.error('Erro ao buscar ou criar destinatário:', error);
        throw new Error('Falha ao processar destinatário');
    }
}

// Função para buscar um destinatário por ID
export async function getRecipientById(recipientId: string): Promise<Recipient | null> {
    try {
        const docRef = doc(db, 'recipients', recipientId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            return null;
        }
        
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Recipient;
    } catch (error) {
        console.error('Erro ao buscar destinatário por ID:', error);
        throw new Error('Falha ao buscar destinatário');
    }
}
