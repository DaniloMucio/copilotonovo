// Arquivo de serviços para entregas
import { Transaction } from './transactions';

// Interface básica para entrega (alias de Transaction)
export interface Delivery extends Transaction {
  // Todas as propriedades estão em Transaction
}

// Tipos específicos para entregas
export type DeliveryStatus = 'Pendente' | 'Confirmada' | 'A caminho' | 'Entregue' | 'Recusada';
export type PaymentStatus = 'Pendente' | 'Pago';
export type PaymentType = 'À vista' | 'A receber';

// Função para validar se uma transação é uma entrega
export const isDelivery = (transaction: Transaction): transaction is Delivery => {
  return transaction.type === 'receita' && transaction.deliveryStatus !== undefined;
};

// Função para filtrar apenas entregas de uma lista de transações
export const filterDeliveries = (transactions: Transaction[]): Delivery[] => {
  return transactions.filter(isDelivery);
};