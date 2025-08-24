"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import { signIn } from "@/services/auth";
import { Footer } from "@/components/Footer";
import { useErrorHandler } from "@/lib/errors";
import { loginSchema } from "@/lib/validations";
import { useToastManager } from "@/lib/toast-manager";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { usePWAInstall } from "@/hooks/use-pwa-install";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const toastManager = useToastManager();
  const { canInstall, install } = usePWAInstall();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      await toastManager.withAsyncFeedback(
        signIn(values.email, values.password),
        {
          loading: "Fazendo login...",
          success: "Login realizado com sucesso!",
          error: "Erro no login"
        },
        {
          successDescription: "Bem-vindo de volta!",
          errorDescription: "Verifique suas credenciais e tente novamente."
        }
      );
      router.push("/dashboard");
    } catch (error: any) {
      // Erro já tratado pelo toastManager.withAsyncFeedback
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex flex-1 flex-col items-center justify-center bg-secondary p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <Logo />
            </div>
            <CardTitle className="font-headline text-3xl">Acesse sua conta</CardTitle>
            <CardDescription>
              Bem-vindo de volta! Insira seus dados para continuar.
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="remember"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Lembrar de mim
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full font-bold">
                  Entrar
                </Button>
              </form>
            </Form>
          </CardContent>
           <CardFooter className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Cadastre-se
              </Link>
            </p>
                         <p className="text-xs text-muted-foreground">V.06 - Vercel</p>
          </CardFooter>
        </Card>
      </main>
      <Footer />
      
      {/* PWA Install Banner */}
      <PWAInstallButton canInstall={canInstall} install={install} variant="banner" />
    </div>
  );
}
