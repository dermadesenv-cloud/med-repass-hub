
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 to-purple-50">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between px-6 bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-primary hover:bg-gray-100 p-2 rounded-md" />
              <h1 className="text-xl font-bold text-gray-800">Sistema de Repasse Médico</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 font-medium">Bem-vindo, {user.name}</span>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
