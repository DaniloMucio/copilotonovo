
'use client';

import { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Play, StopCircle, Loader2, Pause, PlayCircle, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase';
import {
  startShift,
  endShift,
  getActiveShift,
  getShifts,
  deleteShift,
  pauseShift,
  resumeShift,
  type WorkShift,
} from '@/services/workShifts';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { reauthenticateUser } from '@/services/auth';
import { ShiftEditForm } from './forms/ShiftEditForm';


export function JornadaManager() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [activeShift, setActiveShift] = useState<WorkShift | null>(null);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for forms
  const [startKm, setStartKm] = useState('');
  const [endKm, setEndKm] = useState('');
  const [isStartShiftOpen, setIsStartShiftOpen] = useState(false);
  const [isEndShiftOpen, setIsEndShiftOpen] = useState(false);

  // State for editing
  const [shiftToEdit, setShiftToEdit] = useState<WorkShift | null>(null);
  const [isEditShiftOpen, setIsEditShiftOpen] = useState(false);

  // State for deletion
  const [shiftToDelete, setShiftToDelete] = useState<WorkShift | null>(null);
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);


  const fetchShiftData = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const [active, history] = await Promise.all([
        getActiveShift(uid),
        getShifts(uid),
      ]);
      setActiveShift(active);
      setShifts(history);
    } catch (error) {
      console.error('Erro ao buscar jornada:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os dados da jornada.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchShiftData(currentUser.uid);
      } else {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router, toast, fetchShiftData]);

  const handleStartShift = async () => {
    if (!user || !startKm) {
        toast({ variant: 'destructive', title: 'Erro', description: 'KM Inicial é obrigatório.' });
        return;
    };

    setIsSubmitting(true);
    try {
      await startShift(user.uid, parseFloat(startKm));
      toast({
        title: 'Jornada Iniciada!',
        description: 'Seu turno de trabalho começou.',
      });
      fetchShiftData(user.uid);
      setIsStartShiftOpen(false);
      setStartKm('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível iniciar a jornada.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleEndShift = async () => {
    if (!user || !activeShift || !endKm) {
        toast({ variant: 'destructive', title: 'Erro', description: 'KM Final é obrigatório.' });
        return;
    }
     if (parseFloat(endKm) < activeShift.startKm) {
        toast({ variant: 'destructive', title: 'Erro', description: 'KM Final não pode ser menor que o KM Inicial.' });
        return;
    }

    setIsSubmitting(true);
    try {
      await endShift(activeShift.id, parseFloat(endKm));
      toast({
        title: 'Jornada Finalizada!',
        description: 'Seu turno de trabalho terminou.',
      });
      fetchShiftData(user.uid);
      setIsEndShiftOpen(false);
      setEndKm('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível finalizar a jornada.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handlePauseShift = async () => {
    if (!user || !activeShift) return;
    setIsSubmitting(true);
    try {
        await pauseShift(activeShift.id);
        toast({
            title: 'Jornada Pausada',
        });
        fetchShiftData(user.uid);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro ao pausar a jornada.'
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleResumeShift = async () => {
    if (!user || !activeShift) return;
    setIsSubmitting(true);
    try {
        await resumeShift(activeShift);
        toast({
            title: 'Jornada Retomada',
        });
        fetchShiftData(user.uid);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro ao retomar a jornada.'
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleEditClick = (shift: WorkShift) => {
    setShiftToEdit(shift);
    setIsEditShiftOpen(true);
  };

  const handleShiftFormSubmit = () => {
    if (user) {
        fetchShiftData(user.uid);
    }
    setIsEditShiftOpen(false);
    setShiftToEdit(null);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !shiftToDelete || !password) {
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Senha é obrigatória."
        })
        return;
    };
    setIsDeleting(true);

    try {
        await reauthenticateUser(password);
        await deleteShift(shiftToDelete.id);
        toast({
            title: "Sucesso!",
            description: "Jornada excluída."
        })
        fetchShiftData(user.uid);
        resetDeleteState();
    } catch(error: any) {
        let description = "Ocorreu um problema ao excluir a jornada.";
        if (error.message.includes("wrong-password")) {
            description = "Senha incorreta. Tente novamente."
        }
        toast({
            variant: "destructive",
            title: "Erro ao excluir",
            description,
        })
    } finally {
        setIsDeleting(false);
    }
  }

  const openDeleteDialog = (shift: WorkShift) => {
    setShiftToDelete(shift);
    setIsDeleteAlertOpen(true);
  }

  const resetDeleteState = () => {
    setIsDeleteAlertOpen(false);
    setShiftToDelete(null);
    setPassword('');
  }

  const formatDuration = (start: Date, end: Date | null) => {
    if (!end) return 'Em andamento';
    const totalMinutes = differenceInMinutes(end, start);
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    return `${hours}h ${minutes}m`;
  }

    const formatPauseDuration = (totalPauseMinutes: number) => {
        if (!totalPauseMinutes || totalPauseMinutes === 0) return "0m";
        const hours = Math.floor(totalPauseMinutes / 60);
        const minutes = Math.round(totalPauseMinutes % 60);
        return `${hours}h ${minutes}m`;
    }

  if (loading && !shifts.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg animate-pulse">
            <Play className="h-4 w-4 text-white" />
          </div>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="relative z-10">
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="relative z-10">
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
        
        <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-gray-900">Histórico de Jornadas</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group">
          <Play className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Jornada de Trabalho</h1>
          <p className="text-gray-600">Gerencie suas jornadas de trabalho</p>
        </div>
      </div>

      <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <CardHeader className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <Play className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-gray-900">Status Atual</CardTitle>
              <CardDescription className="text-gray-600">
                {activeShift ? `Você está em uma jornada de trabalho ${activeShift.status === 'paused' ? 'pausada' : 'ativa'}.` : 'Você não está em uma jornada de trabalho.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4 relative z-10">
          {activeShift ? (
            <>
              <p className="text-gray-600">
                Início: <span className="font-semibold text-gray-900">{format(activeShift.startTime.toDate(), "PPP 'às' HH:mm", { locale: ptBR })}</span>
              </p>
               <p className="text-gray-600">
                KM Inicial: <span className="font-semibold text-gray-900">{activeShift.startKm.toLocaleString('pt-BR')} km</span>
              </p>
                <div className="flex flex-wrap gap-2">
                    {activeShift.status === 'active' && (
                        <Button 
                          onClick={handlePauseShift} 
                          disabled={isSubmitting} 
                          className="bg-yellow-600 text-white hover:bg-yellow-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                        >
                            <Pause className="mr-2 h-4 w-4" /> Pausar
                        </Button>
                    )}
                    {activeShift.status === 'paused' && (
                        <Button 
                          onClick={handleResumeShift} 
                          disabled={isSubmitting}
                          className="bg-green-600 text-white hover:bg-green-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                        >
                            <PlayCircle className="mr-2 h-4 w-4" /> Retomar
                        </Button>
                    )}
                    <AlertDialog open={isEndShiftOpen} onOpenChange={setIsEndShiftOpen}>
                            <AlertDialogTrigger asChild>
                                <Button 
                                  className="bg-red-600 text-white hover:bg-red-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                                  disabled={isSubmitting}
                                >
                                    <StopCircle className="mr-2 h-4 w-4" /> Finalizar Jornada
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white border-0 shadow-2xl rounded-2xl">
                                <AlertDialogHeader className="bg-gradient-to-r from-red-600/5 to-red-500/5 p-6 rounded-t-2xl">
                                    <AlertDialogTitle className="text-2xl font-bold text-gray-900">Finalizar Jornada</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-600 text-base">
                                        Insira a quilometragem final do seu veículo para encerrar o turno.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="grid gap-2 py-2">
                                    <Label htmlFor="endKm">KM Final</Label>
                                    <Input 
                                        id="endKm" 
                                        type="number"
                                        value={endKm}
                                        onChange={(e) => setEndKm(e.target.value)}
                                        placeholder="Ex: 150420" 
                                    />
                                </div>
                                <AlertDialogFooter className="p-6">
                                    <AlertDialogCancel className="bg-gray-500 text-white hover:bg-gray-600 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                                        Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={handleEndShift} 
                                        disabled={isSubmitting}
                                        className="bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirmar'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                    </AlertDialog>
                </div>
            </>
          ) : (
             <AlertDialog open={isStartShiftOpen} onOpenChange={setIsStartShiftOpen}>
                <AlertDialogTrigger asChild>
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                      disabled={isSubmitting}
                    >
                        <Play className="mr-2 h-4 w-4" /> Iniciar Jornada
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white border-0 shadow-2xl rounded-2xl">
                    <AlertDialogHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 p-6 rounded-t-2xl">
                        <AlertDialogTitle className="text-2xl font-bold text-gray-900">Iniciar Nova Jornada</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 text-base">
                            Insira a quilometragem inicial do seu veículo para começar.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-2 py-2">
                        <Label htmlFor="startKm">KM Inicial</Label>
                        <Input 
                            id="startKm" 
                            type="number"
                            value={startKm}
                            onChange={(e) => setStartKm(e.target.value)}
                            placeholder="Ex: 150210" 
                        />
                    </div>
                    <AlertDialogFooter className="p-6">
                        <AlertDialogCancel className="bg-gray-500 text-white hover:bg-gray-600 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleStartShift} 
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Iniciar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
             </AlertDialog>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <CardHeader className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <Play className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-gray-900">Histórico de Jornadas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {shifts.length > 0 ? (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Tempo de Pausa</TableHead>
                  <TableHead>KM Inicial</TableHead>
                  <TableHead>KM Final</TableHead>
                  <TableHead>KM Rodados</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => {
                    const kmRodados = shift.endKm ? shift.endKm - shift.startKm : 0;
                    return (
                        <TableRow key={shift.id}>
                            <TableCell>
                                {format(shift.startTime.toDate(), 'dd/MM/yy')}
                            </TableCell>
                            <TableCell>
                                {formatDuration(shift.startTime.toDate(), shift.endTime?.toDate() || null)}
                            </TableCell>
                            <TableCell>
                                {formatPauseDuration(shift.totalPauseDuration)}
                            </TableCell>
                             <TableCell>
                                {shift.startKm.toLocaleString('pt-BR')} km
                            </TableCell>
                            <TableCell>
                                {shift.endKm ? `${shift.endKm.toLocaleString('pt-BR')} km` : '—'}
                            </TableCell>
                            <TableCell>
                                {shift.endKm ? `${kmRodados.toLocaleString('pt-BR')} km` : '—'}
                            </TableCell>
                            <TableCell>
                            <Badge variant={shift.status === 'completed' ? 'secondary' : (shift.status === 'paused' ? 'outline' : 'default')}>
                                {shift.status === 'active' ? 'Ativa' : (shift.status === 'paused' ? 'Pausada' : 'Finalizada')}
                            </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                                <Dialog open={isEditShiftOpen && shiftToEdit?.id === shift.id} onOpenChange={setIsEditShiftOpen}>
                                    <DialogTrigger asChild>
                                        <Button 
                                          className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                                          size="icon" 
                                          onClick={() => handleEditClick(shift)} 
                                          disabled={shift.status !== 'completed'}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-white border-0 shadow-2xl rounded-2xl">
                                        <DialogHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 p-6 rounded-t-2xl">
                                            <DialogTitle className="text-2xl font-bold text-gray-900">Editar Jornada</DialogTitle>
                                            <DialogDescription className="text-gray-600 text-base">
                                                Altere os dados da jornada. Lembre-se de que a senha é necessária para confirmar.
                                            </DialogDescription>
                                        </DialogHeader>
                                        {shiftToEdit && <ShiftEditForm shift={shiftToEdit} onFormSubmit={handleShiftFormSubmit} />}
                                    </DialogContent>
                                </Dialog>

                                <AlertDialog open={isDeleteAlertOpen && shiftToDelete?.id === shift.id} onOpenChange={(isOpen) => { if (!isOpen) resetDeleteState(); }}>
                                    <AlertDialogTrigger asChild>
                                        <Button 
                                          className="bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                                          size="icon" 
                                          onClick={() => openDeleteDialog(shift)} 
                                          disabled={shift.status !== 'completed'}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-white border-0 shadow-2xl rounded-2xl">
                                        <AlertDialogHeader className="bg-gradient-to-r from-red-600/5 to-red-500/5 p-6 rounded-t-2xl">
                                            <AlertDialogTitle className="text-2xl font-bold text-gray-900">Confirmar Exclusão</AlertDialogTitle>
                                            <AlertDialogDescription className="text-gray-600 text-base">
                                                Para sua segurança, digite sua senha para excluir esta jornada. Esta ação não pode ser desfeita.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <div className="grid gap-2 py-2">
                                            <Label htmlFor="password">Senha</Label>
                                            <Input 
                                                id="password" 
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Sua senha de login" 
                                            />
                                        </div>
                                        <AlertDialogFooter className="p-6">
                                            <AlertDialogCancel 
                                                onClick={resetDeleteState}
                                                className="bg-gray-500 text-white hover:bg-gray-600 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                                            >
                                                Cancelar
                                            </AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={handleDeleteConfirm} 
                                                disabled={isDeleting}
                                                className="bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                                            >
                                                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    )
                })}
              </TableBody>
            </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Nenhuma jornada registrada ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
