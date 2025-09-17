import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit2, Trash2, Shield, User } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { UserForm } from "@/components/UserForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: 'admin' | 'usuario';
  created_at: string;
  updated_at: string;
  empresas?: Array<{
    id: string;
    nome: string;
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
      
      // Buscar perfis
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        throw profilesError;
      }

      // Buscar empresas vinculadas para cada usuário
      const profilesWithEmpresas = await Promise.all(
        profilesData?.map(async (profile) => {
          if (profile.role === 'admin') {
            return {
              ...profile,
              role: profile.role as 'admin' | 'usuario',
              empresas: []
            };
          }

          const { data: userEmpresas } = await supabase
            .from('user_empresas')
            .select(`
              empresas (
                id,
                nome
              )
            `)
            .eq('user_id', profile.user_id);

          return {
            ...profile,
            role: profile.role as 'admin' | 'usuario',
            empresas: userEmpresas?.map((ue: any) => ue.empresas).filter(Boolean) || []
          };
        }) || []
      );

      // No need to filter medico since our interface only allows admin | usuario
      const filteredProfiles = profilesWithEmpresas;
      
      console.log('Profiles data:', filteredProfiles);
      setProfiles(filteredProfiles);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar usuários.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
    }
  }, [isAdmin]);

  const filteredProfiles = profiles.filter(profile =>
    profile.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (userProfile: Profile) => {
    setEditingProfile(userProfile);
    setIsDialogOpen(true);
  };

  const handleDelete = async (userProfile: Profile) => {
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
      // Primeiro, delete o perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userProfile.id);

      if (profileError) throw profileError;

      // Depois, delete o usuário da auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userProfile.user_id);
      
      if (authError) {
        console.warn('Warning: Could not delete auth user, but profile was deleted:', authError);
      }

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
      default: return 'Usuário';
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
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
          <h1 className="text-3xl font-bold tracking-tight text-primary">Gestão de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários e permissões do sistema
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingProfile(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            Lista de todos os usuários cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredProfiles.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Nenhum usuário encontrado</p>
              <p className="text-gray-400 text-sm">
                {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece adicionando seu primeiro usuário'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Empresas</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((userProfile) => (
                    <TableRow key={userProfile.id}>
                      <TableCell className="font-medium">{userProfile.nome}</TableCell>
                      <TableCell>{userProfile.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleVariant(userProfile.role) as any} className="flex items-center gap-1 w-fit">
                          {getRoleIcon(userProfile.role)}
                          {getRoleBadge(userProfile.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {userProfile.role === 'admin' ? (
                          <Badge variant="outline" className="text-xs">Todas as empresas</Badge>
                        ) : userProfile.empresas && userProfile.empresas.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {userProfile.empresas.map((empresa) => (
                              <Badge key={empresa.id} variant="secondary" className="text-xs">
                                {empresa.nome}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <Badge variant="destructive" className="text-xs">Sem empresas</Badge>
                        )}
                      </TableCell>
                      <TableCell>{userProfile.telefone || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(userProfile)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={userProfile.id === profile?.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover Usuário</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover o usuário "{userProfile.nome}"? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(userProfile)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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