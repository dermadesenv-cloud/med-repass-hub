
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
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-secondary-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-primary">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
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
        path="/medicos" 
        element={
          <ProtectedRoute>
            {user?.role === 'admin' ? <Medicos /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/empresas" 
        element={
          <ProtectedRoute>
            {user?.role === 'admin' ? <Empresas /> : <Navigate to="/dashboard" replace />}
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
            {user?.role === 'admin' ? <Pagamentos /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/usuarios" 
        element={
          <ProtectedRoute>
            {user?.role === 'admin' ? <Usuarios /> : <Navigate to="/dashboard" replace />}
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
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
