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
  Globe,
  Handshake,
  Star,
  Rocket,
  Code,
  Heart,
  Target,
  Award,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Settings,
  Moon,
  Smartphone,
  Truck,
  CreditCard,
  Building
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
      description: "Controle completo de informações, manutenções e histórico do seu veículo",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <Fuel className="h-8 w-8" />,
      title: "Controle de Combustível",
      description: "Acompanhe abastecimentos, consumo médio e custos de combustível",
      color: "from-green-500 to-green-600"
    },
    {
      icon: <Wrench className="h-8 w-8" />,
      title: "Manutenções Inteligentes",
      description: "Agende e acompanhe manutenções com lembretes automáticos",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Gestão de Jornadas",
      description: "Controle horários de trabalho, pausas e quilometragem",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Relatórios Financeiros",
      description: "Análises detalhadas de receitas, despesas e lucro",
      color: "from-emerald-500 to-emerald-600"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Segurança Total",
      description: "Autenticação Firebase e dados protegidos com criptografia",
      color: "from-red-500 to-red-600"
    }
  ];

  const stats = [
    { label: "Motoristas Ativos", value: "2.5K+", icon: <Users className="h-6 w-6" />, color: "from-blue-500 to-blue-600" },
    { label: "Entregas Realizadas", value: "50K+", icon: <Globe className="h-6 w-6" />, color: "from-green-500 to-green-600" },
    { label: "Economia Média", value: "R$ 3.2K", icon: <TrendingUp className="h-6 w-6" />, color: "from-emerald-500 to-emerald-600" },
    { label: "Tempo Economizado", value: "20h/mês", icon: <Clock className="h-6 w-6" />, color: "from-purple-500 to-purple-600" }
  ];

  const benefits = [
    "Controle financeiro detalhado em tempo real",
    "Gestão completa de jornadas de trabalho",
    "Administração inteligente de entregas",
    "Relatórios automatizados em PDF e Excel",
    "Interface otimizada para dispositivos móveis",
    "Funcionamento offline com sincronização automática",
    "Notificações push para lembretes importantes",
    "Backup automático na nuvem"
  ];

  const testimonials = [
    {
      name: "Carlos Silva",
      role: "Motorista Autônomo",
      content: "O Co-Piloto Driver revolucionou minha gestão financeira. Agora sei exatamente quanto ganho e gasto por dia.",
      avatar: "CS",
      rating: 5
    },
    {
      name: "Maria Santos",
      role: "Entregadora",
      content: "A interface é incrível! Consigo gerenciar todas as minhas entregas e finanças em um só lugar.",
      avatar: "MS",
      rating: 5
    },
    {
      name: "João Oliveira",
      role: "Motorista de Aplicativo",
      content: "Os relatórios me ajudaram a otimizar minhas rotas e aumentar minha receita em 30%.",
      avatar: "JO",
      rating: 5
    }
  ];

  const technologies = [
    { name: "Next.js 14", icon: "⚡", description: "Framework React com SSR/SSG" },
    { name: "TypeScript", icon: "🔷", description: "Tipagem estática e segurança" },
    { name: "Firebase", icon: "🔥", description: "Backend serverless e autenticação" },
    { name: "Tailwind CSS", icon: "🎨", description: "Framework CSS utilitário" },
    { name: "PWA", icon: "📱", description: "Aplicação web progressiva" },
    { name: "Shadcn/ui", icon: "🎯", description: "Componentes UI reutilizáveis" }
  ];

  const partnerTypes = [
    {
      title: "Empresas de Logística",
      description: "Integração com sistemas de rastreamento e gestão de frota",
      icon: <Truck className="h-8 w-8" />,
      benefits: ["API personalizada", "Relatórios customizados", "Suporte dedicado"]
    },
    {
      title: "Fintechs",
      description: "Soluções financeiras integradas para motoristas",
      icon: <CreditCard className="h-8 w-8" />,
      benefits: ["Pagamentos instantâneos", "Controle de fluxo de caixa", "Análise de crédito"]
    },
    {
      title: "Frotas Corporativas",
      description: "Gestão centralizada para empresas com múltiplos veículos",
      icon: <Building className="h-8 w-8" />,
      benefits: ["Dashboard corporativo", "Relatórios gerenciais", "Controle de custos"]
    },
    {
      title: "Desenvolvedores",
      description: "API aberta para integrações e customizações",
      icon: <Code className="h-8 w-8" />,
      benefits: ["Documentação completa", "SDK disponível", "Comunidade ativa"]
    }
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
              <Link href="/atualizacoes">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full px-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizações
                  </Button>
                </motion.div>
              </Link>
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
      <section className="relative py-20 overflow-hidden">
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Seu{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Co-Piloto
              </span>{" "}
              Digital
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              A ferramenta completa para{" "}
              <span className="font-semibold text-blue-600">motoristas autônomos</span> que
              precisam de controle financeiro, gestão de jornadas e administração de entregas.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link href="/signup">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-full px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300">
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </Link>
            <Link href="/login">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" variant="outline" className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                  Já tenho conta
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* PWA Install Button */}
          {showInstallButton && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-8"
            >
              <Button
                onClick={installApp}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Instalar App
              </Button>
            </motion.div>
          )}
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-green-500/20 rounded-full blur-xl animate-pulse animation-delay-4000"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50/30 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Funcionalidades{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Inteligentes
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tudo que você precisa para gerenciar sua atividade como motorista em uma única plataforma
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <Card className="p-6 hover:shadow-2xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm group-hover:bg-white">
                  <CardHeader>
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <div className="text-white">
                        {feature.icon}
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold group-hover:text-blue-600 transition-colors duration-300">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Números que{" "}
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Impressionam
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Confiança de milhares de motoristas em todo o Brasil
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="text-center group"
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${stat.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <div className="text-white">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              O que nossos{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Usuários
              </span>{" "}
              Dizem
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Depoimentos reais de motoristas que transformaram sua gestão
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className="p-6 hover:shadow-2xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-0">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-600 mb-4 italic">&quot;{testimonial.content}&quot;</p>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{testimonial.name}</div>
                        <div className="text-sm text-gray-600">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Por que escolher o{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Co-Piloto Driver
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Vantagens exclusivas para motoristas que buscam excelência
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start space-x-4 group"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <p className="text-gray-700 text-lg group-hover:text-gray-900 transition-colors duration-300">
                  {benefit}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.1)_100%)]"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Pronto para{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Transformar
              </span>{" "}
              sua Gestão?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Junte-se a milhares de motoristas que já otimizaram sua gestão financeira e operacional
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/signup">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 rounded-full px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300">
                    Criar Conta Grátis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/login">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 rounded-full px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                    Fazer Login
                  </Button>
                </motion.div>
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-blue-100">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span className="text-sm">100% Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                <span className="text-sm">Setup em 2 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                <span className="text-sm">Suporte 24/7</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 relative">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Car className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-semibold">Co-Piloto Driver</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                A plataforma completa para motoristas que buscam excelência na gestão financeira e operacional.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors duration-300 cursor-pointer">
                  <span className="text-sm font-bold">FB</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors duration-300 cursor-pointer">
                  <span className="text-sm font-bold">IG</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors duration-300 cursor-pointer">
                  <span className="text-sm font-bold">TW</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors duration-300">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Preços</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Integrações</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors duration-300">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Comunidade</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2025 Co-Piloto Driver. Todos os direitos reservados.
              </div>
              <div className="flex space-x-6 text-sm text-gray-400">
                <a href="#" className="hover:text-white transition-colors duration-300">Privacidade</a>
                <a href="#" className="hover:text-white transition-colors duration-300">Termos</a>
                <a href="#" className="hover:text-white transition-colors duration-300">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}