
import React, { useState } from 'react';
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

interface Medico {
  id: string;
  nome: string;
  email: string;
  crm: string;
  especialidade: string;
  empresaId: string;
  empresaNome: string;
  status: 'ativo' | 'inativo';
  telefone: string;
  token?: string;
  isPaid?: boolean;
}

const Medicos = () => {
  const [medicos, setMedicos] = useState<Medico[]>([
    {
      id: '1',
      nome: 'Dr. João Silva',
      email: 'joao@clinica.com',
      crm: '12345-SP',
      especialidade: 'Cardiologia',
      empresaId: '1',
      empresaNome: 'Clínica São Paulo',
      status: 'ativo',
      telefone: '(11) 99999-9999',
      token: 'TOKEN123',
      isPaid: true
    },
    {
      id: '2',
      nome: 'Dra. Maria Santos',
      email: 'maria@clinica.com',
      crm: '67890-RJ',
      especialidade: 'Dermatologia',
      empresaId: '2',
      empresaNome: 'Hospital Central',
      status: 'ativo',
      telefone: '(21) 88888-8888',
      token: 'TOKEN456',
      isPaid: false
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedico, setEditingMedico] = useState<Medico | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    crm: '',
    especialidade: '',
    empresaId: '',
    telefone: '',
    token: '',
    isPaid: true
  });

  const { toast } = useToast();

  const empresas = [
    { id: '1', nome: 'Clínica São Paulo' },
    { id: '2', nome: 'Hospital Central' },
    { id: '3', nome: 'Clínica Nova Esperança' }
  ];

  const especialidades = [
    'Cardiologia', 'Dermatologia', 'Neurologia', 'Ortopedia', 
    'Pediatria', 'Ginecologia', 'Oftalmologia', 'Psiquiatria'
  ];

  const filteredMedicos = medicos.filter(medico =>
    medico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medico.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medico.crm.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const empresaSelecionada = empresas.find(emp => emp.id === formData.empresaId);
    
    if (editingMedico) {
      setMedicos(medicos.map(medico => 
        medico.id === editingMedico.id 
          ? { 
              ...medico, 
              ...formData,
              empresaNome: empresaSelecionada?.nome || '',
              status: 'ativo' as const
            }
          : medico
      ));
      toast({
        title: "Médico atualizado!",
        description: "Os dados do médico foram atualizados com sucesso.",
      });
    } else {
      const novoMedico: Medico = {
        id: Date.now().toString(),
        ...formData,
        empresaNome: empresaSelecionada?.nome || '',
        status: 'ativo'
      };
      setMedicos([...medicos, novoMedico]);
      toast({
        title: "Médico cadastrado!",
        description: "Novo médico foi adicionado ao sistema.",
      });
    }

    setFormData({
      nome: '',
      email: '',
      crm: '',
      especialidade: '',
      empresaId: '',
      telefone: '',
      token: '',
      isPaid: true
    });
    setEditingMedico(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (medico: Medico) => {
    setEditingMedico(medico);
    setFormData({
      nome: medico.nome,
      email: medico.email,
      crm: medico.crm,
      especialidade: medico.especialidade,
      empresaId: medico.empresaId,
      telefone: medico.telefone,
      token: medico.token || '',
      isPaid: medico.isPaid || false
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setMedicos(medicos.filter(medico => medico.id !== id));
    toast({
      title: "Médico removido!",
      description: "O médico foi removido do sistema.",
    });
  };

  const generateToken = () => {
    const token = 'TOKEN' + Math.random().toString(36).substr(2, 9).toUpperCase();
    setFormData({ ...formData, token });
  };

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
                    required
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
                    required
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
              </div>
              
              <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <Label className="text-primary font-medium">Controle de Acesso (Admin apenas)</Label>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Token de acesso"
                    value={formData.token}
                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                  />
                  <Button type="button" variant="outline" onClick={generateToken}>
                    Gerar Token
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPaid"
                    checked={formData.isPaid}
                    onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                    className="rounded border-primary/20"
                  />
                  <Label htmlFor="isPaid">Usuário com pagamento em dia</Label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white">
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
                  <TableHead>Status Pagamento</TableHead>
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
                        <div className="text-sm text-gray-500">{medico.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{medico.crm}</TableCell>
                    <TableCell>{medico.especialidade}</TableCell>
                    <TableCell>{medico.empresaNome}</TableCell>
                    <TableCell>
                      <Badge variant={medico.isPaid ? "default" : "destructive"}>
                        {medico.isPaid ? "Pago" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={medico.status === 'ativo' ? "default" : "secondary"}>
                        {medico.status === 'ativo' ? 'Ativo' : 'Inativo'}
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
