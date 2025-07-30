import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Search, Calculator, FileText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Lancamento {
  id: string;
  medico_id: string;
  empresa_id: string;
  data_lancamento: string;
  observacoes: string | null;
  valor_total: number;
  created_at: string;
  medicos?: { nome: string; crm: string };
  empresas?: { nome: string };
}

interface LancamentoItem {
  id: string;
  lancamento_id: string;
  procedimento_id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  procedimentos?: { nome: string; categoria: string };
}

interface Medico {
  id: string;
  nome: string;
  crm: string;
  empresa_id: string;
}

interface Procedimento {
  id: string;
  nome: string;
  valor: number;
  categoria: string;
  empresa_id: string;
}

const Lancamentos = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<LancamentoItem[]>([]);
  const [formData, setFormData] = useState({
    medico_id: '',
    data_lancamento: new Date().toISOString().split('T')[0],
    observacoes: ''
  });

  const isAdmin = profile?.role === 'admin';
  const userEmpresaId = profile?.empresa_id;

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar lançamentos
      let lancamentosQuery = supabase
        .from('lancamentos')
        .select(`
          *,
          medicos:medico_id(nome, crm),
          empresas:empresa_id(nome)
        `)
        .order('created_at', { ascending: false });

      if (!isAdmin && userEmpresaId) {
        lancamentosQuery = lancamentosQuery.eq('empresa_id', userEmpresaId);
      }

      const { data: lancamentosData, error: lancamentosError } = await lancamentosQuery;
      if (lancamentosError) throw lancamentosError;

      // Buscar médicos
      let medicosQuery = supabase
        .from('medicos')
        .select('*')
        .eq('status', 'ativa');

      if (!isAdmin && userEmpresaId) {
        medicosQuery = medicosQuery.eq('empresa_id', userEmpresaId);
      }

      const { data: medicosData, error: medicosError } = await medicosQuery;
      if (medicosError) throw medicosError;

      // Buscar procedimentos
      let procedimentosQuery = supabase
        .from('procedimentos')
        .select('*')
        .eq('status', 'ativo');

      if (!isAdmin && userEmpresaId) {
        procedimentosQuery = procedimentosQuery.eq('empresa_id', userEmpresaId);
      }

      const { data: procedimentosData, error: procedimentosError } = await procedimentosQuery;
      if (procedimentosError) throw procedimentosError;

      setLancamentos(lancamentosData || []);
      setMedicos(medicosData || []);
      setProcedimentos(procedimentosData || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLancamentos = lancamentos.filter(lancamento =>
    lancamento.medicos?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lancamento.empresas?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lancamento.observacoes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItem = () => {
    setSelectedItems([...selectedItems, {
      id: Date.now().toString(),
      lancamento_id: '',
      procedimento_id: '',
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0
    }]);
  };

  const updateItem = (index: number, field: keyof LancamentoItem, value: any) => {
    const newItems = [...selectedItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalcular valor total do item
    if (field === 'quantidade' || field === 'valor_unitario') {
      newItems[index].valor_total = newItems[index].quantidade * newItems[index].valor_unitario;
    }

    // Atualizar procedimento selecionado
    if (field === 'procedimento_id') {
      const procedimento = procedimentos.find(p => p.id === value);
      if (procedimento) {
        newItems[index].valor_unitario = procedimento.valor;
        newItems[index].valor_total = newItems[index].quantidade * procedimento.valor;
      }
    }

    setSelectedItems(newItems);
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + item.valor_total, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um procedimento ao lançamento.",
        variant: "destructive"
      });
      return;
    }

    try {
      const medico = medicos.find(m => m.id === formData.medico_id);
      if (!medico) {
        throw new Error('Médico não encontrado');
      }

      const lancamentoData = {
        ...formData,
        empresa_id: medico.empresa_id,
        valor_total: calculateTotal(),
        created_by: profile?.user_id
      };

      const { data: lancamento, error: lancamentoError } = await supabase
        .from('lancamentos')
        .insert([lancamentoData])
        .select()
        .single();

      if (lancamentoError) throw lancamentoError;

      // Inserir itens do lançamento
      const itemsData = selectedItems.map(item => ({
        lancamento_id: lancamento.id,
        procedimento_id: item.procedimento_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total
      }));

      const { error: itemsError } = await supabase
        .from('lancamento_itens')
        .insert(itemsData);

      if (itemsError) throw itemsError;

      toast({
        title: "Lançamento criado",
        description: "O lançamento foi criado com sucesso.",
      });

      setFormData({
        medico_id: '',
        data_lancamento: new Date().toISOString().split('T')[0],
        observacoes: ''
      });
      setSelectedItems([]);
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao criar lançamento",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lançamentos</h1>
          <p className="text-muted-foreground">
            Gerencie os lançamentos de procedimentos
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Lançamento</DialogTitle>
              <DialogDescription>
                Crie um novo lançamento de procedimentos
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                
                <div className="space-y-2">
                  <Label htmlFor="data">Data do Lançamento</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data_lancamento}
                    onChange={(e) => setFormData({ ...formData, data_lancamento: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações adicionais..."
                />
              </div>

              {/* Itens do Lançamento */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg">Procedimentos</Label>
                  <Button type="button" onClick={addItem} variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Item
                  </Button>
                </div>
                
                {selectedItems.map((item, index) => (
                  <Card key={item.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="space-y-2">
                        <Label>Procedimento</Label>
                        <Select 
                          value={item.procedimento_id} 
                          onValueChange={(value) => updateItem(index, 'procedimento_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {procedimentos.map(proc => (
                              <SelectItem key={proc.id} value={proc.id}>
                                {proc.nome} - R$ {proc.valor.toFixed(2)}
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
                      
                      <div className="space-y-2">
                        <Label>Valor Unit.</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.valor_unitario}
                          onChange={(e) => updateItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex-1 text-right">
                          <Label>Total: R$ {item.valor_total.toFixed(2)}</Label>
                        </div>
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
                  </Card>
                ))}
                
                {selectedItems.length > 0 && (
                  <Card className="p-4 bg-muted">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Geral:</span>
                      <span className="text-xl font-bold text-green-600">
                        R$ {calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </Card>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Criar Lançamento
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
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por médico, empresa ou observações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Lançamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lançamentos ({filteredLancamentos.length})
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
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLancamentos.map((lancamento) => (
                  <TableRow key={lancamento.id}>
                    <TableCell>
                      {new Date(lancamento.data_lancamento).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {lancamento.medicos?.nome}
                      <br />
                      <span className="text-sm text-muted-foreground">
                        CRM: {lancamento.medicos?.crm}
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>{lancamento.empresas?.nome}</TableCell>
                    )}
                    <TableCell className="font-semibold text-green-600">
                      R$ {lancamento.valor_total.toFixed(2)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {lancamento.observacoes || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
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