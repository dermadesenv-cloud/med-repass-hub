
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

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-gray-50 border-r-2 border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/1f27fba1-1c30-44f2-8802-66b0a90188e8.png" 
              alt="MedPay Logo" 
              className="h-10 w-auto"
            />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-800">MedControl</span>
                <span className="text-sm text-gray-600">Sistema de Repasse</span>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="px-2 py-4">
          <SidebarGroupLabel className="text-gray-700 font-semibold px-3 py-2 text-sm">Menu Principal</SidebarGroupLabel>
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
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg font-semibold' 
                            : 'text-gray-700 hover:bg-white hover:shadow-md hover:text-blue-600'
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
