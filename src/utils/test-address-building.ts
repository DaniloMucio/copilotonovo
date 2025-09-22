// Teste para verificar a construção de endereços

import { buildFullAddress } from '@/services/route-optimization';

export function testAddressBuilding() {
    console.log('🧪 Testando construção de endereços...');
    
    // Teste 1: Endereço completo
    const completeAddress = {
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP'
    };
    
    const result1 = buildFullAddress(completeAddress);
    console.log('Endereço completo:', result1);
    // Esperado: "Rua das Flores, 123, Centro, São Paulo, SP"
    
    // Teste 2: Endereço incompleto
    const incompleteAddress = {
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: '' // Estado vazio
    };
    
    const result2 = buildFullAddress(incompleteAddress);
    console.log('Endereço incompleto:', result2);
    // Esperado: "Endereço não informado"
    
    // Teste 3: Endereço nulo
    const result3 = buildFullAddress(null);
    console.log('Endereço nulo:', result3);
    // Esperado: "Endereço não informado"
    
    // Teste 4: Endereço undefined
    const result4 = buildFullAddress(undefined);
    console.log('Endereço undefined:', result4);
    // Esperado: "Endereço não informado"
    
    return {
        complete: result1,
        incomplete: result2,
        null: result3,
        undefined: result4
    };
}

// Função para testar com dados reais de transações
export function testWithRealTransactionData() {
    console.log('🧪 Testando com dados reais de transações...');
    
    const mockTransaction = {
        id: '1',
        description: 'Entrega Teste',
        recipientAddress: {
            street: 'Av. Paulista',
            number: '1000',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP'
        }
    };
    
    const result = buildFullAddress(mockTransaction.recipientAddress);
    console.log('Resultado com dados reais:', result);
    
    return result;
}
