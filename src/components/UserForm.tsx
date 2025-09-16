
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Building2 } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: 'admin' | 'usuario';
  created_at: string;
  updated_at: string;
}

interface Empresa {
  id: string;
  nome: string;
  status: string;
}

interface UserFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingProfile: Profile | null;
  onSuccess: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({
  isOpen,
  onOpenChange,
  editingProfile,
  onSuccess
}) => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [selectedEmpresas, setSelectedEmpresas] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    nome: editingProfile?.nome || '',
    email: editingProfile?.email || '',
    telefone: editingProfile?.telefone || '',
    role: editingProfile?.role || 'usuario' as 'admin' | 'usuario',
    password: ''
  });

  // Carregar empresas disponíveis
  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome, status')
        .eq('status', 'ativa')
        .order('nome');
      
      if (error) throw error;
      setEmpresas(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  // Carregar empresas do usuário (para edição)
  const fetchUserEmpresas = async () => {
    if (!editingProfile) return;
    
    try {
      const { data, error } = await supabase
        .from('user_empresas')
        .select('empresa_id')
        .eq('user_id', editingProfile.user_id);
      
      if (error) throw error;
      setSelectedEmpresas(data?.map(item => item.empresa_id) || []);
    } catch (error) {
      console.error('Erro ao carregar empresas do usuário:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmpresas();
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingProfile) {
      setFormData({
        nome: editingProfile.nome,
        email: editingProfile.email,
        telefone: editingProfile.telefone || '',
        role: editingProfile.role,
        password: ''
      });
      fetchUserEmpresas();
    } else {
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        role: 'usuario',
        password: ''
      });
      setSelectedEmpresas([]);
    }
  }, [editingProfile, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update({
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone,
            role: formData.role
          })
          .eq('id', editingProfile.id);

        if (error) throw error;

        // Atualizar vinculações com empresas para usuário existente (se não for admin)
        if (formData.role !== 'admin') {
          // Remover vinculações existentes
          await supabase
            .from('user_empresas')
            .delete()
            .eq('user_id', editingProfile.user_id);

          // Adicionar novas vinculações
          if (selectedEmpresas.length > 0) {
            const userEmpresasData = selectedEmpresas.map(empresaId => ({
              user_id: editingProfile.user_id,
              empresa_id: empresaId
            }));

            const { error: userEmpresasError } = await supabase
              .from('user_empresas')
              .insert(userEmpresasData);

            if (userEmpresasError) throw userEmpresasError;
          }
        }

        toast({
          title: "Usuário atualizado",
          description: "Os dados do usuário foram atualizados com sucesso.",
        });
      } else {
        // Criar novo usuário usando signUp normal
        const redirectUrl = `${window.location.origin}/`;
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              nome: formData.nome,
            }
          }
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            toast({
              title: "Erro",
              description: "Este email já está cadastrado no sistema.",
              variant: "destructive"
            });
          } else {
            throw authError;
          }
          return;
        }

        if (authData.user) {
          // Verificar se já existe um perfil para este usuário
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', authData.user.id)
            .single();

          if (!existingProfile) {
            // Criar o perfil do usuário apenas se não existir
            const { error: profileError } = await supabase
              .from('profiles')
              .insert([{
                user_id: authData.user.id,
                nome: formData.nome,
                email: formData.email,
                telefone: formData.telefone || null,
                role: formData.role
              }]);

            if (profileError) throw profileError;

            // Salvar vinculações com empresas (apenas se não for admin)
            if (formData.role !== 'admin' && selectedEmpresas.length > 0) {
              const userEmpresasData = selectedEmpresas.map(empresaId => ({
                user_id: authData.user.id,
                empresa_id: empresaId
              }));

              const { error: userEmpresasError } = await supabase
                .from('user_empresas')
                .insert(userEmpresasData);

              if (userEmpresasError) throw userEmpresasError;
            }
          }

          toast({
            title: "Usuário cadastrado",
            description: "Novo usuário foi cadastrado com sucesso.",
          });
        }
      }

      onSuccess();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar usuário.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingProfile ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
          <DialogDescription>
            {editingProfile 
              ? 'Atualize as informações do usuário.' 
              : 'Preencha os dados para cadastrar um novo usuário.'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
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
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({...formData, telefone: e.target.value})}
            />
          </div>
          {!editingProfile && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="role">Papel</Label>
            <Select value={formData.role} onValueChange={(value: 'admin' | 'usuario') => setFormData({...formData, role: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usuario">Usuário</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {formData.role !== 'admin' && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Empresas de Acesso
              </Label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                {empresas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma empresa disponível</p>
                ) : (
                  empresas.map((empresa) => (
                    <div key={empresa.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={empresa.id}
                        checked={selectedEmpresas.includes(empresa.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedEmpresas([...selectedEmpresas, empresa.id]);
                          } else {
                            setSelectedEmpresas(selectedEmpresas.filter(id => id !== empresa.id));
                          }
                        }}
                      />
                      <Label htmlFor={empresa.id} className="text-sm font-normal cursor-pointer">
                        {empresa.nome}
                      </Label>
                    </div>
                  ))
                )}
              </div>
              {selectedEmpresas.length === 0 && (
                <p className="text-xs text-amber-600">
                  ⚠️ Usuário sem empresas não terá acesso a procedimentos
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : (editingProfile ? 'Atualizar' : 'Cadastrar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
