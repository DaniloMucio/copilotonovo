'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Transaction } from '@/services/transactions';
import { optimizeRoute, generateGoogleMapsUrl, buildFullAddress } from '@/services/route-optimization';

interface RouteOptimizerProps {
    deliveries: Transaction[];
    selectedDeliveries: string[];
    onSelectionChange: (deliveryId: string, checked: boolean) => void;
    onSelectAll: (checked: boolean) => void;
    onOptimize: () => void;
    isOptimizing: boolean;
    optimizedRoute: any;
    onClearRoute: () => void;
}

export function RouteOptimizer({
    deliveries,
    selectedDeliveries,
    onSelectionChange,
    onSelectAll,
    onOptimize,
    isOptimizing,
    optimizedRoute,
    onClearRoute
}: RouteOptimizerProps) {
    const availableDeliveries = deliveries.filter(d => 
        d.deliveryStatus === 'Confirmada' || d.deliveryStatus === 'Pendente'
    );

    const isAllSelected = selectedDeliveries.length === availableDeliveries.length && selectedDeliveries.length > 0;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <input 
                        type="checkbox" 
                        id="select-all"
                        className="rounded border-gray-300"
                        checked={isAllSelected}
                        onChange={(e) => onSelectAll(e.target.checked)}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium">
                        Selecionar todas as entregas ({selectedDeliveries.length} selecionadas)
                    </label>
                </div>
                <Button 
                    variant="default" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={onOptimize}
                    disabled={isOptimizing || selectedDeliveries.length < 2}
                >
                    {isOptimizing ? '🔄 Otimizando...' : '🗺️ Otimizar Rota'}
                </Button>
            </div>
            
            <div className="grid gap-4">
                {availableDeliveries.map((delivery) => (
                    <div key={delivery.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start space-x-3">
                            <input 
                                type="checkbox" 
                                id={`delivery-${delivery.id}`}
                                className="mt-1 rounded border-gray-300"
                                checked={selectedDeliveries.includes(delivery.id)}
                                onChange={(e) => onSelectionChange(delivery.id, e.target.checked)}
                            />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium text-gray-900">
                                        {delivery.description || 'Entrega sem descrição'}
                                    </h3>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        delivery.deliveryStatus === 'Confirmada' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {delivery.deliveryStatus}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    📍 {buildFullAddress(delivery.recipientAddress)}
                                </p>
                                <p className="text-sm text-gray-500">
                                    📅 {delivery.date.toDate().toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {availableDeliveries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p>Nenhuma entrega disponível para otimização de rota.</p>
                </div>
            )}

            {/* Exibição da rota otimizada */}
            {optimizedRoute && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-3">🗺️ Rota Otimizada</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{optimizedRoute.totalDistance}</div>
                            <div className="text-sm text-green-700">Distância Total</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{optimizedRoute.estimatedTime}</div>
                            <div className="text-sm text-green-700">Tempo Estimado</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{optimizedRoute.fuelCost}</div>
                            <div className="text-sm text-green-700">Custo de Combustível</div>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <h4 className="font-medium text-green-800">Ordem das Entregas:</h4>
                        {optimizedRoute.deliveries.map((delivery: any, index: number) => (
                            <div key={delivery.id} className="flex items-center space-x-3 p-2 bg-white rounded border">
                                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    {delivery.order}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">{delivery.description || 'Entrega sem descrição'}</div>
                                    <div className="text-sm text-gray-600">{delivery.recipientAddress?.address}</div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    Chegada: {delivery.estimatedArrival}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={onClearRoute}
                        >
                            ✏️ Reotimizar
                        </Button>
                        <Button 
                            variant="default" 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                                const googleMapsUrl = generateGoogleMapsUrl(optimizedRoute.deliveries);
                                console.log('Google Maps URL:', googleMapsUrl);
                                console.log('Deliveries data:', optimizedRoute.deliveries);
                                console.log('Addresses:', optimizedRoute.deliveries.map((d: any) => d.address));
                                
                                // Verificar se a URL foi gerada corretamente
                                if (googleMapsUrl.includes('google.com/maps')) {
                                    window.open(googleMapsUrl, '_blank');
                                } else {
                                    console.error('URL inválida gerada:', googleMapsUrl);
                                    alert('Erro ao gerar URL do Google Maps. Verifique o console para mais detalhes.');
                                }
                            }}
                        >
                            📱 Abrir no Google Maps
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
