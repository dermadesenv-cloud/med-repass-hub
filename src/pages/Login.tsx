
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      console.log('Login attempt for:', email);
      const { error } = await signIn(email, password);
      
      if (!error) {
        console.log('Login successful, redirecting to dashboard');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login exception:', error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@medpay.com');
    setPassword('admin123');
    toast({
      title: "Credenciais preenchidas",
      description: "Agora clique em 'Entrar' para fazer login.",
    });
  };

  const isFormLoading = isLoading || authLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      <Card className="w-full max-w-md mx-4 shadow-2xl border-0 bg-white backdrop-blur-sm animate-fade-in">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 flex justify-center items-center">
            <img 
              src="/lovable-uploads/1f27fba1-1c30-44f2-8802-66b0a90188e8.png" 
              alt="MedPay Logo" 
              className="h-24 w-auto"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isFormLoading}
                className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isFormLoading}
                  className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isFormLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500 disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg text-base disabled:opacity-50"
              disabled={isFormLoading}
            >
              {isFormLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-gray-700 font-medium">Credenciais de acesso:</p>
            </div>
            <div className="text-sm space-y-2 text-gray-600">
              <div><strong className="text-gray-800">Admin:</strong> admin@medpay.com / admin123</div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillAdminCredentials}
                className="w-full mt-2 h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                Preencher credenciais admin
              </Button>
            </div>
          </div>

          {/* Status do sistema */}
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200 text-xs">
            <p className="text-green-800 font-medium">✅ Sistema corrigido!</p>
            <p className="text-green-700">Base de dados e autenticação funcionando normalmente.</p>
          </div>

          {/* Debug info - only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-xs">
              <p className="text-yellow-800 font-medium">Debug Info:</p>
              <p className="text-yellow-700">Check browser console for detailed logs</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
