
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
  UserCheck
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
  const { user, profile } = useAuth();

  console.log('AppSidebar - user:', user?.email, 'profile:', profile);

  const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home, roles: ['admin', 'usuario'] },
    { title: "Médicos", url: "/medicos", icon: Users, roles: ['admin'] },
    { title: "Empresas", url: "/empresas", icon: Building2, roles: ['admin'] },
    { title: "Procedimentos", url: "/procedimentos", icon: FileText, roles: ['admin', 'usuario'] },
    { title: "Relatórios", url: "/relatorios", icon: BarChart3, roles: ['admin', 'usuario'] },
    { title: "Pagamentos", url: "/pagamentos", icon: CreditCard, roles: ['admin'] },
    { title: "Usuários", url: "/usuarios", icon: UserCheck, roles: ['admin'] },
    { title: "Configurações", url: "/configuracoes", icon: Settings, roles: ['admin', 'usuario'] },
  ];

  // Filtrar itens baseado no role do perfil
  const filteredItems = menuItems.filter(item => {
    if (!profile || !profile.role) {
      console.log('No profile or role available');
      return false;
    }
    const hasRole = item.roles.includes(profile.role);
    console.log(`Menu item ${item.title} - required roles:`, item.roles, 'user role:', profile.role, 'has access:', hasRole);
    return hasRole;
  });

  const isCollapsed = state === "collapsed";

  console.log('Filtered menu items:', filteredItems.length, 'Profile role:', profile?.role);

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
          <SidebarGroupLabel className="text-blue-800 font-semibold px-3 py-2 text-sm">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg transition-all duration-200 ${
                          isActive 
                            ? 'bg-blue-600 text-white shadow-lg font-semibold' 
                            : 'text-blue-800 hover:bg-blue-100 hover:shadow-md'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
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
