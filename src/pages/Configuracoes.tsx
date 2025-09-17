
import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ConfiguracaoItem {
  chave: string;
  valor: string;
  descricao?: string;
  tipo: string;
}

const Configuracoes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Buscar configurações
  const { data: configuracoes = [], isLoading } = useQuery({
    queryKey: ['configuracoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*');
      
      if (error) throw error;
      return data as ConfiguracaoItem[];
    }
  });

  // Salvar configuração
  const salvarConfiguracao = useMutation({
    mutationFn: async ({ chave, valor, descricao, tipo }: ConfiguracaoItem) => {
      const { data, error } = await supabase
        .from('configuracoes')
        .upsert([{ chave, valor, descricao, tipo }], {
          onConflict: 'chave'
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] });
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar configurações",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Função para buscar valor de configuração
  const getConfigValue = (chave: string, defaultValue: string = '') => {
    const config = configuracoes.find(c => c.chave === chave);
    return config ? config.valor : defaultValue;
  };

  // Função para atualizar configuração
  const updateConfig = (chave: string, valor: string, descricao: string, tipo: string = 'string') => {
    salvarConfiguracao.mutate({ chave, valor, descricao, tipo });
  };

  const [localValues, setLocalValues] = useState({
    nomeEmpresa: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    timezone: 'America/Sao_Paulo',
    tentativasLogin: '3',
    tempoSessao: '480',
    senhaComplexidade: true,
    autenticacaoDoisFatores: false,
    logAuditoria: true,
    emailProcedimentos: true,
    emailPagamentos: true,
    emailRelatorios: false,
    pushNotifications: true,
    backupAutomatico: true,
    frequenciaBackup: 'diario',
    manterBackups: '30'
  });

  useEffect(() => {
    if (configuracoes.length > 0) {
      setLocalValues({
        nomeEmpresa: getConfigValue('sistema_nome_empresa', 'Sistema Médico'),
        cnpj: getConfigValue('sistema_cnpj', ''),
        telefone: getConfigValue('sistema_telefone', ''),
        email: getConfigValue('sistema_email', ''),
        endereco: getConfigValue('sistema_endereco', ''),
        timezone: getConfigValue('sistema_timezone', 'America/Sao_Paulo'),
        tentativasLogin: getConfigValue('seguranca_tentativas_login', '3'),
        tempoSessao: getConfigValue('seguranca_tempo_sessao', '480'),
        senhaComplexidade: getConfigValue('seguranca_senha_complexidade', 'true') === 'true',
        autenticacaoDoisFatores: getConfigValue('seguranca_2fa', 'false') === 'true',
        logAuditoria: getConfigValue('seguranca_log_auditoria', 'true') === 'true',
        emailProcedimentos: getConfigValue('notificacoes_email_procedimentos', 'true') === 'true',
        emailPagamentos: getConfigValue('notificacoes_email_pagamentos', 'true') === 'true',
        emailRelatorios: getConfigValue('notificacoes_email_relatorios', 'false') === 'true',
        pushNotifications: getConfigValue('notificacoes_push', 'true') === 'true',
        backupAutomatico: getConfigValue('backup_automatico', 'true') === 'true',
        frequenciaBackup: getConfigValue('backup_frequencia', 'diario'),
        manterBackups: getConfigValue('backup_manter_dias', '30')
      });
    }
  }, [configuracoes]);

  const handleSalvarSistema = () => {
    updateConfig('sistema_nome_empresa', localValues.nomeEmpresa, 'Nome da empresa');
    updateConfig('sistema_cnpj', localValues.cnpj, 'CNPJ da empresa');
    updateConfig('sistema_telefone', localValues.telefone, 'Telefone da empresa');
    updateConfig('sistema_email', localValues.email, 'Email da empresa');
    updateConfig('sistema_endereco', localValues.endereco, 'Endereço da empresa');
    updateConfig('sistema_timezone', localValues.timezone, 'Fuso horário do sistema');
  };

  const handleSalvarSeguranca = () => {
    updateConfig('seguranca_tentativas_login', localValues.tentativasLogin, 'Número máximo de tentativas de login', 'number');
    updateConfig('seguranca_tempo_sessao', localValues.tempoSessao, 'Tempo de sessão em minutos', 'number');
    updateConfig('seguranca_senha_complexidade', localValues.senhaComplexidade.toString(), 'Exigir senha complexa', 'boolean');
    updateConfig('seguranca_2fa', localValues.autenticacaoDoisFatores.toString(), 'Autenticação de dois fatores', 'boolean');
    updateConfig('seguranca_log_auditoria', localValues.logAuditoria.toString(), 'Log de auditoria ativo', 'boolean');
  };

  const handleSalvarNotificacoes = () => {
    updateConfig('notificacoes_email_procedimentos', localValues.emailProcedimentos.toString(), 'Notificações de procedimentos por email', 'boolean');
    updateConfig('notificacoes_email_pagamentos', localValues.emailPagamentos.toString(), 'Notificações de pagamentos por email', 'boolean');
    updateConfig('notificacoes_email_relatorios', localValues.emailRelatorios.toString(), 'Notificações de relatórios por email', 'boolean');
    updateConfig('notificacoes_push', localValues.pushNotifications.toString(), 'Notificações push ativas', 'boolean');
  };

  const handleSalvarBackup = () => {
    updateConfig('backup_automatico', localValues.backupAutomatico.toString(), 'Backup automático ativo', 'boolean');
    updateConfig('backup_frequencia', localValues.frequenciaBackup, 'Frequência do backup automático');
    updateConfig('backup_manter_dias', localValues.manterBackups, 'Dias para manter backups', 'number');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Configurações</h1>
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
                    value={localValues.nomeEmpresa}
                    onChange={(e) => setLocalValues(prev => ({ ...prev, nomeEmpresa: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={localValues.cnpj}
                    onChange={(e) => setLocalValues(prev => ({ ...prev, cnpj: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={localValues.telefone}
                    onChange={(e) => setLocalValues(prev => ({ ...prev, telefone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={localValues.email}
                    onChange={(e) => setLocalValues(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={localValues.endereco}
                  onChange={(e) => setLocalValues(prev => ({ ...prev, endereco: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Fuso Horário</Label>
                <Select value={localValues.timezone} onValueChange={(value) => setLocalValues(prev => ({ ...prev, timezone: value }))}>
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

              <Button 
                onClick={handleSalvarSistema}
                disabled={salvarConfiguracao.isPending}
              >
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
                    value={localValues.tentativasLogin}
                    onChange={(e) => setLocalValues(prev => ({ ...prev, tentativasLogin: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tempoSessao">Tempo de Sessão (minutos)</Label>
                  <Input
                    id="tempoSessao"
                    type="number"
                    min="30"
                    max="1440"
                    value={localValues.tempoSessao}
                    onChange={(e) => setLocalValues(prev => ({ ...prev, tempoSessao: e.target.value }))}
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
                    checked={localValues.senhaComplexidade}
                    onCheckedChange={(checked) => setLocalValues(prev => ({ ...prev, senhaComplexidade: checked }))}
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
                    checked={localValues.autenticacaoDoisFatores}
                    onCheckedChange={(checked) => setLocalValues(prev => ({ ...prev, autenticacaoDoisFatores: checked }))}
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
                    checked={localValues.logAuditoria}
                    onCheckedChange={(checked) => setLocalValues(prev => ({ ...prev, logAuditoria: checked }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSalvarSeguranca}
                disabled={salvarConfiguracao.isPending}
              >
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
                    checked={localValues.emailProcedimentos}
                    onCheckedChange={(checked) => setLocalValues(prev => ({ ...prev, emailProcedimentos: checked }))}
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
                    checked={localValues.emailPagamentos}
                    onCheckedChange={(checked) => setLocalValues(prev => ({ ...prev, emailPagamentos: checked }))}
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
                    checked={localValues.emailRelatorios}
                    onCheckedChange={(checked) => setLocalValues(prev => ({ ...prev, emailRelatorios: checked }))}
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
                    checked={localValues.pushNotifications}
                    onCheckedChange={(checked) => setLocalValues(prev => ({ ...prev, pushNotifications: checked }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSalvarNotificacoes}
                disabled={salvarConfiguracao.isPending}
              >
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
                  checked={localValues.backupAutomatico}
                  onCheckedChange={(checked) => setLocalValues(prev => ({ ...prev, backupAutomatico: checked }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequenciaBackup">Frequência do Backup</Label>
                  <Select value={localValues.frequenciaBackup} onValueChange={(value) => setLocalValues(prev => ({ ...prev, frequenciaBackup: value }))}>
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
                    value={localValues.manterBackups}
                    onChange={(e) => setLocalValues(prev => ({ ...prev, manterBackups: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSalvarBackup}
                  disabled={salvarConfiguracao.isPending}
                >
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
