"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Car, 
  ArrowLeft, 
  Mail,
  CheckCircle,
  ArrowRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import { useForceLightTheme } from "@/hooks/use-force-light-theme";
import { sendPasswordReset } from "@/services/auth";

// Schema de validação para o formulário
const forgotPasswordSchema = z.object({
  email: z.string().email("Digite um email válido"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Forçar tema claro na página
  useForceLightTheme();

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsLoading(true);
    try {
      await sendPasswordReset(values.email);
      setEmailSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.",
      });
    } catch (error: any) {
      console.error('Erro ao enviar email de recuperação:', error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar email",
        description: error.message || "Não foi possível enviar o email de recuperação. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (emailSent) {
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
              
              <Link href="/login">
                <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full px-4 shadow-sm hover:shadow-md transition-all duration-300">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao login
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Success Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] py-12 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-md w-full space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <Logo />
              </div>
              
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Email enviado!
              </h2>
              <p className="text-gray-600 mb-6">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Próximos passos
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        1. Verifique sua caixa de entrada<br/>
                        2. Clique no link do email<br/>
                        3. Defina uma nova senha
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Link href="/login">
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                          Voltar ao login
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setEmailSent(false);
                          form.reset();
                        }}
                      >
                        Tentar outro email
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

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
            
            <Link href="/login">
              <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full px-4 shadow-sm hover:shadow-md transition-all duration-300">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <Logo />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Esqueceu sua senha?
            </h2>
            <p className="text-gray-600">
              Digite seu email e enviaremos um link para redefinir sua senha
            </p>
          </motion.div>

          {/* Forgot Password Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">Recuperar Senha</CardTitle>
                <CardDescription className="text-gray-600">
                  Digite o email associado à sua conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="seu@email.com"
                                className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-300"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Enviando..." : "Enviar link de recuperação"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Back to Login Link */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center"
          >
            <p className="text-gray-600">
              Lembrou da senha?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-500 font-semibold transition-colors duration-300">
                Fazer login
              </Link>
            </p>
          </motion.div>

          {/* App Version */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mt-8"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 font-medium">
                Versão v1.4.0
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Sistema de Rastreamento de Entregas
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
