'use client';

import { useState, useEffect, Suspense } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase';
import { getUserDocument, type UserData } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User as UserIcon, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Zap,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

function AgendaClienteSkeleton() {
  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-baseline justify-between"
      >
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg"
          >
            <Calendar className="h-4 w-4 text-white" />
          </motion.div>
          <Skeleton className="h-8 w-1/2" />
        </div>
        <Skeleton className="h-4 w-24" />
      </motion.div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 * i }}
          >
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent className="relative z-10">
                <Skeleton className="h-8 w-3/4" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span>Agenda</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + 0.1 * i }}
                >
                  <Skeleton className="h-10 w-full" />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function AgendaClienteContent() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const data = await getUserDocument(currentUser.uid);
        if (data && data.userType === 'cliente') {
          setUserData(data);
          // Inicializar com array vazio - em produção viria do banco
          setAppointments([]);
        } else {
          toast({
            variant: 'destructive',
            title: 'Acesso Negado',
            description: 'Esta página é exclusiva para clientes.'
          });
        }
      } else {
        router.push('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, toast]);

  if (loading) {
    return <AgendaClienteSkeleton />;
  }

  if (!user || !userData) {
    return null;
  }

  const upcomingAppointments = appointments.filter(
    app => app.date > new Date() && app.status !== 'Concluído'
  );
  const completedAppointments = appointments.filter(
    app => app.status === 'Concluído'
  );
  const pendingAppointments = appointments.filter(
    app => app.status === 'Agendado'
  );

  const handleOpenForm = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleFormSubmit = async () => {
    setIsFormOpen(false);
    // Aqui você pode adicionar lógica para salvar o compromisso
    toast({
      title: 'Sucesso!',
      description: 'Compromisso criado com sucesso.'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Agendado':
        return <Badge variant="secondary">Agendado</Badge>;
      case 'Confirmado':
        return <Badge variant="default" className="bg-blue-600">Confirmado</Badge>;
      case 'Concluído':
        return <Badge variant="default" className="bg-green-600">Concluído</Badge>;
      case 'Cancelado':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4"
      >
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <Calendar className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Minha Agenda</h1>
            <p className="text-gray-600">
              Gerencie seus compromissos e agendamentos, {userData.displayName?.split(' ')[0]}.
            </p>
          </div>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Button 
            onClick={handleOpenForm}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Compromisso
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group"
          >
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group-hover:shadow-xl transition-all duration-500 border-l-4 border-l-blue-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-blue-800 flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Total</span>
                </CardTitle>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-gray-900">{appointments.length}</div>
                <p className="text-xs text-gray-500 mt-1">Compromissos</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group"
          >
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group-hover:shadow-xl transition-all duration-500 border-l-4 border-l-purple-500">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-purple-800 flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Próximos</span>
                </CardTitle>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-purple-600">{upcomingAppointments.length}</div>
                <p className="text-xs text-gray-500 mt-1">Agendados</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group"
          >
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group-hover:shadow-xl transition-all duration-500 border-l-4 border-l-orange-500">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-amber-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-orange-800 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Pendentes</span>
                </CardTitle>
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-orange-600">{pendingAppointments.length}</div>
                <p className="text-xs text-gray-500 mt-1">Aguardando</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group"
          >
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group-hover:shadow-xl transition-all duration-500 border-l-4 border-l-green-500">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-green-800 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Concluídos</span>
                </CardTitle>
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-green-600">{completedAppointments.length}</div>
                <p className="text-xs text-gray-500 mt-1">Finalizados</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border-0 rounded-2xl shadow-lg p-1">
            <TabsTrigger 
              value="upcoming" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <span className="hidden sm:inline">Próximos</span>
              <span className="sm:hidden">Próximos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="pending"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <span className="hidden sm:inline">Pendentes</span>
              <span className="sm:hidden">Pendentes</span>
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <span className="hidden sm:inline">Concluídos</span>
              <span className="sm:hidden">Concluídos</span>
            </TabsTrigger>
          </TabsList>

        {/* Próximos Compromissos */}
        <TabsContent value="upcoming" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  Próximos Compromissos
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Compromissos agendados para os próximos dias
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments
                      .sort((a, b) => a.date.getTime() - b.date.getTime())
                      .map((appointment, index) => (
                        <motion.div
                          key={appointment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.4 + 0.1 * index }}
                          className="flex items-center justify-between p-4 border rounded-lg bg-white/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <h3 className="font-medium text-gray-900">{appointment.title}</h3>
                            </div>
                            <p className="text-sm text-gray-600">{appointment.description}</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(appointment.date, 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {appointment.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {appointment.location}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <UserIcon className="h-3 w-3" />
                              <span>Motorista: {appointment.driverName}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-4">
                            {getStatusBadge(appointment.status)}
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                                <Edit className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 border-2 border-red-300 hover:bg-red-50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                                <Trash2 className="h-3 w-3 mr-1" />
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhum compromisso próximo</p>
                    <p className="text-sm">Agende um novo compromisso para começar</p>
                  </div>
                )}
            </CardContent>
          </Card>
          </motion.div>
        </TabsContent>

        {/* Compromissos Pendentes */}
        <TabsContent value="pending" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-amber-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-amber-600 rounded-lg flex items-center justify-center shadow-lg">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  Compromissos Pendentes
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Compromissos aguardando confirmação
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                {pendingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {pendingAppointments.map((appointment, index) => (
                      <motion.div
                        key={appointment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 + 0.1 * index }}
                        className="flex items-center justify-between p-4 border rounded-lg bg-white/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-orange-600" />
                            <h3 className="font-medium text-gray-900">{appointment.title}</h3>
                          </div>
                          <p className="text-sm text-gray-600">{appointment.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(appointment.date, 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {appointment.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {appointment.location}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          {getStatusBadge(appointment.status)}
                          <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirmar
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhum compromisso pendente</p>
                    <p className="text-sm">Todos os seus compromissos foram confirmados</p>
                  </div>
                )}
            </CardContent>
          </Card>
          </motion.div>
        </TabsContent>

        {/* Compromissos Concluídos */}
        <TabsContent value="completed" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  Compromissos Concluídos
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Histórico de compromissos finalizados
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                {completedAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {completedAppointments
                      .sort((a, b) => b.date.getTime() - a.date.getTime())
                      .map((appointment, index) => (
                        <motion.div
                          key={appointment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.4 + 0.1 * index }}
                          className="flex items-center justify-between p-4 border rounded-lg bg-white/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-green-600" />
                              <h3 className="font-medium text-gray-900">{appointment.title}</h3>
                            </div>
                            <p className="text-sm text-gray-600">{appointment.description}</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(appointment.date, 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {appointment.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {appointment.location}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <UserIcon className="h-3 w-3" />
                              <span>Motorista: {appointment.driverName}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-4">
                            {getStatusBadge(appointment.status)}
                            <Button size="sm" variant="outline" className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                              <Edit className="h-3 w-3 mr-1" />
                              Reagendar
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhum compromisso concluído</p>
                    <p className="text-sm">Seus compromissos concluídos aparecerão aqui</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        </Tabs>
      </motion.div>

      {/* Modal Novo Compromisso */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 p-8 text-white rounded-t-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Novo Compromisso</h2>
                    <p className="text-blue-100">Agende um novo compromisso</p>
                  </div>
                </div>
                <Button
                  onClick={handleCloseForm}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 rounded-xl"
                >
                  ✕
                </Button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-8">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título do Compromisso
                    </label>
                    <input
                      type="text"
                      className="w-full h-12 pl-4 pr-4 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-base transition-all duration-300"
                      placeholder="Ex: Reunião com cliente"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data
                    </label>
                    <input
                      type="date"
                      className="w-full h-12 pl-4 pr-4 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-base transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horário
                    </label>
                    <input
                      type="time"
                      className="w-full h-12 pl-4 pr-4 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-base transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Local
                    </label>
                    <input
                      type="text"
                      className="w-full h-12 pl-4 pr-4 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-base transition-all duration-300"
                      placeholder="Ex: Escritório, Cliente"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    rows={3}
                    className="w-full pl-4 pr-4 pt-3 pb-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-base transition-all duration-300 resize-none"
                    placeholder="Descreva os detalhes do compromisso..."
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50/50 border-t border-gray-100 p-6 -m-8 mt-8">
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  <Button 
                    onClick={handleCloseForm}
                    variant="outline" 
                    className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 font-medium"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleFormSubmit}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendar Compromisso
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function AgendaClientePage() {
  return (
    <Suspense fallback={<AgendaClienteSkeleton />}>
      <AgendaClienteContent />
    </Suspense>
  );
}
