
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Download, FileText, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';

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
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingProcedimento, setEditingProcedimento] = useState<Procedimento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todas');
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('todas');
  const [isImporting, setIsImporting] = useState(false);
  const [selectedImportEmpresa, setSelectedImportEmpresa] = useState<string>('');
  
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

  // Função para gerar código automático
  const generateNextCode = async (): Promise<string> => {
    const { data } = await supabase
      .from('procedimentos')
      .select('codigo')
      .not('codigo', 'is', null)
      .order('codigo', { ascending: false })
      .limit(1);
    
    let nextNumber = 1;
    if (data && data.length > 0 && data[0].codigo) {
      const lastCode = data[0].codigo;
      const match = lastCode.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }
    
    return `PROC${String(nextNumber).padStart(4, '0')}`;
  };

  // Mutation para criar/atualizar procedimento
  const procedimentoMutation = useMutation({
    mutationFn: async (procedimentoData: typeof formData & { id?: string }) => {
      let codigo = procedimentoData.codigo;
      
      // Se não há código e não está editando, gerar automaticamente
      if (!codigo && !procedimentoData.id) {
        codigo = await generateNextCode();
      }
      
      const dataToSave = {
        nome: procedimentoData.nome,
        codigo: codigo || null,
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

  // Função para baixar modelo Excel
  const downloadTemplate = () => {
    const templateData = [
      {
        'Nome do Procedimento': 'Consulta Clínica Geral',
        'Valor': 150.00,
        'Categoria': 'Consulta'
      },
      {
        'Nome do Procedimento': 'Exame de Sangue',
        'Valor': 80.50,
        'Categoria': 'Exame'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo Procedimentos');
    XLSX.writeFile(wb, 'modelo_procedimentos.xlsx');
    
    toast({
      title: "Modelo baixado!",
      description: "Use este arquivo como modelo para importar procedimentos.",
    });
  };

  // Mutation para importar procedimentos
  const importMutation = useMutation({
    mutationFn: async (data: { procedimentosData: any[], empresaId: string }) => {
      const { procedimentosData, empresaId } = data;
      
      // Gerar códigos automaticamente para cada procedimento
      const procedimentosComCodigo = [];
      for (let i = 0; i < procedimentosData.length; i++) {
        const codigo = await generateNextCode();
        procedimentosComCodigo.push({
          ...procedimentosData[i],
          codigo,
          empresa_id: empresaId || null
        });
      }
      
      const { error } = await supabase
        .from('procedimentos')
        .insert(procedimentosComCodigo);
      if (error) throw error;
      
      return procedimentosComCodigo;
    },
    onSuccess: (procedimentosImportados) => {
      queryClient.invalidateQueries({ queryKey: ['procedimentos'] });
      toast({
        title: "Importação concluída!",
        description: `${procedimentosImportados.length} procedimentos foram importados com sucesso.`,
      });
      setIsImportDialogOpen(false);
      setSelectedImportEmpresa('');
    },
    onError: (error) => {
      console.error('Error importing procedimentos:', error);
      toast({
        title: "Erro na importação",
        description: "Verifique o formato do arquivo e tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Função para processar arquivo Excel
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!selectedImportEmpresa) {
      toast({
        title: "Selecione uma empresa",
        description: "É necessário selecionar uma empresa antes de fazer a importação.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Processar e validar dados (código será gerado automaticamente)
      const procedimentosData = jsonData.map((row: any) => ({
        nome: row['Nome do Procedimento'] || row.nome,
        valor: parseFloat(row['Valor'] || row.valor) || 0,
        categoria: row['Categoria'] || row.categoria || null,
        status: 'ativo' as const
      })).filter(item => item.nome && item.valor > 0); // Filtrar apenas itens válidos

      if (procedimentosData.length === 0) {
        toast({
          title: "Arquivo inválido",
          description: "Nenhum procedimento válido encontrado no arquivo.",
          variant: "destructive"
        });
        return;
      }

      importMutation.mutate({
        procedimentosData,
        empresaId: selectedImportEmpresa
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Erro ao processar arquivo",
        description: "Verifique se o arquivo está no formato correto.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      // Limpar o input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Procedimentos</h1>
          <p className="text-muted-foreground">Gerencie os procedimentos cadastrados no sistema</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Importar Excel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Procedimentos</DialogTitle>
                <DialogDescription>
                  Faça upload de um arquivo Excel com os procedimentos para importar em lote.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="empresa-import">Empresa</Label>
                  <Select value={selectedImportEmpresa} onValueChange={setSelectedImportEmpresa}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa para os procedimentos" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map(empresa => (
                        <SelectItem key={empresa.id} value={empresa.id}>{empresa.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecione um arquivo Excel (.xlsx) com os procedimentos
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={isImporting || !selectedImportEmpresa}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label
                    htmlFor="excel-upload"
                    className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${!selectedImportEmpresa || isImporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isImporting ? 'Processando...' : 'Selecionar Arquivo'}
                  </label>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <h4 className="font-medium mb-2">Formato esperado:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Nome do Procedimento (obrigatório)</li>
                    <li>Valor (obrigatório, em números)</li>
                    <li>Categoria (opcional)</li>
                  </ul>
                  <p className="mt-2 text-xs">
                    <strong>Nota:</strong> O código será gerado automaticamente e todos os procedimentos serão associados à empresa selecionada acima.
                  </p>
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Modelo
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsImportDialogOpen(false);
                    setSelectedImportEmpresa('');
                  }}>
                    Fechar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
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
                    placeholder={editingProcedimento ? "Ex: PROC0001" : "Será gerado automaticamente se deixado vazio"}
                    disabled={!editingProcedimento}
                  />
                  {!editingProcedimento && (
                    <p className="text-xs text-muted-foreground">
                      O código será gerado automaticamente no formato PROC0001, PROC0002, etc.
                    </p>
                  )}
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
