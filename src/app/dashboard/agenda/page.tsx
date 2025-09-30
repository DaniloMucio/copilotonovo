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
import { Calendar, FileText } from "lucide-react";

export default function AgendaPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg animate-pulse">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    router.push("/login");
    return null;
  }

  const handleSuccess = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group">
          <Calendar className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Agenda</h1>
          <p className="text-gray-600">Gerencie seus compromissos e anotações</p>
        </div>
      </div>

      <Tabs defaultValue="appointments">
        <TabsList className="tabs-list-mobile grid w-full grid-cols-2 border-0 rounded-2xl shadow-lg p-1">
          <TabsTrigger 
            value="appointments"
            className="tabs-trigger-mobile rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
          >
            Compromissos
          </TabsTrigger>
          <TabsTrigger 
            value="notes"
            className="tabs-trigger-mobile rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
          >
            Anotações
          </TabsTrigger>
        </TabsList>
        <TabsContent value="appointments">
          <div className="space-y-4">
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-gray-900">Novo Agendamento</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <AppointmentForm userId={user.uid} onSuccess={handleSuccess} />
              </CardContent>
            </Card>
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-gray-900">Meus Agendamentos</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <AppointmentList userId={user.uid} refreshKey={refreshKey} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="notes">
          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-gray-900">Anotações</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <NotesManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
