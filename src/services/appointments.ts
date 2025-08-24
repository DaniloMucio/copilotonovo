import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Define a estrutura de dados para um agendamento
export interface Appointment {
  id?: string;
  userId: string;
  title: string;
  date: string; // Data do agendamento
  type: "maintenance" | "general"; // Tipo de agendamento
  observations?: string; // Observações adicionais
  mileage?: number; // KM para revisão (apenas se type for 'maintenance')
  createdAt: number; // Timestamp da criação
}

const APPOINTMENTS_COLLECTION = "appointments";

// --- Funções CRUD para Agendamentos ---

/**
 * Cria um novo agendamento no Firestore.
 * @param appointment - O objeto de agendamento a ser criado.
 * @returns O ID do documento criado.
 */
export const createAppointment = async (
  appointment: Omit<Appointment, "id" | "createdAt">
): Promise<string> => {
  try {
    // Cria uma cópia limpa do objeto para evitar enviar 'undefined'
    const dataToSave = { ...appointment };

    // Remove chaves com valor 'undefined' antes de enviar ao Firestore
    Object.keys(dataToSave).forEach((key) => {
      if ((dataToSave as any)[key] === undefined) {
        delete (dataToSave as any)[key];
      }
    });

    const docRef = await addDoc(collection(db, APPOINTMENTS_COLLECTION), {
      ...dataToSave,
      createdAt: Date.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    throw new Error("Não foi possível criar o agendamento.");
  }
};

/**
 * Busca todos os agendamentos de um usuário.
 * @param userId - O ID do usuário.
 * @returns Uma lista de agendamentos.
 */
export const getAppointments = async (
  userId: string
): Promise<Appointment[]> => {
  try {
    const q = query(
      collection(db, APPOINTMENTS_COLLECTION),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Appointment)
    );
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    throw new Error("Não foi possível buscar os agendamentos.");
  }
};

/**
 * Atualiza um agendamento existente.
 * @param id - O ID do agendamento a ser atualizado.
 * @param updates - Os campos a serem atualizados.
 */
export const updateAppointment = async (
  id: string,
  updates: Partial<Appointment>
): Promise<void> => {
  try {
    const docRef = doc(db, APPOINTMENTS_COLLECTION, id);
    await updateDoc(docRef, updates);
  } catch (error)
 {
    console.error("Erro ao atualizar agendamento:", error);
    throw new Error("Não foi possível atualizar o agendamento.");
  }
};

/**
 * Deleta um agendamento.
 * @param id - O ID do agendamento a ser deletado.
 */
export const deleteAppointment = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, APPOINTMENTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Erro ao deletar agendamento:", error);
    throw new Error("Não foi possível deletar o agendamento.");
  }
};
