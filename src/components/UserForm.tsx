
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nome: editingProfile?.nome || '',
    email: editingProfile?.email || '',
    telefone: editingProfile?.telefone || '',
    role: editingProfile?.role || 'usuario' as 'admin' | 'usuario',
    password: ''
  });

  React.useEffect(() => {
    if (editingProfile) {
      setFormData({
        nome: editingProfile.nome,
        email: editingProfile.email,
        telefone: editingProfile.telefone || '',
        role: editingProfile.role,
        password: ''
      });
    } else {
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        role: 'usuario',
        password: ''
      });
    }
  }, [editingProfile, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingProfile) {
        // Atualizar perfil existente
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
