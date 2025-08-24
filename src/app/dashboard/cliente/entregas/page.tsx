
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeliveryForm } from '@/components/forms/DeliveryForm';
import { DeliveryHistory } from '@/components/DeliveryHistory';
import { Transaction, getDeliveriesByClient, getUsers } from '@/services/transactions';
import { useAuth } from '@/context/AuthContext';

export default function EntregasClientePage() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      const unsubscribe = getDeliveriesByClient(user.uid, setDeliveries);
      return () => unsubscribe();
    }
    return undefined;
  }, [user]);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const driverUsers = await getUsers('motorista');
        console.log("Motoristas buscados:", driverUsers);
        setDrivers(driverUsers);
      } catch (error) {
        console.error("Erro ao buscar motoristas:", error);
      }
    };
    fetchDrivers();
  }, []);

  const handleNewDelivery = () => {
    setShowForm(true);
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    if (user) {
      const unsubscribe = getDeliveriesByClient(user.uid, setDeliveries);
      return () => unsubscribe();
    }
    return undefined;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Minhas Entregas</h1>
        <Button onClick={handleNewDelivery}>Nova Entrega</Button>
      </div>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Nova Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <DeliveryForm drivers={drivers} onFormSubmit={handleFormSubmit} />
          </CardContent>
        </Card>
      ) : (
        <DeliveryHistory deliveries={deliveries} onAction={handleFormSubmit} loading={false} />
      )}
    </div>
  );
}
