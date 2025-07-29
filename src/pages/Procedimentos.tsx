
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Upload, Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface Procedimento {
  id: string;
  nome: string;
  valor: number;
  empresaId: string;
  empresaNome: string;
  categoria: string;
  status: 'ativo' | 'inativo';
  createdAt: string;
}

const Procedimentos = () => {
  const { user } = useAuth();
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([
    {
      id: '1',
      nome: 'Consulta Cardiológica',
      valor: 120.00,
      empresaId: '1',
      empresaNome: 'Clínica São Paulo',
      categoria: 'Consulta',
      status: 'ativo',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      nome: 'Ecocardiograma',
      valor: 250.00,
      empresaId: '1',
      empresaNome: 'Clínica São Paulo',
      categoria: 'Exame',
      status: 'ativo',
      createdAt: '2024-01-15'
    },
    {
      id: '3',
      nome: 'Cirurgia Cardíaca',
      valor: 1500.00,
      empresaId: '2',
      empresaNome: 'Hospital Central',
      categoria: 'Cirurgia',
      status: 'ativo',
      createdAt: '2024-01-16'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingProcedimento, setEditingProcedimento] = useState<Procedimento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todas');
  const [formData, setFormData] = useState({
    nome: '',
    valor: '',
    empresaId: '',
    categoria: ''
  });

  const { toast } = useToast();

  const empresas = [
    { id: '1', nome: 'Clínica São Paulo' },
    { id: '2', nome: 'Hospital Central' },
    { id: '3', nome: 'Clínica Nova Esperança' }
  ];

  const categorias = ['Consulta', 'Exame', 'Cirurgia', 'Procedimento', 'Internação'];

  // Filtrar procedimentos baseado no usuário
  const getFilteredProcedimentos = () => {
    let filtered = procedimentos;
    
    // Se não for admin, mostrar apenas os procedimentos da empresa do usuário
    if (user?.role !== 'admin' && user?.companyId) {
      filtered = filtered.filter(proc => proc.empresaId === user.companyId);
    }

    // Aplicar filtros de busca
    if (searchTerm) {
      filtered = filtered.filter(proc =>
        proc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.empresaNome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategoria && selectedCategoria !== 'todas') {
      filtered = filtered.filter(proc => proc.categoria === selectedCategoria);
    }

    return filtered;
  };

  const filteredProcedimentos = getFilteredProcedimentos();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const empresaSelecionada = empresas.find(emp => emp.id === formData.empresaId);
    
    if (editingProcedimento) {
      setProcedimentos(procedimentos.map(proc => 
        proc.id === editingProcedimento.id 
          ? { 
              ...proc, 
              ...formData,
              valor: parseFloat(formData.valor),
              empresaNome: empresaSelecionada?.nome || '',
              status: 'ativo' as const
            }
          : proc
      ));
      toast({
        title: "Procedimento atualizado!",
        description: "Os dados do procedimento foram atualizados com sucesso.",
      });
    } else {
      const novoProcedimento: Procedimento = {
        id: Date.now().toString(),
        ...formData,
        valor: parseFloat(formData.valor),
        empresaNome: empresaSelecionada?.nome || '',
        status: 'ativo',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setProcedimentos([...procedimentos, novoProcedimento]);
      toast({
        title: "Procedimento cadastrado!",
        description: "Novo procedimento foi adicionado ao sistema.",
      });
    }

    setFormData({ nome: '', valor: '', empresaId: '', categoria: '' });
    setEditingProcedimento(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (procedimento: Procedimento) => {
    setEditingProcedimento(procedimento);
    setFormData({
      nome: procedimento.nome,
      valor: procedimento.valor.toString(),
      empresaId: procedimento.empresaId,
      categoria: procedimento.categoria
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setProcedimentos(procedimentos.filter(proc => proc.id !== id));
    toast({
      title: "Procedimento removido!",
      description: "O procedimento foi removido do sistema.",
    });
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      // Simulação de importação de CSV
      const reader = new FileReader();
      reader.onload = (event) => {
        const csv = event.target?.result as string;
        const lines = csv.split('\n').slice(1); // Remove header
        
        const importedProcedimentos: Procedimento[] = lines
          .filter(line => line.trim())
          .map((line, index) => {
            const [nome, valor, empresaId, categoria] = line.split(',');
            const empresa = empresas.find(emp => emp.id === empresaId?.trim());
            return {
              id: (Date.now() + index).toString(),
              nome: nome?.trim() || '',
              valor: parseFloat(valor?.trim() || '0'),
              empresaId: empresaId?.trim() || '',
              empresaNome: empresa?.nome || '',
              categoria: categoria?.trim() || 'Procedimento',
              status: 'ativo' as const,
              createdAt: new Date().toISOString().split('T')[0]
            };
          });

        setProcedimentos([...procedimentos, ...importedProcedimentos]);
        toast({
          title: "Importação concluída!",
          description: `${importedProcedimentos.length} procedimentos foram importados.`,
        });
        setIsImportDialogOpen(false);
      };
      reader.readAsText(file);
    }
  };

  const exportCSV = () => {
    const headers = 'Nome,Valor,Empresa,Categoria,Status,Data\n';
    const csvContent = filteredProcedimentos.map(proc => 
      `${proc.nome},${proc.valor},${proc.empresaNome},${proc.categoria},${proc.status},${proc.createdAt}`
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Procedimentos</h1>
          <p className="text-secondary">Gerencie os procedimentos cadastrados no sistema</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          
          {user?.role === 'admin' && (
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Importar CSV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-primary">Importar Procedimentos via CSV</DialogTitle>
                  <DialogDescription>
                    Faça upload de um arquivo CSV com os procedimentos. O arquivo deve conter: Nome, Valor, EmpresaId, Categoria
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="csv-file">Arquivo CSV</Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                    />
                  </div>
                  
                  <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md">
                    <p className="font-medium mb-2">Formato esperado:</p>
                    <code>Nome,Valor,EmpresaId,Categoria</code>
                    <br />
                    <code>Consulta Exemplo,100.00,1,Consulta</code>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white">
                <Plus className="mr-2 h-4 w-4" />
                Novo Procedimento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-primary">
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
                
                {user?.role === 'admin' && (
                  <div className="space-y-2">
                    <Label htmlFor="empresa">Empresa</Label>
                    <Select 
                      value={formData.empresaId} 
                      onValueChange={(value) => setFormData({ ...formData, empresaId: value })}
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
                )}
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white">
                    {editingProcedimento ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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
                  placeholder="Buscar por nome ou empresa..."
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
          </div>
        </CardContent>
      </Card>

      {/* Lista de Procedimentos */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
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
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  {user?.role === 'admin' && <TableHead>Empresa</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Data Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProcedimentos.map((procedimento) => (
                  <TableRow key={procedimento.id}>
                    <TableCell className="font-medium text-primary">
                      {procedimento.nome}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {procedimento.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      R$ {procedimento.valor.toFixed(2)}
                    </TableCell>
                    {user?.role === 'admin' && (
                      <TableCell>{procedimento.empresaNome}</TableCell>
                    )}
                    <TableCell>
                      <Badge variant={procedimento.status === 'ativo' ? "default" : "secondary"}>
                        {procedimento.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(procedimento.createdAt).toLocaleDateString('pt-BR')}
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
                        {user?.role === 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(procedimento.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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

export default Procedimentos;
