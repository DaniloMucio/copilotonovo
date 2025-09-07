'use client';

import { useEffect } from 'react';

/**
 * Hook para forçar o tema claro em páginas de autenticação
 * Independentemente da preferência do usuário, essas páginas sempre usarão tema claro
 */
export function useForceLightTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    
    // Salvar temporariamente o tema original
    const originalTheme = localStorage.getItem('theme');
    
    // Aplicar tema claro temporariamente
    localStorage.setItem('theme', 'light');
    
    // Restaurar tema original quando sair da página
    return () => {
      if (originalTheme) {
        localStorage.setItem('theme', originalTheme);
        root.classList.remove('light', 'dark');
        if (originalTheme === 'dark') {
          root.classList.add('dark');
        } else if (originalTheme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            root.classList.add('dark');
          } else {
            root.classList.add('light');
          }
        } else {
          root.classList.add('light');
        }
      } else {
        root.classList.remove('light', 'dark');
        root.classList.add('light');
      }
    };
  }, []);
}
