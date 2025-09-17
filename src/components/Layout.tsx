import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from '@/context/AuthContext';
interface LayoutProps {
  children: React.ReactNode;
}
export const Layout: React.FC<LayoutProps> = ({
  children
}) => {
  const {
    user,
    profile,
    signOut
  } = useAuth();
  console.log('Layout - user:', user?.email, 'profile:', profile);
  if (!user) {
    return <>{children}</>;
  }
  const handleUserInfoClick = (e: React.MouseEvent) => {
    // Prevenir logout acidental - remover o onClick do botão
    e.preventDefault();
    console.log('User info clicked - not logging out');
  };
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 to-purple-50">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-end bg-blue-50 shadow-sm border-b border-blue-200 px-[28px] mx-0 py-0 my-[7px]">
            <div className="flex items-center gap-4">
              <span className="text-sm text-blue-800 font-medium">
                Bem-vindo, {profile?.nome || user?.email}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={handleUserInfoClick} className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md hover:bg-blue-700 transition-colors" title={`Usuário: ${profile?.nome || user?.email} (${profile?.role || 'carregando...'})`}>
                  {(profile?.nome || user?.email || 'U').charAt(0).toUpperCase()}
                </button>
                <button onClick={signOut} className="text-sm text-blue-600 hover:text-blue-800 underline" title="Fazer logout">
                  Sair
                </button>
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
    </SidebarProvider>;
};