'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FuelRecord } from '@/services/vehicle';

interface FuelFormProps {
  isOpen: boolean;
  fuelToEdit: FuelRecord | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FuelForm({ isOpen, fuelToEdit, onSuccess, onCancel }: FuelFormProps) {
  const [formData, setFormData] = useState({
    date: '',
    liters: '',
    cost: '',
    km: '',
    station: '',
    fuelType: 'gasoline' as 'gasoline' | 'ethanol' | 'diesel' | 'flex'
  });

  useEffect(() => {
    if (fuelToEdit) {
      setFormData({
        date: fuelToEdit.date,
        liters: fuelToEdit.liters.toString(),
        cost: fuelToEdit.cost.toString(),
        km: fuelToEdit.km.toString(),
        station: fuelToEdit.station,
        fuelType: fuelToEdit.fuelType
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        liters: '',
        cost: '',
        km: '',
        station: '',
        fuelType: 'gasoline'
      });
    }
  }, [fuelToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Aqui você implementaria a lógica para salvar no Firebase
      // Por enquanto, apenas fechamos o modal
      console.log('Salvando combustível:', formData);
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar combustível:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {fuelToEdit ? 'Editar Abastecimento' : 'Novo Abastecimento'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="liters">Litros</Label>
              <Input
                id="liters"
                type="number"
                step="0.01"
                value={formData.liters}
                onChange={(e) => setFormData(prev => ({ ...prev, liters: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Custo Total</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="km">Quilometragem</Label>
              <Input
                id="km"
                type="number"
                value={formData.km}
                onChange={(e) => setFormData(prev => ({ ...prev, km: e.target.value }))}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="station">Posto</Label>
            <Input
              id="station"
              value={formData.station}
              onChange={(e) => setFormData(prev => ({ ...prev, station: e.target.value }))}
              placeholder="Nome do posto"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fuelType">Tipo de Combustível</Label>
            <Select
              value={formData.fuelType}
              onValueChange={(value: 'gasoline' | 'ethanol' | 'diesel' | 'flex') => 
                setFormData(prev => ({ ...prev, fuelType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gasoline">Gasolina</SelectItem>
                <SelectItem value="ethanol">Etanol</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="flex">Flex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              {fuelToEdit ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
