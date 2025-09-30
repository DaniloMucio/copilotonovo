'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Car, 
  Fuel, 
  Wrench, 
  Calendar, 
  AlertTriangle, 
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react';
import { format, addDays, addMonths, isAfter, isBefore, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getUserVehicle, 
  getUserVehicles,
  getVehicleMaintenance, 
  getFuelRecords, 
  calculateVehicleStats,
  deleteVehicle,
  deleteMaintenance,
  type VehicleInfo as RealVehicleInfo,
  type MaintenanceItem as RealMaintenanceItem,
  type FuelRecord as RealFuelRecord
} from '@/services/vehicle';
import { getTransactions, type Transaction } from '@/services/transactions';
import { VehicleForm } from '@/components/forms/VehicleForm';
import { FuelForm } from '@/components/forms/FuelForm';
import { MaintenanceForm } from '@/components/forms/MaintenanceForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
// Removido - debug não é mais necessário

// Tipos para gestão de veículo (compatibilidade)
interface MaintenanceItem {
  id: string;
  type: 'oil' | 'tire' | 'brake' | 'filter' | 'other';
  description: string;
  date: string;
  nextDate: string;
  cost: number;
  km: number;
  nextKm: number;
  notes?: string;
}

// Usar o tipo real do serviço
type FuelRecord = RealFuelRecord;

interface VehicleInfo {
  brand: string;
  model: string;
  year: number;
  plate: string;
  currentKm: number;
  fuelTank: number;
  averageConsumption: number;
}

// Dados de exemplo para usuários novos (serão substituídos por dados reais)

// Componente de item de manutenção
function MaintenanceCard({ 
  item, 
  onEdit, 
  onDelete, 
  currentKm 
}: { 
  item: MaintenanceItem; 
  onEdit: (item: MaintenanceItem) => void;
  onDelete: (id: string) => void;
  currentKm: number;
}) {
  const daysUntilNext = differenceInDays(new Date(item.nextDate), new Date());
  const kmUntilNext = item.nextKm - currentKm;
  const isUrgent = daysUntilNext <= 7 || kmUntilNext <= 1000;
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'oil': return '🛢️';
      case 'tire': return '🛞';
      case 'brake': return '🛑';
      case 'filter': return '🔍';
      default: return '🔧';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'oil': return 'Óleo';
      case 'tire': return 'Pneus';
      case 'brake': return 'Freios';
      case 'filter': return 'Filtros';
      default: return 'Outros';
    }
  };

  return (
    <Card className={`shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500 ${isUrgent ? 'ring-2 ring-orange-500' : ''}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">{item.description}</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {getTypeName(item.type)} • R$ {item.cost.toFixed(2)}
              </CardDescription>
            </div>
          </div>
          
          {isUrgent && (
            <div className="flex items-center gap-1 text-orange-600 text-xs">
              <AlertTriangle className="h-3 w-3" />
              {daysUntilNext <= 7 ? 'Urgente' : 'Atenção'}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 relative z-10">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-gray-600">Última manutenção</Label>
            <p className="font-medium text-gray-900">{format(new Date(item.date), 'dd/MM/yyyy')}</p>
          </div>
          <div>
            <Label className="text-gray-600">Próxima manutenção</Label>
            <p className="font-medium text-gray-900">{format(new Date(item.nextDate), 'dd/MM/yyyy')}</p>
          </div>
          <div>
            <Label className="text-gray-600">KM atual</Label>
            <p className="font-medium text-gray-900">{item.km.toLocaleString()}</p>
          </div>
          <div>
            <Label className="text-gray-600">Próximo KM</Label>
            <p className="font-medium text-gray-900">{item.nextKm.toLocaleString()}</p>
          </div>
        </div>
        
        {item.notes && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">
            {item.notes}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-600">
            {daysUntilNext > 0 ? `${daysUntilNext} dias restantes` : 'Vencido há ' + Math.abs(daysUntilNext) + ' dias'}
            {kmUntilNext > 0 ? ` • ${kmUntilNext.toLocaleString()} km restantes` : ' • KM vencido'}
          </div>
          
          <div className="flex gap-2">
            <Button 
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
              size="sm" 
              onClick={() => onEdit(item)}
            >
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
            <Button 
              className="bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
              size="sm" 
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Excluir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de registro de combustível
function FuelRecordCard({ record, onEdit, onDelete }: { 
  record: FuelRecord; 
  onEdit: (record: FuelRecord) => void;
  onDelete: (id: string) => void;
}) {
  const getFuelTypeIcon = (type: string) => {
    switch (type) {
      case 'gasoline': return '⛽';
      case 'ethanol': return '🌱';
      case 'diesel': return '🛢️';
      case 'flex': return '⚡';
      default: return '⛽';
    }
  };

  const getFuelTypeName = (type: string) => {
    switch (type) {
      case 'gasoline': return 'Gasolina';
      case 'ethanol': return 'Etanol';
      case 'diesel': return 'Diesel';
      case 'flex': return 'Flex';
      default: return 'Gasolina';
    }
  };

  return (
    <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
              <Fuel className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">{record.station}</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {getFuelTypeName(record.fuelType)} • {format(new Date(record.date), 'dd/MM/yyyy')}
              </CardDescription>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">
              R$ {record.cost.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              {record.liters}L • R$ {(record.cost / record.liters).toFixed(2)}/L
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
          <div>
            <Label className="text-gray-600">Quilometragem</Label>
            <p className="font-medium text-gray-900">{record.km.toLocaleString()} km</p>
          </div>
          <div>
            <Label className="text-gray-600">Consumo médio</Label>
            <p className="font-medium text-gray-900">{(record.km / record.liters).toFixed(1)} km/L</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-600">
            KM: {record.km.toLocaleString()}
          </div>
          
          <div className="flex gap-2">
            <Button 
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
              size="sm" 
              onClick={() => onEdit(record)}
            >
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
            <Button 
              className="bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
              size="sm" 
              onClick={() => onDelete(record.id || '')}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Excluir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente principal de gestão de veículo
export function VehicleManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([]);
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vehicles, setVehicles] = useState<RealVehicleInfo[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<RealVehicleInfo | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<RealVehicleInfo | null>(null);
  const [isFuelFormOpen, setIsFuelFormOpen] = useState(false);
  const [fuelToEdit, setFuelToEdit] = useState<FuelRecord | null>(null);

  const [maintenanceToEdit, setMaintenanceToEdit] = useState<RealMaintenanceItem | null>(null);
  const [isMaintenanceFormOpen, setIsMaintenanceFormOpen] = useState(false);

  // Carregar dados reais do Firestore
  useEffect(() => {
    if (!user?.uid) return;

    const loadVehicleData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Iniciando carregamento de dados do veículo...');
        console.log('👤 User ID:', user.uid);

        // Removido - debug não é mais necessário

        console.log('🔍 Carregando dados em paralelo...');
        
        // Carregar dados em paralelo
        const [userVehicles, maintenance, fuel, stats, transactions] = await Promise.all([
          getUserVehicles(user.uid),
          getVehicleMaintenance(user.uid),
          getFuelRecords(user.uid),
          calculateVehicleStats(user.uid),
          getTransactions(user.uid)
        ]);

        console.log('✅ Dados carregados:', { 
          vehicles: userVehicles.length, 
          maintenance: maintenance.length, 
          fuel: fuel.length 
        });

        // Atualizar lista de veículos
        setVehicles(userVehicles);
        if (userVehicles.length > 0) {
          setSelectedVehicle(userVehicles[0]); // Selecionar o primeiro veículo por padrão
        }

        // Converter manutenções para formato compatível
        const convertedMaintenance: MaintenanceItem[] = maintenance.map(item => ({
          id: item.id || '',
          type: item.type === 'coolant' || item.type === 'battery' ? 'other' : item.type,
          description: item.description,
          date: format(item.date, 'yyyy-MM-dd'),
          nextDate: format(item.nextDate, 'yyyy-MM-dd'),
          cost: item.cost,
          km: item.km,
          nextKm: item.nextKm,
          notes: item.notes
        }));

        // Converter registros de combustível para formato compatível
        const convertedFuel: FuelRecord[] = fuel.map(record => ({
          ...record,
          id: record.id || '',
          userId: record.userId || user.uid,
          vehicleId: record.vehicleId || '',
          pricePerLiter: record.pricePerLiter || 0,
          createdAt: record.createdAt || new Date(),
          updatedAt: record.updatedAt || new Date()
        }));

        // Adicionar transações de combustível das despesas
        const fuelTransactions = (transactions || [])
          .filter(t => t.type === 'despesa' && t.category === 'Combustível' && t.km && t.pricePerLiter)
          .map(t => ({
            id: `fuel_${t.id}`,
            userId: user.uid,
            vehicleId: '',
            date: t.date instanceof Date ? t.date : t.date.toDate(),
            liters: t.amount / (t.pricePerLiter || 1),
            cost: t.amount,
            km: t.km || 0,
            station: 'Posto (Transação)',
            fuelType: 'gasoline' as any,
            pricePerLiter: t.pricePerLiter || 0,
            createdAt: new Date(),
            updatedAt: new Date()
          } as FuelRecord));

        // Combinar dados de combustível
        const allFuelRecords = [...convertedFuel, ...fuelTransactions];

        setMaintenanceItems(convertedMaintenance);
        setFuelRecords(allFuelRecords);
        setTransactions(transactions);

        console.log('🎉 Dados do veículo carregados com sucesso!');

      } catch (err) {
        console.error('❌ Erro ao carregar dados do veículo:', err);
        
        // Erro mais detalhado
        let errorMessage = 'Erro ao carregar dados do veículo.';
        
        if (err instanceof Error) {
          if (err.message.includes('permission-denied')) {
            errorMessage = 'Sem permissão para acessar os dados. Verifique se está logado.';
          } else if (err.message.includes('unavailable')) {
            errorMessage = 'Serviço temporariamente indisponível. Tente novamente.';
          } else if (err.message.includes('not-found')) {
            errorMessage = 'Dados não encontrados. Você pode não ter veículo cadastrado ainda.';
          } else {
            errorMessage = `Erro: ${err.message}`;
          }
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadVehicleData();
  }, [user?.uid]);

  // Calcula estatísticas
  const totalMaintenanceCost = maintenanceItems.reduce((sum, item) => sum + item.cost, 0);
  const totalFuelCost = fuelRecords.reduce((sum, record) => sum + record.cost, 0);
  
          // Adicionar custos de manutenção das transações
        const maintenanceTransactions = (transactions || [])
          .filter(t => t.type === 'despesa' && t.category === 'Manutenção')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalMaintenanceWithTransactions = totalMaintenanceCost + maintenanceTransactions;
  
  const urgentMaintenance = maintenanceItems.filter(item => {
    const daysUntilNext = differenceInDays(new Date(item.nextDate), new Date());
    const kmUntilNext = item.nextKm - (selectedVehicle?.currentKm || 0);
    return daysUntilNext <= 7 || kmUntilNext <= 1000;
  });

  const handleAddFuel = () => {
    // Implementar modal de adição
    console.log('Adicionar combustível');
  };

  const handleAddMaintenance = () => {
    setMaintenanceToEdit(null);
    setIsMaintenanceFormOpen(true);
  };

  const handleEditMaintenance = (item: MaintenanceItem) => {
    // Converter para o tipo real
    const realMaintenance: RealMaintenanceItem = {
      id: item.id,
      userId: user?.uid || '',
      vehicleId: selectedVehicle?.id || '',
      type: item.type === 'other' ? 'other' : item.type,
      description: item.description,
      date: new Date(item.date),
      nextDate: new Date(item.nextDate),
      cost: item.cost,
      km: item.km,
      nextKm: item.nextKm,
      notes: item.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setMaintenanceToEdit(realMaintenance);
    setIsMaintenanceFormOpen(true);
  };

  const handleEditFuel = (record: FuelRecord) => {
    setFuelToEdit(record);
    setIsFuelFormOpen(true);
  };

  const handleDeleteMaintenance = async (id: string) => {
    try {
      await deleteMaintenance(id);
      toast({
        title: 'Manutenção excluída!',
        description: 'A manutenção foi excluída com sucesso.',
      });
      // Recarregar dados
      if (user?.uid) {
        const maintenance = await getVehicleMaintenance(user.uid);
        const convertedMaintenance: MaintenanceItem[] = maintenance.map(item => ({
          id: item.id || '',
          type: item.type === 'coolant' || item.type === 'battery' ? 'other' : item.type,
          description: item.description,
          date: format(item.date, 'yyyy-MM-dd'),
          nextDate: format(item.nextDate, 'yyyy-MM-dd'),
          cost: item.cost,
          km: item.km,
          nextKm: item.nextKm,
          notes: item.notes
        }));
        setMaintenanceItems(convertedMaintenance);
      }
    } catch (error) {
      console.error('Erro ao excluir manutenção:', error);
      toast({
        title: 'Erro ao excluir manutenção',
        description: 'Não foi possível excluir a manutenção.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFuel = (id: string) => {
    setFuelRecords(prev => prev.filter(record => record.id !== id));
  };

  const handleMaintenanceFormSuccess = async () => {
    setIsMaintenanceFormOpen(false);
    setMaintenanceToEdit(null);
    
    // Recarregar dados de manutenção
    if (user?.uid) {
      try {
        const maintenance = await getVehicleMaintenance(user.uid);
        const convertedMaintenance: MaintenanceItem[] = maintenance.map(item => ({
          id: item.id || '',
          type: item.type === 'coolant' || item.type === 'battery' ? 'other' : item.type,
          description: item.description,
          date: format(item.date, 'yyyy-MM-dd'),
          nextDate: format(item.nextDate, 'yyyy-MM-dd'),
          cost: item.cost,
          km: item.km,
          nextKm: item.nextKm,
          notes: item.notes
        }));
        setMaintenanceItems(convertedMaintenance);
      } catch (error) {
        console.error('Erro ao recarregar manutenções:', error);
      }
    }
  };

  const handleMaintenanceFormCancel = () => {
    setIsMaintenanceFormOpen(false);
    setMaintenanceToEdit(null);
  };

  const handleAddVehicle = () => {
    setVehicleToEdit(null);
    setIsVehicleFormOpen(true);
  };

  const handleEditVehicle = (vehicle: RealVehicleInfo) => {
    setVehicleToEdit(vehicle);
    setIsVehicleFormOpen(true);
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!user) return;
    
    try {
      await deleteVehicle(vehicleId);
      toast({
        title: 'Sucesso!',
        description: 'Veículo excluído com sucesso.',
      });
      
      // Recarregar lista de veículos
      const updatedVehicles = await getUserVehicles(user.uid);
      setVehicles(updatedVehicles);
      
      // Se o veículo excluído era o selecionado, selecionar outro
      if (selectedVehicle?.id === vehicleId) {
        setSelectedVehicle(updatedVehicles.length > 0 ? updatedVehicles[0] : null);
      }
    } catch (error) {
      console.error('Erro ao excluir veículo:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível excluir o veículo.',
      });
    }
  };

  const handleVehicleFormSuccess = async () => {
    setIsVehicleFormOpen(false);
    setVehicleToEdit(null);
    
    // Recarregar lista de veículos
    if (user?.uid) {
      try {
        const updatedVehicles = await getUserVehicles(user.uid);
        setVehicles(updatedVehicles);
        
        // Se não há veículo selecionado, selecionar o primeiro
        if (!selectedVehicle && updatedVehicles.length > 0) {
          setSelectedVehicle(updatedVehicles[0]);
        }
      } catch (error) {
        console.error('Erro ao recarregar veículos:', error);
      }
    }
  };

  const handleVehicleFormCancel = () => {
    setIsVehicleFormOpen(false);
    setVehicleToEdit(null);
  };

  const handleFuelFormSuccess = () => {
    setIsFuelFormOpen(false);
    setFuelToEdit(null);
    // Recarregar dados de combustível
    if (user?.uid) {
      getFuelRecords(user.uid).then(fuel => {
        if (fuel) {
          const convertedFuel: FuelRecord[] = fuel.map(record => ({
            ...record,
            id: record.id || '',
            userId: record.userId || user.uid,
            vehicleId: record.vehicleId || '',
            pricePerLiter: record.pricePerLiter || 0,
            createdAt: record.createdAt || new Date(),
            updatedAt: record.updatedAt || new Date()
          }));
          setFuelRecords(convertedFuel);
        }
      });
    }
  };

  const handleFuelFormCancel = () => {
    setIsFuelFormOpen(false);
    setFuelToEdit(null);
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Veículo</h1>
            <p className="text-muted-foreground">
              Carregando dados do veículo...
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar erro
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Veículo</h1>
            <p className="text-muted-foreground">
              Erro ao carregar dados
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-red-600 font-medium mb-2">Erro ao carregar dados</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Veículo</h1>
          <p className="text-muted-foreground">
            Controle manutenções, combustível e informações do seu veículo
          </p>
        </div>
        
                 {/* Botão debug removido */}
      </div>

      {/* Lista de veículos */}
      <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Car className="h-4 w-4 text-white" />
              </div>
              Meus Veículos ({vehicles.length})
            </CardTitle>
            <Button 
              onClick={handleAddVehicle} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Veículo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {vehicles.length > 0 ? (
            <div className="space-y-4">
              {vehicles.map((vehicle) => (
                <div 
                  key={vehicle.id} 
                  className={`p-4 border rounded-xl cursor-pointer transition-all duration-300 ${
                    selectedVehicle?.id === vehicle.id 
                      ? 'border-blue-500 bg-blue-50 shadow-lg' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {vehicle.brand} {vehicle.model} {vehicle.year}
                        </h3>
                        {selectedVehicle?.id === vehicle.id && (
                          <Badge variant="default" className="text-xs">Ativo</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <Label className="text-muted-foreground">Placa</Label>
                          <p className="font-medium font-mono">{vehicle.plate}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">KM Atual</Label>
                          <p className="font-medium">{vehicle.currentKm.toLocaleString()} km</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Consumo Médio</Label>
                          <p className="font-medium">{vehicle.averageConsumption} km/L</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Tanque</Label>
                          <p className="font-medium">{vehicle.fuelTank}L</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditVehicle(vehicle);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            className="bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Veículo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o veículo <strong>{vehicle.brand} {vehicle.model}</strong> (placa: <strong>{vehicle.plate}</strong>)?
                              <br /><br />
                              Esta ação não pode ser desfeita e excluirá permanentemente:
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Dados do veículo</li>
                                <li>Histórico de manutenções</li>
                                <li>Registros de combustível</li>
                                <li>Transações relacionadas</li>
                              </ul>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteVehicle(vehicle.id!)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir Veículo
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Car className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum veículo cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Cadastre seu primeiro veículo para começar a controlar manutenções e combustível.
              </p>
              <Button onClick={handleAddVehicle}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Veículo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-900">Custo Total Manutenção</CardTitle>
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
              <Wrench className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-red-600">
              R$ {totalMaintenanceWithTransactions.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">
              {maintenanceItems.length} itens + transações
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-900">Custo Total Combustível</CardTitle>
            <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
              <Fuel className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-orange-600">
              R$ {totalFuelCost.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">
              {fuelRecords.length} abastecimentos
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-900">Manutenções Urgentes</CardTitle>
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-600 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-orange-600">
              {urgentMaintenance.length}
            </div>
            <p className="text-xs text-gray-600">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-900">Eficiência</CardTitle>
            <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center shadow-lg">
              <Zap className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-green-600">
              {selectedVehicle?.averageConsumption || 0}
            </div>
            <p className="text-xs text-gray-600">
              km/L médio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="tabs-list-mobile grid w-full grid-cols-3 border-0 rounded-2xl shadow-lg p-1">
          <TabsTrigger 
            value="overview"
            className="tabs-trigger-mobile rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
          >
            Visão Geral
          </TabsTrigger>
          <TabsTrigger 
            value="maintenance"
            className="tabs-trigger-mobile rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
          >
            Manutenção
          </TabsTrigger>
          <TabsTrigger 
            value="fuel"
            className="tabs-trigger-mobile rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
          >
            Combustível
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Manutenções recentes */}
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Wrench className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900">Manutenções Recentes</CardTitle>
                    <CardDescription className="text-gray-600">Últimas manutenções realizadas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 relative z-10">
                {maintenanceItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
                        <Wrench className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.description}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(item.date), 'dd/MM/yyyy')} • R$ {item.cost.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <Button 
                      className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                      size="sm" 
                      onClick={() => handleEditMaintenance(item)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Abastecimentos recentes */}
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center shadow-lg">
                    <Fuel className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900">Abastecimentos Recentes</CardTitle>
                    <CardDescription className="text-gray-600">Últimos abastecimentos registrados</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 relative z-10">
                {fuelRecords.slice(0, 3).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                        <Fuel className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{record.station}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(record.date), 'dd/MM/yyyy')} • {record.liters}L
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">R$ {record.cost.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Controle de Manutenção</h3>
              <p className="text-sm text-gray-600 mt-1">
                Registre e acompanhe as manutenções do seu veículo
              </p>
            </div>
            <Button 
              onClick={handleAddMaintenance} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Manutenção
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {maintenanceItems.map((item) => (
              <MaintenanceCard
                key={item.id}
                item={item}
                onEdit={handleEditMaintenance}
                onDelete={handleDeleteMaintenance}
                currentKm={selectedVehicle?.currentKm || 0}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="fuel" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Controle de Combustível</h3>
            <p className="text-sm text-gray-600 mt-1">
              Abastecimentos registrados através do formulário de despesas
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {fuelRecords.map((record) => (
              <FuelRecordCard
                key={record.id}
                record={record}
                onEdit={handleEditFuel}
                onDelete={handleDeleteFuel}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de edição de veículo */}
      <VehicleForm
        isOpen={isVehicleFormOpen}
        vehicleToEdit={vehicleToEdit}
        onSuccess={handleVehicleFormSuccess}
        onCancel={handleVehicleFormCancel}
      />

      {/* Modal de edição de combustível */}
      <FuelForm
        isOpen={isFuelFormOpen}
        fuelToEdit={fuelToEdit}
        onSuccess={handleFuelFormSuccess}
        onCancel={handleFuelFormCancel}
      />

      {/* Modal de manutenção */}
      <MaintenanceForm
        isOpen={isMaintenanceFormOpen}
        maintenanceToEdit={maintenanceToEdit}
        onSuccess={handleMaintenanceFormSuccess}
        onCancel={handleMaintenanceFormCancel}
      />
    </div>
  );
}
