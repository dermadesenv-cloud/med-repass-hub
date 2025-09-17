
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Procedimento {
  id: string;
  nome: string;
  codigo?: string;
  valor: number;
  empresa_id?: string;
  categoria?: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
  empresas?: {
    id: string;
    nome: string;
  };
}

interface Empresa {
  id: string;
  nome: string;
  status: 'ativa' | 'inativa';
}

const Procedimentos = () => {
  const { isAdmin, allowedEmpresas } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProcedimento, setEditingProcedimento] = useState<Procedimento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todas');
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('todas');
  
  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    valor: '',
    empresa_id: '',
    categoria: ''
  });

  const categorias: string[] = [];

  // Buscar empresas ativas (apenas as permitidas para usuários não admin)
  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas-ativas', isAdmin, allowedEmpresas],
    queryFn: async () => {
      let query = supabase
        .from('empresas')
        .select('id, nome, status')
        .eq('status', 'ativa');

      // Se não for admin, filtrar por empresas permitidas
      if (!isAdmin && allowedEmpresas.length > 0) {
        query = query.in('id', allowedEmpresas);
      }

      const { data, error } = await query.order('nome');

      if (error) throw error;
      return data as Empresa[];
    }
  });

  // Buscar procedimentos com filtro por empresa
  const { data: procedimentos = [], isLoading } = useQuery({
    queryKey: ['procedimentos', isAdmin, allowedEmpresas],
    queryFn: async () => {
      let query = supabase
        .from('procedimentos')
        .select(`
          *,
          empresas (
            id,
            nome
          )
        `);

      // Se não for admin, filtrar por empresas permitidas
      if (!isAdmin && allowedEmpresas.length > 0) {
        query = query.in('empresa_id', allowedEmpresas);
      }

      const { data, error } = await query.order('nome');
      if (error) throw error;
      return data as Procedimento[];
    }
  });

  // Mutation para criar/atualizar procedimento
  const procedimentoMutation = useMutation({
    mutationFn: async (procedimentoData: typeof formData & { id?: string }) => {
      const dataToSave = {
        nome: procedimentoData.nome,
        codigo: procedimentoData.codigo || null,
        valor: parseFloat(procedimentoData.valor),
        empresa_id: procedimentoData.empresa_id || null,
        categoria: procedimentoData.categoria || null,
        status: 'ativo' as const
      };

      if (procedimentoData.id) {
        const { error } = await supabase
          .from('procedimentos')
          .update(dataToSave)
          .eq('id', procedimentoData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('procedimentos')
          .insert([dataToSave]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedimentos'] });
      toast({
        title: editingProcedimento ? "Procedimento atualizado!" : "Procedimento cadastrado!",
        description: editingProcedimento 
          ? "Os dados do procedimento foram atualizados com sucesso."
          : "Novo procedimento foi adicionado ao sistema.",
      });
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Error saving procedimento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar procedimento. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Mutation para deletar procedimento
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('procedimentos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedimentos'] });
      toast({
        title: "Procedimento removido!",
        description: "O procedimento foi removido do sistema.",
      });
    },
    onError: (error) => {
      console.error('Error deleting procedimento:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover procedimento. Verifique se não existem lançamentos vinculados.",
        variant: "destructive"
      });
    }
  });

  // Filtrar procedimentos
  const getFilteredProcedimentos = () => {
    let filtered = procedimentos;

    if (searchTerm) {
      filtered = filtered.filter(proc =>
        proc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.empresas?.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategoria && selectedCategoria !== 'todas') {
      filtered = filtered.filter(proc => proc.categoria === selectedCategoria);
    }

    if (selectedEmpresa && selectedEmpresa !== 'todas') {
      filtered = filtered.filter(proc => proc.empresa_id === selectedEmpresa);
    }

    return filtered;
  };

  const filteredProcedimentos = getFilteredProcedimentos();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const procedimentoData = {
      ...formData,
      ...(editingProcedimento && { id: editingProcedimento.id })
    };
    
    procedimentoMutation.mutate(procedimentoData);
  };

  const handleEdit = (procedimento: Procedimento) => {
    setEditingProcedimento(procedimento);
    setFormData({
      nome: procedimento.nome,
      codigo: procedimento.codigo || '',
      valor: procedimento.valor.toString(),
      empresa_id: procedimento.empresa_id || '',
      categoria: procedimento.categoria || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este procedimento?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProcedimento(null);
    setFormData({ nome: '', codigo: '', valor: '', empresa_id: '', categoria: '' });
  };

  const exportCSV = () => {
    const headers = 'Nome,Código,Valor,Empresa,Categoria,Status,Data\n';
    const csvContent = filteredProcedimentos.map(proc => 
      `${proc.nome},${proc.codigo || ''},${proc.valor},${proc.empresas?.nome || ''},${proc.categoria || ''},${proc.status},${new Date(proc.created_at).toLocaleDateString('pt-BR')}`
    ).join('\n');
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'procedimentos.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Exportação concluída!",
      description: "Arquivo CSV foi baixado com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Procedimentos</h1>
          <p className="text-muted-foreground">Gerencie os procedimentos cadastrados no sistema</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCloseDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Procedimento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingProcedimento ? 'Editar Procedimento' : 'Novo Procedimento'}
                </DialogTitle>
                <DialogDescription>
                  {editingProcedimento ? 'Atualize os dados do procedimento' : 'Preencha as informações do novo procedimento'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Procedimento</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ex: CON001"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select 
                    value={formData.categoria} 
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={procedimentoMutation.isPending}>
                    {procedimentoMutation.isPending ? 'Salvando...' : (editingProcedimento ? 'Atualizar' : 'Cadastrar')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, código ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as categorias</SelectItem>
                  {categorias.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <div className="w-48">
                <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as empresas</SelectItem>
                    {empresas.map(empresa => (
                      <SelectItem key={empresa.id} value={empresa.id}>{empresa.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Procedimentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Procedimentos Cadastrados ({filteredProcedimentos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  {isAdmin && <TableHead>Empresa</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="text-center">
                      Carregando procedimentos...
                    </TableCell>
                  </TableRow>
                ) : filteredProcedimentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="text-center">
                      Nenhum procedimento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProcedimentos.map((procedimento) => (
                    <TableRow key={procedimento.id}>
                      <TableCell className="font-medium">
                        {procedimento.nome}
                      </TableCell>
                      <TableCell>{procedimento.codigo || '-'}</TableCell>
                      <TableCell>
                        {procedimento.categoria && (
                          <Badge variant="secondary">
                            {procedimento.categoria}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        R$ {procedimento.valor.toFixed(2)}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>{procedimento.empresas?.nome || '-'}</TableCell>
                      )}
                      <TableCell>
                        <Badge variant={procedimento.status === 'ativo' ? "default" : "secondary"}>
                          {procedimento.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(procedimento)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(procedimento.id)}
                            disabled={deleteMutation.isPending}
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
    </div>
  );
};

export default Procedimentos;
