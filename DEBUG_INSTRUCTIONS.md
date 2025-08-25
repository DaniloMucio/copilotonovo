# 🔧 Instruções para Resolver Problemas de Dados

## 🚨 Problema Atual
Os dashboards de "Gestão de Veículo" e "Financeiro" estão dando erro ao carregar dados.

## 🧪 Como Diagnosticar

### 1. Acesse a Página de Teste
- Vá para `/dashboard/teste` no seu app
- Clique em "🚀 Executar Todos os Testes"
- Verifique os resultados na tela e no console (F12)

### 2. Possíveis Causas e Soluções

#### 🔴 Erro "permission-denied"
**Causa:** Regras do Firestore muito restritivas
**Solução:** Implantar as novas regras de segurança

```bash
# Instalar Firebase CLI (se não tiver)
npm install -g firebase-tools

# Fazer login
firebase login

# Navegar para o projeto
cd C:\Users\windows\Downloads\Co-Piloto-master

# Implantar regras
firebase deploy --only firestore:rules
```

#### 🔴 Erro "unavailable"
**Causa:** Problema de conectividade ou configuração
**Solução:** Verificar configuração do Firebase em `src/lib/firebase.ts`

#### 🔴 Erro "not-found"
**Causa:** Coleção ou documento não existe
**Solução:** Verificar se as coleções foram criadas no Firebase Console

#### 🔴 Erro "unauthenticated"
**Causa:** Usuário não está logado corretamente
**Solução:** Verificar autenticação e logout/login

## 📋 Checklist de Verificação

- [ ] Usuário está logado (verificar `user.uid` no console)
- [ ] Regras do Firestore foram implantadas
- [ ] Coleções existem no Firebase Console
- [ ] Configuração do Firebase está correta
- [ ] Índices do Firestore foram criados

## 🛠️ Arquivos de Configuração

### firestore.rules
Contém as regras de segurança atualizadas para permitir acesso às coleções:
- `vehicles`
- `maintenance` 
- `fuel`
- `transactions`

### firestore.indexes.json
Contém índices otimizados para consultas por `userId` e `date`.

### firebase.json
Configuração do projeto Firebase.

## 🔍 Testes Disponíveis

1. **Teste de Conexão:** Verifica se o Firebase está acessível
2. **Teste de Coleções:** Verifica acesso a cada coleção
3. **Teste de Permissões:** Verifica se o usuário tem acesso
4. **Verificação de Dados:** Verifica se existem dados nas coleções

## 📱 Como Usar

1. Execute os testes na página `/dashboard/teste`
2. Verifique os resultados coloridos:
   - 🟢 Verde: Funcionando
   - 🟡 Amarelo: Aviso/atenção
   - 🔴 Vermelho: Erro
3. Use as informações do console para debug detalhado
4. Implemente as correções necessárias

## 🚀 Próximos Passos

Após resolver os problemas:
1. Teste os dashboards novamente
2. Verifique se os dados estão carregando
3. Atualize o roadmap com o progresso
4. Continue com as próximas funcionalidades

## 📞 Suporte

Se os problemas persistirem:
1. Verifique o console do navegador (F12)
2. Execute os testes de debug
3. Verifique as regras do Firestore
4. Consulte a documentação do Firebase
