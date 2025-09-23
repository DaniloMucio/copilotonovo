'use client';

import { VehicleManager } from '@/components/VehicleManager';
import { Car, Sparkles } from 'lucide-react';

export default function VeiculoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group">
          <Car className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Veículos</h1>
          <p className="text-gray-600">Gerencie sua frota de veículos</p>
        </div>
      </div>

      <div>
        <VehicleManager />
      </div>
    </div>
  );
}
