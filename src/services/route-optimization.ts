// Serviço para otimização de rotas
// Este arquivo será expandido para integração com Google Maps API

/**
 * Constrói endereço completo a partir dos campos separados
 */
export function buildFullAddress(address: any): string {
    if (!address) return 'Endereço não informado';
    
    const { street, number, neighborhood, city, state } = address;
    if (street && number && neighborhood && city && state) {
        return `${street}, ${number}, ${neighborhood}, ${city}, ${state}`;
    }
    
    return 'Endereço não informado';
}

export interface RouteOptimizationResult {
    totalDistance: string;
    estimatedTime: string;
    fuelCost: string;
    deliveries: OptimizedDelivery[];
    route: RouteStep[];
}

export interface OptimizedDelivery {
    id: string;
    order: number;
    description: string;
    address: string;
    estimatedArrival: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}

export interface RouteStep {
    from: string;
    to: string;
    distance: string;
    duration: string;
    instructions: string;
}

export interface DeliveryLocation {
    id: string;
    address: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}

/**
 * Simula otimização de rota (será substituído por integração real com Google Maps)
 */
export async function optimizeRoute(deliveryIds: string[], deliveries: any[]): Promise<RouteOptimizationResult> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔍 Debug optimizeRoute:');
    console.log('- deliveryIds:', deliveryIds);
    console.log('- deliveries:', deliveries);
    
    const selectedDeliveries = deliveries.filter(d => deliveryIds.includes(d.id));
    console.log('- selectedDeliveries:', selectedDeliveries);
    
    // Debug dos endereços
    selectedDeliveries.forEach((delivery, index) => {
        console.log(`- Entrega ${index + 1}:`, {
            id: delivery.id,
            description: delivery.description,
            recipientAddress: delivery.recipientAddress,
            fullAddress: buildFullAddress(delivery.recipientAddress)
        });
    });
    
    // Simular cálculo de distância e tempo
    const baseDistance = 5.2; // km por entrega
    const baseTime = 15; // minutos por entrega
    
    const totalDistance = (selectedDeliveries.length * baseDistance).toFixed(1);
    const totalTimeMinutes = selectedDeliveries.length * baseTime;
    const hours = Math.floor(totalTimeMinutes / 60);
    const minutes = totalTimeMinutes % 60;
    const estimatedTime = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
    
    // Simular custo de combustível (R$ 4,50 por litro, 12 km/l)
    const fuelCost = (parseFloat(totalDistance) / 12 * 4.5).toFixed(2);
    
    // Simular ordem otimizada (algoritmo simples de ordenação por proximidade)
    const optimizedDeliveries = selectedDeliveries.map((delivery, index) => ({
        id: delivery.id,
        order: index + 1,
        description: delivery.description || 'Entrega sem descrição',
        address: buildFullAddress(delivery.recipientAddress),
        estimatedArrival: `14:${30 + index * 15}`,
        coordinates: delivery.recipientAddress?.coordinates
    }));
    
    // Simular passos da rota
    const route: RouteStep[] = [
        {
            from: 'Ponto de Partida',
            to: optimizedDeliveries[0]?.address || 'Primeira entrega',
            distance: `${baseDistance} km`,
            duration: `${baseTime} min`,
            instructions: 'Siga em direção à primeira entrega'
        },
        ...optimizedDeliveries.slice(1).map((delivery, index) => ({
            from: optimizedDeliveries[index]?.address || 'Entrega anterior',
            to: delivery.address,
            distance: `${baseDistance} km`,
            duration: `${baseTime} min`,
            instructions: `Continue para ${delivery.address}`
        }))
    ];
    
    return {
        totalDistance: `${totalDistance} km`,
        estimatedTime,
        fuelCost: `R$ ${fuelCost}`,
        deliveries: optimizedDeliveries,
        route
    };
}

/**
 * Gera URL do Google Maps com múltiplas paradas
 */
export function generateGoogleMapsUrl(deliveries: OptimizedDelivery[]): string {
    if (deliveries.length === 0) return 'https://www.google.com/maps';
    
    // Filtrar endereços válidos
    const validAddresses = deliveries
        .map(d => d.address)
        .filter(address => address && address.trim() !== '' && address !== 'Endereço não informado');
    
    if (validAddresses.length === 0) {
        console.warn('Nenhum endereço válido encontrado para gerar URL do Google Maps');
        return 'https://www.google.com/maps';
    }
    
    if (validAddresses.length === 1) {
        // Para uma única entrega, usar formato simples
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(validAddresses[0])}`;
    }
    
    // Para múltiplas entregas, usar formato mais simples e confiável
    const baseUrl = 'https://www.google.com/maps/dir/';
    const encodedAddresses = validAddresses.map(addr => encodeURIComponent(addr)).join('/');
    const url = `${baseUrl}${encodedAddresses}`;
    
    console.log('Generated Google Maps URL:', url);
    console.log('Valid addresses:', validAddresses);
    console.log('Encoded addresses:', encodedAddresses);
    
    return url;
}

/**
 * Calcula distância entre duas coordenadas (fórmula de Haversine)
 */
export function calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
): number {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

/**
 * Algoritmo simples de otimização de rota (TSP - Traveling Salesman Problem)
 * Em produção, usar APIs especializadas como Google Directions API
 */
export function simpleRouteOptimization(locations: DeliveryLocation[]): string[] {
    if (locations.length <= 1) return locations.map(l => l.id);
    
    // Algoritmo simples: ordenar por distância do ponto inicial
    // Em produção, usar algoritmos mais sofisticados
    const sortedLocations = [...locations].sort((a, b) => {
        if (!a.coordinates || !b.coordinates) return 0;
        // Simular ordenação por proximidade
        return Math.random() - 0.5;
    });
    
    return sortedLocations.map(l => l.id);
}
