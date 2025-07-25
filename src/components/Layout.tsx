
import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from '@/context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider collapsedWidth={56}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-primary-light to-secondary-light">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between px-6 bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-primary" />
              <h1 className="text-xl font-semibold text-primary">Sistema de Repasse Médico</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-primary">Bem-vindo, {user.name}</span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-medium">
                {user.name.charAt(0)}
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
