import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, FileText, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { DateRange } from "react-day-picker";

interface RelatorioData {
  periodo: string;
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
  
  const dadosRelatorio: RelatorioData = {
    periodo: 'Janeiro 2024',
    totalProcedimentos: 248,
    totalValor: 124500.00,
    medicosMaisAtivos: [
      { nome: 'Dr. João Silva', procedimentos: 45, valor: 22500.00 },
      { nome: 'Dra. Maria Santos', procedimentos: 38, valor: 19000.00 },
      { nome: 'Dr. Carlos Oliveira', procedimentos: 32, valor: 16000.00 },
    ],
    procedimentosMaisRealizados: [
      { nome: 'Consulta Cardiológica', quantidade: 65, valor: 9750.00 },
      { nome: 'Exame de Sangue', quantidade: 52, valor: 2600.00 },
      { nome: 'Ultrassom', quantidade: 43, valor: 12900.00 },
    ]
  };

  const handleExportarRelatorio = () => {
    // Implementar lógica de exportação
    console.log('Exportando relatório...');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
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
                Gerar Relatório
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
            <div className="text-2xl font-bold">{dadosRelatorio.totalProcedimentos}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% em relação ao mês anterior
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
              R$ {dadosRelatorio.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +8% em relação ao mês anterior
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
              R$ {(dadosRelatorio.totalValor / dadosRelatorio.totalProcedimentos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              -2% em relação ao mês anterior
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
            <div className="text-2xl font-bold">{dadosRelatorio.medicosMaisAtivos.length}</div>
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
                {dadosRelatorio.medicosMaisAtivos.map((medico, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{medico.nome}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{medico.procedimentos}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {medico.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
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
                {dadosRelatorio.procedimentosMaisRealizados.map((procedimento, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{procedimento.nome}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{procedimento.quantidade}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {procedimento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Relatorios;