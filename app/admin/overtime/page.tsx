"use client";

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Clock, Plus, Search, Filter, Trash2, Edit, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Employee {
    id: string;
    name: string;
    dept: string;
    role: string;
    email?: string;
    hourlyRate: number;
}

interface Overtime {
    id: string;
    employeeId: string;
    employee: Employee;
    date: string;
    hours: number;
    reason: string;
    status: string;
    adminComment?: string;
    approvedBy?: string;
    createdAt: string;
}

export default function OvertimeManagementPage() {
    const [overtimes, setOvertimes] = useState<Overtime[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingOvertime, setEditingOvertime] = useState<Overtime | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [formData, setFormData] = useState({
        employeeId: '',
        date: '',
        hours: '',
        reason: '',
        status: 'pending',
        adminComment: ''
    });

    const getStatusColor = (status: string) => {
        const colors = {
            approved: 'bg-green-500/10 text-green-400 border-green-500/20',
            pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            rejected: 'bg-red-500/10 text-red-400 border-red-500/20'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    };

    useEffect(() => {
        fetchOvertimes();
        fetchEmployees();
    }, []);

    const fetchOvertimes = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/overtime');
            if (!response.ok) {
                console.error('Erro na resposta da API de horas extras:', response.status, response.statusText);
                setOvertimes([]);
                return;
            }
            
            const data = await response.json();
            setOvertimes(data.overtimes || []);
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao carregar horas extras');
            setOvertimes([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await fetch('/api/admin/employees');
            if (!response.ok) throw new Error('Erro ao buscar funcionários');
            
            const data = await response.json();
            console.log('Funcionários carregados (overtime):', data);
            // A API retorna um array direto, não um objeto com propriedade employees
            setEmployees(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao carregar funcionários');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.employeeId || !formData.date || !formData.hours || !formData.reason) {
            toast.error('Preencha todos os campos obrigatórios');
            return;
        }

        if (parseFloat(formData.hours) <= 0) {
            toast.error('As horas extras devem ser maior que zero');
            return;
        }

        try {
            const method = editingOvertime ? 'PUT' : 'POST';
            const url = editingOvertime ? `/api/admin/overtime/${editingOvertime.id}` : '/api/admin/overtime';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    hours: parseFloat(formData.hours)
                })
            });

            if (!response.ok) throw new Error('Erro ao salvar horas extras');

            toast.success(editingOvertime ? 'Horas extras atualizadas com sucesso!' : 'Horas extras registradas com sucesso!');
            setShowModal(false);
            resetForm();
            fetchOvertimes();
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao salvar horas extras');
        }
    };

    const handleStatusChange = async (overtimeId: string, newStatus: string, comment?: string) => {
        try {
            const response = await fetch(`/api/admin/overtime/${overtimeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: newStatus,
                    adminComment: comment
                })
            });

            if (!response.ok) throw new Error('Erro ao atualizar status');

            toast.success(`Horas extras ${newStatus === 'approved' ? 'aprovadas' : 'rejeitadas'} com sucesso!`);
            fetchOvertimes();
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao atualizar status');
        }
    };

    const handleDelete = async (overtimeId: string) => {
        if (!confirm('Tem certeza que deseja excluir este registro de horas extras?')) return;

        try {
            const response = await fetch(`/api/admin/overtime/${overtimeId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Erro ao excluir horas extras');

            toast.success('Horas extras excluídas com sucesso!');
            fetchOvertimes();
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao excluir horas extras');
        }
    };

    const resetForm = () => {
        setFormData({
            employeeId: '',
            date: '',
            hours: '',
            reason: '',
            status: 'pending',
            adminComment: ''
        });
        setEditingOvertime(null);
    };

    const openEditModal = (overtime: Overtime) => {
        setEditingOvertime(overtime);
        setFormData({
            employeeId: overtime.employeeId,
            date: overtime.date,
            hours: overtime.hours.toString(),
            reason: overtime.reason,
            status: overtime.status,
            adminComment: overtime.adminComment || ''
        });
        setShowModal(true);
    };

    const filteredOvertimes = overtimes.filter(overtime => {
        const matchesSearch = overtime.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            overtime.employee.dept.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || overtime.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const calculateOvertimePay = (hours: number, hourlyRate: number) => {
        return hours * hourlyRate * 1.5; // 50% adicional para horas extras
    };

    const getTotalStats = () => {
        const approved = filteredOvertimes.filter(o => o.status === 'approved');
        const totalHours = approved.reduce((sum, o) => sum + o.hours, 0);
        const totalPay = approved.reduce((sum, o) => sum + calculateOvertimePay(o.hours, o.employee.hourlyRate || 0), 0);
        
        return { totalHours, totalPay, approvedCount: approved.length };
    };

    const stats = getTotalStats();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <div className="max-w-7xl mx-auto p-6 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors">
                            <ArrowLeft size={24} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <Clock className="text-amber-400" />
                                Horas Extras
                            </h1>
                            <p className="text-slate-400 mt-1">
                                Gerencie e aprove solicitações de horas extras
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all"
                    >
                        <Plus size={20} />
                        Registrar Horas Extras
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 p-6 rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="text-green-400" size={24} />
                            <div>
                                <p className="text-green-400 text-sm font-medium">Horas Aprovadas</p>
                                <p className="text-2xl font-bold text-white">
                                    {stats.totalHours.toFixed(1)}h
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 p-6 rounded-lg border border-blue-500/20">
                        <div className="flex items-center gap-3">
                            <Clock className="text-blue-400" size={24} />
                            <div>
                                <p className="text-blue-400 text-sm font-medium">Registros Aprovados</p>
                                <p className="text-2xl font-bold text-white">
                                    {stats.approvedCount}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 p-6 rounded-lg border border-amber-500/20">
                        <div className="flex items-center gap-3">
                            <div className="text-amber-400 text-xl">💰</div>
                            <div>
                                <p className="text-amber-400 text-sm font-medium">Valor a Pagar</p>
                                <p className="text-2xl font-bold text-white">
                                    R$ {stats.totalPay.toFixed(2).replace('.', ',')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por funcionário ou departamento..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={20} className="text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 transition-colors"
                            >
                                <option value="all">Todos os Status</option>
                                <option value="pending">Pendentes</option>
                                <option value="approved">Aprovadas</option>
                                <option value="rejected">Rejeitadas</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Lista de Horas Extras */}
                <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="p-6 border-b border-slate-700/50">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Clock size={20} />
                            Registros de Horas Extras ({filteredOvertimes.length})
                        </h2>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                            </div>
                        ) : filteredOvertimes.length === 0 ? (
                            <div className="text-center py-12">
                                <Clock size={48} className="text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400 text-lg">
                                    Nenhum registro de horas extras encontrado
                                </p>
                                <p className="text-slate-500 text-sm mt-2">
                                    Clique em "Registrar Horas Extras" para adicionar o primeiro registro
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredOvertimes.map((overtime) => (
                                    <div key={overtime.id} className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                    {overtime.employee.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-lg">{overtime.employee.name}</h3>
                                                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                                                        <span>{overtime.employee.dept} • {overtime.employee.role}</span>
                                                        <span>R$ {(overtime.employee.hourlyRate || 0).toFixed(2).replace('.', ',')}/h</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className={`px-3 py-1 rounded-lg border text-sm font-medium ${getStatusColor(overtime.status)}`}>
                                                    {overtime.status === 'approved' && <CheckCircle size={14} className="inline mr-1" />}
                                                    {overtime.status === 'rejected' && <XCircle size={14} className="inline mr-1" />}
                                                    {overtime.status === 'pending' && <AlertCircle size={14} className="inline mr-1" />}
                                                    {overtime.status === 'approved' && 'Aprovado'}
                                                    {overtime.status === 'pending' && 'Pendente'}
                                                    {overtime.status === 'rejected' && 'Rejeitado'}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {overtime.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusChange(overtime.id, 'approved')}
                                                                className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-medium transition-colors"
                                                            >
                                                                Aprovar
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const comment = prompt('Motivo da rejeição (opcional):');
                                                                    handleStatusChange(overtime.id, 'rejected', comment || undefined);
                                                                }}
                                                                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-medium transition-colors"
                                                            >
                                                                Rejeitar
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => openEditModal(overtime)}
                                                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(overtime.id)}
                                                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-slate-400">Data</p>
                                                    <p className="text-white font-medium">
                                                        {format(parseISO(overtime.date), 'dd/MM/yyyy')}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400">Horas Extras</p>
                                                    <p className="text-white font-medium">
                                                        {overtime.hours.toFixed(1)}h
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400">Valor (Hora Extra +50%)</p>
                                                    <p className="text-white font-medium">
                                                        R$ {calculateOvertimePay(overtime.hours, overtime.employee.hourlyRate || 0).toFixed(2).replace('.', ',')}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400">Motivo</p>
                                                    <p className="text-white font-medium">{overtime.reason}</p>
                                                </div>
                                                {overtime.adminComment && (
                                                    <div className="md:col-span-4">
                                                        <p className="text-slate-400">Comentário do Admin</p>
                                                        <p className="text-white font-medium">{overtime.adminComment}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-bold text-white mb-6">
                            {editingOvertime ? 'Editar Horas Extras' : 'Registrar Horas Extras'}
                        </h3>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-slate-300 text-sm font-medium mb-2">
                                    Funcionário *
                                </label>
                                <select
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 transition-colors"
                                    required
                                >
                                    <option value="">Selecione um funcionário</option>
                                    {employees.map(employee => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.name} - {employee.dept}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-300 text-sm font-medium mb-2">
                                    Data *
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 transition-colors"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 text-sm font-medium mb-2">
                                    Quantidade de Horas *
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    max="12"
                                    value={formData.hours}
                                    onChange={(e) => setFormData({...formData, hours: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 transition-colors"
                                    placeholder="Ex: 2.5"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 text-sm font-medium mb-2">
                                    Motivo/Justificativa *
                                </label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 transition-colors resize-none"
                                    rows={3}
                                    placeholder="Descreva o motivo das horas extras"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 text-sm font-medium mb-2">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 transition-colors"
                                >
                                    <option value="pending">Pendente</option>
                                    <option value="approved">Aprovado</option>
                                    <option value="rejected">Rejeitado</option>
                                </select>
                            </div>

                            {(formData.status === 'rejected' || editingOvertime?.adminComment) && (
                                <div>
                                    <label className="block text-slate-300 text-sm font-medium mb-2">
                                        Comentário do Admin
                                    </label>
                                    <textarea
                                        value={formData.adminComment}
                                        onChange={(e) => setFormData({...formData, adminComment: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 transition-colors resize-none"
                                        rows={2}
                                        placeholder="Comentário sobre a aprovação/rejeição"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    {editingOvertime ? 'Atualizar' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}