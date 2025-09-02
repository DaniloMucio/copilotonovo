# 🔥 Configuração do Firebase

## ❌ Problema Atual
Você está recebendo o erro `Firebase: Error (auth/invalid-api-key)` porque as configurações do Firebase não estão definidas.

## ✅ Solução

### 1. Criar arquivo `.env.local`
Crie um arquivo chamado `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
# Configurações do Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

### 2. Obter as credenciais do Firebase

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Selecione seu projeto (ou crie um novo)
3. Vá em **Configurações do projeto** (ícone de engrenagem)
4. Na aba **Geral**, role até **Seus aplicativos**
5. Se não tiver um app web, clique em **Adicionar app** > **Web**
6. Copie as configurações do objeto `firebaseConfig`

### 3. Exemplo de configuração real:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=meu-projeto-123.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=meu-projeto-123
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=meu-projeto-123.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

### 4. Reiniciar o servidor
Após criar o arquivo `.env.local`, reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

## ⚠️ Importante
- O arquivo `.env.local` não deve ser commitado no Git (já está no .gitignore)
- Nunca compartilhe suas chaves de API publicamente
- As variáveis devem começar com `NEXT_PUBLIC_` para funcionar no frontend

## 🔧 Configurações adicionais necessárias

### Firestore Database
1. No console do Firebase, vá em **Firestore Database**
2. Clique em **Criar banco de dados**
3. Escolha **Modo de teste** (para desenvolvimento)
4. Selecione uma localização

### Authentication
1. No console do Firebase, vá em **Authentication**
2. Clique em **Começar**
3. Na aba **Sign-in method**, habilite **Email/Password**

### Storage (opcional)
1. No console do Firebase, vá em **Storage**
2. Clique em **Começar**
3. Aceite as regras padrão

## 🚀 Após configurar
Depois de configurar tudo, sua aplicação deve funcionar normalmente sem erros de autenticação!
