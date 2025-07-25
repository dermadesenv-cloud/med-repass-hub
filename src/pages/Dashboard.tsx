
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { CalendarIcon, TrendingUp, Users, FileText, DollarSign, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';

const Dashboard = () => {
  const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
  const [selectedPeriod, setSelectedPeriod] = useState('mes');
  const { user } = useAuth();

  // Dados simulados
  const procedureData = [
    { name: 'Consultas', value: 125, revenue: 15000 },
    { name: 'Exames', value: 89, revenue: 12500 },
    { name: 'Cirurgias', value: 45, revenue: 35000 },
    { name: 'Procedimentos', value: 67, revenue: 8750 },
  ];

  const monthlyData = [
    { month: 'Jan', procedures: 234, revenue: 28500 },
    { month: 'Fev', procedures: 287, revenue: 34200 },
    { month: 'Mar', procedures: 356, revenue: 42800 },
    { month: 'Abr', procedures: 298, revenue: 38600 },
    { month: 'Mai', procedures: 326, revenue: 41200 },
    { month: 'Jun', procedures: 382, revenue: 48900 },
  ];

  const COLORS = ['hsl(210, 100%, 70%)', 'hsl(280, 50%, 70%)', 'hsl(240, 60%, 75%)', 'hsl(200, 80%, 75%)'];

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
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs opacity-80">+12% em relação a ontem</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-secondary to-secondary-dark text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Hoje</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 3.240</div>
            <p className="text-xs opacity-80">+8% em relação a ontem</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-accent to-primary text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procedimentos Mês</CardTitle>
            <FileText className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">382</div>
            <p className="text-xs opacity-80">+15% em relação ao mês passado</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-primary-dark to-secondary text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mês</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 48.900</div>
            <p className="text-xs opacity-80">+18% em relação ao mês passado</p>
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
            <CardTitle className="text-primary">Evolução Mensal</CardTitle>
            <CardDescription>Procedimentos e receita ao longo dos meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 100%, 90%)" />
                <XAxis dataKey="month" stroke="hsl(210, 100%, 60%)" />
                <YAxis stroke="hsl(210, 100%, 60%)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid hsl(210, 100%, 80%)',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="procedures" 
                  stroke="hsl(210, 100%, 70%)" 
                  strokeWidth={3}
                  name="Procedimentos"
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(280, 50%, 70%)" 
                  strokeWidth={3}
                  name="Receita (R$)"
                />
              </LineChart>
            </ResponsiveContainer>
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
