
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileText, 
  Building2, 
  BarChart3, 
  Settings, 
  CreditCard,
  UserCheck,
  ClipboardList
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from '@/context/AuthContext';

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, profile, isAdmin } = useAuth();

  console.log('AppSidebar - user:', user?.email, 'profile:', profile, 'isAdmin:', isAdmin);

  const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home, roles: ['admin', 'usuario', 'medico'] },
    { title: "Lançamentos", url: "/lancamentos", icon: ClipboardList, roles: ['admin', 'usuario', 'medico'] },
    { title: "Médicos", url: "/medicos", icon: Users, roles: ['admin'] },
    { title: "Empresas", url: "/empresas", icon: Building2, roles: ['admin'] },
    { title: "Procedimentos", url: "/procedimentos", icon: FileText, roles: ['admin', 'usuario', 'medico'] },
    { title: "Relatórios", url: "/relatorios", icon: BarChart3, roles: ['admin', 'usuario', 'medico'] },
    { title: "Pagamentos", url: "/pagamentos", icon: CreditCard, roles: ['admin'] },
    { title: "Usuários", url: "/usuarios", icon: UserCheck, roles: ['admin'] },
    { title: "Configurações", url: "/configuracoes", icon: Settings, roles: ['admin', 'usuario', 'medico'] },
  ];

  // Se é admin, mostrar TODOS os itens sem filtrar
  // Se não é admin, filtrar pelos roles do perfil
  const filteredItems = isAdmin 
    ? menuItems 
    : menuItems.filter(item => {
        if (!profile?.role) {
          console.log('No profile role available, showing no items');
          return false;
        }
        const hasAccess = item.roles.includes(profile.role);
        console.log(`Item ${item.title} - roles: [${item.roles.join(', ')}], user role: ${profile.role}, access: ${hasAccess}`);
        return hasAccess;
      });

  const isCollapsed = state === "collapsed";

  console.log(`Menu filtering - isAdmin: ${isAdmin}, profile role: ${profile?.role}, filtered items: ${filteredItems.length}/${menuItems.length}`);
  console.log('Visible menu items:', filteredItems.map(item => item.title));

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-blue-50 border-r-2 border-blue-200">
        <div className="p-4 border-b border-blue-200 bg-blue-50">
          <div className="flex items-center justify-center">
            <img 
              src="/lovable-uploads/1f27fba1-1c30-44f2-8802-66b0a90188e8.png" 
              alt="Logo" 
              className="h-10 w-auto"
            />
          </div>
        </div>

        <SidebarGroup className="px-2 py-4">
          <SidebarGroupLabel className="text-blue-800 font-semibold px-3 py-2 text-sm">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                     <NavLink 
                       to={item.url} 
                       className={({ isActive }) => 
                         `flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-300 ease-in-out transform ${
                           isActive 
                             ? 'bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-foreground))] shadow-lg scale-105 border-l-4 border-l-white/30' 
                             : 'text-blue-800 hover:bg-blue-100/80 hover:shadow-md hover:scale-[1.02] hover:translate-x-1'
                         }`
                       }
                     >
                       <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors duration-300 ${location.pathname === item.url ? 'text-white' : 'text-blue-800'}`} />
                       {!isCollapsed && (
                         <span className={`font-medium transition-colors duration-300 ${location.pathname === item.url ? 'text-white' : 'text-blue-800'}`}>
                           {item.title}
                         </span>
                       )}
                     </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
