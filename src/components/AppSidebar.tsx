
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
  const { collapsed } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home, roles: ['admin', 'user'] },
    { title: "Médicos", url: "/medicos", icon: Users, roles: ['admin'] },
    { title: "Empresas", url: "/empresas", icon: Building2, roles: ['admin'] },
    { title: "Procedimentos", url: "/procedimentos", icon: FileText, roles: ['admin', 'user'] },
    { title: "Relatórios", url: "/relatorios", icon: BarChart3, roles: ['admin', 'user'] },
    { title: "Pagamentos", url: "/pagamentos", icon: CreditCard, roles: ['admin'] },
    { title: "Usuários", url: "/usuarios", icon: UserCheck, roles: ['admin'] },
    { title: "Configurações", url: "/configuracoes", icon: Settings, roles: ['admin', 'user'] },
  ];

  const filteredItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible>
      <SidebarContent className="bg-white/90 backdrop-blur-sm border-r border-white/20">
        <div className="p-4">
          <div className="flex items-center gap-2">
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-primary">MedControl</span>
                <span className="text-xs text-secondary">Sistema de Repasse</span>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-primary/70">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isActive 
                            ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md' 
                            : 'hover:bg-primary/10 text-primary'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
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
