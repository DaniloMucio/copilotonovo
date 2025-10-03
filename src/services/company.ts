// Serviço para dados da empresa
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface CompanyData {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };
  whatsappMessage: string;
  createdAt: string;
  updatedAt: string;
}

// Função para buscar dados da empresa
export async function getCompanyData(): Promise<CompanyData | null> {
  try {
    const companyRef = doc(db, 'company', 'settings');
    const companyDoc = await getDoc(companyRef);
    
    if (!companyDoc.exists()) {
      return null;
    }
    
    return companyDoc.data() as CompanyData;
  } catch (error) {
    console.error('Erro ao buscar dados da empresa:', error);
    return null;
  }
}

// Função para salvar dados da empresa
export async function saveCompanyData(data: Partial<CompanyData>): Promise<void> {
  try {
    const companyRef = doc(db, 'company', 'settings');
    const now = new Date().toISOString();
    
    const companyData: CompanyData = {
      id: 'settings',
      name: data.name || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || {
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        cep: ''
      },
      whatsappMessage: data.whatsappMessage || '',
      createdAt: data.createdAt || now,
      updatedAt: now
    };
    
    await setDoc(companyRef, companyData, { merge: true });
  } catch (error) {
    console.error('Erro ao salvar dados da empresa:', error);
    throw error;
  }
}

// Função para gerar mensagem padrão do WhatsApp
export function generateDefaultWhatsAppMessage(
  trackingCode: string,
  recipientName: string,
  status: string,
  senderCompany?: string
): string {
  const company = senderCompany || 'Nossa empresa';
  
  return `🎉 Olá ${recipientName}! Que alegria ter você conosco! 🎊

🚚 Sua entrega está a caminho e não podemos esperar para entregá-la! 

📦 *Código de rastreamento:* \`${trackingCode}\`
🔗 *Acompanhe em tempo real:* ${typeof window !== 'undefined' ? window.location.origin : ''}/rastreio?code=${trackingCode}

✨ *Status atual:* ${status}
🏢 *Empresa:* ${company}

💝 *Obrigado por confiar em nossos serviços!* 
🙏 *Sua satisfação é nossa prioridade!* 

🌟 *Equipe ${company}* 💙`;
}

