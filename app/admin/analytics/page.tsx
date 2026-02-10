"use client";

import { useState, useEffect } from "react";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    Clock,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Loader2,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Employee {
    id: string;
    name: string;
    dept: string;
    hourlyRate: number;
}

interface DailyRecord {
    id: string;
    date: string;
    entry: string | null;
    lunchStart: string | null;
    lunchEnd: string | null;
    exit: string | null;
    employee: Employee;
}

interface DeptStats {
    dept: string;
    totalHours: number;
    avgHours: number;
    employees: number;
    totalCost: number;
}

interface DailyStats {
    date: string;
    totalHours: number;
    avgHours: number;
    records: number;
}

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<DailyRecord[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

    // Estatísticas calculadas
    const [deptStats, setDeptStats] = useState<DeptStats[]>([]);
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [topPerformers, setTopPerformers] = useState<{name: string; hours: number; dept: string}[]>([]);
    const [alerts, setAlerts] = useState<{type: string; message: string; severity: 'warning' | 'danger' | 'info'}[]>([]);

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            console.log('[ANALYTICS] Buscando dados para mês:', selectedMonth);
            
            const [recordsRes, employeesRes] = await Promise.all([
                fetch(`/api/admin/reports?month=${selectedMonth}`),
                fetch('/api/admin/employees')
            ]);

            if (!recordsRes.ok || !employeesRes.ok) {
                console.error('[ANALYTICS] Erro nas respostas das APIs:', {
                    records: recordsRes.status,
                    employees: employeesRes.status
                });
                setRecords([]);
                setEmployees([]);
                return;
            }

            const recordsData = await recordsRes.json();
            const employeesData = await employeesRes.json();

            console.log('[ANALYTICS] Registros recebidos:', {
                count: Array.isArray(recordsData) ? recordsData.length : 0,
                data: recordsData
            });
            console.log('[ANALYTICS] Funcionários recebidos:', {
                count: Array.isArray(employeesData) ? employeesData.length : 0
            });

            setRecords(Array.isArray(recordsData) ? recordsData : []);
            setEmployees(Array.isArray(employeesData) ? employeesData : []);

            calculateStats(Array.isArray(recordsData) ? recordsData : [], Array.isArray(employeesData) ? employeesData : []);
        } catch (error) {
            console.error("[ANALYTICS] Erro ao carregar dados:", error);
            setRecords([]);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateWorkedHours = (record: DailyRecord) => {
        if (!record.entry || !record.exit) return 0;

        const entry = new Date(record.entry);
        const exit = new Date(record.exit);
        let minutes = differenceInMinutes(exit, entry);

        if (record.lunchStart && record.lunchEnd) {
            const lunchStart = new Date(record.lunchStart);
            const lunchEnd = new Date(record.lunchEnd);
            minutes -= differenceInMinutes(lunchEnd, lunchStart);
        }

        return Math.max(0, minutes / 60);
    };

    const calculateStats = (records: DailyRecord[], employees: Employee[]) => {
        // Estatísticas por departamento
        const deptMap = new Map<string, { hours: number; employees: Set<string>; cost: number }>();
        const employeeHours = new Map<string, { name: string; hours: number; dept: string }>();
        const dailyMap = new Map<string, { hours: number; count: number }>();
        const newAlerts: typeof alerts = [];

        records.forEach(record => {
            const hours = calculateWorkedHours(record);
            const dept = record.employee.dept;
            const empId = record.employee.name;

            // Departamento
            if (!deptMap.has(dept)) {
                deptMap.set(dept, { hours: 0, employees: new Set(), cost: 0 });
            }
            const deptData = deptMap.get(dept)!;
            deptData.hours += hours;
            deptData.employees.add(empId);
            deptData.cost += hours * (record.employee.hourlyRate || 0);

            // Por funcionário
            if (!employeeHours.has(empId)) {
                employeeHours.set(empId, { name: empId, hours: 0, dept });
            }
            employeeHours.get(empId)!.hours += hours;

            // Por dia
            if (!dailyMap.has(record.date)) {
                dailyMap.set(record.date, { hours: 0, count: 0 });
            }
            const dayData = dailyMap.get(record.date)!;
            dayData.hours += hours;
            dayData.count += 1;

            // Alertas
            if (hours > 10) {
                newAlerts.push({
                    type: 'overtime',
                    message: `${record.employee.name} trabalhou ${hours.toFixed(1)}h em ${record.date}`,
                    severity: 'warning'
                });
            }
            if (!record.lunchStart && hours > 6) {
                newAlerts.push({
                    type: 'no_lunch',
                    message: `${record.employee.name} não registrou almoço em ${record.date}`,
                    severity: 'info'
                });
            }
        });

        // Converter mapas em arrays
        const deptStatsArray: DeptStats[] = Array.from(deptMap.entries()).map(([dept, data]) => ({
            dept,
            totalHours: data.hours,
            avgHours: data.hours / data.employees.size,
            employees: data.employees.size,
            totalCost: data.cost
        })).sort((a, b) => b.totalHours - a.totalHours);

        const dailyStatsArray: DailyStats[] = Array.from(dailyMap.entries())
            .map(([date, data]) => ({
                date,
                totalHours: data.hours,
                avgHours: data.hours / data.count,
                records: data.count
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        const topPerformersArray = Array.from(employeeHours.values())
            .sort((a, b) => b.hours - a.hours)
            .slice(0, 5);

        setDeptStats(deptStatsArray);
        setDailyStats(dailyStatsArray);
        setTopPerformers(topPerformersArray);
        setAlerts(newAlerts.slice(0, 5));
    };

    const totalHours = records.reduce((acc, r) => acc + calculateWorkedHours(r), 0);
    const totalCost = records.reduce((acc, r) => acc + (calculateWorkedHours(r) * (r.employee.hourlyRate || 0)), 0);
    const avgHoursPerDay = dailyStats.length > 0 ? totalHours / dailyStats.length : 0;
    const completionRate = records.length > 0
        ? (records.filter(r => r.entry && r.exit).length / records.length) * 100
        : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-white">Analytics</h2>
                    <p className="text-slate-400 mt-1">Métricas e insights sobre sua equipe</p>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total de Horas"
                    value={`${totalHours.toFixed(0)}h`}
                    subtitle={`${records.length} registros`}
                    icon={Clock}
                    color="blue"
                    trend={12}
                />
                <KPICard
                    title="Custo Total"
                    value={`R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    subtitle="Folha estimada"
                    icon={TrendingUp}
                    color="emerald"
                    trend={8}
                />
                <KPICard
                    title="Média por Dia"
                    value={`${avgHoursPerDay.toFixed(1)}h`}
                    subtitle="Por funcionário"
                    icon={BarChart3}
                    color="amber"
                    trend={-3}
                />
                <KPICard
                    title="Taxa de Conclusão"
                    value={`${completionRate.toFixed(0)}%`}
                    subtitle="Pontos completos"
                    icon={CheckCircle}
                    color="purple"
                    trend={5}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Gráfico de Horas Diárias */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        Horas por Dia
                    </h3>
                    <div className="h-64 flex items-end gap-1">
                        {dailyStats.slice(-20).map((day, i) => {
                            const maxHours = Math.max(...dailyStats.map(d => d.totalHours), 1);
                            const height = (day.totalHours / maxHours) * 100;
                            return (
                                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className="w-full bg-gradient-to-t from-blue-600 to-cyan-500 rounded-t-lg transition-all hover:opacity-80 cursor-pointer relative group"
                                        style={{ height: `${Math.max(5, height)}%` }}
                                        title={`${day.date}: ${day.totalHours.toFixed(1)}h`}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {day.totalHours.toFixed(1)}h
                                        </div>
                                    </div>
                                    <span className="text-[9px] text-slate-500 -rotate-45 origin-left">
                                        {day.date.slice(8)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top Performers */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Top 5 - Horas Trabalhadas
                    </h3>
                    <div className="space-y-4">
                        {topPerformers.map((emp, i) => (
                            <div key={emp.name} className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                    i === 0 ? 'bg-amber-500 text-amber-900' :
                                    i === 1 ? 'bg-slate-400 text-slate-900' :
                                    i === 2 ? 'bg-orange-600 text-orange-100' :
                                    'bg-slate-800 text-slate-400'
                                }`}>
                                    {i + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-white text-sm">{emp.name}</p>
                                    <p className="text-xs text-slate-500">{emp.dept}</p>
                                </div>
                                <p className="font-mono font-bold text-blue-400">{emp.hours.toFixed(1)}h</p>
                            </div>
                        ))}
                        {topPerformers.length === 0 && (
                            <p className="text-slate-500 text-center py-8">Nenhum dado disponível</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Estatísticas por Departamento */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-400" />
                        Por Departamento
                    </h3>
                    <div className="space-y-4">
                        {deptStats.map((dept) => {
                            const maxHours = Math.max(...deptStats.map(d => d.totalHours), 1);
                            const width = (dept.totalHours / maxHours) * 100;
                            return (
                                <div key={dept.dept} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-white">{dept.dept}</p>
                                            <p className="text-xs text-slate-500">{dept.employees} funcionário(s)</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono font-bold text-white">{dept.totalHours.toFixed(0)}h</p>
                                            <p className="text-xs text-emerald-400">R$ {dept.totalCost.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all"
                                            style={{ width: `${width}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {deptStats.length === 0 && (
                            <p className="text-slate-500 text-center py-8">Nenhum dado disponível</p>
                        )}
                    </div>
                </div>

                {/* Alertas */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        Alertas e Pendências
                    </h3>
                    <div className="space-y-3">
                        {alerts.map((alert, i) => (
                            <div
                                key={i}
                                className={`p-4 rounded-xl border ${
                                    alert.severity === 'danger' ? 'bg-red-500/10 border-red-500/20' :
                                    alert.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
                                    'bg-blue-500/10 border-blue-500/20'
                                }`}
                            >
                                <p className={`text-sm ${
                                    alert.severity === 'danger' ? 'text-red-400' :
                                    alert.severity === 'warning' ? 'text-amber-400' :
                                    'text-blue-400'
                                }`}>
                                    {alert.message}
                                </p>
                            </div>
                        ))}
                        {alerts.length === 0 && (
                            <div className="text-center py-8">
                                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                <p className="text-slate-400">Nenhum alerta no período</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, subtitle, icon: Icon, color, trend }: {
    title: string;
    value: string;
    subtitle: string;
    icon: any;
    color: 'blue' | 'emerald' | 'amber' | 'purple';
    trend?: number;
}) {
    const colors = {
        blue: 'bg-blue-500/10 text-blue-400',
        emerald: 'bg-emerald-500/10 text-emerald-400',
        amber: 'bg-amber-500/10 text-amber-400',
        purple: 'bg-purple-500/10 text-purple-400'
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <p className="text-2xl font-black text-white mb-1">{value}</p>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-xs text-slate-600 mt-1">{subtitle}</p>
        </div>
    );
}
