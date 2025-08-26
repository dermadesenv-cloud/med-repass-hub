
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit2, Trash2, UserCheck, Shield, User } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { UserForm } from "@/components/UserForm";

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: 'admin' | 'usuario' | 'medico';
  empresa_id: string | null;
  created_at: string;
  updated_at: string;
  user_empresas?: Array<{
    empresa_id: string;
    empresas: {
      nome: string;
    };
  }>;
}

const Usuarios = () => {
  const { toast } = useToast();
  const { profile, isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProfiles = async () => {
    try {
      console.log('Fetching profiles as admin:', isAdmin);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_empresas (
            empresa_id,
            empresas (
              nome
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar usuários: " + error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Profiles loaded:', data?.length || 0);
      setProfiles(data || []);
    } catch (error) {
      console.error('Error in fetchProfiles:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar usuários.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (isAdmin) {
      console.log('User is admin, loading profiles...');
      fetchProfiles();
    } else {
      console.log('User is not admin, skipping profile load');
    }
  }, [isAdmin]);

  const filteredProfiles = profiles.filter(profile =>
    profile.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (userProfile: Profile) => {
    setEditingProfile(userProfile);
    setIsDialogOpen(true);
  };

  const handleDelete = async (userProfile: Profile) => {
    if (!confirm('Tem certeza que deseja remover este usuário?')) {
      return;
    }

    // Não permitir deletar o próprio usuário admin
    if (userProfile.id === profile?.id) {
      toast({
        title: "Erro",
        description: "Você não pode deletar seu próprio usuário.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Deletar do auth (isso também deletará o perfil por cascade)
      const { error } = await supabase.auth.admin.deleteUser(userProfile.user_id);
      
      if (error) throw error;

      await fetchProfiles();
      toast({
        title: "Usuário removido",
        description: "O usuário foi removido com sucesso.",
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover usuário.",
        variant: "destructive"
      });
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'medico': return 'Médico';
      default: return 'Usuário';
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'medico': return 'secondary';
      default: return 'outline';
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">Acesso Negado</p>
          <p className="text-gray-400">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, permissões e empresas do sistema
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingProfile(null);
            setIsDialogOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Lista de Usuários
          </CardTitle>
          <CardDescription>
            Total de {profiles.length} usuários cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Papel/Permissão</TableHead>
                  <TableHead>Empresas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles.map((userProfile) => (
                    <TableRow key={userProfile.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(userProfile.role)}
                          <span>{userProfile.nome}</span>
                          {userProfile.id === profile?.id && (
                            <Badge variant="outline" className="text-xs">Você</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{userProfile.email}</TableCell>
                      <TableCell>{userProfile.telefone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleVariant(userProfile.role)}>
                          {getRoleBadge(userProfile.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {userProfile.role === 'admin' ? (
                            <Badge variant="secondary" className="text-xs">Todas</Badge>
                          ) : (
                            userProfile.user_empresas?.map((ue, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {ue.empresas.nome}
                              </Badge>
                            )) || <span className="text-muted-foreground text-sm">Nenhuma</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Ativo
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(userProfile)}
                            title="Editar usuário"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(userProfile)}
                            disabled={userProfile.id === profile?.id}
                            title={userProfile.id === profile?.id ? "Não é possível deletar seu próprio usuário" : "Deletar usuário"}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <UserForm
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingProfile={editingProfile}
        onSuccess={fetchProfiles}
      />
    </div>
  );
};

export default Usuarios;
