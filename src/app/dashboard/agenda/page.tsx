"use client";

import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { AppointmentList } from "@/components/AppointmentList";
import { NotesManager } from "@/components/NotesManager"; // Importar o novo componente
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AgendaPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return <p>Carregando...</p>;
  }
  if (!user) {
    router.push("/login");
    return null;
  }

  const handleSuccess = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold">Agenda</h1>

      <Tabs defaultValue="appointments">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="appointments">Compromissos</TabsTrigger>
          <TabsTrigger value="notes">Anotações</TabsTrigger>
        </TabsList>
        <TabsContent value="appointments">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Novo Agendamento</CardTitle>
              </CardHeader>
              <CardContent>
                <AppointmentForm userId={user.uid} onSuccess={handleSuccess} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Meus Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <AppointmentList userId={user.uid} refreshKey={refreshKey} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="notes">
          <NotesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
