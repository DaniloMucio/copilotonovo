import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Função para corrigir usuários que não têm o campo isActive definido
 * Execute uma vez para garantir que todos os usuários tenham o campo isActive
 */
export const fixUsersIsActiveField = async () => {
  console.log('🔄 [MIGRATION] Iniciando correção do campo isActive...');
  
  try {
    // Buscar todos os usuários
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    
    let totalUsers = 0;
    let usersFixed = 0;
    let errors = 0;
    
    // Processar cada usuário
    const promises = snapshot.docs.map(async (userDoc) => {
      totalUsers++;
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      console.log(`\n👤 [MIGRATION] Verificando usuário: ${userData.email || userId}`);
      console.log(`📊 [MIGRATION] Tipo: ${userData.userType}, isActive atual: ${userData.isActive} (${typeof userData.isActive})`);
      
      try {
        // Verificar se isActive não está definido ou é undefined
        if (userData.isActive === undefined || userData.isActive === null) {
          console.log(`🔧 [MIGRATION] Corrigindo usuário ${userData.email || userId} - definindo isActive como true`);
          
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            isActive: true,
            updatedAt: new Date()
          });
          
          usersFixed++;
          console.log(`✅ [MIGRATION] Usuário ${userData.email || userId} corrigido`);
        } else {
          console.log(`✅ [MIGRATION] Usuário ${userData.email || userId} já tem isActive definido: ${userData.isActive}`);
        }
      } catch (error) {
        console.error(`❌ [MIGRATION] Erro ao corrigir usuário ${userData.email || userId}:`, error);
        errors++;
      }
    });
    
    // Aguardar todas as atualizações
    await Promise.all(promises);
    
    console.log('\n📊 [MIGRATION] Relatório final:');
    console.log(`- Total de usuários verificados: ${totalUsers}`);
    console.log(`- Usuários corrigidos: ${usersFixed}`);
    console.log(`- Erros: ${errors}`);
    console.log('✅ [MIGRATION] Correção concluída!');
    
    return { totalUsers, usersFixed, errors };
    
  } catch (error) {
    console.error('❌ [MIGRATION] Erro durante migração:', error);
    throw error;
  }
};

/**
 * Função para verificar o status atual de todos os usuários (apenas leitura)
 */
export const auditUsersIsActiveField = async () => {
  console.log('🔍 [AUDIT] Iniciando auditoria do campo isActive...');
  
  try {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    
    const auditResults: any[] = [];
    
    snapshot.docs.forEach((userDoc) => {
      const userData = userDoc.data();
      auditResults.push({
        id: userDoc.id,
        email: userData.email,
        displayName: userData.displayName,
        userType: userData.userType,
        isActive: userData.isActive,
        isActiveType: typeof userData.isActive,
        isOnline: userData.isOnline,
        isOnlineType: typeof userData.isOnline,
        needsFix: userData.isActive === undefined || userData.isActive === null
      });
    });
    
    console.log('📊 [AUDIT] Resultado da auditoria:');
    console.table(auditResults);
    
    const needsFix = auditResults.filter(u => u.needsFix);
    console.log(`\n⚠️ [AUDIT] ${needsFix.length} usuários precisam de correção`);
    
    if (needsFix.length > 0) {
      console.log('🔧 [AUDIT] Usuários que precisam de correção:');
      console.table(needsFix);
    }
    
    return auditResults;
    
  } catch (error) {
    console.error('❌ [AUDIT] Erro durante auditoria:', error);
    throw error;
  }
};

// Disponibilizar no window para uso no console do navegador
if (typeof window !== 'undefined') {
  (window as any).fixUsersIsActiveField = fixUsersIsActiveField;
  (window as any).auditUsersIsActiveField = auditUsersIsActiveField;
  
  console.log('🛠️ [MIGRATION] Funções de migração carregadas:');
  console.log('  - fixUsersIsActiveField() - corrige usuários sem isActive');
  console.log('  - auditUsersIsActiveField() - mostra status atual dos usuários');
}
