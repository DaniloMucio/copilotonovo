# 🔥 Configuração Firebase para Notificações

## 1. Gerar Chave VAPID

### Passo 1: Acessar Firebase Console
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto `co-pilotogit`
3. Vá para **Project Settings** (ícone de engrenagem)

### Passo 2: Configurar Cloud Messaging
1. Na aba **Cloud Messaging**
2. Clique em **Generate new private key**
3. Baixe o arquivo JSON com as chaves
4. Copie a chave pública VAPID

### Passo 3: Atualizar Código
Substitua a chave VAPID no arquivo `src/services/notifications.ts`:

```typescript
// Substitua esta linha:
const VAPID_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HI8F7j1Ow09cW-4gX3fx2HvFYhIBkMW3SDcMjS6Xy6pOwa1iDee5U8Xo2E';

// Por sua chave real:
const VAPID_KEY = 'SUA_CHAVE_VAPID_REAL_AQUI';
```

## 2. Configurar Regras do Firestore

### Adicionar ao arquivo `firestore.rules`:

```javascript
// Regras para notificações
match /notifications/{notificationId} {
  allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
  allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
}

match /notificationSettings/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

match /fcmTokens/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## 3. Configurar Variáveis de Ambiente

### Adicionar ao arquivo `.env.local`:

```env
# Firebase Cloud Messaging
NEXT_PUBLIC_FCM_VAPID_KEY=sua_chave_vapid_aqui
NEXT_PUBLIC_FCM_SENDER_ID=1004254989892
```

## 4. Testar Notificações

### Em Desenvolvimento:
1. Execute `npm run dev`
2. Acesse a dashboard do motorista
3. Clique em "Ativar Notificações"
4. Clique em "Testar Notificação"

### Em Produção:
1. Faça deploy da aplicação
2. Acesse em HTTPS (obrigatório para notificações)
3. Teste as notificações push

## 5. Monitoramento

### Firebase Console:
- **Analytics** > **Events** para ver estatísticas de notificações
- **Cloud Messaging** para ver histórico de envios
- **Firestore** para ver dados de notificações

## 6. Troubleshooting

### Problemas Comuns:

1. **"Request is missing required authentication credential"**
   - Verifique se a chave VAPID está correta
   - Confirme se o usuário está autenticado

2. **"Missing or insufficient permissions"**
   - Verifique as regras do Firestore
   - Confirme se o usuário tem permissões

3. **Notificações não aparecem**
   - Verifique se o site está em HTTPS
   - Confirme se as permissões foram concedidas
   - Verifique o console do navegador

### Logs Úteis:
```javascript
// Adicionar ao console para debug
console.log('FCM Token:', await getToken(messaging));
console.log('Notification Permission:', Notification.permission);
console.log('Service Worker:', navigator.serviceWorker);
```