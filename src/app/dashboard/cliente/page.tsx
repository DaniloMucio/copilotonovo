
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClienteDashboard() {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao seu dashboard, cliente!</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Este é o seu espaço personalizado.</p>
        </CardContent>
      </Card>
    </div>
  );
}
