import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Settings, Shield, Bell, Database, Mail, Globe } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const Configuracoes = () => {
  const { toast } = useToast();
  
  const [configuracoes, setConfiguracoes] = useState({
    sistema: {
      nomeEmpresa: 'Sistema Médico',
      cnpj: '12.345.678/0001-90',
      telefone: '(11) 3456-7890',
      email: 'contato@sistemamedico.com.br',
      endereco: 'Rua das Flores, 123 - São Paulo/SP',
      timezone: 'America/Sao_Paulo'
    },
    seguranca: {
      tentativasLogin: 3,
      tempoSessao: 480, // em minutos
      senhaComplexidade: true,
      autenticacaoDoisFatores: false,
      logAuditoria: true
    },
    notificacoes: {
      emailProcedimentos: true,
      emailPagamentos: true,
      emailRelatorios: false,
      pushNotifications: true
    },
    backup: {
      backupAutomatico: true,
      frequenciaBackup: 'diario',
      manterBackups: 30 // dias
    }
  });

  const handleSalvar = (categoria: string, dados: any) => {
    setConfiguracoes(prev => ({
      ...prev,
      [categoria]: { ...prev[categoria as keyof typeof prev], ...dados }
    }));
    
    toast({
      title: "Configurações salvas",
      description: "As configurações foram atualizadas com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="sistema" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="sistema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>
                Informações básicas e configurações gerais do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
                  <Input
                    id="nomeEmpresa"
                    value={configuracoes.sistema.nomeEmpresa}
                    onChange={(e) => setConfiguracoes(prev => ({
                      ...prev,
                      sistema: { ...prev.sistema, nomeEmpresa: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={configuracoes.sistema.cnpj}
                    onChange={(e) => setConfiguracoes(prev => ({
                      ...prev,
                      sistema: { ...prev.sistema, cnpj: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={configuracoes.sistema.telefone}
                    onChange={(e) => setConfiguracoes(prev => ({
                      ...prev,
                      sistema: { ...prev.sistema, telefone: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={configuracoes.sistema.email}
                    onChange={(e) => setConfiguracoes(prev => ({
                      ...prev,
                      sistema: { ...prev.sistema, email: e.target.value }
                    }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={configuracoes.sistema.endereco}
                  onChange={(e) => setConfiguracoes(prev => ({
                    ...prev,
                    sistema: { ...prev.sistema, endereco: e.target.value }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Fuso Horário</Label>
                <Select value={configuracoes.sistema.timezone} onValueChange={(value) => setConfiguracoes(prev => ({
                  ...prev,
                  sistema: { ...prev.sistema, timezone: value }
                }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                    <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                    <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => handleSalvar('sistema', configuracoes.sistema)}>
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configurações de Segurança
              </CardTitle>
              <CardDescription>
                Defina políticas de segurança e acesso ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tentativasLogin">Tentativas de Login</Label>
                  <Input
                    id="tentativasLogin"
                    type="number"
                    min="1"
                    max="10"
                    value={configuracoes.seguranca.tentativasLogin}
                    onChange={(e) => setConfiguracoes(prev => ({
                      ...prev,
                      seguranca: { ...prev.seguranca, tentativasLogin: parseInt(e.target.value) }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tempoSessao">Tempo de Sessão (minutos)</Label>
                  <Input
                    id="tempoSessao"
                    type="number"
                    min="30"
                    max="1440"
                    value={configuracoes.seguranca.tempoSessao}
                    onChange={(e) => setConfiguracoes(prev => ({
                      ...prev,
                      seguranca: { ...prev.seguranca, tempoSessao: parseInt(e.target.value) }
                    }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="senhaComplexidade">Senha Complexa</Label>
                    <p className="text-sm text-muted-foreground">
                      Exigir senhas com pelo menos 8 caracteres, maiúsculas, minúsculas e números
                    </p>
                  </div>
                  <Switch
                    id="senhaComplexidade"
                    checked={configuracoes.seguranca.senhaComplexidade}
                    onCheckedChange={(checked) => setConfiguracoes(prev => ({
                      ...prev,
                      seguranca: { ...prev.seguranca, senhaComplexidade: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autenticacaoDoisFatores">Autenticação de Dois Fatores</Label>
                    <p className="text-sm text-muted-foreground">
                      Exigir código adicional por SMS ou aplicativo
                    </p>
                  </div>
                  <Switch
                    id="autenticacaoDoisFatores"
                    checked={configuracoes.seguranca.autenticacaoDoisFatores}
                    onCheckedChange={(checked) => setConfiguracoes(prev => ({
                      ...prev,
                      seguranca: { ...prev.seguranca, autenticacaoDoisFatores: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="logAuditoria">Log de Auditoria</Label>
                    <p className="text-sm text-muted-foreground">
                      Registrar todas as ações dos usuários no sistema
                    </p>
                  </div>
                  <Switch
                    id="logAuditoria"
                    checked={configuracoes.seguranca.logAuditoria}
                    onCheckedChange={(checked) => setConfiguracoes(prev => ({
                      ...prev,
                      seguranca: { ...prev.seguranca, logAuditoria: checked }
                    }))}
                  />
                </div>
              </div>

              <Button onClick={() => handleSalvar('seguranca', configuracoes.seguranca)}>
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configurações de Notificações
              </CardTitle>
              <CardDescription>
                Configure quando e como receber notificações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailProcedimentos">E-mail de Procedimentos</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações por e-mail sobre novos procedimentos
                    </p>
                  </div>
                  <Switch
                    id="emailProcedimentos"
                    checked={configuracoes.notificacoes.emailProcedimentos}
                    onCheckedChange={(checked) => setConfiguracoes(prev => ({
                      ...prev,
                      notificacoes: { ...prev.notificacoes, emailProcedimentos: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailPagamentos">E-mail de Pagamentos</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações sobre pagamentos e cobranças
                    </p>
                  </div>
                  <Switch
                    id="emailPagamentos"
                    checked={configuracoes.notificacoes.emailPagamentos}
                    onCheckedChange={(checked) => setConfiguracoes(prev => ({
                      ...prev,
                      notificacoes: { ...prev.notificacoes, emailPagamentos: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailRelatorios">E-mail de Relatórios</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber relatórios periódicos por e-mail
                    </p>
                  </div>
                  <Switch
                    id="emailRelatorios"
                    checked={configuracoes.notificacoes.emailRelatorios}
                    onCheckedChange={(checked) => setConfiguracoes(prev => ({
                      ...prev,
                      notificacoes: { ...prev.notificacoes, emailRelatorios: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="pushNotifications">Notificações Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações instantâneas no navegador
                    </p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={configuracoes.notificacoes.pushNotifications}
                    onCheckedChange={(checked) => setConfiguracoes(prev => ({
                      ...prev,
                      notificacoes: { ...prev.notificacoes, pushNotifications: checked }
                    }))}
                  />
                </div>
              </div>

              <Button onClick={() => handleSalvar('notificacoes', configuracoes.notificacoes)}>
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Configurações de Backup
              </CardTitle>
              <CardDescription>
                Configure backups automáticos e restauração de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="backupAutomatico">Backup Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Realizar backups automáticos dos dados do sistema
                  </p>
                </div>
                <Switch
                  id="backupAutomatico"
                  checked={configuracoes.backup.backupAutomatico}
                  onCheckedChange={(checked) => setConfiguracoes(prev => ({
                    ...prev,
                    backup: { ...prev.backup, backupAutomatico: checked }
                  }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequenciaBackup">Frequência do Backup</Label>
                  <Select value={configuracoes.backup.frequenciaBackup} onValueChange={(value) => setConfiguracoes(prev => ({
                    ...prev,
                    backup: { ...prev.backup, frequenciaBackup: value }
                  }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diario">Diário</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manterBackups">Manter Backups (dias)</Label>
                  <Input
                    id="manterBackups"
                    type="number"
                    min="7"
                    max="365"
                    value={configuracoes.backup.manterBackups}
                    onChange={(e) => setConfiguracoes(prev => ({
                      ...prev,
                      backup: { ...prev.backup, manterBackups: parseInt(e.target.value) }
                    }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleSalvar('backup', configuracoes.backup)}>
                  Salvar Configurações
                </Button>
                <Button variant="outline">
                  Fazer Backup Agora
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuracoes;