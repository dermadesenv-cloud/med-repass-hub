
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Medico {
  id: string;
  nome: string;
  email: string | null;
  crm: string;
  especialidade: string | null;
  empresa_id: string | null;
  status: 'ativa' | 'inativa';
  telefone: string | null;
  created_at: string;
  updated_at: string;
  empresas?: {
    nome: string;
  };
}

interface Empresa {
  id: string;
  nome: string;
}

const Medicos = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedico, setEditingMedico] = useState<Medico | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    crm: '',
    especialidade: '',
    empresa_id: '',
    telefone: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const especialidades = [
    'Cardiologia', 'Dermatologia', 'Neurologia', 'Ortopedia', 
    'Pediatria', 'Ginecologia', 'Oftalmologia', 'Psiquiatria'
  ];

  // Buscar médicos
  const { data: medicos = [], isLoading: loadingMedicos } = useQuery({
    queryKey: ['medicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medicos')
        .select(`
          *,
          empresas (
            nome
          )
        `)
        .order('nome');
      
      if (error) throw error;
      return data as Medico[];
    }
  });

  // Buscar empresas
  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('status', 'ativa')
        .order('nome');
      
      if (error) throw error;
      return data as Empresa[];
    }
  });

  // Criar médico
  const createMedico = useMutation({
    mutationFn: async (newMedico: Omit<Medico, 'id' | 'created_at' | 'updated_at' | 'empresas'>) => {
      const { data, error } = await supabase
        .from('medicos')
        .insert([newMedico])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicos'] });
      toast({
        title: "Médico cadastrado!",
        description: "Novo médico foi adicionado ao sistema.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar médico",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Atualizar médico
  const updateMedico = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Medico> & { id: string }) => {
      const { data, error } = await supabase
        .from('medicos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicos'] });
      toast({
        title: "Médico atualizado!",
        description: "Os dados do médico foram atualizados com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar médico",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Deletar médico
  const deleteMedico = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('medicos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicos'] });
      toast({
        title: "Médico removido!",
        description: "O médico foi removido do sistema.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover médico",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const filteredMedicos = medicos.filter(medico =>
    medico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medico.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medico.crm.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMedico) {
      await updateMedico.mutateAsync({
        id: editingMedico.id,
        ...formData,
        status: 'ativa' as const
      });
    } else {
      await createMedico.mutateAsync({
        ...formData,
        status: 'ativa' as const
      });
    }

    setFormData({
      nome: '',
      email: '',
      crm: '',
      especialidade: '',
      empresa_id: '',
      telefone: ''
    });
    setEditingMedico(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (medico: Medico) => {
    setEditingMedico(medico);
    setFormData({
      nome: medico.nome,
      email: medico.email || '',
      crm: medico.crm,
      especialidade: medico.especialidade || '',
      empresa_id: medico.empresa_id || '',
      telefone: medico.telefone || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteMedico.mutateAsync(id);
  };

  if (loadingMedicos) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Médicos</h1>
          <p className="text-secondary">Gerencie os médicos cadastrados no sistema</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white">
              <Plus className="mr-2 h-4 w-4" />
              Novo Médico
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-primary">
                {editingMedico ? 'Editar Médico' : 'Novo Médico'}
              </DialogTitle>
              <DialogDescription>
                {editingMedico ? 'Atualize os dados do médico' : 'Preencha as informações do novo médico'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="crm">CRM</Label>
                  <Input
                    id="crm"
                    value={formData.crm}
                    onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                    placeholder="12345-SP"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="especialidade">Especialidade</Label>
                  <Select 
                    value={formData.especialidade} 
                    onValueChange={(value) => setFormData({ ...formData, especialidade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma especialidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {especialidades.map(esp => (
                        <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Select 
                    value={formData.empresa_id} 
                    onValueChange={(value) => setFormData({ ...formData, empresa_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map(empresa => (
                        <SelectItem key={empresa.id} value={empresa.id}>{empresa.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white"
                  disabled={createMedico.isPending || updateMedico.isPending}
                >
                  {editingMedico ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
                  placeholder="Buscar por nome, email ou CRM..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Médicos */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Médicos Cadastrados ({filteredMedicos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CRM</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicos.map((medico) => (
                  <TableRow key={medico.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold text-primary">{medico.nome}</div>
                        {medico.email && <div className="text-sm text-gray-500">{medico.email}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{medico.crm}</TableCell>
                    <TableCell>{medico.especialidade || '-'}</TableCell>
                    <TableCell>{medico.empresas?.nome || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={medico.status === 'ativa' ? "default" : "secondary"}>
                        {medico.status === 'ativa' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(medico)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(medico.id)}
                          disabled={deleteMedico.isPending}
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

export default Medicos;
