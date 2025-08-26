'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Fuel, 
  Wrench, 
  Calendar, 
  TrendingUp, 
  Shield, 
  CheckCircle,
  ArrowRight,
  Play,
  Download,
  Users,
  BarChart3,
  Clock,
  Bell,
  LogIn,
  Zap,
  Cpu,
  Database,
  Globe
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePWAInstall } from '@/hooks/use-pwa-install';

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { canInstall, isInstalled, installApp, showInstallButton } = usePWAInstall();

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: <Car className="h-8 w-8" />,
      title: "Gestão de Veículos",
      description: "Controle completo de informações, manutenções e histórico do seu veículo"
    },
    {
      icon: <Fuel className="h-8 w-8" />,
      title: "Controle de Combustível",
      description: "Acompanhe abastecimentos, consumo médio e custos de combustível"
    },
    {
      icon: <Wrench className="h-8 w-8" />,
      title: "Manutenções Inteligentes",
      description: "Agende e acompanhe manutenções com lembretes automáticos"
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Gestão de Jornadas",
      description: "Controle horários de trabalho, pausas e quilometragem"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Relatórios Financeiros",
      description: "Análises detalhadas de receitas, despesas e lucro"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Segurança Total",
      description: "Autenticação Firebase e dados protegidos com criptografia"
    }
  ];

  const stats = [
    { label: "Motoristas Ativos", value: "500+", icon: <Users className="h-6 w-6" /> },
    { label: "Entregas Realizadas", value: "10K+", icon: <Globe className="h-6 w-6" /> },
    { label: "Economia Média", value: "R$ 2.5K", icon: <TrendingUp className="h-6 w-6" /> },
    { label: "Tempo Economizado", value: "15h/mês", icon: <Clock className="h-6 w-6" /> }
  ];

  const benefits = [
    "Controle financeiro detalhado em tempo real",
    "Gestão completa de jornadas de trabalho",
    "Administração inteligente de entregas",
    "Relatórios automatizados em PDF",
    "Interface otimizada para dispositivos móveis",
    "Funcionamento offline com sincronização automática",
    "Notificações push para lembretes importantes",
    "Backup automático na nuvem"
  ];

  const technologies = [
    { name: "Next.js 14", icon: "⚡", description: "Framework React com SSR/SSG" },
    { name: "TypeScript", icon: "🔷", description: "Tipagem estática e segurança" },
    { name: "Firebase", icon: "🔥", description: "Backend serverless e autenticação" },
    { name: "Tailwind CSS", icon: "🎨", description: "Framework CSS utilitário" },
    { name: "PWA", icon: "📱", description: "Aplicação web progressiva" },
    { name: "Shadcn/ui", icon: "🎯", description: "Componentes UI reutilizáveis" }
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Tech Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-green-100/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse animation-delay-4000"></div>
        
        {/* Tech Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
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
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group">
                <Car className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Co-Piloto Driver
                </h1>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-full px-6 shadow-lg hover:shadow-xl transition-all duration-300">
                    <Zap className="h-4 w-4 mr-2" />
                    Entrar
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-32 text-center relative">
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
              <Badge variant="secondary" className="mb-8 px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-gray-700 border-0 rounded-full shadow-lg">
                🚀 Nova Versão Disponível
              </Badge>
            </motion.div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-8 text-gray-900 leading-tight">
              O seu co-piloto digital para
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient">
                gestão financeira completa
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto font-light">
              Ferramenta completa para motoristas autônomos que precisam de controle financeiro, 
              gestão de jornadas e administração de entregas em uma única plataforma.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                  <Zap className="h-5 w-5 mr-2" />
                  Começar Agora
                </Button>
              </motion.div>
                             {showInstallButton && !isInstalled ? (
                 <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                   <Button 
                     onClick={installApp}
                     size="lg" 
                     className="text-lg px-8 py-6 border-2 border-green-600 text-green-600 hover:bg-green-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                   >
                     <Download className="h-5 w-5 mr-2" />
                     Instalar App
                   </Button>
                 </motion.div>
               ) : isInstalled ? (
                 <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                   <Button 
                     variant="outline" 
                     size="lg" 
                     className="text-lg px-8 py-6 border-2 border-green-600 text-green-600 rounded-full shadow-lg cursor-default"
                     disabled
                   >
                     <CheckCircle className="h-5 w-5 mr-2" />
                     App Instalado
                   </Button>
                 </motion.div>
               ) : (
                 <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                   <Button 
                     variant="outline" 
                     size="lg" 
                     className="text-lg px-8 py-6 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-blue-300 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                     onClick={() => {
                       // Fallback para navegadores que não suportam PWA
                       if (navigator.share) {
                         navigator.share({
                           title: 'Co-Piloto Driver',
                           text: 'Baixe o app Co-Piloto Driver para gestão financeira completa!',
                           url: window.location.href
                         });
                       } else {
                         // Copiar URL para área de transferência
                         navigator.clipboard.writeText(window.location.href);
                         alert('Link copiado para área de transferência! Adicione esta página à tela inicial do seu dispositivo.');
                       }
                     }}
                   >
                     <Download className="h-5 w-5 mr-2" />
                     Baixar App
                   </Button>
                 </motion.div>
               )}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                    <LogIn className="h-5 w-5 mr-2" />
                    Fazer Login
                  </Button>
                </Link>
              </motion.div>
            </div>
            
                         {/* PWA Installation Info */}
             <motion.div 
               className="text-center"
               whileHover={{ scale: 1.05 }}
               transition={{ type: "spring", stiffness: 400, damping: 10 }}
             >
               {showInstallButton && !isInstalled ? (
                 <Badge variant="secondary" className="px-6 py-3 text-base font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-0 rounded-full shadow-lg">
                   📱 Clique em &ldquo;Instalar App&rdquo; para baixar o PWA
                 </Badge>
               ) : isInstalled ? (
                 <Badge variant="secondary" className="px-6 py-3 text-base font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-0 rounded-full shadow-lg">
                   ✅ App instalado com sucesso!
                 </Badge>
               ) : (
                 <Badge variant="secondary" className="px-6 py-3 text-base font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-0 rounded-full shadow-lg">
                   📱 Em breve na Google Play Store
                 </Badge>
               )}
               <p className="text-sm text-gray-500 mt-3">
                 {showInstallButton && !isInstalled 
                   ? "Adicione o Co-Piloto Driver à sua tela inicial para acesso rápido"
                   : isInstalled 
                     ? "Aproveite o app instalado em seu dispositivo"
                     : "Aplicativo nativo para Android com todas as funcionalidades"
                 }
               </p>
             </motion.div>
          </motion.div>

          {/* Hero Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mt-20"
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center group"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="relative">
                  <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">{stat.label}</div>
                  <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300">
                    <div className="text-blue-600 group-hover:scale-110 transition-transform duration-300">
                      {stat.icon}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
              Funcionalidades Principais
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
              Tudo que você precisa para gerenciar sua atividade como motorista autônomo 
              em uma interface intuitiva e moderna.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
                transition={{ duration: 0.8, delay: 0.1 * index }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group"
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-blue-50/50">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="text-center pb-6 relative z-10">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-500 flex items-center justify-center shadow-lg group-hover:shadow-xl">
                      <div className="text-blue-600 group-hover:scale-110 transition-transform duration-500">
                        {feature.icon}
                      </div>
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center px-8 pb-8 relative z-10">
                    <CardDescription className="text-gray-600 text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 bg-white relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -30 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-12">
                Por que escolher o
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Co-Piloto Driver?
                </span>
              </h2>
              
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-start space-x-4 group"
                    whileHover={{ x: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <CheckCircle className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                    <p className="text-lg text-gray-700 group-hover:text-blue-600 transition-colors duration-300">{benefit}</p>
                  </motion.div>
                ))}
              </div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-full px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  Saiba Mais
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="relative"
            >
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-3xl overflow-hidden group hover:shadow-3xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="text-center pb-6 relative z-10">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-500">
                    <BarChart3 className="h-10 w-10 text-white group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Dashboard Inteligente
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Visualize todos os dados importantes em um só lugar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-8 pb-8 relative z-10">
                  <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                    <span className="text-gray-700">Receitas do Mês</span>
                    <span className="font-semibold text-green-600">R$ 8.450,00</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                    <span className="text-gray-700">Despesas</span>
                    <span className="font-semibold text-red-600">R$ 2.180,00</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                    <span className="text-gray-700">Lucro Líquido</span>
                    <span className="font-semibold text-blue-600">R$ 6.270,00</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-32 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
              Tecnologias Modernas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
              Construído com as melhores tecnologias do mercado para garantir 
              performance, segurança e escalabilidade.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {technologies.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
                transition={{ duration: 0.8, delay: 0.1 * index + 1.2 }}
                className="text-center group"
                whileHover={{ scale: 1.1, y: -10 }}
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200 flex items-center justify-center text-3xl shadow-lg group-hover:shadow-xl transition-all duration-500">
                  {tech.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">{tech.name}</h3>
                <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">{tech.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Android App Section */}
      <section className="py-32 bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-green-50/50 relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -30 }}
              transition={{ duration: 0.8, delay: 1.4 }}
              className="text-center lg:text-left"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Badge variant="secondary" className="mb-8 px-4 py-2 text-sm font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-0 rounded-full shadow-lg">
                  🚀 Novidade
                </Badge>
              </motion.div>
              
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
                Aplicativo Android
                <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Em Breve
                </span>
              </h2>
              
              <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                Estamos desenvolvendo um aplicativo nativo para Android que trará 
                todas as funcionalidades do Co-Piloto Driver para o seu smartphone, 
                com interface otimizada e recursos exclusivos para dispositivos móveis.
              </p>
              
              <div className="space-y-6 mb-10">
                {[
                  "Interface nativa para Android",
                  "Notificações push nativas",
                  "Sincronização offline inteligente",
                  "Widgets para dashboard rápido"
                ].map((benefit, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-center space-x-4 group"
                    whileHover={{ x: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <CheckCircle className="h-6 w-6 text-green-600 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-gray-700 group-hover:text-green-600 transition-colors duration-300">{benefit}</span>
                  </motion.div>
                ))}
              </div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 rounded-full px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Bell className="h-5 w-5 mr-2" />
                  Receber Notificação
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 1.6 }}
              className="relative"
            >
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden group hover:shadow-3xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="text-center pb-6 relative z-10">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-500">
                    <span className="text-4xl group-hover:scale-110 transition-transform duration-500">📱</span>
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Google Play Store
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Disponível em breve para download
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-8 pb-8 relative z-10">
                  {[
                    { label: "Versão", value: "1.0.0" },
                    { label: "Tamanho", value: "~25 MB" },
                    { label: "Android", value: "6.0+" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-green-50/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                      <span className="text-gray-700">{item.label}</span>
                      <span className="font-semibold text-green-600">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 1.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              Pronto para transformar sua gestão?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Junte-se a centenas de motoristas que já estão economizando tempo e dinheiro 
              com o Co-Piloto Driver.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6 bg-white text-gray-900 hover:bg-gray-100 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                  <Play className="h-5 w-5 mr-2" />
                  Ver Demo
                </Button>
              </motion.div>
                             {showInstallButton && !isInstalled ? (
                 <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                   <Button 
                     onClick={installApp}
                     size="lg" 
                     variant="outline"
                     className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-green-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                   >
                     <Download className="h-5 w-5 mr-2" />
                     Instalar App
                   </Button>
                 </motion.div>
               ) : isInstalled ? (
                 <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                   <Button 
                     size="lg" 
                     variant="outline"
                     className="text-lg px-8 py-6 border-green-600 text-green-600 bg-white rounded-full shadow-lg cursor-default"
                     disabled
                   >
                     <CheckCircle className="h-5 w-5 mr-2" />
                     App Instalado
                   </Button>
                 </motion.div>
               ) : (
                 <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                   <Button 
                     size="lg" 
                     variant="outline" 
                     className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-gray-900 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                     onClick={() => {
                       if (navigator.share) {
                         navigator.share({
                           title: 'Co-Piloto Driver',
                           text: 'Baixe o app Co-Piloto Driver para gestão financeira completa!',
                           url: window.location.href
                         });
                       } else {
                         navigator.clipboard.writeText(window.location.href);
                         alert('Link copiado para área de transferência! Adicione esta página à tela inicial do seu dispositivo.');
                       }
                     }}
                   >
                     <Download className="h-5 w-5 mr-2" />
                     Baixar Agora
                   </Button>
                 </motion.div>
               )}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-gray-900 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                    <LogIn className="h-5 w-4 mr-2" />
                    Fazer Login
                  </Button>
                </Link>
              </motion.div>
            </div>
            
            {/* Android App CTA */}
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Badge variant="secondary" className="px-6 py-3 text-base font-medium bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 mb-4 rounded-full shadow-lg">
                📱 Aplicativo Android em Desenvolvimento
              </Badge>
              <p className="text-lg text-gray-300">
                Em breve disponível na Google Play Store com funcionalidades exclusivas para mobile
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20 relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <motion.div 
                className="flex items-center space-x-3 mb-6"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Car className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Co-Piloto Driver</h3>
                  <p className="text-sm text-gray-400">Sua solução completa</p>
                </div>
              </motion.div>
              <p className="text-gray-400 mb-8 max-w-md leading-relaxed">
                Ferramenta completa para motoristas autônomos que precisam de controle financeiro, 
                gestão de jornadas e administração de entregas.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg">Produto</h4>
              <ul className="space-y-3 text-gray-400">
                {[
                  "Funcionalidades",
                  "Preços",
                  "Documentação",
                  "API",
                  { text: "App Android (Em Breve)", icon: "📱" }
                ].map((item, index) => (
                  <motion.li 
                    key={index}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <a href="#" className="hover:text-white transition-colors duration-300 flex items-center">
                      {typeof item === 'string' ? item : (
                        <>
                          <span className="mr-2">{item.icon}</span>
                          {item.text}
                        </>
                      )}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg">Suporte</h4>
              <ul className="space-y-3 text-gray-400">
                {[
                  "Central de Ajuda",
                  "Contato",
                  "Status",
                  "Comunidade"
                ].map((item, index) => (
                  <motion.li 
                    key={index}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <a href="#" className="hover:text-white transition-colors duration-300">
                      {item}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-16 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Co-Piloto Driver. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
