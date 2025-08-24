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
    return <p>Carregando agendamentos...</p>;
  }

  return (
    <div className="space-y-4">
      {appointments.length === 0 ? (
        <p>Nenhum agendamento encontrado.</p>
      ) : (
        appointments.map((app) => (
          <Card key={app.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{app.title}</CardTitle>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação não pode ser desfeita. Isso irá deletar
                      permanentemente o agendamento.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(app.id!)}>
                      Deletar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardHeader>
            <CardContent>
              <p>
                <strong>Data:</strong> {new Date(app.date).toLocaleDateString()}
              </p>
              <p>
                <strong>Tipo:</strong>{" "}
                {app.type === "maintenance" ? "Manutenção" : "Geral"}
              </p>
              {app.type === "maintenance" && app.mileage && (
                <p>
                  <strong>KM para Revisão:</strong> {app.mileage} km
                </p>
              )}
              {app.observations && (
                <p>
                  <strong>Observações:</strong> {app.observations}
                </p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
