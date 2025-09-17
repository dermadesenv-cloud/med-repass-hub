
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, FileText, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { DateRange } from "react-day-picker";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RelatorioData {
  totalProcedimentos: number;
  totalValor: number;
  medicosMaisAtivos: Array<{
    nome: string;
    procedimentos: number;
    valor: number;
  }>;
  procedimentosMaisRealizados: Array<{
    nome: string;
    quantidade: number;
    valor: number;
  }>;
}

const Relatorios = () => {
  const [tipoRelatorio, setTipoRelatorio] = useState('procedimentos');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // Buscar dados dos relatórios
  const { data: relatorioData, isLoading } = useQuery({
    queryKey: ['relatorios', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('lancamentos')
        .select(`
          *,
          lancamento_itens (
            quantidade,
            valor_unitario,
            valor_total,
            procedimentos (
              nome
            )
          ),
          medicos (
            nome
          )
        `);

      if (dateRange?.from) {
        query = query.gte('data_lancamento', dateRange.from.toISOString().split('T')[0]);
      }
      if (dateRange?.to) {
        query = query.lte('data_lancamento', dateRange.to.toISOString().split('T')[0]);
      }

      const { data: lancamentos, error } = await query;
      
      if (error) throw error;

      // Processar dados para relatório
      const totalProcedimentos = lancamentos?.reduce((sum, l) => sum + (l.lancamento_itens?.length || 0), 0) || 0;
      const totalValor = lancamentos?.reduce((sum, l) => sum + Number(l.valor_total || 0), 0) || 0;

      // Médicos mais ativos
      const medicoStats = new Map();
      lancamentos?.forEach(lancamento => {
        const medico = lancamento.medicos?.nome;
        if (medico) {
          const current = medicoStats.get(medico) || { nome: medico, procedimentos: 0, valor: 0 };
          current.procedimentos += lancamento.lancamento_itens?.length || 0;
          current.valor += Number(lancamento.valor_total || 0);
          medicoStats.set(medico, current);
        }
      });

      const medicosMaisAtivos = Array.from(medicoStats.values())
        .sort((a, b) => b.procedimentos - a.procedimentos)
        .slice(0, 5);

      // Procedimentos mais realizados
      const procedimentoStats = new Map();
      lancamentos?.forEach(lancamento => {
        lancamento.lancamento_itens?.forEach((item: any) => {
          const nome = item.procedimentos?.nome;
          if (nome) {
            const current = procedimentoStats.get(nome) || { nome, quantidade: 0, valor: 0 };
            current.quantidade += item.quantidade;
            current.valor += Number(item.valor_total || 0);
            procedimentoStats.set(nome, current);
          }
        });
      });

      const procedimentosMaisRealizados = Array.from(procedimentoStats.values())
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);

      return {
        totalProcedimentos,
        totalValor,
        medicosMaisAtivos,
        procedimentosMaisRealizados
      } as RelatorioData;
    }
  });

  const handleExportarRelatorio = () => {
    // Implementar lógica de exportação
    console.log('Exportando relatório...');
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Carregando relatórios...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Relatórios</h1>
          <p className="text-muted-foreground">
            Visualize estatísticas e gere relatórios do sistema
          </p>
        </div>
        <Button onClick={handleExportarRelatorio}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Filtros de Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Relatório</label>
              <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="procedimentos">Procedimentos</SelectItem>
                  <SelectItem value="medicos">Médicos</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="empresas">Empresas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            
            <div className="flex items-end">
              <Button className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Atualizar Relatório
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Procedimentos
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{relatorioData?.totalProcedimentos || 0}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Procedimentos realizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(relatorioData?.totalValor || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Valor total dos lançamentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Média por Procedimento
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                relatorioData?.totalProcedimentos 
                  ? (relatorioData.totalValor / relatorioData.totalProcedimentos) 
                  : 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor médio por procedimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Médicos Ativos
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{relatorioData?.medicosMaisAtivos.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Médicos com procedimentos no período
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Médicos Mais Ativos */}
        <Card>
          <CardHeader>
            <CardTitle>Médicos Mais Ativos</CardTitle>
            <CardDescription>
              Ranking dos médicos com mais procedimentos realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Médico</TableHead>
                  <TableHead className="text-center">Procedimentos</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatorioData?.medicosMaisAtivos.map((medico, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{medico.nome}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{medico.procedimentos}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(medico.valor)}
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nenhum dado encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Procedimentos Mais Realizados */}
        <Card>
          <CardHeader>
            <CardTitle>Procedimentos Mais Realizados</CardTitle>
            <CardDescription>
              Os procedimentos com maior volume no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Procedimento</TableHead>
                  <TableHead className="text-center">Quantidade</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatorioData?.procedimentosMaisRealizados.map((procedimento, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{procedimento.nome}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{procedimento.quantidade}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(procedimento.valor)}
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nenhum dado encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Relatorios;
