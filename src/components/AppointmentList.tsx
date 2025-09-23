"use client";

import { useEffect, useState } from "react";
import {
  Appointment,
  getAppointments,
  deleteAppointment,
} from "@/services/appointments";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
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

interface AppointmentListProps {
  userId: string;
  refreshKey?: number; // Adicionado para forçar a atualização
}

export function AppointmentList({ userId, refreshKey }: AppointmentListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const userAppointments = await getAppointments(userId);
        // Ordena os agendamentos por data
        userAppointments.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setAppointments(userAppointments);
      } catch (error) {
        toast({
          title: "Erro ao buscar agendamentos",
          description: "Não foi possível carregar a lista de agendamentos.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [userId, toast, refreshKey]); // Adicionado refreshKey como dependência

  const handleDelete = async (id: string) => {
    try {
      await deleteAppointment(id);
      setAppointments(appointments.filter((app) => app.id !== id));
      toast({
        title: "Agendamento deletado!",
        description: "O agendamento foi removido com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar o agendamento.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg animate-pulse">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <p className="text-gray-600">Carregando agendamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.length === 0 ? (
        <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardContent className="relative z-10 p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <p className="text-gray-600 text-lg">Nenhum agendamento encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        appointments.map((app) => (
          <Card key={app.id} className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-gray-900">{app.title}</CardTitle>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    className="bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    size="sm"
                  >
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white border-0 shadow-2xl rounded-2xl">
                  <AlertDialogHeader className="bg-gradient-to-r from-red-600/5 to-red-500/5 p-6 rounded-t-2xl">
                    <AlertDialogTitle className="text-2xl font-bold text-gray-900">Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600 text-base">
                      Essa ação não pode ser desfeita. Isso irá deletar
                      permanentemente o agendamento.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="p-6">
                    <AlertDialogCancel className="bg-gray-500 text-white hover:bg-gray-600 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDelete(app.id!)}
                      className="bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                    >
                      Deletar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                <p className="text-gray-600">
                  <strong className="text-gray-900">Data:</strong> {new Date(app.date).toLocaleDateString()}
                </p>
                <p className="text-gray-600">
                  <strong className="text-gray-900">Tipo:</strong>{" "}
                  {app.type === "maintenance" ? "Manutenção" : "Geral"}
                </p>
                {app.type === "maintenance" && app.mileage && (
                  <p className="text-gray-600">
                    <strong className="text-gray-900">KM para Revisão:</strong> {app.mileage} km
                  </p>
                )}
                {app.observations && (
                  <p className="text-gray-600">
                    <strong className="text-gray-900">Observações:</strong> {app.observations}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
