import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface Empresa {
  id: string;
  nome: string;
}

interface Medico {
  id: string;
  nome: string;
}

interface Procedimento {
  id: string;
  nome: string;
  valor: number;
}

interface LancamentoItem {
  id?: string;
  procedimento_id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

interface Lancamento {
  id: string;
  empresa_id: string;
  medico_id: string;
  paciente_nome: string;
  data_procedimento: string;
  observacoes?: string;
  valor_total?: number;
  status: 'pendente' | 'processado' | 'cancelado';
  itens: LancamentoItem[];
  empresas?: Empresa;
  medicos?: Medico;
}

interface FormData {
  empresa_id: string;
  medico_id: string;
  paciente_nome: string;
  data_procedimento: string;
  observacoes: string;
  itens: LancamentoItem[];
}

const Lancamentos = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [editingLancamento, setEditingLancamento] = useState<Lancamento | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    empresa_id: '',
    medico_id: '',
    paciente_nome: '',
    data_procedimento: new Date().toISOString().split('T')[0],
    observacoes: '',
    itens: [{
      procedimento_id: '',
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0
    }],
  });

  useEffect(() => {
    fetchLancamentos();
    fetchEmpresas();
    fetchMedicos();
    fetchProcedimentos();
  }, []);

  const fetchLancamentos = async () => {
    try {
      let query = supabase
        .from('lancamentos')
        .select(`
          *,
          empresas ( nome ),
          medicos ( nome )
        `)
        .order('data_procedimento', { ascending: false });

      if (!isAdmin) {
        query = query.eq('empresa_id', user?.empresa_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLancamentos(data || []);
    } catch (error: any) {
      console.error('Error fetching lançamentos:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar lançamentos.",
        variant: "destructive"
      });
    }
  };

  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nome');

      if (error) throw error;

      setEmpresas(data || []);
    } catch (error: any) {
      console.error('Error fetching empresas:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar empresas.",
        variant: "destructive"
      });
    }
  };

  const fetchMedicos = async () => {
    try {
      const { data, error } = await supabase
        .from('medicos')
        .select('*')
        .order('nome');

      if (error) throw error;

      setMedicos(data || []);
    } catch (error: any) {
      console.error('Error fetching medicos:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar médicos.",
        variant: "destructive"
      });
    }
  };

  const fetchProcedimentos = async () => {
    try {
      const { data, error } = await supabase
        .from('procedimentos')
        .select('*')
        .order('nome');

      if (error) throw error;

      setProcedimentos(data || []);
    } catch (error: any) {
      console.error('Error fetching procedimentos:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar procedimentos.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const valorTotal = formData.itens.reduce((sum, item) => sum + item.valor_total, 0);

      if (editingLancamento) {
        // Atualizar lançamento existente
        const { error } = await supabase
          .from('lancamentos')
          .update({
            empresa_id: formData.empresa_id,
            medico_id: formData.medico_id,
            paciente_nome: formData.paciente_nome,
            data_procedimento: formData.data_procedimento,
            observacoes: formData.observacoes,
            valor_total: valorTotal
          })
          .eq('id', editingLancamento.id);

        if (error) throw error;

        // Atualizar itens do lançamento (excluir os antigos e inserir os novos)
        await supabase
          .from('lancamento_itens')
          .delete()
          .eq('lancamento_id', editingLancamento.id);

        const itensToInsert = formData.itens.map(item => ({
          ...item,
          lancamento_id: editingLancamento.id
        }));

        const { error: itemError } = await supabase
          .from('lancamento_itens')
          .insert(itensToInsert);

        if (itemError) throw itemError;

        toast({
          title: "Lançamento atualizado",
          description: "Os dados do lançamento foram atualizados com sucesso.",
        });
      } else {
        // Criar novo lançamento
        const { data, error } = await supabase
          .from('lancamentos')
          .insert([{
            empresa_id: formData.empresa_id,
            medico_id: formData.medico_id,
            paciente_nome: formData.paciente_nome,
            data_procedimento: formData.data_procedimento,
            observacoes: formData.observacoes,
            valor_total: valorTotal,
            status: 'pendente'
          }])
          .select()

        if (error) throw error;

        const newLancamento = data && data[0];

        // Criar itens do lançamento
        const itensToInsert = formData.itens.map(item => ({
          ...item,
          lancamento_id: newLancamento.id
        }));

        const { error: itemError } = await supabase
          .from('lancamento_itens')
          .insert(itensToInsert);

        if (itemError) throw itemError;

        toast({
          title: "Lançamento cadastrado",
          description: "Novo lançamento foi cadastrado com sucesso.",
        });
      }

      fetchLancamentos();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving lancamento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar lançamento.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      itens: [...formData.itens, {
        procedimento_id: '',
        quantidade: 1,
        valor_unitario: 0,
        valor_total: 0
      }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = [...formData.itens];
    newItems.splice(index, 1);
    setFormData({ ...formData, itens: newItems });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.itens];
    
    if (field === 'procedimento_id') {
      const selectedProcedimento = procedimentos.find(p => p.id === value);
      newItems[index] = {
        ...newItems[index],
        procedimento_id: value,
        valor_unitario: selectedProcedimento?.valor || 0,
        valor_total: newItems[index].quantidade * (selectedProcedimento?.valor || 0)
      };
    } else if (field === 'quantidade') {
      const quantidade = parseInt(value, 10) || 1;
      newItems[index] = {
        ...newItems[index],
        quantidade: quantidade,
        valor_total: quantidade * newItems[index].valor_unitario
      };
    } else if (field === 'valor_unitario') {
      const valorUnitario = parseFloat(value) || 0;
      newItems[index] = {
        ...newItems[index],
        valor_unitario: valorUnitario,
        valor_total: newItems[index].quantidade * valorUnitario
      };
    }

    setFormData({ ...formData, itens: newItems });
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lancamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Lançamento excluído",
        description: "Lançamento foi excluído com sucesso.",
      });

      fetchLancamentos();
    } catch (error: any) {
      console.error('Error deleting lancamento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir lançamento.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Lançamentos</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingLancamento(null)}>
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
                {editingLancamento 
                  ? 'Atualize as informações do lançamento.' 
                  : 'Preencha os dados para cadastrar um novo lançamento.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="empresa_id">Empresa</Label>
                  <Select 
                    value={formData.empresa_id} 
                    onValueChange={(value) => setFormData({...formData, empresa_id: value})}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa" />
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
                <div className="space-y-2">
                  <Label htmlFor="medico_id">Médico</Label>
                  <Select 
                    value={formData.medico_id} 
                    onValueChange={(value) => setFormData({...formData, medico_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um médico" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicos.map((medico) => (
                        <SelectItem key={medico.id} value={medico.id}>
                          {medico.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paciente_nome">Nome do Paciente</Label>
                  <Input
                    id="paciente_nome"
                    value={formData.paciente_nome}
                    onChange={(e) => setFormData({...formData, paciente_nome: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_procedimento">Data do Procedimento</Label>
                  <Input
                    id="data_procedimento"
                    type="date"
                    value={formData.data_procedimento}
                    onChange={(e) => setFormData({...formData, data_procedimento: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Procedimentos</Label>
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Procedimento
                  </Button>
                </div>
                
                {formData.itens.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-4 border rounded">
                    <div className="col-span-5">
                      <Label>Procedimento</Label>
                      <Select 
                        value={item.procedimento_id} 
                        onValueChange={(value) => updateItem(index, 'procedimento_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um procedimento" />
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
                    <div className="col-span-2">
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => updateItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Valor Unit.</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.valor_unitario}
                        onChange={(e) => updateItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Total</Label>
                      <Input
                        type="text"
                        value={`R$ ${item.valor_total.toFixed(2)}`}
                        disabled
                      />
                    </div>
                    <div className="col-span-1">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="text-right">
                  <Label className="text-lg font-semibold">
                    Total Geral: R$ {formData.itens.reduce((sum, item) => sum + item.valor_total, 0).toFixed(2)}
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : (editingLancamento ? 'Atualizar' : 'Cadastrar')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lançamentos Cadastrados</CardTitle>
          <CardDescription>
            Lista de todos os lançamentos de procedimentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancamentos.map((lancamento) => (
                  <TableRow key={lancamento.id}>
                    <TableCell>
                      {new Date(lancamento.data_procedimento).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{lancamento.paciente_nome}</TableCell>
                    <TableCell>{lancamento.empresas?.nome}</TableCell>
                    <TableCell>{lancamento.medicos?.nome}</TableCell>
                    <TableCell>R$ {lancamento.valor_total?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        lancamento.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                        lancamento.status === 'processado' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {lancamento.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingLancamento(lancamento);
                            setFormData({
                              empresa_id: lancamento.empresa_id,
                              medico_id: lancamento.medico_id,
                              paciente_nome: lancamento.paciente_nome,
                              data_procedimento: lancamento.data_procedimento,
                              observacoes: lancamento.observacoes || '',
                              itens: []
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(lancamento.id)}
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

export default Lancamentos;
