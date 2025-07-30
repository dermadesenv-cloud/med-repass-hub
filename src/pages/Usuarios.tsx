import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit2, Trash2, UserCheck, Shield, User } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Usuario {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'ativo' | 'inativo';
  lastLogin: string;
  createdAt: string;
}

const Usuarios = () => {
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([
    {
      id: '1',
      name: 'Administrador',
      email: 'admin@sistema.com',
      role: 'admin',
      status: 'ativo',
      lastLogin: '2024-01-30 09:30:00',
      createdAt: '2024-01-01'
    },
    {
      id: '2',
      name: 'João Silva',
      email: 'joao@sistema.com',
      role: 'user',
      status: 'ativo',
      lastLogin: '2024-01-29 14:15:00',
      createdAt: '2024-01-15'
    },
    {
      id: '3',
      name: 'Maria Santos',
      email: 'maria@sistema.com',
      role: 'user',
      status: 'inativo',
      lastLogin: '2024-01-20 11:00:00',
      createdAt: '2024-01-10'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'admin' | 'user',
    status: 'ativo' as 'ativo' | 'inativo',
    password: ''
  });

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUsuario) {
      setUsuarios(usuarios.map(usuario => 
        usuario.id === editingUsuario.id 
          ? { ...usuario, name: formData.name, email: formData.email, role: formData.role, status: formData.status }
          : usuario
      ));
      toast({
        title: "Usuário atualizado",
        description: "Os dados do usuário foram atualizados com sucesso.",
      });
    } else {
      const newUsuario: Usuario = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        lastLogin: 'Nunca',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setUsuarios([...usuarios, newUsuario]);
      toast({
        title: "Usuário cadastrado",
        description: "Novo usuário foi cadastrado com sucesso.",
      });
    }

    setFormData({
      name: '',
      email: '',
      role: 'user',
      status: 'ativo',
      password: ''
    });
    setEditingUsuario(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setFormData({
      name: usuario.name,
      email: usuario.email,
      role: usuario.role,
      status: usuario.status,
      password: ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setUsuarios(usuarios.filter(usuario => usuario.id !== id));
    toast({
      title: "Usuário removido",
      description: "O usuário foi removido com sucesso.",
      variant: "destructive"
    });
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? 'Administrador' : 'Usuário';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários do sistema
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingUsuario(null);
              setFormData({
                name: '',
                email: '',
                role: 'user',
                status: 'ativo',
                password: ''
              });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
              <DialogDescription>
                {editingUsuario 
                  ? 'Atualize as informações do usuário.' 
                  : 'Preencha os dados para cadastrar um novo usuário.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              {!editingUsuario && (
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="role">Papel</Label>
                <Select value={formData.role} onValueChange={(value: 'admin' | 'user') => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: 'ativo' | 'inativo') => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingUsuario ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Lista de Usuários
          </CardTitle>
          <CardDescription>
            Total de {usuarios.length} usuários cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(usuario.role)}
                        {usuario.name}
                      </div>
                    </TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <Badge variant={usuario.role === 'admin' ? 'default' : 'secondary'}>
                        {getRoleBadge(usuario.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={usuario.status === 'ativo' ? 'default' : 'secondary'}>
                        {usuario.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>{usuario.lastLogin}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(usuario)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(usuario.id)}
                          disabled={usuario.role === 'admin' && usuario.id === '1'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Usuarios;