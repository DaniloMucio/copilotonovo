# 📱 Prompt Completo: App Nativo Android - Co-Piloto Driver

## 🎯 **VISÃO GERAL DO PROJETO**

Desenvolva um **app nativo Android** baseado no sistema web "Co-Piloto Driver" - uma plataforma completa para gestão financeira e operacional de motoristas autônomos e clientes de entregas.

### **📋 CONTEXTO DO SISTEMA ORIGINAL**

O Co-Piloto Driver é uma aplicação web PWA (Progressive Web App) que oferece:

**Para Motoristas:**
- Gestão financeira completa (receitas, despesas, lucro)
- Controle de jornadas de trabalho
- Gestão de entregas e clientes
- Relatórios detalhados em PDF
- Sistema de rádio integrado
- Controle de veículos e manutenções
- Dashboard com métricas em tempo real

**Para Clientes:**
- Acompanhamento de entregas em tempo real
- Histórico de entregas
- Status de pagamentos
- Interface simplificada

**Tecnologias do Sistema Original:**
- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Backend: Firebase (Auth, Firestore, Functions)
- PWA: Service Workers, Push Notifications, Offline Support

---

## 🏗️ **ARQUITETURA DO APP ANDROID**

### **Stack Tecnológica Recomendada:**

**Linguagem:** Kotlin (100%)
**Framework:** Android Jetpack Compose
**Arquitetura:** MVVM + Clean Architecture
**Backend:** Firebase (mesmo do sistema web)
**Navegação:** Navigation Compose
**Estado:** ViewModel + StateFlow
**Injeção de Dependência:** Hilt
**Networking:** Retrofit + OkHttp
**Banco Local:** Room Database
**Imagens:** Coil
**UI Components:** Material Design 3

### **Estrutura de Módulos:**
```
app/
├── :core:common          # Utilitários compartilhados
├── :core:data            # Repositórios e datasources
├── :core:domain          # Casos de uso e entidades
├── :core:ui              # Componentes UI reutilizáveis
├── :feature:auth         # Autenticação
├── :feature:driver       # Dashboard motorista
├── :feature:client       # Dashboard cliente
├── :feature:transactions # Gestão de entregas
├── :feature:financial    # Relatórios financeiros
├── :feature:radio        # Sistema de rádio
├── :feature:vehicle      # Gestão de veículos
└── :feature:notifications # Sistema de notificações
```

---

## 👥 **PERFIS DE USUÁRIO E AUTENTICAÇÃO**

### **Tipos de Usuário:**
1. **Motorista** - Usuário principal com acesso completo
2. **Cliente** - Usuário com acesso limitado às suas entregas

### **Sistema de Autenticação:**
- **Firebase Authentication** (email/senha)
- **Registro** com seleção de tipo de usuário
- **Login** com redirecionamento baseado no tipo
- **Recuperação de senha**
- **Logout** com limpeza de dados locais

### **Telas de Autenticação:**
1. **Splash Screen** - Logo e verificação de login
2. **Login Screen** - Email, senha, "Esqueci minha senha"
3. **Register Screen** - Nome, email, senha, tipo de usuário
4. **Forgot Password** - Recuperação por email

---

## 🚛 **DASHBOARD MOTORISTA (Tela Principal)**

### **Layout Principal:**
- **Bottom Navigation** com 5 abas principais
- **Floating Action Button** para ações rápidas
- **AppBar** com notificações e perfil

### **Abas do Bottom Navigation:**
1. **🏠 Início** - Visão geral e métricas principais
2. **📦 Entregas** - Gestão de entregas e transações
3. **💰 Financeiro** - Relatórios e análises
4. **🚗 Veículo** - Informações e manutenções
5. **⚙️ Perfil** - Configurações e dados pessoais

### **Tela Início (Home):**
```
┌─────────────────────────────────┐
│ [🔔] Co-Piloto    [👤] Perfil   │
├─────────────────────────────────┤
│ 📊 RESUMO DO DIA                │
│ ┌─────────┬─────────┬─────────┐ │
│ │ R$ 450  │ 8h 30m  │ 120km   │ │
│ │Receita  │Trabalho │Rodado   │ │
│ └─────────┴─────────┴─────────┘ │
├─────────────────────────────────┤
│ 🚀 AÇÕES RÁPIDAS                │
│ [Iniciar Jornada] [Nova Entrega]│
├─────────────────────────────────┤
│ 📈 GRÁFICO RECEITA (7 dias)     │
│ [Gráfico de linha interativo]   │
├─────────────────────────────────┤
│ 📦 ENTREGAS RECENTES            │
│ • Entrega #123 - R$ 45,00       │
│ • Entrega #124 - R$ 32,00       │
└─────────────────────────────────┘
```

### **Funcionalidades da Tela Início:**
- **Métricas em tempo real** (receita, horas, km)
- **Gráfico de receita** dos últimos 7 dias
- **Lista de entregas recentes**
- **Botões de ação rápida**
- **Status da jornada atual**

---

## 📦 **GESTÃO DE ENTREGAS**

### **Tela Principal de Entregas:**
```
┌─────────────────────────────────┐
│ 📦 Entregas        [🔍] [➕]    │
├─────────────────────────────────┤
│ [Hoje] [Pendentes] [Concluídas] │
├─────────────────────────────────┤
│ 📦 Entrega #123                 │
│ Cliente: João Silva             │
│ Valor: R$ 45,00                 │
│ Status: Em andamento            │
│ [Aceitar] [Recusar] [Detalhes]  │
├─────────────────────────────────┤
│ 📦 Entrega #124                 │
│ Cliente: Maria Santos           │
│ Valor: R$ 32,00                 │
│ Status: Pendente                │
│ [Aceitar] [Recusar] [Detalhes]  │
└─────────────────────────────────┘
```

### **Tela de Nova Entrega:**
- **Formulário completo** com validação
- **Campos obrigatórios:**
  - Cliente (nome, telefone, email)
  - Endereço de coleta
  - Endereço de entrega
  - Valor da entrega
  - Tipo de pagamento (à vista/a receber)
  - Observações
- **Integração com mapas** para endereços
- **Validação em tempo real**

### **Tela de Detalhes da Entrega:**
- **Informações completas** da entrega
- **Status em tempo real**
- **Histórico de alterações**
- **Botões de ação** (aceitar, recusar, concluir)
- **Integração com GPS** para navegação

---

## 💰 **DASHBOARD FINANCEIRO**

### **Tela Principal Financeira:**
```
┌─────────────────────────────────┐
│ 💰 Financeiro     [📊] [📤]     │
├─────────────────────────────────┤
│ 📈 RESUMO MENSAL                │
│ Receita: R$ 2.450,00            │
│ Despesas: R$ 890,00             │
│ Lucro: R$ 1.560,00              │
├─────────────────────────────────┤
│ 📊 GRÁFICOS                     │
│ [Receita vs Despesas]           │
│ [Evolução Mensal]               │
│ [Distribuição por Categoria]    │
├─────────────────────────────────┤
│ 📋 ÚLTIMAS TRANSAÇÕES           │
│ • Entrega #123 - +R$ 45,00      │
│ • Combustível - -R$ 120,00      │
│ • Entrega #124 - +R$ 32,00      │
└─────────────────────────────────┘
```

### **Funcionalidades Financeiras:**
- **Relatórios detalhados** (diário, semanal, mensal)
- **Gráficos interativos** (receita, despesas, lucro)
- **Categorização automática** de gastos
- **Exportação em PDF**
- **Projeções de ganhos**
- **Comparativo com períodos anteriores**

---

## 🚗 **GESTÃO DE VEÍCULOS**

### **Tela de Informações do Veículo:**
```
┌─────────────────────────────────┐
│ 🚗 Meu Veículo     [✏️]         │
├─────────────────────────────────┤
│ 🚙 Honda Civic 2020             │
│ Placa: ABC-1234                 │
│ KM Atual: 85.420                │
├─────────────────────────────────┤
│ ⚠️ MANUTENÇÕES PENDENTES        │
│ • Troca de óleo (5.000km)       │
│ • Revisão geral (10.000km)      │
├─────────────────────────────────┤
│ ⛽ ÚLTIMO ABASTECIMENTO         │
│ Data: 15/01/2024                │
│ Valor: R$ 120,00                │
│ KM/L: 12,5                      │
└─────────────────────────────────┘
```

### **Funcionalidades de Veículo:**
- **Cadastro completo** do veículo
- **Controle de quilometragem**
- **Lembretes de manutenção**
- **Histórico de abastecimentos**
- **Cálculo de consumo médio**
- **Controle de despesas** relacionadas

---

## 📱 **DASHBOARD CLIENTE (Versão Simplificada)**

### **Layout Cliente:**
```
┌─────────────────────────────────┐
│ [🔔] Minhas Entregas  [👤]      │
├─────────────────────────────────┤
│ 📦 ENTREGAS ATIVAS              │
│ • Entrega #123                  │
│ Status: Em andamento            │
│ Motorista: João Silva           │
│ [Rastrear] [Detalhes]           │
├─────────────────────────────────┤
│ 📋 HISTÓRICO                    │
│ • Entrega #122 - Concluída      │
│ • Entrega #121 - Concluída      │
└─────────────────────────────────┘
```

### **Funcionalidades Cliente:**
- **Visualização de entregas** contratadas
- **Status em tempo real**
- **Histórico completo**
- **Contato com motorista**
- **Avaliação de serviços**

---

## 🔔 **SISTEMA DE NOTIFICAÇÕES**

### **Tipos de Notificações:**
1. **Nova entrega disponível** (motorista)
2. **Entrega aceita/recusada** (cliente)
3. **Entrega concluída** (cliente)
4. **Lembrete de manutenção** (motorista)
5. **Relatório diário** (motorista)

### **Implementação:**
- **Firebase Cloud Messaging (FCM)**
- **Notificações locais** para lembretes
- **Centro de notificações** in-app
- **Configurações personalizáveis**

---

## 🎵 **SISTEMA DE RÁDIO INTEGRADO**

### **Player de Rádio:**
```
┌─────────────────────────────────┐
│ 🎵 Rádio Co-Piloto              │
├─────────────────────────────────┤
│ 📻 Rádio Globo                  │
│ Programa: Manhã Globo           │
│ ┌─────────────────────────────┐ │
│ │     ⏸️     ⏭️     ⏹️      │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 📋 ESTAÇÕES                    │
│ • Rádio Globo                   │
│ • Jovem Pan                     │
│ • BandNews FM                   │
│ • CBN                          │
└─────────────────────────────────┘
```

### **Funcionalidades:**
- **16 rádios nacionais** pré-configuradas
- **Player integrado** com controles
- **Categorização** por gênero
- **Funcionamento em background**
- **Controle por notificação**

---

## 🗄️ **ARMAZENAMENTO E SINCRONIZAÇÃO**

### **Estratégia de Dados:**
- **Firebase Firestore** - Dados principais
- **Room Database** - Cache local e offline
- **Sincronização automática** quando online
- **Modo offline** com funcionalidades limitadas

### **Estrutura de Dados:**
```kotlin
// Entidades principais
data class User(
    val id: String,
    val name: String,
    val email: String,
    val userType: UserType,
    val createdAt: Date
)

data class Transaction(
    val id: String,
    val userId: String,
    val clientId: String?,
    val type: TransactionType,
    val amount: Double,
    val description: String,
    val status: DeliveryStatus,
    val createdAt: Date
)

data class WorkShift(
    val id: String,
    val userId: String,
    val startTime: Date,
    val endTime: Date?,
    val totalKm: Double,
    val isActive: Boolean
)
```

---

## 🎨 **DESIGN E UX**

### **Design System:**
- **Material Design 3** como base
- **Cores principais:** Azul (#1976D2), Verde (#4CAF50), Laranja (#FF9800)
- **Tipografia:** Roboto (padrão Android)
- **Ícones:** Material Icons + Lucide Icons
- **Animações:** Transições suaves e micro-interações

### **Responsividade:**
- **Suporte a tablets** (layout adaptativo)
- **Orientação landscape** para dashboards
- **Densidade de tela** adaptativa
- **Acessibilidade** completa (TalkBack, contraste)

### **Temas:**
- **Tema claro** (padrão)
- **Tema escuro** (opcional)
- **Tema automático** (seguir sistema)

---

## 🔧 **FUNCIONALIDADES TÉCNICAS**

### **Performance:**
- **Lazy loading** de imagens e dados
- **Cache inteligente** com Room
- **Otimização de rede** com Retrofit
- **Compressão de imagens**
- **Minimização de bateria**

### **Segurança:**
- **Criptografia** de dados sensíveis
- **Biometria** para login (opcional)
- **Certificado pinning** para APIs
- **Validação** de entrada de dados
- **Logs de auditoria**

### **Testes:**
- **Unit tests** para lógica de negócio
- **Integration tests** para repositórios
- **UI tests** para telas principais
- **Testes de acessibilidade**

---

## 📋 **ROADMAP DE DESENVOLVIMENTO**

### **Fase 1 - MVP (4-6 semanas):**
- [ ] Setup do projeto e arquitetura
- [ ] Sistema de autenticação
- [ ] Dashboard básico do motorista
- [ ] CRUD de entregas
- [ ] Sincronização com Firebase

### **Fase 2 - Funcionalidades Core (4-6 semanas):**
- [ ] Dashboard financeiro completo
- [ ] Sistema de notificações
- [ ] Gestão de veículos
- [ ] Relatórios em PDF
- [ ] Dashboard do cliente

### **Fase 3 - Recursos Avançados (3-4 semanas):**
- [ ] Sistema de rádio
- [ ] Integração com mapas
- [ ] Modo offline completo
- [ ] Otimizações de performance
- [ ] Testes automatizados

### **Fase 4 - Polimento (2-3 semanas):**
- [ ] Refinamento de UX/UI
- [ ] Testes de usabilidade
- [ ] Otimizações finais
- [ ] Preparação para produção

---

## 🚀 **ENTREGÁVEIS ESPERADOS**

### **Código:**
- **Repositório Git** bem estruturado
- **Documentação** completa do código
- **README** com instruções de setup
- **Arquitetura** limpa e escalável

### **App:**
- **APK** de produção
- **AAB** para Google Play Store
- **Versão de debug** para testes
- **Configurações** de build otimizadas

### **Documentação:**
- **Manual do usuário**
- **Documentação técnica**
- **Guia de deploy**
- **Troubleshooting**

---

## 💡 **CONSIDERAÇÕES ESPECIAIS**

### **Integração com Sistema Web:**
- **Mesmo backend** Firebase
- **Sincronização** em tempo real
- **Compatibilidade** de dados
- **Migração** suave entre plataformas

### **Experiência Mobile-First:**
- **Gestos nativos** (swipe, pull-to-refresh)
- **Feedback háptico** para ações importantes
- **Otimização** para uso com uma mão
- **Integração** com sistema Android

### **Escalabilidade:**
- **Arquitetura modular** para futuras features
- **API versioning** para compatibilidade
- **Monitoramento** de performance
- **Analytics** de uso

---

## 🎯 **CRITÉRIOS DE SUCESSO**

### **Funcionalidade:**
- ✅ **100% das features** do sistema web implementadas
- ✅ **Sincronização** perfeita com backend
- ✅ **Modo offline** funcional
- ✅ **Performance** otimizada

### **Qualidade:**
- ✅ **Zero crashes** em produção
- ✅ **Tempo de carregamento** < 3 segundos
- ✅ **Cobertura de testes** > 80%
- ✅ **Acessibilidade** completa

### **UX:**
- ✅ **Interface intuitiva** e familiar
- ✅ **Navegação fluida** entre telas
- ✅ **Feedback visual** em todas as ações
- ✅ **Responsividade** em todos os dispositivos

---

**Este prompt fornece uma base sólida para desenvolver um app Android nativo completo, mantendo a funcionalidade e experiência do sistema web original, mas otimizado para a plataforma mobile.**


