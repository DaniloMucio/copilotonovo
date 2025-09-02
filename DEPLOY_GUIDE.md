# 🚀 Guia de Deploy - Sistema de Notificações

## 📋 Checklist de Deploy

### ✅ Pré-requisitos
- [ ] Firebase CLI instalado (`npm install -g firebase-tools`)
- [ ] Logado no Firebase (`firebase login`)
- [ ] Projeto configurado (`firebase use co-pilotogit`)

### ✅ Configuração Firebase Console
1. **Gerar Chave VAPID:**
   - Acesse [Firebase Console](https://console.firebase.google.com/project/co-pilotogit)
   - Vá para **Project Settings** > **Cloud Messaging**
   - Clique em **Generate new private key**
   - Copie a chave pública VAPID

2. **Atualizar Código:**
   ```typescript
   // Em src/services/notifications.ts
   const VAPID_KEY = 'SUA_CHAVE_VAPID_REAL_AQUI';
   ```

### ✅ Deploy das Regras do Firestore
```bash
firebase deploy --only firestore:rules
```

### ✅ Deploy das Cloud Functions
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### ✅ Deploy do Hosting
```bash
npm run build
firebase deploy --only hosting
```

## 🔧 Comandos de Deploy

### Deploy Completo
```bash
# Tornar o script executável
chmod +x deploy-notifications.sh

# Executar deploy
./deploy-notifications.sh
```

### Deploy Individual
```bash
# Apenas regras do Firestore
firebase deploy --only firestore:rules

# Apenas Cloud Functions
firebase deploy --only functions

# Apenas hosting
firebase deploy --only hosting
```

## 🧪 Testes Pós-Deploy

### 1. Teste Local
```bash
npm run dev
# Acesse http://localhost:3000
# Teste as notificações na dashboard
```

### 2. Teste em Produção
```bash
# Acesse sua URL de produção
# Teste as notificações push
# Verifique os logs das Cloud Functions
```

### 3. Verificar Logs
```bash
# Logs das Cloud Functions
firebase functions:log

# Logs do Firestore
# Acesse Firebase Console > Firestore > Usage
```

## 📊 Monitoramento

### Firebase Console
- **Functions**: https://console.firebase.google.com/project/co-pilotogit/functions
- **Firestore**: https://console.firebase.google.com/project/co-pilotogit/firestore
- **Analytics**: https://console.firebase.google.com/project/co-pilotogit/analytics

### Métricas Importantes
- Taxa de entrega de notificações
- Tempo de resposta das Cloud Functions
- Uso de recursos do Firestore
- Erros de autenticação

## 🐛 Troubleshooting

### Problemas Comuns

1. **"Function not found"**
   ```bash
   # Verificar se as functions foram deployadas
   firebase functions:list
   ```

2. **"Permission denied"**
   ```bash
   # Verificar regras do Firestore
   firebase firestore:rules:get
   ```

3. **"VAPID key invalid"**
   - Verificar se a chave VAPID está correta
   - Confirmar se foi copiada completamente

### Logs Úteis
```bash
# Logs em tempo real
firebase functions:log --follow

# Logs específicos
firebase functions:log --only sendPushNotification
```

## 🔄 Rollback

### Reverter Deploy
```bash
# Listar deploys anteriores
firebase hosting:releases

# Reverter para versão anterior
firebase hosting:rollback
```

### Reverter Functions
```bash
# Deploy versão anterior das functions
git checkout HEAD~1
firebase deploy --only functions
```

## 📱 Teste em Dispositivos

### Android
1. Instalar app via PWA
2. Permitir notificações
3. Testar notificações push
4. Verificar comportamento em background

### iOS
1. Instalar app via PWA
2. Permitir notificações
3. Testar notificações push
4. Verificar comportamento em background

### Desktop
1. Acessar via Chrome/Edge
2. Permitir notificações
3. Testar notificações push
4. Verificar comportamento com app fechado

## 🎯 Próximos Passos

1. **Monitorar métricas** por 1 semana
2. **Coletar feedback** dos usuários
3. **Otimizar performance** baseado nos dados
4. **Implementar notificações agendadas**
5. **Adicionar analytics** de notificações
