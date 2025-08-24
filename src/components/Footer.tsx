
'use client';

import { Facebook, Linkedin } from "lucide-react";
import Link from "next/link";

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="currentColor"
        {...props}
    >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.875-.547-5.571-1.584l-6.162 1.687zM4.772 21.13c1.595.918 3.444 1.422 5.373 1.422 5.454 0 9.917-4.463 9.917-9.917s-4.463-9.917-9.917-9.917-9.917 4.464-9.917 9.917c0 2.021.608 3.965 1.738 5.618l.162.272-1.04 3.784 3.896-1.037.289.171zM8.331 7.234c.102-.272.24-.302.378-.312 1.416-.117 1.416-.117 2.246.678.83.795.83.795.83 2.126 0 1.331 0 1.331-.83 2.126-.83.795-2.246.678-2.246.678-.138-.01-.276-.04-.378-.312s-1.04-1.595-1.04-3.181c0-1.586.938-2.909 1.04-3.181zm-2.021 6.557c-.918-1.595-1.422-3.444-1.422-5.373 0-5.454 4.463-9.917 9.917-9.917s9.917 4.463 9.917 9.917-4.463 9.917-9.917 9.917c-1.928 0-3.776-.552-5.373-1.422l-2.894.763 2.895-2.895z"/>
    </svg>
);


export function Footer() {
  return (
    <footer className="w-full bg-background py-4 px-4 md:px-6 border-t mt-auto">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-4 text-center text-sm text-muted-foreground">
        <p>
          Desenvolvido por{" "}
          <Link
            href="https://danmucio.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            Danilo Mucio
          </Link>
        </p>
        <div className="flex items-center gap-3">
            <Link 
                href="https://www.facebook.com/profile.php?id=61574610050197"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Perfil do Facebook de Danilo Mucio"
                className="text-muted-foreground hover:text-primary transition-colors"
            >
                <Facebook className="h-5 w-5" />
            </Link>
            <Link 
                href="https://www.linkedin.com/in/danilo-mucio-81086326b/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Perfil do LinkedIn de Danilo Mucio"
                className="text-muted-foreground hover:text-primary transition-colors"
            >
                <Linkedin className="h-5 w-5" />
            </Link>
            <Link 
                href="https://wa.me/5516997452118"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contato de WhatsApp de Danilo Mucio"
                className="text-muted-foreground hover:text-primary transition-colors"
            >
                <WhatsAppIcon className="h-5 w-5" />
            </Link>
        </div>
      </div>
    </footer>
  );
}
