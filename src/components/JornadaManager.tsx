
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
        <h1 className="text-3xl font-bold tracking-tight">Jornada de Trabalho</h1>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Jornadas</CardTitle>
          </CardHeader>
          <CardContent>
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
      <h1 className="text-3xl font-bold tracking-tight">Jornada de Trabalho</h1>

      <Card>
        <CardHeader>
          <CardTitle>Status Atual</CardTitle>
           <CardDescription>
            {activeShift ? `Você está em uma jornada de trabalho ${activeShift.status === 'paused' ? 'pausada' : 'ativa'}.` : 'Você não está em uma jornada de trabalho.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          {activeShift ? (
            <>
              <p className="text-muted-foreground">
                Início: <span className="font-semibold text-foreground">{format(activeShift.startTime.toDate(), "PPP 'às' HH:mm", { locale: ptBR })}</span>
              </p>
               <p className="text-muted-foreground">
                KM Inicial: <span className="font-semibold text-foreground">{activeShift.startKm.toLocaleString('pt-BR')} km</span>
              </p>
                <div className="flex flex-wrap gap-2">
                    {activeShift.status === 'active' && (
                        <Button onClick={handlePauseShift} disabled={isSubmitting} variant="outline">
                            <Pause className="mr-2 h-4 w-4" /> Pausar
                        </Button>
                    )}
                    {activeShift.status === 'paused' && (
                        <Button onClick={handleResumeShift} disabled={isSubmitting}>
                            <PlayCircle className="mr-2 h-4 w-4" /> Retomar
                        </Button>
                    )}
                    <AlertDialog open={isEndShiftOpen} onOpenChange={setIsEndShiftOpen}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isSubmitting}>
                                    <StopCircle className="mr-2 h-4 w-4" /> Finalizar Jornada
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Finalizar Jornada</AlertDialogTitle>
                                    <AlertDialogDescription>
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
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleEndShift} disabled={isSubmitting}>
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
                    <Button disabled={isSubmitting}>
                        <Play className="mr-2 h-4 w-4" /> Iniciar Jornada
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Iniciar Nova Jornada</AlertDialogTitle>
                        <AlertDialogDescription>
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
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleStartShift} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Iniciar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
             </AlertDialog>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Jornadas</CardTitle>
        </CardHeader>
        <CardContent>
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
                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(shift)} disabled={shift.status !== 'completed'}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Editar Jornada</DialogTitle>
                                            <DialogDescription>
                                                Altere os dados da jornada. Lembre-se de que a senha é necessária para confirmar.
                                            </DialogDescription>
                                        </DialogHeader>
                                        {shiftToEdit && <ShiftEditForm shift={shiftToEdit} onFormSubmit={handleShiftFormSubmit} />}
                                    </DialogContent>
                                </Dialog>

                                <AlertDialog open={isDeleteAlertOpen && shiftToDelete?.id === shift.id} onOpenChange={(isOpen) => { if (!isOpen) resetDeleteState(); }}>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(shift)} disabled={shift.status !== 'completed'}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                            <AlertDialogDescription>
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
                                        <AlertDialogFooter>
                                            <AlertDialogCancel onClick={resetDeleteState}>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting}>
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
