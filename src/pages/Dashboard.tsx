
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { CalendarIcon, TrendingUp, Users, FileText, DollarSign, Activity } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
  const [selectedPeriod, setSelectedPeriod] = useState('mes');
  const { user } = useAuth();

  // Função para obter as datas baseadas no período selecionado
  const getDateRange = () => {
    const today = new Date();
    switch (selectedPeriod) {
      case 'dia':
        return { start: startOfDay(today), end: endOfDay(today) };
      case 'mes':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      default:
        return { start: startOfDay(today), end: endOfDay(today) };
    }
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Query para contagem de procedimentos hoje
  const { data: todayStats } = useQuery({
    queryKey: ['dashboard-today-stats', startOfDay(new Date()).toISOString()],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const tomorrow = endOfDay(new Date());
      
      const { data, error } = await supabase
        .from('lancamentos')
        .select('valor_total')
        .gte('data_lancamento', today.toISOString().split('T')[0])
        .lte('data_lancamento', tomorrow.toISOString().split('T')[0]);

      if (error) throw error;

      return {
        count: data?.length || 0,
        total: data?.reduce((sum, item) => sum + Number(item.valor_total || 0), 0) || 0
      };
    },
    enabled: !!user
  });

  // Query para contagem de procedimentos do mês
  const { data: monthStats } = useQuery({
    queryKey: ['dashboard-month-stats', startOfMonth(new Date()).toISOString()],
    queryFn: async () => {
      const startMonth = startOfMonth(new Date());
      const endMonth = endOfMonth(new Date());
      
      const { data, error } = await supabase
        .from('lancamentos')
        .select('valor_total')
        .gte('data_lancamento', startMonth.toISOString().split('T')[0])
        .lte('data_lancamento', endMonth.toISOString().split('T')[0]);

      if (error) throw error;

      return {
        count: data?.length || 0,
        total: data?.reduce((sum, item) => sum + Number(item.valor_total || 0), 0) || 0
      };
    },
    enabled: !!user
  });

  // Query para dados de procedimentos por tipo (baseado em lançamentos reais)
  const { data: procedureData = [] } = useQuery({
    queryKey: ['dashboard-procedure-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lancamento_itens')
        .select(`
          quantidade,
          valor_total,
          procedimentos (nome, categoria)
        `);

      if (error) throw error;

      // Agrupar por categoria de procedimento
      const grouped = data?.reduce((acc: any, item: any) => {
        const categoria = item.procedimentos?.categoria || 'Outros';
        if (!acc[categoria]) {
          acc[categoria] = { name: categoria, value: 0, revenue: 0 };
        }
        acc[categoria].value += item.quantidade || 0;
        acc[categoria].revenue += Number(item.valor_total || 0);
        return acc;
      }, {});

      return Object.values(grouped || {});
    },
    enabled: !!user
  });

  const COLORS = ['hsl(210, 100%, 70%)', 'hsl(280, 50%, 70%)', 'hsl(240, 60%, 75%)', 'hsl(200, 80%, 75%)'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
          <p className="text-secondary">Visão geral dos seus procedimentos e finanças</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dia">Hoje</SelectItem>
              <SelectItem value="semana">Semana</SelectItem>
              <SelectItem value="mes">Mês</SelectItem>
              <SelectItem value="ano">Ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="border-primary/20">
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateRange.from}
                onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-primary to-primary-dark text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procedimentos Hoje</CardTitle>
            <Activity className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats?.count || 0}</div>
            <p className="text-xs opacity-80">Procedimentos realizados hoje</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-secondary to-secondary-dark text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Hoje</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayStats?.total || 0)}</div>
            <p className="text-xs opacity-80">Receita gerada hoje</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-accent to-primary text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procedimentos Mês</CardTitle>
            <FileText className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthStats?.count || 0}</div>
            <p className="text-xs opacity-80">Procedimentos realizados este mês</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-primary-dark to-secondary text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mês</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthStats?.total || 0)}</div>
            <p className="text-xs opacity-80">Receita gerada este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary">Procedimentos por Tipo</CardTitle>
            <CardDescription>Distribuição dos procedimentos realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={procedureData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {procedureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary">Resumo de Dados</CardTitle>
            <CardDescription>Informações gerais do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                <span className="text-sm font-medium">Total de Procedimentos Registrados</span>
                <span className="text-lg font-bold text-primary">{monthStats?.count || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-secondary/5 rounded-lg">
                <span className="text-sm font-medium">Receita Total do Mês</span>
                <span className="text-lg font-bold text-secondary">{formatCurrency(monthStats?.total || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-accent/5 rounded-lg">
                <span className="text-sm font-medium">Procedimentos Hoje</span>
                <span className="text-lg font-bold text-accent">{todayStats?.count || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                <span className="text-sm font-medium">Receita Hoje</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(todayStats?.total || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Barras */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Receita por Tipo de Procedimento</CardTitle>
          <CardDescription>Comparação da receita gerada por cada tipo de procedimento</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={procedureData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 100%, 90%)" />
              <XAxis dataKey="name" stroke="hsl(210, 100%, 60%)" />
              <YAxis stroke="hsl(210, 100%, 60%)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid hsl(210, 100%, 80%)',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Bar dataKey="revenue" fill="url(#colorGradient)" name="Receita (R$)" />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(210, 100%, 70%)" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="hsl(280, 50%, 70%)" stopOpacity={0.9}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
