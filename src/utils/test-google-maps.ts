// Função de teste para verificar a geração de URLs do Google Maps

export function testGoogleMapsUrl() {
    const testDeliveries = [
        {
            id: '1',
            order: 1,
            description: 'Entrega Teste 1',
            address: 'Rua das Flores, 123, São Paulo, SP',
            estimatedArrival: '14:30'
        },
        {
            id: '2', 
            order: 2,
            description: 'Entrega Teste 2',
            address: 'Av. Paulista, 1000, São Paulo, SP',
            estimatedArrival: '14:45'
        },
        {
            id: '3',
            order: 3,
            description: 'Entrega Teste 3', 
            address: 'Rua Augusta, 500, São Paulo, SP',
            estimatedArrival: '15:00'
        }
    ];

    console.log('🧪 Testando geração de URL do Google Maps...');
    console.log('Dados de teste:', testDeliveries);

    // Teste 1: Formato simples com direções
    const simpleUrl = `https://www.google.com/maps/dir/${testDeliveries.map(d => encodeURIComponent(d.address)).join('/')}`;
    console.log('URL Simples:', simpleUrl);

    // Teste 2: Formato com parâmetros
    const origin = encodeURIComponent(testDeliveries[0].address);
    const destination = encodeURIComponent(testDeliveries[testDeliveries.length - 1].address);
    const waypoints = testDeliveries.slice(1, -1).map(d => `waypoints=${encodeURIComponent(d.address)}`).join('&');
    const paramUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&${waypoints}`;
    console.log('URL com Parâmetros:', paramUrl);

    // Teste 3: Formato alternativo
    const altUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${testDeliveries.slice(1, -1).map(d => encodeURIComponent(d.address)).join('|')}`;
    console.log('URL Alternativa:', altUrl);

    return {
        simple: simpleUrl,
        withParams: paramUrl,
        alternative: altUrl
    };
}

// Função para testar abertura de URLs
export function testOpenUrls() {
    const urls = testGoogleMapsUrl();
    
    console.log('🔗 Testando abertura de URLs...');
    
    // Testar cada formato
    Object.entries(urls).forEach(([type, url]) => {
        console.log(`Testando ${type}:`, url);
        // window.open(url, '_blank'); // Descomente para testar
    });
}
