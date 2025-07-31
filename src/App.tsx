
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Lancamentos from "./pages/Lancamentos";
import Medicos from "./pages/Medicos";
import Empresas from "./pages/Empresas";
import Procedimentos from "./pages/Procedimentos";
import Relatorios from "./pages/Relatorios";
import Pagamentos from "./pages/Pagamentos";
import Usuarios from "./pages/Usuarios";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  console.log('ProtectedRoute - user:', user?.email, 'profile:', profile?.nome, 'loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-blue-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { profile } = useAuth();
  
  console.log('AdminRoute - profile role:', profile?.role);
  
  if (profile?.role !== 'admin') {
    console.log('AdminRoute - Not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  console.log('AppRoutes - user:', user?.email, 'loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-blue-600">Carregando aplicação...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/lancamentos" 
        element={
          <ProtectedRoute>
            <Lancamentos />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/medicos" 
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Medicos />
            </AdminRoute>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/empresas" 
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Empresas />
            </AdminRoute>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/procedimentos" 
        element={
          <ProtectedRoute>
            <Procedimentos />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/relatorios" 
        element={
          <ProtectedRoute>
            <Relatorios />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/pagamentos" 
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Pagamentos />
            </AdminRoute>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/usuarios" 
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Usuarios />
            </AdminRoute>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/configuracoes" 
        element={
          <ProtectedRoute>
            <Configuracoes />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
