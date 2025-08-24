
'use client';

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { saveUserNotes, getUserNotes } from "@/services/firestore";
import { Loader2 } from "lucide-react";

export function NotesManager() {
  const [user, loading] = useAuthState(auth);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const fetchNotes = async () => {
        const userNotes = await getUserNotes(user.uid);
        setNotes(userNotes);
      };
      fetchNotes();
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Você precisa estar logado para salvar as anotações.",
        });
      return;
    }
    setIsSaving(true);
    try {
      await saveUserNotes(user.uid, notes);
      toast({
        title: "Sucesso!",
        description: "Suas anotações foram salvas.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar suas anotações.",
      });
    } finally {
        setIsSaving(false);
    }
  };

  if (loading) {
    return <p>Carregando...</p>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anotações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Digite suas anotações aqui..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={10}
        />
        <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Salvando..." : "Salvar Anotações"}
        </Button>
      </CardContent>
    </Card>
  );
}
