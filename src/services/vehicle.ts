import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDoc,
  setDoc,
  limit
} from 'firebase/firestore';

// Tipos para dados de veículo
export interface VehicleInfo {
  id?: string;
  userId: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  currentKm: number;
  fuelTank: number;
  averageConsumption: number;
  color?: string;
  vin?: string;
  insurance?: {
    company: string;
    policy: string;
    expiry: Date;
  };
  registration?: {
    number: string;
    expiry: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceItem {
  id?: string;
  userId: string;
  vehicleId: string;
  type: 'oil' | 'tire' | 'brake' | 'filter' | 'battery' | 'coolant' | 'other';
  description: string;
  date: Date;
  nextDate: Date;
  cost: number;
  km: number;
  nextKm: number;
  workshop?: string;
  mechanic?: string;
  notes?: string;
  receipts?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FuelRecord {
  id?: string;
  userId: string;
  vehicleId: string;
  date: Date;
  liters: number;
  cost: number;
  km: number;
  station: string;
  fuelType: 'gasoline' | 'ethanol' | 'diesel' | 'flex';
  pricePerLiter: number;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Buscar informações do veículo do usuário (primeiro veículo - compatibilidade)
export async function getUserVehicle(userId: string): Promise<VehicleInfo | null> {
  try {
    const vehicles = await getUserVehicles(userId);
    return vehicles.length > 0 ? vehicles[0] : null;
  } catch (error) {
    console.error('Erro ao buscar veículo:', error);
    throw new Error('Falha ao carregar informações do veículo');
  }
}

// Buscar todos os veículos do usuário
export async function getUserVehicles(userId: string): Promise<VehicleInfo[]> {
  try {
    const q = query(
      collection(db, 'vehicles'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const vehicles: VehicleInfo[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      vehicles.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
        insurance: data.insurance ? {
          ...data.insurance,
          expiry: data.insurance.expiry ? data.insurance.expiry.toDate() : new Date()
        } : undefined,
        registration: data.registration ? {
          ...data.registration,
          expiry: data.registration.expiry ? data.registration.expiry.toDate() : new Date()
        } : undefined
      } as VehicleInfo);
    });
    
    return vehicles;
  } catch (error) {
    console.error('Erro ao buscar veículos:', error);
    throw new Error('Falha ao carregar informações dos veículos');
  }
}

// Criar novo veículo
export async function saveVehicleInfo(vehicleInfo: Omit<VehicleInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const now = new Date();
    const vehicleData = {
      ...vehicleInfo,
      createdAt: now,
      updatedAt: now,
    };

    // Sempre criar um novo veículo
    const docRef = await addDoc(collection(db, 'vehicles'), vehicleData);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao salvar veículo:', error);
    throw new Error('Falha ao salvar informações do veículo');
  }
}

// Atualizar informações do veículo
export async function updateVehicleInfo(vehicleId: string, vehicleInfo: Partial<VehicleInfo>): Promise<void> {
  try {
    const now = new Date();
    const vehicleData = {
      ...vehicleInfo,
      updatedAt: now,
    };

    await updateDoc(doc(db, 'vehicles', vehicleId), vehicleData);
  } catch (error) {
    console.error('Erro ao atualizar veículo:', error);
    throw new Error('Falha ao atualizar informações do veículo');
  }
}

// Excluir veículo
export async function deleteVehicle(vehicleId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'vehicles', vehicleId));
  } catch (error) {
    console.error('Erro ao excluir veículo:', error);
    throw new Error('Falha ao excluir veículo');
  }
}

// Buscar manutenções do veículo
export async function getVehicleMaintenance(
  userId: string,
  vehicleId?: string
): Promise<MaintenanceItem[]> {
  try {
    // Query simplificada sem orderBy para evitar necessidade de índice composto
    let q = query(
      collection(db, 'maintenance'),
      where('userId', '==', userId)
    );

    if (vehicleId) {
      q = query(q, where('vehicleId', '==', vehicleId));
    }

    const querySnapshot = await getDocs(q);
    const maintenanceItems: MaintenanceItem[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Verificar se os campos de data existem antes de chamar toDate()
      const maintenanceItem = {
        id: doc.id,
        ...data,
        date: data.date ? data.date.toDate() : new Date(),
        nextDate: data.nextDate ? data.nextDate.toDate() : new Date(),
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      } as MaintenanceItem;
      
      maintenanceItems.push(maintenanceItem);
    });

    // Ordenar em memória para evitar necessidade de índice composto
    return maintenanceItems.sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error('Erro ao buscar manutenções:', error);
    throw new Error('Falha ao carregar histórico de manutenções');
  }
}

// Adicionar nova manutenção
export async function addMaintenance(
  maintenance: Omit<MaintenanceItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const now = new Date();
    const maintenanceData = {
      ...maintenance,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, 'maintenance'), maintenanceData);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar manutenção:', error);
    throw new Error('Falha ao salvar manutenção');
  }
}

// Atualizar manutenção
export async function updateMaintenance(
  maintenanceId: string,
  updates: Partial<MaintenanceItem>
): Promise<void> {
  try {
    const maintenanceRef = doc(db, 'maintenance', maintenanceId);
    await updateDoc(maintenanceRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Erro ao atualizar manutenção:', error);
    throw new Error('Falha ao atualizar manutenção');
  }
}

// Excluir manutenção
export async function deleteMaintenance(maintenanceId: string): Promise<void> {
  try {
    const maintenanceRef = doc(db, 'maintenance', maintenanceId);
    await deleteDoc(maintenanceRef);
  } catch (error) {
    console.error('Erro ao excluir manutenção:', error);
    throw new Error('Falha ao excluir manutenção');
  }
}

// Buscar registros de combustível
export async function getFuelRecords(
  userId: string,
  vehicleId?: string
): Promise<FuelRecord[]> {
  try {
    // Query simplificada sem orderBy para evitar necessidade de índice composto
    let q = query(
      collection(db, 'fuel'),
      where('userId', '==', userId)
    );

    if (vehicleId) {
      q = query(q, where('vehicleId', '==', vehicleId));
    }

    const querySnapshot = await getDocs(q);
    const fuelRecords: FuelRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Verificar se os campos de data existem antes de chamar toDate()
      const fuelRecord = {
        id: doc.id,
        ...data,
        date: data.date ? data.date.toDate() : new Date(),
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      } as FuelRecord;
      
      fuelRecords.push(fuelRecord);
    });

    // Ordenar em memória para evitar necessidade de índice composto
    return fuelRecords.sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error('Erro ao buscar registros de combustível:', error);
    throw new Error('Falha ao carregar histórico de combustível');
  }
}

// Adicionar novo registro de combustível
export async function addFuelRecord(
  fuelRecord: Omit<FuelRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const now = new Date();
    const fuelData = {
      ...fuelRecord,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, 'fuel'), fuelData);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar registro de combustível:', error);
    throw new Error('Falha ao salvar registro de combustível');
  }
}

// Atualizar registro de combustível
export async function updateFuelRecord(
  fuelRecordId: string,
  updates: Partial<FuelRecord>
): Promise<void> {
  try {
    const fuelRef = doc(db, 'fuel', fuelRecordId);
    await updateDoc(fuelRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Erro ao atualizar registro de combustível:', error);
    throw new Error('Falha ao atualizar registro de combustível');
  }
}

// Excluir registro de combustível
export async function deleteFuelRecord(fuelRecordId: string): Promise<void> {
  try {
    const fuelRef = doc(db, 'fuel', fuelRecordId);
    await deleteDoc(fuelRef);
  } catch (error) {
    console.error('Erro ao excluir registro de combustível:', error);
    throw new Error('Falha ao excluir registro de combustível');
  }
}

// Calcular estatísticas do veículo
export async function calculateVehicleStats(userId: string): Promise<{
  totalMaintenanceCost: number;
  totalFuelCost: number;
  urgentMaintenance: MaintenanceItem[];
  averageConsumption: number;
}> {
  try {
    const [maintenanceItems, fuelRecords] = await Promise.all([
      getVehicleMaintenance(userId),
      getFuelRecords(userId)
    ]);

    const totalMaintenanceCost = maintenanceItems.reduce((sum, item) => sum + item.cost, 0);
    const totalFuelCost = fuelRecords.reduce((sum, record) => sum + record.cost, 0);
    
    // Manutenções urgentes (próximos 7 dias ou 1000 km)
    const now = new Date();
    const urgentMaintenance = maintenanceItems.filter(item => {
      const daysUntilNext = Math.ceil((item.nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilNext <= 7;
    });

    // Consumo médio de combustível
    const totalKm = fuelRecords.reduce((sum, record) => sum + record.km, 0);
    const totalLiters = fuelRecords.reduce((sum, record) => sum + record.liters, 0);
    const averageConsumption = totalLiters > 0 ? totalKm / totalLiters : 0;

    return {
      totalMaintenanceCost,
      totalFuelCost,
      urgentMaintenance,
      averageConsumption
    };
  } catch (error) {
    console.error('Erro ao calcular estatísticas do veículo:', error);
    throw new Error('Falha ao calcular estatísticas do veículo');
  }
}

// Gerar dados de exemplo para usuários novos
export function generateSampleVehicleData(userId: string): {
  vehicle: Omit<VehicleInfo, 'id' | 'createdAt' | 'updatedAt'>;
  maintenance: Omit<MaintenanceItem, 'id' | 'createdAt' | 'updatedAt'>[];
  fuel: Omit<FuelRecord, 'id' | 'createdAt' | 'updatedAt'>[];
} {
  const today = new Date();
  
  const vehicle: Omit<VehicleInfo, 'id' | 'createdAt' | 'updatedAt'> = {
    userId,
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    plate: 'ABC-1234',
    currentKm: 48500,
    fuelTank: 50,
    averageConsumption: 12.5,
    color: 'Prata',
    insurance: {
      company: 'Porto Seguro',
      policy: 'PS-123456',
      expiry: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
    },
    registration: {
      number: 'REG-789012',
      expiry: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
    }
  };

  const maintenance: Omit<MaintenanceItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      userId,
      vehicleId: 'sample',
      type: 'oil',
      description: 'Troca de óleo e filtro',
      date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
      nextDate: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 dias
      cost: 120.00,
      km: 45000,
      nextKm: 50000,
      workshop: 'Oficina Central',
      notes: 'Óleo sintético 5W30'
    },
    {
      userId,
      vehicleId: 'sample',
      type: 'tire',
      description: 'Troca de pneus',
      date: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 dias atrás
      nextDate: new Date(today.getTime() + 300 * 24 * 60 * 60 * 1000), // 300 dias
      cost: 800.00,
      km: 42000,
      nextKm: 72000,
      workshop: 'Pneus Express',
      notes: 'Pneus Michelin'
    }
  ];

  const fuel: Omit<FuelRecord, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      userId,
      vehicleId: 'sample',
      date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 dias atrás
      liters: 45.5,
      cost: 225.75,
      km: 48500,
      station: 'Posto Ipiranga',
      fuelType: 'flex',
      pricePerLiter: 4.96,
      location: 'São Paulo - SP'
    },
    {
      userId,
      vehicleId: 'sample',
      date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 dias atrás
      liters: 42.0,
      cost: 210.00,
      km: 47800,
      station: 'Posto Shell',
      fuelType: 'flex',
      pricePerLiter: 5.00,
      location: 'São Paulo - SP'
    }
  ];

  return { vehicle, maintenance, fuel };
}
