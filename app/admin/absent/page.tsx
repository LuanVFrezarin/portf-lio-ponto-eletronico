"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Users, Calendar, Clock, UserX, Coffee } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Employee {
    id: string;
    name: string;
    dept: string;
    role: string;
    email?: string;
    phone?: string;
}

interface TimeOff {
    id: string;
    startDate: string;
    endDate: string;
    type: string;
    reason?: string;
    status: string;
    employee: Employee;
}

interface AbsentEmployee {
    employee: Employee;
    status: 'missing' | 'timeoff';
    timeOff?: TimeOff;
    lastEntry?: string;
}

export default function AbsentEmployeesPage() {
    const [absentEmployees, setAbsentEmployees] = useState<AbsentEmployee[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'missing': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'timeoff': return 'bg-green-500/10 text-green-400 border-green-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    const getStatusLabel = (absent: AbsentEmployee) => {
        if (absent.status === 'timeoff') {
            const typeLabels = {
                vacation: 'FÉRIAS',
                sick: 'ATESTADO',
                personal: 'FOLGA',
                medical: 'MÉDICO'
            };
            return typeLabels[absent.timeOff?.type as keyof typeof typeLabels] || 'FOLGA';
        }
        return 'AUSENTE';
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'vacation': return '🏖️';
            case 'sick': return '🤒';
            case 'medical': return '🏥';
            case 'personal': return '☕';
            default: return '📅';
        }
    };

    useEffect(() => {
        fetchAbsentEmployees();
    }, [selectedDate]);

    const fetchAbsentEmployees = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/absent?date=${selectedDate}`);
            if (!response.ok) throw new Error('Erro ao buscar funcionários ausentes');
            
            const data = await response.json();
            setAbsentEmployees(data.absentEmployees || []);
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao carregar funcionários ausentes');
            setAbsentEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <div className="max-w-6xl mx-auto p-6 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors">
                            <ArrowLeft size={24} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <UserX className="text-red-400" />
                                Funcionários Ausentes
                            </h1>
                            <p className="text-slate-400 mt-1">
                                Monitoramento de ausências e folgas programadas
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg">
                            <Calendar size={18} className="text-slate-400" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent border-none text-white focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 p-6 rounded-lg border border-red-500/20">
                        <div className="flex items-center gap-3">
                            <UserX className="text-red-400" size={24} />
                            <div>
                                <p className="text-red-400 text-sm font-medium">Ausentes Não Justificados</p>
                                <p className="text-2xl font-bold text-white">
                                    {absentEmployees.filter(a => a.status === 'missing').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 p-6 rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-3">
                            <Coffee className="text-green-400" size={24} />
                            <div>
                                <p className="text-green-400 text-sm font-medium">Folgas Programadas</p>
                                <p className="text-2xl font-bold text-white">
                                    {absentEmployees.filter(a => a.status === 'timeoff').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 p-6 rounded-lg border border-blue-500/20">
                        <div className="flex items-center gap-3">
                            <Users className="text-blue-400" size={24} />
                            <div>
                                <p className="text-blue-400 text-sm font-medium">Total de Ausentes</p>
                                <p className="text-2xl font-bold text-white">
                                    {absentEmployees.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lista de Ausentes */}
                <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="p-6 border-b border-slate-700/50">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Clock size={20} />
                            Funcionários Ausentes em {format(new Date(selectedDate + 'T00:00:00'), 'dd/MM/yyyy')}
                        </h2>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                            </div>
                        ) : absentEmployees.length === 0 ? (
                            <div className="text-center py-12">
                                <Users size={48} className="text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400 text-lg">
                                    Nenhum funcionário ausente encontrado para esta data
                                </p>
                                <p className="text-slate-500 text-sm mt-2">
                                    Todos os funcionários estão presentes! 🎉
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {absentEmployees.map((absent) => (
                                    <div key={absent.employee.id} className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                    {absent.employee.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-lg">{absent.employee.name}</h3>
                                                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                                                        <span>{absent.employee.dept} • {absent.employee.role}</span>
                                                        {absent.employee.email && <span>{absent.employee.email}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className={`px-4 py-2 rounded-lg border font-bold text-sm ${getStatusColor(absent.status)}`}>
                                                    {absent.status === 'timeoff' && (
                                                        <span className="mr-2">
                                                            {getTypeIcon(absent.timeOff?.type || '')}
                                                        </span>
                                                    )}
                                                    {getStatusLabel(absent)}
                                                </div>
                                            </div>
                                        </div>

                                        {absent.timeOff && (
                                            <div className="mt-4 pt-4 border-t border-slate-700/50">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-slate-400">Período</p>
                                                        <p className="text-white font-medium">
                                                            {format(new Date(absent.timeOff.startDate + 'T00:00:00'), 'dd/MM')} a {format(new Date(absent.timeOff.endDate + 'T00:00:00'), 'dd/MM')}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400">Tipo</p>
                                                        <p className="text-white font-medium capitalize">
                                                            {absent.timeOff.type === 'vacation' && 'Férias'}
                                                            {absent.timeOff.type === 'sick' && 'Atestado Médico'}
                                                            {absent.timeOff.type === 'personal' && 'Folga Pessoal'}
                                                            {absent.timeOff.type === 'medical' && 'Consulta Médica'}
                                                        </p>
                                                    </div>
                                                    {absent.timeOff.reason && (
                                                        <div>
                                                            <p className="text-slate-400">Motivo</p>
                                                            <p className="text-white font-medium">{absent.timeOff.reason}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {absent.status === 'missing' && absent.lastEntry && (
                                            <div className="mt-4 pt-4 border-t border-slate-700/50">
                                                <p className="text-slate-400 text-sm">
                                                    Última entrada: <span className="text-white font-medium">
                                                        {format(new Date(absent.lastEntry), 'dd/MM/yyyy às HH:mm')}
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}