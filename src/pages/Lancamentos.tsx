
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Calendar, User, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';

interface Lancamento {
  id: string;
  data_lancamento: string;
  medico_id: string;
  empresa_id: string;
  observacoes?: string;
  valor_total: number;
  created_at: string;
  medicos: {
    id: string;
    nome: string;
    crm: string;
  };
  empresas: {
    id: string;
    nome: string;
  };
  lancamento_itens: Array<{
    id: string;
    procedimento_id: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
    procedimentos: {
      id: string;
      nome: string;
      codigo?: string;
    };
  }>;
}

interface LancamentoItem {
  procedimento_id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

const Lancamentos = () => {
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLancamento, setEditingLancamento] = useState<Lancamento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('todas');
  const [selectedMedico, setSelectedMedico] = useState<string>('todos');
  
  const [formData, setFormData] = useState({
    data_lancamento: new Date().toISOString().split('T')[0],
    medico_id: '',
    empresa_id: profile?.empresa_id || '',
    observacoes: '',
    itens: [] as LancamentoItem[]
  });

  // Buscar empresas
  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas-ativas'],
    queryFn: async () => {
      let query = supabase
        .from('empresas')
        .select('id, nome')
        .eq('status', 'ativa')
        .order('nome');

      if (!isAdmin && profile?.empresa_id) {
        query = query.eq('id', profile.empresa_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Buscar médicos
  const { data: medicos = [] } = useQuery({
    queryKey: ['medicos', formData.empresa_id],
    queryFn: async () => {
      if (!formData.empresa_id) return [];

      const { data, error } = await supabase
        .from('medicos')
        .select('id, nome, crm')
        .eq('empresa_id', formData.empresa_id)
        .eq('status', 'ativa')
        .order('nome');

      if (error) throw error;
      return data;
    },
    enabled: !!formData.empresa_id
  });

  // Buscar procedimentos
  const { data: procedimentos = [] } = useQuery({
    queryKey: ['procedimentos-ativos', formData.empresa_id],
    queryFn: async () => {
      if (!formData.empresa_id) return [];

      const { data, error } = await supabase
        .from('procedimentos')
        .select('id, nome, codigo, valor')
        .eq('empresa_id', formData.empresa_id)
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      return data;
    },
    enabled: !!formData.empresa_id
  });

  // Buscar lançamentos
  const { data: lancamentos = [], isLoading } = useQuery({
    queryKey: ['lancamentos'],
    queryFn: async () => {
      let query = supabase
        .from('lancamentos')
        .select(`
          *,
          medicos (id, nome, crm),
          empresas (id, nome),
          lancamento_itens (
            id,
            procedimento_id,
            quantidade,
            valor_unitario,
            valor_total,
            procedimentos (id, nome, codigo)
          )
        `)
        .order('data_lancamento', { ascending: false });

      if (!isAdmin && profile?.empresa_id) {
        query = query.eq('empresa_id', profile.empresa_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lancamento[];
    }
  });

  // Mutation para salvar lançamento
  const lancamentoMutation = useMutation({
    mutationFn: async (lancamentoData: typeof formData & { id?: string }) => {
      const { itens, ...dadosLancamento } = lancamentoData;
      
      // Calcular valor total
      const valor_total = itens.reduce((sum, item) => sum + item.valor_total, 0);
      
      const lancamentoToSave = {
        ...dadosLancamento,
        valor_total,
        created_by: profile?.id,
        observacoes: lancamentoData.observacoes || null
      };

      let lancamentoId: string;

      if (lancamentoData.id) {
        // Atualizar lançamento existente
        const { error } = await supabase
          .from('lancamentos')
          .update(lancamentoToSave)
          .eq('id', lancamentoData.id);
        
        if (error) throw error;
        
        // Deletar itens antigos
        await supabase
          .from('lancamento_itens')
          .delete()
          .eq('lancamento_id', lancamentoData.id);
        
        lancamentoId = lancamentoData.id;
      } else {
        // Criar novo lançamento
        const { data, error } = await supabase
          .from('lancamentos')
          .insert([lancamentoToSave])
          .select()
          .single();
        
        if (error) throw error;
        lancamentoId = data.id;
      }

      // Inserir itens
      if (itens.length > 0) {
        const itensToInsert = itens.map(item => ({
          lancamento_id: lancamentoId,
          ...item
        }));

        const { error } = await supabase
          .from('lancamento_itens')
          .insert(itensToInsert);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      toast({
        title: editingLancamento ? "Lançamento atualizado!" : "Lançamento cadastrado!",
        description: editingLancamento 
          ? "O lançamento foi atualizado com sucesso."
          : "Novo lançamento foi registrado no sistema.",
      });
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Error saving lançamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar lançamento. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Mutation para deletar lançamento
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lancamentos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      toast({
        title: "Lançamento removido!",
        description: "O lançamento foi removido do sistema.",
      });
    },
    onError: (error) => {
      console.error('Error deleting lançamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover lançamento.",
        variant: "destructive"
      });
    }
  });

  const filteredLancamentos = lancamentos.filter(lancamento => {
    const matchesSearch = searchTerm === '' || 
      lancamento.medicos?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lancamento.empresas?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lancamento.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEmpresa = selectedEmpresa === 'todas' || lancamento.empresa_id === selectedEmpresa;
    const matchesMedico = selectedMedico === 'todos' || lancamento.medico_id === selectedMedico;
    
    return matchesSearch && matchesEmpresa && matchesMedico;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.itens.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um procedimento ao lançamento.",
        variant: "destructive"
      });
      return;
    }
    
    const lancamentoData = {
      ...formData,
      ...(editingLancamento && { id: editingLancamento.id })
    };
    
    lancamentoMutation.mutate(lancamentoData);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLancamento(null);
    setFormData({
      data_lancamento: new Date().toISOString().split('T')[0],
      medico_id: '',
      empresa_id: profile?.empresa_id || '',
      observacoes: '',
      itens: []
    });
  };

  const adicionarItem = () => {
    setFormData({
      ...formData,
      itens: [...formData.itens, { procedimento_id: '', quantidade: 1, valor_unitario: 0, valor_total: 0 }]
    });
  };

  const removerItem = (index: number) => {
    setFormData({
      ...formData,
      itens: formData.itens.filter((_, i) => i !== index)
    });
  };

  const atualizarItem = (index: number, campo: keyof LancamentoItem, valor: any) => {
    const novosItens = [...formData.itens];
    novosItens[index] = { ...novosItens[index], [campo]: valor };
    
    // Recalcular valor total do item
    if (campo === 'quantidade' || campo === 'valor_unitario') {
      novosItens[index].valor_total = novosItens[index].quantidade * novosItens[index].valor_unitario;
    }
    
    // Se mudou o procedimento, buscar o valor
    if (campo === 'procedimento_id') {
      const procedimento = procedimentos.find(p => p.id === valor);
      if (procedimento) {
        novosItens[index].valor_unitario = procedimento.valor;
        novosItens[index].valor_total = novosItens[index].quantidade * procedimento.valor;
      }
    }
    
    setFormData({ ...formData, itens: novosItens });
  };

  const valorTotalLancamento = formData.itens.reduce((sum, item) => sum + item.valor_total, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lançamentos</h1>
          <p className="text-muted-foreground">Registre os procedimentos realizados</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCloseDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLancamento ? 'Editar Lançamento' : 'Novo Lançamento'}
              </DialogTitle>
              <DialogDescription>
                Registre os procedimentos realizados
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_lancamento">Data do Lançamento</Label>
                  <Input
                    id="data_lancamento"
                    type="date"
                    value={formData.data_lancamento}
                    onChange={(e) => setFormData({ ...formData, data_lancamento: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Select 
                    value={formData.empresa_id} 
                    onValueChange={(value) => setFormData({ ...formData, empresa_id: value, medico_id: '' })}
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

              <div className="space-y-2">
                <Label htmlFor="medico">Médico</Label>
                <Select 
                  value={formData.medico_id} 
                  onValueChange={(value) => setFormData({ ...formData, medico_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicos.map(medico => (
                      <SelectItem key={medico.id} value={medico.id}>
                        {medico.nome} - CRM: {medico.crm}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Procedimentos</Label>
                  <Button type="button" onClick={adicionarItem} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Item
                  </Button>
                </div>

                {formData.itens.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-2">
                        <Label>Procedimento</Label>
                        <Select 
                          value={item.procedimento_id}
                          onValueChange={(value) => atualizarItem(index, 'procedimento_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {procedimentos.map(proc => (
                              <SelectItem key={proc.id} value={proc.id}>
                                {proc.nome} {proc.codigo && `(${proc.codigo})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantidade}
                          onChange={(e) => atualizarItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removerItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label>Valor Unitário</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.valor_unitario}
                          onChange={(e) => atualizarItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div>
                        <Label>Valor Total</Label>
                        <Input
                          type="text"
                          value={`R$ ${item.valor_total.toFixed(2)}`}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {formData.itens.length > 0 && (
                  <div className="text-right">
                    <strong>Total do Lançamento: R$ {valorTotalLancamento.toFixed(2)}</strong>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={lancamentoMutation.isPending}>
                  {lancamentoMutation.isPending ? 'Salvando...' : (editingLancamento ? 'Atualizar' : 'Salvar')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
                  placeholder="Buscar por médico, empresa ou observações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
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

      {/* Lista de Lançamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Lançamentos Registrados ({filteredLancamentos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Médico</TableHead>
                  {isAdmin && <TableHead>Empresa</TableHead>}
                  <TableHead>Procedimentos</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className="text-center">
                      Carregando lançamentos...
                    </TableCell>
                  </TableRow>
                ) : filteredLancamentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className="text-center">
                      Nenhum lançamento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLancamentos.map((lancamento) => (
                    <TableRow key={lancamento.id}>
                      <TableCell>
                        {new Date(lancamento.data_lancamento).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lancamento.medicos?.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            CRM: {lancamento.medicos?.crm}
                          </div>
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>{lancamento.empresas?.nome}</TableCell>
                      )}
                      <TableCell>
                        <div className="space-y-1">
                          {lancamento.lancamento_itens?.map(item => (
                            <div key={item.id} className="text-sm">
                              {item.procedimentos?.nome} 
                              {item.procedimentos?.codigo && ` (${item.procedimentos.codigo})`}
                              <span className="text-muted-foreground"> - Qtd: {item.quantidade}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        R$ {lancamento.valor_total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(lancamento.id)}
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

export default Lancamentos;
