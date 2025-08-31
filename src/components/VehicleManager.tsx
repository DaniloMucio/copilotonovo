'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { 
  getUserVehicle, 
  getVehicleMaintenance, 
  getFuelRecords, 
  calculateVehicleStats,
  type VehicleInfo as RealVehicleInfo,
  type MaintenanceItem as RealMaintenanceItem,
  type FuelRecord as RealFuelRecord
} from '@/services/vehicle';
import { getTransactions, type Transaction } from '@/services/transactions';
import { VehicleForm } from '@/components/forms/VehicleForm';
import { FuelForm } from '@/components/forms/FuelForm';
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
    <Card className={`hover:shadow-lg transition-shadow ${isUrgent ? 'ring-2 ring-orange-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getTypeIcon(item.type)}</span>
            <div>
              <CardTitle className="text-lg">{item.description}</CardTitle>
              <CardDescription className="text-sm">
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
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-muted-foreground">Última manutenção</Label>
            <p className="font-medium">{format(new Date(item.date), 'dd/MM/yyyy')}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Próxima manutenção</Label>
            <p className="font-medium">{format(new Date(item.nextDate), 'dd/MM/yyyy')}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">KM atual</Label>
            <p className="font-medium">{item.km.toLocaleString()}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Próximo KM</Label>
            <p className="font-medium">{item.nextKm.toLocaleString()}</p>
          </div>
        </div>
        
        {item.notes && (
          <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
            {item.notes}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {daysUntilNext > 0 ? `${daysUntilNext} dias restantes` : 'Vencido há ' + Math.abs(daysUntilNext) + ' dias'}
            {kmUntilNext > 0 ? ` • ${kmUntilNext.toLocaleString()} km restantes` : ' • KM vencido'}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(item.id)}>
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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getFuelTypeIcon(record.fuelType)}</span>
            <div>
              <CardTitle className="text-lg">{record.station}</CardTitle>
              <CardDescription className="text-sm">
                {getFuelTypeName(record.fuelType)} • {format(new Date(record.date), 'dd/MM/yyyy')}
              </CardDescription>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">
              R$ {record.cost.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">
              {record.liters}L • R$ {(record.cost / record.liters).toFixed(2)}/L
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
          <div>
            <Label className="text-muted-foreground">Quilometragem</Label>
            <p className="font-medium">{record.km.toLocaleString()} km</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Consumo médio</Label>
            <p className="font-medium">{(record.km / record.liters).toFixed(1)} km/L</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            KM: {record.km.toLocaleString()}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(record)}>
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(record.id || '')}>
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
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([]);
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    brand: '',
    model: '',
    year: 0,
    plate: '',
    currentKm: 0,
    fuelTank: 0,
    averageConsumption: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<RealVehicleInfo | null>(null);
  const [isFuelFormOpen, setIsFuelFormOpen] = useState(false);
  const [fuelToEdit, setFuelToEdit] = useState<FuelRecord | null>(null);

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
        const [vehicle, maintenance, fuel, stats, transactions] = await Promise.all([
          getUserVehicle(user.uid),
          getVehicleMaintenance(user.uid),
          getFuelRecords(user.uid),
          calculateVehicleStats(user.uid),
          getTransactions(user.uid)
        ]);

        console.log('✅ Dados carregados:', { 
          vehicle: !!vehicle, 
          maintenance: maintenance.length, 
          fuel: fuel.length 
        });

        // Atualizar informações do veículo
        if (vehicle) {
          setVehicleInfo({
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            plate: vehicle.plate,
            currentKm: vehicle.currentKm,
            fuelTank: vehicle.fuelTank,
            averageConsumption: vehicle.averageConsumption
          });
          setVehicleToEdit(vehicle);
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
    const kmUntilNext = item.nextKm - vehicleInfo.currentKm;
    return daysUntilNext <= 7 || kmUntilNext <= 1000;
  });

  const handleAddMaintenance = () => {
    // Implementar modal de adição
    console.log('Adicionar manutenção');
  };

  const handleAddFuel = () => {
    // Implementar modal de adição
    console.log('Adicionar combustível');
  };

  const handleEditMaintenance = (item: MaintenanceItem) => {
    // Implementar modal de edição
    console.log('Editar manutenção:', item);
  };

  const handleEditFuel = (record: FuelRecord) => {
    setFuelToEdit(record);
    setIsFuelFormOpen(true);
  };

  const handleDeleteMaintenance = (id: string) => {
    setMaintenanceItems(prev => prev.filter(item => item.id !== id));
  };

  const handleDeleteFuel = (id: string) => {
    setFuelRecords(prev => prev.filter(record => record.id !== id));
  };

  const handleEditVehicle = () => {
    setIsVehicleFormOpen(true);
  };

  const handleVehicleFormSuccess = () => {
    setIsVehicleFormOpen(false);
    setVehicleToEdit(null);
    // Recarregar dados do veículo
    if (user?.uid) {
      getUserVehicle(user.uid).then(vehicle => {
        if (vehicle) {
          setVehicleInfo({
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            plate: vehicle.plate,
            currentKm: vehicle.currentKm,
            fuelTank: vehicle.fuelTank,
            averageConsumption: vehicle.averageConsumption
          });
          setVehicleToEdit(vehicle);
        }
      });
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

      {/* Informações do veículo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Informações do Veículo
            </CardTitle>
            <Button onClick={handleEditVehicle} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-muted-foreground">Veículo</Label>
              <p className="font-medium">{vehicleInfo.brand} {vehicleInfo.model} {vehicleInfo.year}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Placa</Label>
              <p className="font-medium font-mono">{vehicleInfo.plate}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">KM Atual</Label>
              <p className="font-medium">{vehicleInfo.currentKm.toLocaleString()} km</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Consumo Médio</Label>
              <p className="font-medium">{vehicleInfo.averageConsumption} km/L</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Custo Total Manutenção</CardTitle>
             <Wrench className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-red-600">
               R$ {totalMaintenanceWithTransactions.toFixed(2)}
             </div>
             <p className="text-xs text-muted-foreground">
               {maintenanceItems.length} itens + transações
             </p>
           </CardContent>
         </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total Combustível</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {totalFuelCost.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {fuelRecords.length} abastecimentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manutenções Urgentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {urgentMaintenance.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {vehicleInfo.averageConsumption}
            </div>
            <p className="text-xs text-muted-foreground">
              km/L médio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
          <TabsTrigger value="fuel">Combustível</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         {/* Manutenções recentes */}
             <Card>
               <CardHeader>
                 <div>
                   <CardTitle className="text-lg">Manutenções Recentes</CardTitle>
                   <CardDescription>Últimas manutenções realizadas</CardDescription>
                 </div>
               </CardHeader>
              <CardContent className="space-y-3">
                {maintenanceItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔧</span>
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(item.date), 'dd/MM/yyyy')} • R$ {item.cost.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleEditMaintenance(item)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

                         {/* Abastecimentos recentes */}
             <Card>
               <CardHeader>
                 <div>
                   <CardTitle className="text-lg">Abastecimentos Recentes</CardTitle>
                   <CardDescription>Últimos abastecimentos registrados</CardDescription>
                 </div>
               </CardHeader>
              <CardContent className="space-y-3">
                {fuelRecords.slice(0, 3).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⛽</span>
                      <div>
                        <p className="font-medium">{record.station}</p>
                        <p className="text-sm text-muted-foreground">
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
           <div>
             <h3 className="text-lg font-semibold">Controle de Manutenção</h3>
             <p className="text-sm text-muted-foreground mt-1">
               Manutenções registradas através da agenda e formulário de despesas
             </p>
           </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {maintenanceItems.map((item) => (
              <MaintenanceCard
                key={item.id}
                item={item}
                onEdit={handleEditMaintenance}
                onDelete={handleDeleteMaintenance}
                currentKm={vehicleInfo.currentKm}
              />
            ))}
          </div>
        </TabsContent>
        
                 <TabsContent value="fuel" className="space-y-4">
           <div>
             <h3 className="text-lg font-semibold">Controle de Combustível</h3>
             <p className="text-sm text-muted-foreground mt-1">
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
    </div>
  );
}
