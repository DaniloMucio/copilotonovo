# 🚛 Co-Piloto Driver

> **O seu co-piloto digital para gestão financeira completa como motorista autônomo**

[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.9.1-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-green?style=flat-square)](https://web.dev/progressive-web-apps/)

## 🎯 **Sobre o Projeto**

O **Co-Piloto Driver** é uma aplicação web progressiva (PWA) desenvolvida para motoristas autônomos que precisam de uma ferramenta completa para gestão financeira, controle de jornadas e administração de entregas.

### **Problema Resolvido**
- ✅ Controle financeiro detalhado (receitas, despesas, lucro)
- ✅ Gestão de jornadas de trabalho com precisão
- ✅ Administração de entregas para clientes
- ✅ Relatórios detalhados para tomada de decisões
- ✅ Interface otimizada para uso mobile

### **Diferenciais**
- 🚀 **PWA**: Funciona offline e pode ser instalado como app
- 🎨 **UI/UX Moderna**: Interface intuitiva e responsiva
- ⚡ **Performance**: Cache inteligente e carregamento otimizado
- 🔒 **Segurança**: Autenticação Firebase e regras rigorosas
- 📊 **Relatórios**: Exportação em PDF e análises detalhadas

## ✨ **Funcionalidades**

### **🚛 Para Motoristas**
- **Gestão Financeira**
  - Controle de receitas e despesas
  - Categorização automática de gastos
  - Cálculo automático de lucro líquido
  - Ajuda de custo por empresa

- **Controle de Jornada**
  - Registro de início/fim de jornada
  - Controle de pausas
  - Histórico detalhado de trabalho
  - Quilometragem por período

- **Gestão de Entregas**
  - Cadastro de entregas por cliente
  - Status de pagamento (À vista/A receber)
  - Endereços completos (remetente/destinatário)
  - Histórico de entregas

### **🏢 Para Clientes**
- **Acompanhamento de Entregas**
  - Visualização de entregas contratadas
  - Status em tempo real
  - Histórico completo

### **📱 Funcionalidades Gerais**
- **Relatórios Inteligentes**
  - Exportação em PDF
  - Gráficos interativos
  - Análise de períodos customizados

- **Interface Moderna**
  - Design responsivo
  - Modo escuro/claro
  - Animações suaves
  - Feedback visual em tempo real

- **PWA Features**
  - Instalação como app nativo
  - Funcionamento offline
  - Notificações push
  - Sincronização automática

## 🛠️ **Tecnologias**

### **Frontend**
- **[Next.js 14](https://nextjs.org/)** - Framework React com SSR/SSG
- **[React 18](https://reactjs.org/)** - Biblioteca de interface
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utilitário
- **[Shadcn/ui](https://ui.shadcn.com/)** - Componentes UI reutilizáveis

### **Backend & Database**
- **[Firebase Auth](https://firebase.google.com/docs/auth)** - Autenticação
- **[Firestore](https://firebase.google.com/docs/firestore)** - Banco NoSQL
- **[Firebase Functions](https://firebase.google.com/docs/functions)** - Serverless

### **Ferramentas & Bibliotecas**
- **[Zod](https://zod.dev/)** - Validação de schemas
- **[React Hook Form](https://react-hook-form.com/)** - Formulários performáticos
- **[Recharts](https://recharts.org/)** - Gráficos interativos
- **[jsPDF](https://github.com/MrRio/jsPDF)** - Geração de PDFs
- **[Date-fns](https://date-fns.org/)** - Manipulação de datas

### **Qualidade & Performance**
- **Error Boundaries** - Captura de erros React
- **Cache Inteligente** - Otimização de queries Firestore
- **Lazy Loading** - Carregamento sob demanda
- **TypeScript Strict** - Tipagem rigorosa

## 🚀 **Instalação & Configuração**

### **Pré-requisitos**
- Node.js 18+ 
- npm ou yarn
- Conta Firebase

### **Instalação Rápida**

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/co-piloto-driver.git
cd co-piloto-driver
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o Firebase**
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   - Ative Authentication (Email/Password) e Firestore
   - Copie as credenciais para `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

4. **Execute a aplicação**
```bash
npm run dev
```

5. **Acesse**: http://localhost:9003

### **Configuração de Produção**

Para deploy em produção, configure:
- Domínios autorizados no Firebase Auth
- Regras de segurança do Firestore
- Variáveis de ambiente no seu provedor (Vercel/Netlify)

## 📖 **Como Usar**

### **Primeiro Acesso**
1. Cadastre-se como Motorista ou Cliente
2. Complete seu perfil 
3. Comece a registrar suas atividades

### **Principais Fluxos**

#### **Para Motoristas:**
- **Receitas/Despesas**: Dashboard → Adicionar Transação
- **Jornadas**: Dashboard → Jornada → Iniciar/Finalizar
- **Entregas**: Dashboard → Entregas → Nova Entrega
- **Relatórios**: Dashboard → Relatórios → Gerar PDF

#### **Para Clientes:**
- **Acompanhar Entregas**: Dashboard → Entregas
- **Histórico**: Dashboard → Histórico

## 🏗️ **Arquitetura**

### **Estrutura Principal**
```
src/
├── app/                 # App Router (Next.js 14)
├── components/          # Componentes React
│   ├── ui/             # UI base (shadcn/ui)
│   └── forms/          # Formulários específicos
├── lib/                # Utilitários e configurações
├── services/           # APIs e serviços
└── hooks/              # Hooks customizados
```

### **Principais Features Implementadas**
- ✅ **Sistema de Autenticação** completo
- ✅ **Error Boundaries** para captura de erros
- ✅ **Cache Inteligente** para Firestore
- ✅ **Toast Manager** com feedback contextual
- ✅ **Animações CSS** suaves e performáticas
- ✅ **Lazy Loading** de componentes
- ✅ **PWA** com Service Worker

## 🤝 **Contribuição**

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add: nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 🙏 **Agradecimentos**

- [Shadcn/ui](https://ui.shadcn.com/) - Componentes base
- [Firebase](https://firebase.google.com/) - Infraestrutura
- [Next.js](https://nextjs.org/) - Framework incrível
- Comunidade Open Source

---

<div align="center">

**⭐ Se este projeto foi útil, deixe uma estrela!**

**📧 Suporte**: suporte@co-piloto.app

</div>