"use client";

import { useState, useEffect } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { ArrowLeft, Calendar, Coffee, Plus, Search, Filter, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Employee {
    id: string;
    name: string;
    dept: string;
    role: string;
    email?: string;
}

interface TimeOff {
    id: string;
    employeeId: string;
    employee: Employee;
    startDate: string;
    endDate: string;
    type: string;
    reason?: string;
    status: string;
    approvedBy?: string;
    createdAt: string;
}

export default function TimeOffManagementPage() {
    const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTimeOff, setEditingTimeOff] = useState<TimeOff | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [formData, setFormData] = useState({
        employeeId: '',
        startDate: '',
        endDate: '',
        type: 'personal',
        reason: '',
        status: 'approved'
    });

    const timeOffTypes = [
        { value: 'vacation', label: 'Férias', icon: '🏖️', color: 'blue' },
        { value: 'sick', label: 'Atestado Médico', icon: '🤒', color: 'red' },
        { value: 'personal', label: 'Folga Pessoal', icon: '☕', color: 'green' },
        { value: 'medical', label: 'Consulta Médica', icon: '🏥', color: 'purple' }
    ];

    const getTypeColor = (type: string) => {
        const colors = {
            vacation: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            sick: 'bg-red-500/10 text-red-400 border-red-500/20',
            personal: 'bg-green-500/10 text-green-400 border-green-500/20',
            medical: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        };
        return colors[type as keyof typeof colors] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    };

    const getStatusColor = (status: string) => {
        const colors = {
            approved: 'bg-green-500/10 text-green-400 border-green-500/20',
            pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            rejected: 'bg-red-500/10 text-red-400 border-red-500/20'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    };

    useEffect(() => {
        fetchTimeOffs();
        fetchEmployees();
    }, []);

    const fetchTimeOffs = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/timeoffs');
            if (!response.ok) {
                console.error('Erro na resposta da API de folgas:', response.status, response.statusText);
                setTimeOffs([]);
                return;
            }
            
            const data = await response.json();
            setTimeOffs(data.timeOffs || []);
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao carregar folgas');
            setTimeOffs([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await fetch('/api/admin/employees');
            if (!response.ok) throw new Error('Erro ao buscar funcionários');
            
            const data = await response.json();
            console.log('Funcionários carregados:', data);
            // A API retorna um array direto, não um objeto com propriedade employees
            setEmployees(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao carregar funcionários');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.employeeId || !formData.startDate || !formData.endDate) {
            toast.error('Preencha todos os campos obrigatórios');
            return;
        }

        try {
            const method = editingTimeOff ? 'PUT' : 'POST';
            const url = editingTimeOff ? `/api/admin/timeoffs/${editingTimeOff.id}` : '/api/admin/timeoffs';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Erro ao salvar folga');

            toast.success(editingTimeOff ? 'Folga atualizada com sucesso!' : 'Folga criada com sucesso!');
            setShowModal(false);
            resetForm();
            fetchTimeOffs();
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao salvar folga');
        }
    };

    const handleDelete = async (timeOffId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta folga?')) return;

        try {
            const response = await fetch(`/api/admin/timeoffs/${timeOffId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Erro ao excluir folga');

            toast.success('Folga excluída com sucesso!');
            fetchTimeOffs();
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao excluir folga');
        }
    };

    const resetForm = () => {
        setFormData({
            employeeId: '',
            startDate: '',
            endDate: '',
            type: 'personal',
            reason: '',
            status: 'approved'
        });
        setEditingTimeOff(null);
    };

    const openEditModal = (timeOff: TimeOff) => {
        setEditingTimeOff(timeOff);
        setFormData({
            employeeId: timeOff.employeeId,
            startDate: timeOff.startDate,
            endDate: timeOff.endDate,
            type: timeOff.type,
            reason: timeOff.reason || '',
            status: timeOff.status
        });
        setShowModal(true);
    };

    const filteredTimeOffs = timeOffs.filter(timeOff => {
        const matchesSearch = timeOff.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            timeOff.employee.dept.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || timeOff.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getTypeIcon = (type: string) => {
        return timeOffTypes.find(t => t.value === type)?.icon || '📅';
    };

    const getTypeLabel = (type: string) => {
        return timeOffTypes.find(t => t.value === type)?.label || 'Folga';
    };

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
                                <Coffee className="text-green-400" />
                                Gerenciar Folgas
                            </h1>
                            <p className="text-slate-400 mt-1">
                                Cadastre e gerencie folgas dos funcionários
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all"
                    >
                        <Plus size={20} />
                        Nova Folga
                    </button>
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
                                <option value="approved">Aprovadas</option>
                                <option value="pending">Pendentes</option>
                                <option value="rejected">Rejeitadas</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Lista de Folgas */}
                <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="p-6 border-b border-slate-700/50">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Calendar size={20} />
                            Folgas Registradas ({filteredTimeOffs.length})
                        </h2>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                            </div>
                        ) : filteredTimeOffs.length === 0 ? (
                            <div className="text-center py-12">
                                <Coffee size={48} className="text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400 text-lg">
                                    Nenhuma folga encontrada
                                </p>
                                <p className="text-slate-500 text-sm mt-2">
                                    Clique em "Nova Folga" para cadastrar a primeira folga
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredTimeOffs.map((timeOff) => (
                                    <div key={timeOff.id} className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                    {timeOff.employee.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-lg">{timeOff.employee.name}</h3>
                                                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                                                        <span>{timeOff.employee.dept} • {timeOff.employee.role}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className={`px-3 py-1 rounded-lg border text-sm font-medium ${getTypeColor(timeOff.type)}`}>
                                                    <span className="mr-2">{getTypeIcon(timeOff.type)}</span>
                                                    {getTypeLabel(timeOff.type)}
                                                </div>
                                                
                                                <div className={`px-3 py-1 rounded-lg border text-sm font-medium ${getStatusColor(timeOff.status)}`}>
                                                    {timeOff.status === 'approved' && <CheckCircle size={14} className="inline mr-1" />}
                                                    {timeOff.status === 'rejected' && <XCircle size={14} className="inline mr-1" />}
                                                    {timeOff.status === 'approved' && 'Aprovada'}
                                                    {timeOff.status === 'pending' && 'Pendente'}
                                                    {timeOff.status === 'rejected' && 'Rejeitada'}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(timeOff)}
                                                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(timeOff.id)}
                                                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <p className="text-slate-400">Período</p>
                                                    <p className="text-white font-medium">
                                                        {format(parseISO(timeOff.startDate), 'dd/MM/yyyy')} a {format(parseISO(timeOff.endDate), 'dd/MM/yyyy')}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400">Duração</p>
                                                    <p className="text-white font-medium">
                                                        {Math.ceil((parseISO(timeOff.endDate).getTime() - parseISO(timeOff.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} dias
                                                    </p>
                                                </div>
                                                {timeOff.reason && (
                                                    <div>
                                                        <p className="text-slate-400">Motivo</p>
                                                        <p className="text-white font-medium">{timeOff.reason}</p>
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
                            {editingTimeOff ? 'Editar Folga' : 'Nova Folga'}
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-300 text-sm font-medium mb-2">
                                        Data Início *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 transition-colors"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-300 text-sm font-medium mb-2">
                                        Data Fim *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 text-sm font-medium mb-2">
                                    Tipo de Folga *
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 transition-colors"
                                    required
                                >
                                    {timeOffTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.icon} {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-300 text-sm font-medium mb-2">
                                    Motivo/Observações
                                </label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 transition-colors resize-none"
                                    rows={3}
                                    placeholder="Descreva o motivo da folga (opcional)"
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
                                    <option value="approved">Aprovada</option>
                                    <option value="pending">Pendente</option>
                                    <option value="rejected">Rejeitada</option>
                                </select>
                            </div>

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
                                    className="flex-1 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    {editingTimeOff ? 'Atualizar' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}