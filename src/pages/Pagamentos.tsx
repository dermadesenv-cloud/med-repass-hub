
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, CreditCard, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  token: string;
  isPaid: boolean;
  paymentDate?: string;
  expiryDate?: string;
  planType: 'basic' | 'premium';
}

const Pagamentos = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tokenToValidate, setTokenToValidate] = useState('');
  const [validationResult, setValidationResult] = useState<{token: string, isValid: boolean, user?: Usuario} | null>(null);
  
  const { toast } = useToast();

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.token.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePaymentToggle = (userId: string) => {
    setUsuarios(usuarios.map(usuario => {
      if (usuario.id === userId) {
        const isPaid = !usuario.isPaid;
        return {
          ...usuario,
          isPaid,
          paymentDate: isPaid ? new Date().toISOString().split('T')[0] : undefined,
          expiryDate: isPaid ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined
        };
      }
      return usuario;
    }));
    
    const usuario = usuarios.find(u => u.id === userId);
    toast({
      title: "Status atualizado!",
      description: `Pagamento de ${usuario?.nome} foi ${usuario?.isPaid ? 'marcado como pendente' : 'confirmado'}.`,
    });
  };

  const handleGenerateToken = (userId: string) => {
    const newToken = 'TOKEN' + Math.random().toString(36).substr(2, 9).toUpperCase();
    setUsuarios(usuarios.map(usuario => 
      usuario.id === userId ? { ...usuario, token: newToken } : usuario
    ));
    
    toast({
      title: "Token regenerado!",
      description: `Novo token gerado: ${newToken}`,
    });
  };

  const validateToken = () => {
    const user = usuarios.find(u => u.token === tokenToValidate.trim());
    setValidationResult({
      token: tokenToValidate.trim(),
      isValid: !!user && user.isPaid,
      user
    });
  };

  const getStatusColor = (usuario: Usuario) => {
    if (!usuario.isPaid) return 'destructive';
    
    if (usuario.expiryDate) {
      const expiryDate = new Date(usuario.expiryDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 7) return 'secondary'; // Warning
    }
    
    return 'default'; // Active
  };

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return days;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Controle de Pagamentos</h1>
          <p className="text-secondary">Gerencie pagamentos e valide tokens de usuários</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <CheckCircle className="mr-2 h-4 w-4" />
                Validar Token
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-primary">Validar Token de Usuário</DialogTitle>
                <DialogDescription>
                  Digite o token do usuário para verificar se o pagamento está em dia
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Token do Usuário</Label>
                  <Input
                    id="token"
                    value={tokenToValidate}
                    onChange={(e) => setTokenToValidate(e.target.value)}
                    placeholder="TOKEN123"
                  />
                </div>
                
                <Button onClick={validateToken} className="w-full">
                  Validar Token
                </Button>
                
                {validationResult && (
                  <div className={`p-4 rounded-lg border ${
                    validationResult.isValid 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {validationResult.isValid ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        validationResult.isValid ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {validationResult.isValid ? 'Token Válido' : 'Token Inválido'}
                      </span>
                    </div>
                    
                    {validationResult.user ? (
                      <div className="mt-2 text-sm">
                        <p><strong>Usuário:</strong> {validationResult.user.nome}</p>
                        <p><strong>Email:</strong> {validationResult.user.email}</p>
                        <p><strong>Plano:</strong> {validationResult.user.planType}</p>
                        <p><strong>Status:</strong> {validationResult.user.isPaid ? 'Pago' : 'Pendente'}</p>
                        {validationResult.user.expiryDate && (
                          <p><strong>Expira em:</strong> {getDaysUntilExpiry(validationResult.user.expiryDate)} dias</p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-red-600">
                        Token não encontrado no sistema
                      </p>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-green-400 to-green-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Pagos</CardTitle>
            <CheckCircle className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usuarios.filter(u => u.isPaid).length}
            </div>
            <p className="text-xs opacity-80">
              {((usuarios.filter(u => u.isPaid).length / usuarios.length) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-400 to-red-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <XCircle className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usuarios.filter(u => !u.isPaid).length}
            </div>
            <p className="text-xs opacity-80">
              {((usuarios.filter(u => !u.isPaid).length / usuarios.length) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirando em 7 dias</CardTitle>
            <AlertCircle className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usuarios.filter(u => {
                if (!u.expiryDate) return false;
                const days = getDaysUntilExpiry(u.expiryDate);
                return days !== null && days <= 7 && days > 0;
              }).length}
            </div>
            <p className="text-xs opacity-80">Necessitam renovação</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-primary">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-primary/60" />
                <Input
                  placeholder="Buscar por nome, email ou token..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Controle de Pagamentos ({filteredUsuarios.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status Pagamento</TableHead>
                  <TableHead>Data Pagamento</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((usuario) => {
                  const daysUntilExpiry = getDaysUntilExpiry(usuario.expiryDate);
                  return (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-primary">{usuario.nome}</div>
                          <div className="text-sm text-gray-500">{usuario.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {usuario.token}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={usuario.planType === 'premium' ? 'default' : 'secondary'}>
                          {usuario.planType === 'premium' ? 'Premium' : 'Básico'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(usuario)}>
                          {usuario.isPaid ? 'Pago' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {usuario.paymentDate ? 
                          new Date(usuario.paymentDate).toLocaleDateString('pt-BR') : 
                          '-'
                        }
                      </TableCell>
                      <TableCell>
                        {daysUntilExpiry !== null ? (
                          <span className={daysUntilExpiry <= 7 ? 'text-yellow-600 font-medium' : ''}>
                            {daysUntilExpiry > 0 ? `${daysUntilExpiry} dias` : 'Expirado'}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant={usuario.isPaid ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handlePaymentToggle(usuario.id)}
                          >
                            {usuario.isPaid ? 'Marcar Pendente' : 'Confirmar Pagamento'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateToken(usuario.id)}
                          >
                            Novo Token
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Pagamentos;
