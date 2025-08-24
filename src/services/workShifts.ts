
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
  limit,
  deleteDoc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Pause {
    startTime: Timestamp;
    endTime: Timestamp | null;
}

export interface WorkShift {
  id: string;
  userId: string;
  startTime: Timestamp;
  endTime: Timestamp | null;
  status: 'active' | 'completed' | 'paused';
  startKm: number;
  endKm: number | null;
  pauses: Pause[];
  totalPauseDuration: number;
}

export interface WorkShiftInput extends Partial<Omit<WorkShift, 'id' | 'startTime' | 'endTime' | 'pauses'>> {
    startTime?: Date;
    endTime?: Date | null;
}

/**
 * Inicia uma nova jornada de trabalho para o usuário.
 * @param userId - O ID do usuário.
 * @param startKm - A quilometragem inicial.
 */
export const startShift = async (userId: string, startKm: number): Promise<string> => {
  // Verifica se já existe uma jornada ativa
  const activeShift = await getActiveShift(userId);
  if (activeShift) {
    throw new Error('Já existe uma jornada de trabalho ativa.');
  }

  try {
    const shiftData = {
      userId,
      startTime: Timestamp.now(),
      endTime: null,
      status: 'active',
      startKm,
      endKm: null,
      pauses: [],
      totalPauseDuration: 0,
    };
    const docRef = await addDoc(collection(db, 'workShifts'), shiftData);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao iniciar jornada: ', error);
    throw error;
  }
};

/**
 * Finaliza uma jornada de trabalho ativa.
 * @param shiftId - O ID da jornada a ser finalizada.
 * @param endKm - A quilometragem final.
 */
export const endShift = async (shiftId: string, endKm: number): Promise<void> => {
  try {
    const shiftRef = doc(db, 'workShifts', shiftId);
    await updateDoc(shiftRef, {
      endTime: Timestamp.now(),
      status: 'completed',
      endKm,
    });
  } catch (error) {
    console.error('Erro ao finalizar jornada: ', error);
    throw error;
  }
};

/**
 * Pausa uma jornada de trabalho ativa.
 * @param shiftId - O ID da jornada a ser pausada.
 */
export const pauseShift = async (shiftId: string): Promise<void> => {
    try {
        const shiftRef = doc(db, 'workShifts', shiftId);
        await updateDoc(shiftRef, {
            status: 'paused',
            pauses: arrayUnion({
                startTime: Timestamp.now(),
                endTime: null,
            })
        });
    } catch (error) {
        console.error('Erro ao pausar jornada: ', error);
        throw error;
    }
}

/**
 * Retoma uma jornada de trabalho pausada.
 * @param shift - O objeto da jornada a ser retomada.
 */
export const resumeShift = async (shift: WorkShift): Promise<void> => {
    try {
        const shiftRef = doc(db, 'workShifts', shift.id);
        const lastPause = shift.pauses[shift.pauses.length - 1];
        
        if (lastPause && !lastPause.endTime) {
            lastPause.endTime = Timestamp.now();
            
            const pauseDuration = (lastPause.endTime.toMillis() - lastPause.startTime.toMillis()) / (1000 * 60); // em minutos
            const newTotalPauseDuration = (shift.totalPauseDuration || 0) + pauseDuration;

            await updateDoc(shiftRef, {
                status: 'active',
                pauses: shift.pauses,
                totalPauseDuration: newTotalPauseDuration
            });
        }
    } catch (error) {
        console.error('Erro ao retomar jornada: ', error);
        throw error;
    }
};

/**
 * Atualiza uma jornada de trabalho existente.
 * @param shiftId - O ID da jornada.
 * @param data - Os dados a serem atualizados.
 */
export const updateShift = async (shiftId: string, data: WorkShiftInput): Promise<void> => {
    try {
        const shiftRef = doc(db, 'workShifts', shiftId);
        const dataToUpdate: { [key: string]: any } = { ...data };

        if (data.startTime) {
            dataToUpdate.startTime = Timestamp.fromDate(data.startTime);
        }
        if (data.endTime) {
            dataToUpdate.endTime = Timestamp.fromDate(data.endTime);
        } else if (data.endTime === null) {
            dataToUpdate.endTime = null;
        }


        await updateDoc(shiftRef, dataToUpdate);
    } catch (error) {
        console.error("Erro ao atualizar jornada: ", error);
        throw error;
    }
}


/**
 * Exclui uma jornada de trabalho do Firestore.
 * @param shiftId - O ID da jornada a ser excluída.
 */
export const deleteShift = async (shiftId: string): Promise<void> => {
    try {
        const shiftRef = doc(db, 'workShifts', shiftId);
        await deleteDoc(shiftRef);
    } catch (error) {
        console.error("Erro ao excluir jornada: ", error);
        throw error;
    }
}

/**
 * Busca a jornada de trabalho ativa de um usuário.
 * @param userId - O ID do usuário.
 * @returns A jornada ativa ou null se não houver.
 */
export const getActiveShift = async (
  userId: string
): Promise<WorkShift | null> => {
  try {
    const q = query(
      collection(db, 'workShifts'),
      where('userId', '==', userId),
      where('status', 'in', ['active', 'paused']),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as WorkShift;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar jornada ativa: ', error);
    throw error;
  }
};

/**
 * Busca o histórico de jornadas de um usuário.
 * @param userId - O ID do usuário.
 * @returns Um array com as jornadas do usuário.
 */
export const getShifts = async (userId: string): Promise<WorkShift[]> => {
  try {
    const q = query(
      collection(db, 'workShifts'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const shifts: WorkShift[] = [];
    querySnapshot.forEach((doc) => {
      shifts.push({ id: doc.id, ...doc.data() } as WorkShift);
    });

    // Ordena as jornadas pela data de início em ordem decrescente (mais recente primeiro)
    return shifts.sort((a, b) => b.startTime.toDate().getTime() - a.startTime.toDate().getTime());
  } catch (error) {
    console.error('Erro ao buscar histórico de jornadas: ', error);
    throw error;
  }
};
