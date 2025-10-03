# Sistema de Rastreamento de Entregas

## 📋 Visão Geral

O sistema de rastreamento permite que clientes acompanhem o status de suas entregas em tempo real através de códigos únicos, sem necessidade de autenticação.

## 🚀 Funcionalidades

### Para Clientes
- **Rastreamento Público**: Acesso via `/rastreio` sem login
- **Código Único**: Cada entrega possui um código de 8 caracteres
- **Status em Tempo Real**: Atualizações automáticas a cada 30 segundos
- **Histórico Completo**: Timeline com todas as mudanças de status
- **Compartilhamento**: Link para compartilhar o rastreamento
- **Informações do Motorista**: Dados de contato quando disponível

### Para Motoristas
- **Código de Rastreamento**: Exibido nas páginas de entregas
- **Sincronização Automática**: Status sincronizado automaticamente
- **Histórico de Status**: Registro de todas as mudanças

## 🏗️ Arquitetura

### Estrutura de Dados

```typescript
interface TrackingData {
  id: string;                    // ID da transação
  trackingCode: string;           // Código único de 8 caracteres
  status: DeliveryStatus;         // Status atual da entrega
  recipientName: string;          // Nome do destinatário
  recipientAddress: string;       // Endereço de entrega
  createdAt: string;              // Data de criação
  updatedAt: string;              // Última atualização
  estimatedDelivery?: string;     // Previsão de entrega
  driverName?: string;            // Nome do motorista
  driverPhone?: string;           // Telefone do motorista
  statusHistory: StatusHistoryItem[]; // Histórico de status
  clientId: string;              // ID do cliente
  driverId?: string;             // ID do motorista
}
```

### Status de Entrega

- **Pendente**: Entrega criada, aguardando confirmação
- **Confirmada**: Entrega aceita pelo motorista
- **A caminho**: Motorista saiu para entrega
- **Entregue**: Entrega concluída
- **Recusada**: Entrega recusada pelo motorista

## 🔧 Implementação

### 1. Serviços

#### `src/services/tracking.ts`
- `generateTrackingCode()`: Gera código único
- `createTrackingData()`: Cria dados de rastreamento
- `getTrackingDataByCode()`: Busca por código
- `updateTrackingStatus()`: Atualiza status
- `syncTrackingWithTransaction()`: Sincroniza com transação

### 2. Componentes

#### `src/components/TrackingCodeDisplay.tsx`
Componente para exibir código de rastreamento nas páginas de entregas.

**Props:**
- `transactionId`: ID da transação
- `className`: Classes CSS opcionais

**Funcionalidades:**
- Busca automática do código
- Exibição com opção de ocultar
- Botões para copiar código e link
- Abertura da página de rastreamento

### 3. Páginas

#### `src/app/rastreio/page.tsx`
Página pública de rastreamento.

**Funcionalidades:**
- Busca por código de rastreamento
- Exibição de status em tempo real
- Histórico de mudanças
- Atualização automática
- Compartilhamento de link

### 4. Integração

#### Landing Page
Botão "Rastrear Entrega" adicionado na seção hero.

#### Páginas de Entregas
Componente `TrackingCodeDisplay` integrado em:
- `/dashboard/entregas` (motoristas)
- `/dashboard/cliente/entregas` (clientes)

## 🔄 Fluxo de Funcionamento

### 1. Criação de Entrega
1. Cliente cria entrega
2. Sistema gera código único automaticamente
3. Dados de rastreamento são criados
4. Código fica disponível para compartilhamento

### 2. Atualização de Status
1. Motorista atualiza status da entrega
2. Sistema sincroniza dados de rastreamento
3. Histórico é atualizado automaticamente
4. Cliente vê mudanças em tempo real

### 3. Rastreamento Público
1. Cliente acessa `/rastreio`
2. Insere código de rastreamento
3. Sistema busca dados em tempo real
4. Atualização automática a cada 30 segundos

## 🛠️ Configuração

### 1. Migração de Dados Existentes

Execute o script de migração para entregas existentes:

```bash
node scripts/migrate-existing-deliveries.js
```

### 2. Regras do Firestore

```javascript
// Coleção 'tracking' - acesso público para leitura
match /tracking/{trackingId} {
  allow read: if true;  // Qualquer um pode ler
  allow write: if request.auth != null;  // Apenas usuários autenticados podem escrever
}
```

### 3. Índices Necessários

```javascript
// Firestore Indexes
{
  "collectionGroup": "tracking",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "trackingCode", "order": "ASCENDING" }
  ]
}
```

## 🔒 Segurança

### Dados Expostos
- Status da entrega
- Nome do destinatário
- Endereço de entrega
- Informações do motorista (quando disponível)
- Histórico de status

### Dados Protegidos
- IDs internos do sistema
- Dados financeiros
- Informações pessoais sensíveis
- Dados de outros usuários

### Validações
- Códigos únicos verificados antes da criação
- Validação de formato do código
- Rate limiting para buscas
- Sanitização de entrada

## 📱 Interface do Usuário

### Design
- Interface limpa e moderna
- Cores consistentes com o tema
- Animações suaves
- Design responsivo
- Indicadores visuais claros

### Experiência
- Busca intuitiva por código
- Status claramente identificado
- Histórico cronológico
- Compartilhamento fácil
- Atualizações em tempo real

## 🚀 Melhorias Futuras

### Funcionalidades Planejadas
- [ ] Notificações push para mudanças de status
- [ ] Integração com mapas em tempo real
- [ ] Códigos QR para rastreamento
- [ ] API pública para integrações
- [ ] Relatórios de rastreamento
- [ ] Integração com WhatsApp
- [ ] Geolocalização do motorista
- [ ] Previsão de chegada baseada em tráfego

### Otimizações
- [ ] Cache inteligente
- [ ] Compressão de dados
- [ ] CDN para assets estáticos
- [ ] Service Workers para offline
- [ ] Lazy loading de componentes

## 🐛 Troubleshooting

### Problemas Comuns

#### Código não encontrado
- Verificar se a entrega existe
- Confirmar se dados de rastreamento foram criados
- Executar script de migração se necessário

#### Status não atualiza
- Verificar sincronização com transação
- Confirmar permissões do Firestore
- Verificar logs do console

#### Performance lenta
- Verificar índices do Firestore
- Otimizar queries
- Implementar cache local

### Logs Úteis

```javascript
// Console logs para debug
console.log('🔍 Buscando dados de rastreamento:', trackingCode);
console.log('✅ Dados de rastreamento encontrados:', data);
console.log('❌ Erro ao buscar dados:', error);
```

## 📊 Métricas

### KPIs Importantes
- Taxa de uso do rastreamento
- Tempo médio de resposta
- Satisfação do cliente
- Redução de suporte

### Monitoramento
- Logs de acesso
- Erros de busca
- Performance das queries
- Uso de recursos

---

## 🤝 Contribuição

Para contribuir com o sistema de rastreamento:

1. Siga as convenções de código
2. Adicione testes para novas funcionalidades
3. Documente mudanças importantes
4. Teste em diferentes dispositivos
5. Valide acessibilidade

## 📞 Suporte

Para dúvidas ou problemas:
- Verifique a documentação
- Consulte os logs do sistema
- Entre em contato com a equipe de desenvolvimento

