
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Updated type definitions to match the actual database structure and query results
interface Lancamento {
  id: string;
  empresa_id: string;
  medico_id: string;
  data_lancamento: string;
  observacoes?: string;
  valor_total: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  empresas: { nome: string; } | null;
  medicos: { nome: string; crm: string; } | null;
  itens?: LancamentoItem[];
}

interface LancamentoItem {
  id: string;
  lancamento_id: string;
  procedimento_id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  procedimentos?: { nome: string; };
}

interface Empresa {
  id: string;
  nome: string;
}

interface Medico {
  id: string;
  nome: string;
  crm: string;
}

interface Procedimento {
  id: string;
  nome: string;
  valor: number;
}

interface FormData {
  empresa_id: string;
  medico_id: string;
  data_lancamento: string;
  observacoes: string;
  itens: Array<{
    procedimento_id: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
  }>;
}

export default function Lancamentos() {
  const { user, userProfile } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLancamento, setSelectedLancamento] = useState<Lancamento | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    empresa_id: '',
    medico_id: '',
    data_lancamento: '',
    observacoes: '',
    itens: []
  });
  const queryClient = useQueryClient();

  // Fetch lancamentos with proper type handling
  const { data: lancamentos = [], isLoading } = useQuery({
    queryKey: ['lancamentos'],
    queryFn: async () => {
      let query = supabase
        .from('lancamentos')
        .select(`
          *,
          empresas!inner(nome),
          medicos!inner(nome, crm)
        `)
        .order('data_lancamento', { ascending: false });

      if (userProfile?.role !== 'admin') {
        query = query.eq('empresa_id', userProfile?.empresa_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to match our type expectations
      return (data || []).map(item => ({
        ...item,
        empresas: Array.isArray(item.empresas) ? item.empresas[0] : item.empresas,
        medicos: Array.isArray(item.medicos) ? item.medicos[0] : item.medicos
      })) as Lancamento[];
    },
  });

  // Fetch empresas
  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      let query = supabase.from('empresas').select('id, nome').eq('status', 'ativa');
      
      if (userProfile?.role !== 'admin') {
        query = query.eq('id', userProfile?.empresa_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Empresa[];
    },
  });

  // Fetch medicos
  const { data: medicos = [] } = useQuery({
    queryKey: ['medicos', formData.empresa_id],
    queryFn: async () => {
      if (!formData.empresa_id) return [];
      
      const { data, error } = await supabase
        .from('medicos')
        .select('id, nome, crm')
        .eq('empresa_id', formData.empresa_id)
        .eq('status', 'ativa');

      if (error) throw error;
      return data as Medico[];
    },
    enabled: !!formData.empresa_id,
  });

  // Fetch procedimentos
  const { data: procedimentos = [] } = useQuery({
    queryKey: ['procedimentos', formData.empresa_id],
    queryFn: async () => {
      if (!formData.empresa_id) return [];
      
      const { data, error } = await supabase
        .from('procedimentos')
        .select('id, nome, valor')
        .eq('empresa_id', formData.empresa_id)
        .eq('status', 'ativo');

      if (error) throw error;
      return data as Procedimento[];
    },
    enabled: !!formData.empresa_id,
  });

  // Set default empresa for regular users
  useEffect(() => {
    if (userProfile?.role !== 'admin' && userProfile?.empresa_id && !formData.empresa_id) {
      setFormData(prev => ({ ...prev, empresa_id: userProfile.empresa_id }));
    }
  }, [userProfile, formData.empresa_id]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user) throw new Error('User not authenticated');

      // Insert lancamento
      const { data: lancamento, error: lancamentoError } = await supabase
        .from('lancamentos')
        .insert({
          empresa_id: data.empresa_id,
          medico_id: data.medico_id,
          data_lancamento: data.data_lancamento,
          observacoes: data.observacoes,
          valor_total: data.itens.reduce((total, item) => total + item.valor_total, 0),
          created_by: user.id
        })
        .select()
        .single();

      if (lancamentoError) throw lancamentoError;

      // Insert itens
      if (data.itens.length > 0) {
        const { error: itensError } = await supabase
          .from('lancamento_itens')
          .insert(data.itens.map(item => ({
            ...item,
            lancamento_id: lancamento.id
          })));

        if (itensError) throw itensError;
      }

      return lancamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Lançamento criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating lancamento:', error);
      toast.error('Erro ao criar lançamento');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FormData & { id: string }) => {
      // Update lancamento
      const { error: lancamentoError } = await supabase
        .from('lancamentos')
        .update({
          empresa_id: data.empresa_id,
          medico_id: data.medico_id,
          data_lancamento: data.data_lancamento,
          observacoes: data.observacoes,
          valor_total: data.itens.reduce((total, item) => total + item.valor_total, 0)
        })
        .eq('id', data.id);

      if (lancamentoError) throw lancamentoError;

      // Delete existing itens
      const { error: deleteError } = await supabase
        .from('lancamento_itens')
        .delete()
        .eq('lancamento_id', data.id);

      if (deleteError) throw deleteError;

      // Insert new itens
      if (data.itens.length > 0) {
        const { error: itensError } = await supabase
          .from('lancamento_itens')
          .insert(data.itens.map(item => ({
            ...item,
            lancamento_id: data.id
          })));

        if (itensError) throw itensError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Lançamento atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating lancamento:', error);
      toast.error('Erro ao atualizar lançamento');
    },
  });

  // Delete mutation
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
      toast.success('Lançamento excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting lancamento:', error);
      toast.error('Erro ao excluir lançamento');
    },
  });

  const resetForm = () => {
    setFormData({
      empresa_id: userProfile?.role !== 'admin' ? userProfile?.empresa_id || '' : '',
      medico_id: '',
      data_lancamento: '',
      observacoes: '',
      itens: []
    });
    setSelectedLancamento(null);
    setIsViewMode(false);
  };

  const openDialog = (lancamento?: Lancamento, viewMode = false) => {
    if (lancamento) {
      setSelectedLancamento(lancamento);
      setFormData({
        empresa_id: lancamento.empresa_id,
        medico_id: lancamento.medico_id,
        data_lancamento: lancamento.data_lancamento,
        observacoes: lancamento.observacoes || '',
        itens: lancamento.itens || []
      });
      setIsViewMode(viewMode);
    } else {
      resetForm();
      setIsViewMode(false);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.itens.length === 0) {
      toast.error('Adicione pelo menos um item ao lançamento');
      return;
    }

    if (selectedLancamento) {
      updateMutation.mutate({ ...formData, id: selectedLancamento.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (lancamento: Lancamento) => {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
      deleteMutation.mutate(lancamento.id);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      itens: [...prev.itens, {
        procedimento_id: '',
        quantidade: 1,
        valor_unitario: 0,
        valor_total: 0
      }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newItens = [...prev.itens];
      const item = { ...newItens[index] };
      
      if (field === 'procedimento_id') {
        const procedimento = procedimentos.find(p => p.id === value);
        if (procedimento) {
          item.procedimento_id = value;
          item.valor_unitario = procedimento.valor;
          item.valor_total = item.quantidade * procedimento.valor;
        }
      } else if (field === 'quantidade') {
        item.quantidade = parseInt(value) || 1;
        item.valor_total = item.quantidade * item.valor_unitario;
      } else {
        (item as any)[field] = value;
      }
      
      newItens[index] = item;
      return { ...prev, itens: newItens };
    });
  };

  const totalGeral = formData.itens.reduce((total, item) => total + item.valor_total, 0);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-lg">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Lançamentos</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isViewMode ? 'Visualizar' : selectedLancamento ? 'Editar' : 'Novo'} Lançamento
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userProfile?.role === 'admin' && (
                  <div>
                    <Label htmlFor="empresa_id">Empresa</Label>
                    <Select
                      value={formData.empresa_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, empresa_id: value, medico_id: '' }))}
                      disabled={isViewMode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {empresas.map((empresa) => (
                          <SelectItem key={empresa.id} value={empresa.id}>
                            {empresa.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="medico_id">Médico</Label>
                  <Select
                    value={formData.medico_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, medico_id: value }))}
                    disabled={isViewMode || !formData.empresa_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o médico" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicos.map((medico) => (
                        <SelectItem key={medico.id} value={medico.id}>
                          {medico.nome} - CRM: {medico.crm}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="data_lancamento">Data do Lançamento</Label>
                  <Input
                    id="data_lancamento"
                    type="date"
                    value={formData.data_lancamento}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_lancamento: e.target.value }))}
                    disabled={isViewMode}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  disabled={isViewMode}
                  rows={3}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Procedimentos</Label>
                  {!isViewMode && (
                    <Button type="button" onClick={addItem} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Item
                    </Button>
                  )}
                </div>

                {formData.itens.map((item, index) => (
                  <Card key={index} className="mb-4">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-2">
                          <Label>Procedimento</Label>
                          <Select
                            value={item.procedimento_id}
                            onValueChange={(value) => updateItem(index, 'procedimento_id', value)}
                            disabled={isViewMode}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o procedimento" />
                            </SelectTrigger>
                            <SelectContent>
                              {procedimentos.map((proc) => (
                                <SelectItem key={proc.id} value={proc.id}>
                                  {proc.nome} - R$ {proc.valor.toFixed(2)}
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
                            onChange={(e) => updateItem(index, 'quantidade', e.target.value)}
                            disabled={isViewMode}
                          />
                        </div>

                        <div>
                          <Label>Valor Unit.</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.valor_unitario}
                            disabled
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Label>Total</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.valor_total.toFixed(2)}
                              disabled
                            />
                          </div>
                          {!isViewMode && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="mt-6"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {formData.itens.length > 0 && (
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      Total Geral: R$ {totalGeral.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {!isViewMode && (
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {selectedLancamento ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                {userProfile?.role === 'admin' && <TableHead>Empresa</TableHead>}
                <TableHead>Médico</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lancamentos.map((lancamento) => (
                <TableRow key={lancamento.id}>
                  <TableCell>
                    {new Date(lancamento.data_lancamento).toLocaleDateString('pt-BR')}
                  </TableCell>
                  {userProfile?.role === 'admin' && (
                    <TableCell>
                      <Badge variant="secondary">
                        {lancamento.empresas?.nome || 'N/A'}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    {lancamento.medicos?.nome || 'N/A'}
                    {lancamento.medicos?.crm && (
                      <div className="text-sm text-muted-foreground">
                        CRM: {lancamento.medicos.crm}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      R$ {lancamento.valor_total.toFixed(2)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {lancamento.observacoes || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(lancamento, true)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(lancamento, false)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(lancamento)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
