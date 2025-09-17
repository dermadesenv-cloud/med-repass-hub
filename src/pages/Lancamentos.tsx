import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Calendar, DollarSign, FileText, User, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
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
interface LancamentoItem {
  id?: string;
  lancamento_id?: string;
  procedimento_id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}
interface Lancamento {
  id: string;
  medico_id: string;
  empresa_id: string;
  data_lancamento: string;
  valor_total: number;
  observacoes: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  empresas: {
    nome: string;
  } | {
    nome: string;
  }[];
  medicos: {
    nome: string;
    crm: string;
  } | {
    nome: string;
    crm: string;
  }[];
  itens?: LancamentoItem[];
}
const Lancamentos = () => {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLancamento, setEditingLancamento] = useState<Lancamento | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {
    user,
    profile,
    isAdmin
  } = useAuth();
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    medico_id: '',
    empresa_id: '',
    data_lancamento: new Date().toISOString().split('T')[0],
    observacoes: ''
  });
  const [itensLancamento, setItensLancamento] = useState<LancamentoItem[]>([{
    procedimento_id: '',
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0
  }]);

  // Fix the empresa_id access - use profile instead of userProfile
  const userEmpresaId = isAdmin ? null : profile?.empresa_id;
  useEffect(() => {
    fetchLancamentos();
    fetchEmpresas();
    fetchMedicos();
    fetchProcedimentos();
  }, []);
  const fetchLancamentos = async () => {
    try {
      setLoading(true);
      let query = supabase.from('lancamentos').select(`
          *,
          empresas!inner(nome),
          medicos!inner(nome, crm)
        `);

      // Se não for admin, filtrar por empresa
      if (!isAdmin && userEmpresaId) {
        query = query.eq('empresa_id', userEmpresaId);
      }
      const {
        data,
        error
      } = await query.order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Erro ao buscar lançamentos:', error);
        toast({
          title: "Erro ao carregar lançamentos",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Transform the data to match our interface
      const transformedData = data.map(item => ({
        ...item,
        empresas: Array.isArray(item.empresas) ? item.empresas[0] : item.empresas,
        medicos: Array.isArray(item.medicos) ? item.medicos[0] : item.medicos
      }));
      setLancamentos(transformedData);
    } catch (error) {
      console.error('Erro ao buscar lançamentos:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro ao carregar lançamentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchEmpresas = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('empresas').select('*').order('nome');
      if (error) {
        console.error('Erro ao buscar empresas:', error);
        return;
      }
      setEmpresas(data || []);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    }
  };
  const fetchMedicos = async () => {
    try {
      let query = supabase.from('medicos').select('*');
      if (!isAdmin && userEmpresaId) {
        query = query.eq('empresa_id', userEmpresaId);
      }
      const {
        data,
        error
      } = await query.order('nome');
      if (error) {
        console.error('Erro ao buscar médicos:', error);
        return;
      }
      setMedicos(data || []);
    } catch (error) {
      console.error('Erro ao buscar médicos:', error);
    }
  };
  const fetchProcedimentos = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('procedimentos').select('*').order('nome');
      if (error) {
        console.error('Erro ao buscar procedimentos:', error);
        return;
      }
      setProcedimentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar procedimentos:', error);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }
    try {
      const valorTotal = itensLancamento.reduce((sum, item) => sum + item.valor_total, 0);
      const lancamentoData = {
        ...formData,
        valor_total: valorTotal,
        created_by: user.id
      };
      if (editingLancamento) {
        // Atualizar lançamento existente
        const {
          error: lancamentoError
        } = await supabase.from('lancamentos').update(lancamentoData).eq('id', editingLancamento.id);
        if (lancamentoError) {
          throw lancamentoError;
        }

        // Deletar itens antigos
        const {
          error: deleteError
        } = await supabase.from('lancamento_itens').delete().eq('lancamento_id', editingLancamento.id);
        if (deleteError) {
          throw deleteError;
        }

        // Inserir novos itens
        const itensData = itensLancamento.map(item => ({
          ...item,
          lancamento_id: editingLancamento.id
        }));
        const {
          error: itensError
        } = await supabase.from('lancamento_itens').insert(itensData);
        if (itensError) {
          throw itensError;
        }
        toast({
          title: "Lançamento atualizado",
          description: "Lançamento atualizado com sucesso!"
        });
      } else {
        // Criar novo lançamento
        const {
          data: lancamentoResult,
          error: lancamentoError
        } = await supabase.from('lancamentos').insert([lancamentoData]).select().single();
        if (lancamentoError) {
          throw lancamentoError;
        }

        // Inserir itens
        const itensData = itensLancamento.map(item => ({
          ...item,
          lancamento_id: lancamentoResult.id
        }));
        const {
          error: itensError
        } = await supabase.from('lancamento_itens').insert(itensData);
        if (itensError) {
          throw itensError;
        }
        toast({
          title: "Lançamento criado",
          description: "Lançamento criado com sucesso!"
        });
      }

      // Reset form
      setFormData({
        medico_id: '',
        empresa_id: '',
        data_lancamento: new Date().toISOString().split('T')[0],
        observacoes: ''
      });
      setItensLancamento([{
        procedimento_id: '',
        quantidade: 1,
        valor_unitario: 0,
        valor_total: 0
      }]);
      setEditingLancamento(null);
      setIsDialogOpen(false);
      await fetchLancamentos();
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      toast({
        title: "Erro ao salvar",
        description: "Erro ao salvar lançamento",
        variant: "destructive"
      });
    }
  };
  const handleEdit = (lancamento: Lancamento) => {
    setEditingLancamento(lancamento);
    setFormData({
      medico_id: lancamento.medico_id,
      empresa_id: lancamento.empresa_id,
      data_lancamento: lancamento.data_lancamento,
      observacoes: lancamento.observacoes
    });

    // Load existing items if available
    if (lancamento.itens && lancamento.itens.length > 0) {
      setItensLancamento(lancamento.itens);
    }
    setIsDialogOpen(true);
  };
  const handleDelete = async (id: string) => {
    try {
      const {
        error
      } = await supabase.from('lancamentos').delete().eq('id', id);
      if (error) {
        throw error;
      }
      toast({
        title: "Lançamento excluído",
        description: "Lançamento excluído com sucesso!"
      });
      await fetchLancamentos();
    } catch (error) {
      console.error('Erro ao excluir lançamento:', error);
      toast({
        title: "Erro ao excluir",
        description: "Erro ao excluir lançamento",
        variant: "destructive"
      });
    }
  };
  const addItem = () => {
    setItensLancamento([...itensLancamento, {
      procedimento_id: '',
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0
    }]);
  };
  const removeItem = (index: number) => {
    if (itensLancamento.length > 1) {
      setItensLancamento(itensLancamento.filter((_, i) => i !== index));
    }
  };
  const updateItem = (index: number, field: keyof LancamentoItem, value: string | number) => {
    const newItens = [...itensLancamento];
    newItens[index] = {
      ...newItens[index],
      [field]: value
    };
    if (field === 'quantidade' || field === 'valor_unitario') {
      newItens[index].valor_total = newItens[index].quantidade * newItens[index].valor_unitario;
    }
    setItensLancamento(newItens);
  };
  if (loading) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando lançamentos...</div>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Lançamentos</h1>
          <p className="text-muted-foreground mt-2">Lançamentos de Procedimentos e Consultas executadas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingLancamento(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {editingLancamento ? 'Editar Lançamento' : 'Novo Lançamento'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medico_id">Médico</Label>
                  <Select value={formData.medico_id} onValueChange={value => setFormData({
                  ...formData,
                  medico_id: value
                })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um médico" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicos.map(medico => <SelectItem key={medico.id} value={medico.id}>
                          {medico.nome} - CRM: {medico.crm}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {isAdmin && <div className="space-y-2">
                    <Label htmlFor="empresa_id">Empresa</Label>
                    <Select value={formData.empresa_id} onValueChange={value => setFormData({
                  ...formData,
                  empresa_id: value
                })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {empresas.map(empresa => <SelectItem key={empresa.id} value={empresa.id}>
                            {empresa.nome}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>}

                <div className="space-y-2">
                  <Label htmlFor="data_lancamento">Data do Lançamento</Label>
                  <Input id="data_lancamento" type="date" value={formData.data_lancamento} onChange={e => setFormData({
                  ...formData,
                  data_lancamento: e.target.value
                })} required />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Itens do Lançamento</h3>
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Item
                  </Button>
                </div>

                {itensLancamento.map((item, index) => <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Procedimento</Label>
                          <Select value={item.procedimento_id} onValueChange={value => updateItem(index, 'procedimento_id', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {procedimentos.map(proc => <SelectItem key={proc.id} value={proc.id}>
                                  {proc.nome} - R$ {proc.valor.toFixed(2)}
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Quantidade</Label>
                          <Input type="number" min="1" value={item.quantidade} onChange={e => updateItem(index, 'quantidade', parseInt(e.target.value) || 1)} />
                        </div>

                        <div className="space-y-2">
                          <Label>Valor Unitário</Label>
                          <Input type="number" step="0.01" min="0" value={item.valor_unitario} onChange={e => updateItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)} />
                        </div>

                        <div className="space-y-2">
                          <Label>Total</Label>
                          <div className="flex items-center gap-2">
                            <Input type="text" value={`R$ ${item.valor_total.toFixed(2)}`} disabled />
                            {itensLancamento.length > 1 && <Button type="button" variant="destructive" size="sm" onClick={() => removeItem(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" placeholder="Observações adicionais..." value={formData.observacoes} onChange={e => setFormData({
                ...formData,
                observacoes: e.target.value
              })} />
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-lg font-semibold">
                  Valor Total: R$ {itensLancamento.reduce((sum, item) => sum + item.valor_total, 0).toFixed(2)}
                </span>
                <div className="space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingLancamento ? 'Atualizar' : 'Criar'} Lançamento
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lista de Lançamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lancamentos.map(lancamento => <TableRow key={lancamento.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      {format(new Date(lancamento.data_lancamento), 'dd/MM/yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">
                          {typeof lancamento.medicos === 'object' && !Array.isArray(lancamento.medicos) ? lancamento.medicos.nome : 'Nome não disponível'}
                        </div>
                        <div className="text-sm text-gray-500">
                          CRM: {typeof lancamento.medicos === 'object' && !Array.isArray(lancamento.medicos) ? lancamento.medicos.crm : 'CRM não disponível'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      {typeof lancamento.empresas === 'object' && !Array.isArray(lancamento.empresas) ? lancamento.empresas.nome : 'Empresa não disponível'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <Badge variant="outline" className="text-green-700 border-green-200">
                        R$ {lancamento.valor_total.toFixed(2)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {lancamento.observacoes || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(lancamento)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(lancamento.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>;
};
export default Lancamentos;