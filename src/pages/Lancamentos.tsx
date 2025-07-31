
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Save, Edit, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  codigo: string;
  valor: number;
}

interface LancamentoItem {
  id?: string;
  procedimento_id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  procedimento?: Procedimento;
}

interface Lancamento {
  id: string;
  data_lancamento: string;
  empresa_id: string;
  medico_id: string;
  observacoes: string | null;
  valor_total: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  empresas?: { nome: string };
  medicos?: { nome: string; crm: string };
  lancamento_itens?: LancamentoItem[];
}

const Lancamentos = () => {
  const { user, profile, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLancamento, setEditingLancamento] = useState<Lancamento | null>(null);
  const [viewingLancamento, setViewingLancamento] = useState<Lancamento | null>(null);

  const [formData, setFormData] = useState({
    data_lancamento: new Date().toISOString().split('T')[0],
    empresa_id: profile?.empresa_id || '',
    medico_id: '',
    observacoes: '',
  });

  const [itens, setItens] = useState<LancamentoItem[]>([]);

  useEffect(() => {
    if (user && profile) {
      fetchData();
    }
  }, [user, profile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchLancamentos(),
        fetchEmpresas(),
        fetchMedicos(),
        fetchProcedimentos()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLancamentos = async () => {
    try {
      let query = supabase
        .from('lancamentos')
        .select(`
          *,
          empresas!fk_lancamentos_empresa(nome),
          medicos!fk_lancamentos_medico(nome, crm)
        `)
        .order('created_at', { ascending: false });

      // Se não é admin, filtrar apenas pela empresa do usuário
      if (!isAdmin && profile?.empresa_id) {
        query = query.eq('empresa_id', profile.empresa_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLancamentos(data || []);
    } catch (error) {
      console.error('Error fetching lancamentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lançamentos.",
        variant: "destructive"
      });
    }
  };

  const fetchEmpresas = async () => {
    try {
      let query = supabase
        .from('empresas')
        .select('id, nome')
        .eq('status', 'ativa')
        .order('nome');

      // Se não é admin, filtrar apenas pela empresa do usuário
      if (!isAdmin && profile?.empresa_id) {
        query = query.eq('id', profile.empresa_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      setEmpresas(data || []);
    } catch (error) {
      console.error('Error fetching empresas:', error);
    }
  };

  const fetchMedicos = async () => {
    try {
      let query = supabase
        .from('medicos')
        .select('id, nome, crm')
        .eq('status', 'ativa')
        .order('nome');

      // Se não é admin, filtrar apenas médicos da empresa do usuário
      if (!isAdmin && profile?.empresa_id) {
        query = query.eq('empresa_id', profile.empresa_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      setMedicos(data || []);
    } catch (error) {
      console.error('Error fetching medicos:', error);
    }
  };

  const fetchProcedimentos = async () => {
    try {
      let query = supabase
        .from('procedimentos')
        .select('id, nome, codigo, valor')
        .eq('status', 'ativo')
        .order('nome');

      // Se não é admin, filtrar apenas procedimentos da empresa do usuário
      if (!isAdmin && profile?.empresa_id) {
        query = query.eq('empresa_id', profile.empresa_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      setProcedimentos(data || []);
    } catch (error) {
      console.error('Error fetching procedimentos:', error);
    }
  };

  const fetchLancamentoItens = async (lancamentoId: string) => {
    try {
      const { data, error } = await supabase
        .from('lancamento_itens')
        .select(`
          *,
          procedimentos!fk_lancamento_itens_procedimento(nome, codigo, valor)
        `)
        .eq('lancamento_id', lancamentoId);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching lancamento itens:', error);
      return [];
    }
  };

  const addItem = () => {
    setItens([...itens, {
      procedimento_id: '',
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0
    }]);
  };

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof LancamentoItem, value: any) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };

    if (field === 'procedimento_id') {
      const procedimento = procedimentos.find(p => p.id === value);
      if (procedimento) {
        newItens[index].valor_unitario = procedimento.valor;
        newItens[index].valor_total = procedimento.valor * newItens[index].quantidade;
      }
    }

    if (field === 'quantidade' || field === 'valor_unitario') {
      newItens[index].valor_total = newItens[index].quantidade * newItens[index].valor_unitario;
    }

    setItens(newItens);
  };

  const resetForm = () => {
    setFormData({
      data_lancamento: new Date().toISOString().split('T')[0],
      empresa_id: profile?.empresa_id || '',
      medico_id: '',
      observacoes: '',
    });
    setItens([]);
    setEditingLancamento(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive"
      });
      return;
    }

    if (itens.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao lançamento.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const valorTotal = itens.reduce((sum, item) => sum + item.valor_total, 0);

      if (editingLancamento) {
        // Atualizar lançamento existente
        const { error: lancamentoError } = await supabase
          .from('lancamentos')
          .update({
            data_lancamento: formData.data_lancamento,
            empresa_id: formData.empresa_id,
            medico_id: formData.medico_id,
            observacoes: formData.observacoes,
            valor_total: valorTotal
          })
          .eq('id', editingLancamento.id);

        if (lancamentoError) throw lancamentoError;

        // Remover itens antigos
        const { error: deleteError } = await supabase
          .from('lancamento_itens')
          .delete()
          .eq('lancamento_id', editingLancamento.id);

        if (deleteError) throw deleteError;

        // Inserir novos itens
        const { error: itensError } = await supabase
          .from('lancamento_itens')
          .insert(
            itens.map(item => ({
              lancamento_id: editingLancamento.id,
              procedimento_id: item.procedimento_id,
              quantidade: item.quantidade,
              valor_unitario: item.valor_unitario,
              valor_total: item.valor_total
            }))
          );

        if (itensError) throw itensError;

        toast({
          title: "Sucesso",
          description: "Lançamento atualizado com sucesso."
        });
      } else {
        // Criar novo lançamento
        const { data: lancamentoData, error: lancamentoError } = await supabase
          .from('lancamentos')
          .insert([{
            data_lancamento: formData.data_lancamento,
            empresa_id: formData.empresa_id,
            medico_id: formData.medico_id,
            observacoes: formData.observacoes,
            valor_total: valorTotal,
            created_by: profile.id
          }])
          .select()
          .single();

        if (lancamentoError) throw lancamentoError;

        // Inserir itens
        const { error: itensError } = await supabase
          .from('lancamento_itens')
          .insert(
            itens.map(item => ({
              lancamento_id: lancamentoData.id,
              procedimento_id: item.procedimento_id,
              quantidade: item.quantidade,
              valor_unitario: item.valor_unitario,
              valor_total: item.valor_total
            }))
          );

        if (itensError) throw itensError;

        toast({
          title: "Sucesso",
          description: "Lançamento cadastrado com sucesso."
        });
      }

      setShowForm(false);
      resetForm();
      fetchLancamentos();
    } catch (error: any) {
      console.error('Error saving lancamento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar lançamento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (lancamento: Lancamento) => {
    setFormData({
      data_lancamento: lancamento.data_lancamento,
      empresa_id: lancamento.empresa_id,
      medico_id: lancamento.medico_id,
      observacoes: lancamento.observacoes || '',
    });

    const itensData = await fetchLancamentoItens(lancamento.id);
    setItens(itensData.map(item => ({
      procedimento_id: item.procedimento_id,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      valor_total: item.valor_total
    })));

    setEditingLancamento(lancamento);
    setShowForm(true);
  };

  const handleView = async (lancamento: Lancamento) => {
    const itensData = await fetchLancamentoItens(lancamento.id);
    const lancamentoCompleto = {
      ...lancamento,
      lancamento_itens: itensData
    };
    setViewingLancamento(lancamentoCompleto);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);

      // Primeiro deletar os itens
      const { error: itensError } = await supabase
        .from('lancamento_itens')
        .delete()
        .eq('lancamento_id', id);

      if (itensError) throw itensError;

      // Depois deletar o lançamento
      const { error: lancamentoError } = await supabase
        .from('lancamentos')
        .delete()
        .eq('id', id);

      if (lancamentoError) throw lancamentoError;

      toast({
        title: "Sucesso",
        description: "Lançamento excluído com sucesso."
      });

      fetchLancamentos();
    } catch (error: any) {
      console.error('Error deleting lancamento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir lançamento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lançamentos</h2>
          <p className="text-muted-foreground">
            Gerencie os lançamentos de procedimentos médicos.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lançamento
        </Button>
      </div>

      <div className="grid gap-4">
        {lancamentos.map((lancamento) => (
          <Card key={lancamento.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {new Date(lancamento.data_lancamento).toLocaleDateString('pt-BR')}
                  </CardTitle>
                  <CardDescription>
                    Empresa: {lancamento.empresas?.nome} | 
                    Médico: Dr. {lancamento.medicos?.nome} ({lancamento.medicos?.crm})
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(lancamento)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(lancamento)}
                  >
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
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O lançamento e todos os seus itens serão excluídos permanentemente.
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
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {lancamento.observacoes && `Obs: ${lancamento.observacoes}`}
                </p>
                <p className="font-semibold text-lg">
                  {formatCurrency(lancamento.valor_total)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {lancamentos.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Nenhum lançamento encontrado.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Formulário */}
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              {editingLancamento ? 'Editar Lançamento' : 'Novo Lançamento'}
            </DialogTitle>
            <DialogDescription>
              {editingLancamento ? 'Atualize as informações do lançamento.' : 'Preencha os dados para criar um novo lançamento.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data do Lançamento</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data_lancamento}
                  onChange={(e) => setFormData({...formData, data_lancamento: e.target.value})}
                  required
                />
              </div>
              
              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Select value={formData.empresa_id} onValueChange={(value) => setFormData({...formData, empresa_id: value})}>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="medico">Médico</Label>
              <Select value={formData.medico_id} onValueChange={(value) => setFormData({...formData, medico_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o médico" />
                </SelectTrigger>
                <SelectContent>
                  {medicos.map((medico) => (
                    <SelectItem key={medico.id} value={medico.id}>
                      Dr. {medico.nome} - {medico.crm}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                rows={3}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">Itens do Lançamento</Label>
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Item
                </Button>
              </div>

              {itens.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Item {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Procedimento</Label>
                      <Select
                        value={item.procedimento_id}
                        onValueChange={(value) => updateItem(index, 'procedimento_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o procedimento" />
                        </SelectTrigger>
                        <SelectContent>
                          {procedimentos.map((procedimento) => (
                            <SelectItem key={procedimento.id} value={procedimento.id}>
                              {procedimento.codigo ? `${procedimento.codigo} - ` : ''}{procedimento.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => updateItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor Unitário</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.valor_unitario}
                        onChange={(e) => updateItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Valor Total</Label>
                      <Input
                        type="text"
                        value={formatCurrency(item.valor_total)}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {itens.length > 0 && (
                <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      Total Geral: {formatCurrency(itens.reduce((sum, item) => sum + item.valor_total, 0))}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || itens.length === 0}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Salvando...' : (editingLancamento ? 'Atualizar' : 'Salvar')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização */}
      <Dialog open={!!viewingLancamento} onOpenChange={() => setViewingLancamento(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Lançamento</DialogTitle>
          </DialogHeader>
          
          {viewingLancamento && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Data</Label>
                  <p>{new Date(viewingLancamento.data_lancamento).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <Label className="font-semibold">Empresa</Label>
                  <p>{viewingLancamento.empresas?.nome}</p>
                </div>
              </div>
              
              <div>
                <Label className="font-semibold">Médico</Label>
                <p>Dr. {viewingLancamento.medicos?.nome} - {viewingLancamento.medicos?.crm}</p>
              </div>
              
              {viewingLancamento.observacoes && (
                <div>
                  <Label className="font-semibold">Observações</Label>
                  <p>{viewingLancamento.observacoes}</p>
                </div>
              )}
              
              <Separator />
              
              <div>
                <Label className="font-semibold mb-2 block">Itens</Label>
                <div className="space-y-2">
                  {viewingLancamento.lancamento_itens?.map((item, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {item.procedimento?.codigo ? `${item.procedimento.codigo} - ` : ''}
                            {item.procedimento?.nome}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Qtd: {item.quantidade} x {formatCurrency(item.valor_unitario)}
                          </p>
                        </div>
                        <p className="font-semibold">{formatCurrency(item.valor_total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">Total Geral:</span>
                    <span className="font-semibold text-lg">{formatCurrency(viewingLancamento.valor_total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Lancamentos;
