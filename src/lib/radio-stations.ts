export interface RadioStation {
  id: string;
  name: string;
  description: string;
  streamUrl: string;
  category: 'music' | 'news' | 'specialized' | 'regional';
  region?: string;
  website?: string;
}

export const radioStations: RadioStation[] = [
  // 🎵 RÁDIOS MUSICAIS
  { 
    id: 'kissfm',
    name: 'Kiss FM', 
    description: "O melhor do Rock 'n' Roll", 
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_KISSFM_ADP.aac',
    category: 'music',
    website: 'https://www.kissfm.com.br'
  },
  {
    id: 'jovempan',
    name: 'Jovem Pan FM',
    description: 'A rádio que toca tudo!',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/JOVEM_PAN_FM_SPAAC.aac',
    category: 'music',
    website: 'https://jovempan.uol.com.br'
  },
  {
    id: 'mixfm',
    name: 'Mix FM',
    description: 'Música e diversão!',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/MIXFM_SPAAC.aac',
    category: 'music',
    website: 'https://www.mixfm.com.br'
  },
  {
    id: 'transamerica',
    name: 'Transamérica FM',
    description: 'A rádio que toca o Brasil!',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TRANSAMERICA_SPAAC.aac',
    category: 'music',
    website: 'https://www.transamerica.com.br'
  },
  {
    id: 'rbd',
    name: 'Rádio Bandeirantes',
    description: 'A rádio do seu dia a dia',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_BANDEIRANTES_SPAAC.aac',
    category: 'music',
    website: 'https://www.band.uol.com.br'
  },
  
  // 📻 RÁDIOS DE NOTÍCIAS
  {
    id: 'bandfm',
    name: 'Band FM (São Paulo)',
    description: 'A sua rádio, do seu jeito!',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/BANDFM_SPAAC.aac',
    category: 'news',
    region: 'São Paulo',
    website: 'https://www.band.uol.com.br'
  },
  {
    id: 'bandnewsfm',
    name: 'BandNews FM (São Paulo)',
    description: 'Em 20 minutos, tudo pode mudar.',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/BANDNEWSFM_SPAAC.aac',
    category: 'news',
    region: 'São Paulo',
    website: 'https://www.band.uol.com.br'
  },
  {
    id: 'cbn',
    name: 'CBN (São Paulo)',
    description: 'A rádio que toca notícia.',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/CBN_SPAAC.aac',
    category: 'news',
    region: 'São Paulo',
    website: 'https://cbn.globoradio.globo.com'
  },
  {
    id: 'cnnbrasil',
    name: 'CNN Brasil Rádio',
    description: 'Notícias 24 horas por dia',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/CNN_BRASIL_RADIO_SPAAC.aac',
    category: 'news',
    website: 'https://www.cnnbrasil.com.br'
  },
  
  // 🎶 RÁDIOS ESPECIALIZADAS
  {
    id: 'radiofutura',
    name: 'Rádio Futura',
    description: 'Música brasileira de qualidade',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_FUTURA_SPAAC.aac',
    category: 'specialized',
    website: 'https://futura.org.br'
  },
  {
    id: 'radioinconfidencia',
    name: 'Rádio Inconfidência',
    description: 'Cultura e música brasileira',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_INCONFIDENCIA_MGAAC.aac',
    category: 'specialized',
    region: 'Minas Gerais',
    website: 'https://www.inconfidencia.com.br'
  },
  {
    id: 'radiofmg',
    name: 'Rádio FMG',
    description: 'Música gospel e mensagens',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_FMG_SPAAC.aac',
    category: 'specialized',
    website: 'https://www.fmg.org.br'
  },
  
  // 🌟 RÁDIOS REGIONAIS
  {
    id: 'radioitatiaia',
    name: 'Rádio Itatiaia',
    description: 'A voz de Minas Gerais',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_ITATIAIA_MGAAC.aac',
    category: 'regional',
    region: 'Minas Gerais',
    website: 'https://www.itatiaia.com.br'
  },
  {
    id: 'radiofarroupilha',
    name: 'Rádio Farroupilha',
    description: 'A rádio do Rio Grande do Sul',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_FARROUPILHA_POAAC.aac',
    category: 'regional',
    region: 'Rio Grande do Sul',
    website: 'https://www.radiofarroupilha.com.br'
  },
  {
    id: 'radioverdesmares',
    name: 'Rádio Verdes Mares',
    description: 'A voz do Ceará',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_VERDES_MARES_FORAC.aac',
    category: 'regional',
    region: 'Ceará',
    website: 'https://www.radioverdesmares.com.br'
  }
];

// Função para obter rádios por categoria
export const getStationsByCategory = (category: string) => {
  if (category === 'all') return radioStations;
  return radioStations.filter(station => station.category === category);
};

// Função para buscar rádios
export const searchStations = (searchTerm: string) => {
  const term = searchTerm.toLowerCase();
  return radioStations.filter(station => 
    station.name.toLowerCase().includes(term) ||
    station.description.toLowerCase().includes(term) ||
    (station.region && station.region.toLowerCase().includes(term))
  );
};

// Função para obter rádios favoritas (pode ser expandida no futuro)
export const getFavoriteStations = () => {
  return radioStations.filter(station => 
    ['kissfm', 'jovempan', 'bandfm', 'cbn'].includes(station.id)
  );
};
