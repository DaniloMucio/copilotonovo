'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  RefreshCw,
  Settings,
  Moon,
  Smartphone,
  Rocket,
  CheckCircle,
  Calendar,
  Tag,
  Sparkles,
  Zap,
  Shield,
  Globe,
  Heart
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AtualizacoesPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const updates = [
    {
      version: "v1.2.0",
      date: "Janeiro 2025",
      title: "Sistema de Configurações Unificado",
      description: "Nova página de configurações com todas as opções organizadas em abas intuitivas para melhor experiência do usuário.",
      features: [
        "Tema claro/escuro com detecção automática do sistema",
        "Configurações de perfil unificadas",
        "Gerenciamento de senha seguro",
        "Exclusão de conta com confirmação",
        "Interface responsiva para dispositivos móveis"
      ],
      icon: <Settings className="h-6 w-6" />,
      type: "feature",
      highlights: ["Nova funcionalidade", "Melhoria de UX", "Mobile-first"]
    },
    {
      version: "v1.1.5",
      date: "Dezembro 2024",
      title: "Melhorias no Modo Escuro",
      description: "Otimizações significativas na visibilidade e contraste do tema escuro para melhor legibilidade.",
      features: [
        "Cores aprimoradas para melhor contraste",
        "Interface mais legível em ambientes escuros",
        "Ajustes em cards e componentes",
        "Melhor visibilidade de textos e ícones",
        "Suporte completo a todos os componentes"
      ],
      icon: <Moon className="h-6 w-6" />,
      type: "improvement",
      highlights: ["Acessibilidade", "UX melhorada", "Design system"]
    },
    {
      version: "v1.1.0",
      date: "Novembro 2024",
      title: "PWA para Smartphones",
      description: "Aplicação web progressiva otimizada para dispositivos móveis com funcionalidades nativas.",
      features: [
        "Instalação nativa no dispositivo",
        "Funcionamento offline com sincronização",
        "Notificações push nativas",
        "Interface otimizada para touch",
        "Performance melhorada em mobile"
      ],
      icon: <Smartphone className="h-6 w-6" />,
      type: "feature",
      highlights: ["Mobile", "PWA", "Offline"]
    },
    {
      version: "v1.0.5",
      date: "Outubro 2024",
      title: "Correções e Otimizações",
      description: "Correções importantes e otimizações de performance para melhor estabilidade.",
      features: [
        "Correção de bugs de sincronização",
        "Melhoria na velocidade de carregamento",
        "Otimização de consultas ao banco de dados",
        "Correção de problemas de autenticação",
        "Melhor tratamento de erros"
      ],
      icon: <Shield className="h-6 w-6" />,
      type: "fix",
      highlights: ["Bug fixes", "Performance", "Estabilidade"]
    },
    {
      version: "v1.0.0",
      date: "Setembro 2024",
      title: "Lançamento Inicial",
      description: "Primeira versão do Co-Piloto Driver com funcionalidades básicas de gestão financeira.",
      features: [
        "Sistema completo de gestão financeira",
        "Controle de entregas e agendamentos",
        "Relatórios detalhados em PDF",
        "Dashboard interativo",
        "Sistema de autenticação seguro"
      ],
      icon: <Rocket className="h-6 w-6" />,
      type: "launch",
      highlights: ["Lançamento", "MVP", "Core features"]
    }
  ];

  const upcomingFeatures = [
    {
      title: "Aplicativo Android Nativo",
      description: "App nativo para Android com funcionalidades exclusivas",
      status: "Em desenvolvimento",
      icon: <Globe className="h-5 w-5" />
    },
    {
      title: "Integração com APIs de Logística",
      description: "Conectividade com sistemas de rastreamento",
      status: "Planejado",
      icon: <Zap className="h-5 w-5" />
    },
    {
      title: "Relatórios Avançados",
      description: "Análises mais detalhadas e insights inteligentes",
      status: "Planejado",
      icon: <Heart className="h-5 w-5" />
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'improvement':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'fix':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'launch':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return <Sparkles className="h-4 w-4" />;
      case 'improvement':
        return <RefreshCw className="h-4 w-4" />;
      case 'fix':
        return <Shield className="h-4 w-4" />;
      case 'launch':
        return <Rocket className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-green-100/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-purple-50/50"></div>
        <div className="container mx-auto px-6 py-4 relative">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <ArrowLeft className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Atualizações
                  </h1>
                </div>
              </Link>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-full px-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Zap className="h-4 w-4 mr-2" />
                  Entrar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center relative">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Badge variant="secondary" className="mb-8 px-6 py-3 text-sm font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-0 rounded-full shadow-lg">
                <RefreshCw className="h-4 w-4 mr-2" />
                Histórico de Atualizações
              </Badge>
            </motion.div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-8 text-gray-900 leading-tight">
              Acompanhe nossa
              <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                evolução constante
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto font-light">
              Estamos sempre trabalhando para melhorar sua experiência com novas funcionalidades, 
              correções e otimizações baseadas no seu feedback.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Updates Timeline */}
      <section className="py-16 relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            {updates.map((update, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
                transition={{ duration: 0.8, delay: 0.1 * index }}
                className="mb-12"
              >
                <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden group hover:bg-gradient-to-br hover:from-white hover:to-green-50/50">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                          update.type === 'feature' ? 'bg-gradient-to-br from-blue-100 to-blue-200' :
                          update.type === 'improvement' ? 'bg-gradient-to-br from-yellow-100 to-yellow-200' :
                          update.type === 'fix' ? 'bg-gradient-to-br from-red-100 to-red-200' :
                          update.type === 'launch' ? 'bg-gradient-to-br from-green-100 to-green-200' :
                          'bg-gradient-to-br from-gray-100 to-gray-200'
                        }`}>
                          <div className={`${
                            update.type === 'feature' ? 'text-blue-600' :
                            update.type === 'improvement' ? 'text-yellow-600' :
                            update.type === 'fix' ? 'text-red-600' :
                            update.type === 'launch' ? 'text-green-600' :
                            'text-gray-600'
                          } group-hover:scale-110 transition-transform duration-500`}>
                            {update.icon}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge variant="secondary" className={`${getTypeColor(update.type)} border`}>
                              {getTypeIcon(update.type)}
                              <span className="ml-1">{update.version}</span>
                            </Badge>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-1" />
                              {update.date}
                            </div>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300 mb-2">
                            {update.title}
                          </h3>
                          <p className="text-gray-600 text-lg leading-relaxed">
                            {update.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Highlights */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {update.highlights.map((highlight, highlightIndex) => (
                        <Badge key={highlightIndex} variant="outline" className="text-xs bg-white/50 border-gray-200 text-gray-600">
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="relative z-10">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      Principais Funcionalidades
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {update.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start space-x-3 p-3 bg-gray-50/50 rounded-lg hover:bg-green-50/50 transition-colors duration-300">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Features */}
      <section className="py-16 bg-white/50 relative">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Próximas Funcionalidades
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Estamos trabalhando em novas funcionalidades que chegarão em breve
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
                  transition={{ duration: 0.8, delay: 0.1 * index + 0.8 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group"
                >
                  <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-500 bg-gradient-to-br from-white to-blue-50/50 rounded-xl overflow-hidden">
                    <CardHeader className="text-center pb-4">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <div className="text-blue-600">
                          {feature.icon}
                        </div>
                      </div>
                      <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 text-sm">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                        {feature.status}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Quer sugerir uma funcionalidade?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Sua opinião é fundamental para o desenvolvimento do Co-Piloto Driver. 
              Entre em contato conosco e nos ajude a melhorar a plataforma.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/login">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-6 bg-white text-gray-900 hover:bg-gray-100 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                    <Zap className="h-5 w-5 mr-2" />
                    Começar a Usar
                  </Button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-gray-900 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Voltar ao Início
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
