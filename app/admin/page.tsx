"use client";

import { useEffect, useState } from "react";
// import prisma from "@/lib/prisma";
import { Users, Clock, FileSpreadsheet, AlertCircle, TrendingUp, Activity, CheckCircle2, Coffee, LogIn, LogOut } from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { RefreshButton } from "./refresh-button";

// Todas as buscas de stats agora são feitas via API

function getActivityType(record: any) {
    if (record.exit) return { label: 'Saída', icon: LogOut, color: 'text-rose-400', bg: 'bg-rose-500/10' };
    if (record.lunchEnd) return { label: 'Retorno', icon: Coffee, color: 'text-blue-400', bg: 'bg-blue-500/10' };
    if (record.lunchStart) return { label: 'Almoço', icon: Coffee, color: 'text-amber-400', bg: 'bg-amber-500/10' };
    if (record.entry) return { label: 'Entrada', icon: LogIn, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    return { label: 'Registro', icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10' };
}

function getLastActivityTime(record: any) {
    if (record.exit) return record.exit;
    if (record.lunchEnd) return record.lunchEnd;
    if (record.lunchStart) return record.lunchStart;
    if (record.entry) return record.entry;
    return record.updatedAt;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/dashboard-stats');
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Erro ao buscar stats:', error);
            setStats({
                employeeCount: 0,
                recordsToday: 0,
                totalRecords: 0,
                recordsYesterday: 0,
                recentRecords: [],
                absentCount: 0
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Activity className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    const todayDate = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

    const cards = [
        {
            label: "Total Funcionários",
            value: stats.employeeCount,
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            link: "/admin/employees"
        },
        {
            label: "Registros Hoje",
            value: stats.recordsToday,
            icon: Clock,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            trend: stats.recordsYesterday > 0 ? Math.round(((stats.recordsToday - stats.recordsYesterday) / stats.recordsYesterday) * 100) : null,
            link: "/admin/reports"
        },
        {
            label: "Total de Registros",
            value: stats.totalRecords,
            icon: FileSpreadsheet,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            link: "/admin/analytics"
        },
        {
            label: "Ausentes Hoje",
            value: stats.absentCount,
            icon: AlertCircle,
            color: stats.absentCount > 0 ? "text-rose-500" : "text-emerald-500",
            bg: stats.absentCount > 0 ? "bg-rose-500/10" : "bg-emerald-500/10",
            link: "/admin/absent"
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-white">Dashboard</h2>
                    <p className="text-slate-400 mt-1 capitalize">{todayDate}</p>
                </div>
                <RefreshButton />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <Link
                        key={card.label}
                        href={card.link}
                        className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-lg hover:shadow-blue-500/5 transition-all hover:border-slate-700 group"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">{card.label}</p>
                                <div className="flex items-end gap-2">
                                    <h3 className="text-3xl font-bold text-white">{card.value}</h3>
                                    {card.trend !== null && card.trend !== undefined && (
                                        <span className={`text-xs font-bold flex items-center ${card.trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            <TrendingUp className={`w-3 h-3 mr-0.5 ${card.trend < 0 ? 'rotate-180' : ''}`} />
                                            {Math.abs(card.trend)}%
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className={`${card.bg} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Atividade Recente */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-400" />
                            Atividade Recente
                        </h3>
                        <Link href="/admin/reports" className="text-sm text-blue-400 hover:text-blue-300 font-bold">
                            Ver todos →
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {stats.recentRecords.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-10">
                                Nenhuma atividade registrada ainda.
                            </p>
                        ) : (
                            stats.recentRecords.map((record: any) => {
                                const activity = getActivityType(record);
                                const lastTime = getLastActivityTime(record);
                                return (
                                    <div key={record.id} className="flex items-center gap-4 p-3 bg-slate-950/50 rounded-xl hover:bg-slate-950 transition-all">
                                        <div className={`w-10 h-10 rounded-xl ${activity.bg} flex items-center justify-center`}>
                                            <activity.icon className={`w-5 h-5 ${activity.color}`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-white text-sm">{record.employee.name}</p>
                                            <p className="text-xs text-slate-500">{record.employee.dept} • {activity.label}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-mono text-slate-300">
                                                {lastTime ? format(new Date(lastTime), 'HH:mm') : '--:--'}
                                            </p>
                                            <p className="text-xs text-slate-600">{record.date}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Resumo Rápido */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        Ações Rápidas
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            href="/admin/employees"
                            className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all group"
                        >
                            <Users className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold text-slate-300">Novo Funcionário</span>
                        </Link>
                        <Link
                            href="/admin/reports"
                            className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all group"
                        >
                            <FileSpreadsheet className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold text-slate-300">Gerar Relatório</span>
                        </Link>
                        <Link
                            href="/admin/analytics"
                            className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all group"
                        >
                            <TrendingUp className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold text-slate-300">Ver Analytics</span>
                        </Link>
                        <Link
                            href="/admin/approvals"
                            className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all group"
                        >
                            <AlertCircle className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold text-slate-300">Aprovações</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Status dos Funcionários Hoje */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">Status de Hoje</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-black text-emerald-400">{stats.recordsToday}</p>
                        <p className="text-sm text-slate-400">Registraram ponto</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-black text-amber-400">{stats.absentCount}</p>
                        <p className="text-sm text-slate-400">Ainda não registraram</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-black text-blue-400">
                            {stats.recentRecords.filter((r: any) => r.date === format(new Date(), 'yyyy-MM-dd') && r.exit).length}
                        </p>
                        <p className="text-sm text-slate-400">Já finalizaram</p>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-black text-purple-400">
                            {stats.recentRecords.filter((r: any) => r.date === format(new Date(), 'yyyy-MM-dd') && r.entry && !r.exit).length}
                        </p>
                        <p className="text-sm text-slate-400">Em expediente</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
