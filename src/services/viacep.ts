
'use server';

export interface ViaCEPResponse {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
    ibge: string;
    gia: string;
    ddd: string;
    siafi: string;
    erro?: boolean;
}

/**
 * Busca um endereço a partir de um CEP usando a API do ViaCEP.
 * @param cep - O CEP a ser consultado (somente números).
 * @returns Os dados do endereço.
 */
export const getAddressFromCEP = async (cep: string): Promise<ViaCEPResponse> => {
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!response.ok) {
            throw new Error('A resposta da rede não foi ok');
        }
        const data: ViaCEPResponse = await response.json();
        return data;
    } catch (error) {
        console.error("Erro ao buscar CEP no ViaCEP: ", error);
        throw new Error('Não foi possível buscar o endereço a partir do CEP fornecido.');
    }
};

    
