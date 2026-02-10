"use client";

import { useState, useEffect } from "react";
import {
    CheckSquare,
    Clock,
    AlertCircle,
    CheckCircle,
    XCircle,
    Calendar,
    MessageSquare,
    Filter,
    Loader2,
    RefreshCw,
    X
} from "lucide-react";
import { toast } from "sonner";

interface CorrectionRequest {
    id: string;
    employeeId: string;
    date: string;
    type: string;
    requestedTime: string;
    reason: string;
    status: string;
    createdAt: string;
    employee: {
        name: string;
        dept: string;
    };
}

interface JustificationRequest {
    id: string;
    employeeId: string;
    date: string;
    reason: string;
    status: string;
    createdAt: string;
    employee: {
        name: string;
        dept: string;
    };
}

export default function ApprovalsPage() {
    const [activeTab, setActiveTab] = useState<'corrections' | 'justifications'>('corrections');
    const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
    const [justifications, setJustifications] = useState<JustificationRequest[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    
    // Estados para modal de rejeição
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectData, setRejectData] = useState<{id: string, type: 'correction' | 'justification'} | null>(null);
    const [adminComment, setAdminComment] = useState("");

    const typeLabels: Record<string, string> = {
        entry: 'Entrada',
        lunchStart: 'Saída Almoço',
        lunchEnd: 'Retorno Almoço',
        exit: 'Saída'
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/requests');
            if (!res.ok) {
                console.error('Erro na resposta da API de solicitações:', res.status, res.statusText);
                setCorrections([]);
                setJustifications([]);
                return;
            }
            const data = await res.json();
            setCorrections(data.corrections || []);
            setJustifications(data.justifications || []);
        } catch (error) {
            console.error('Erro ao carregar solicitações:', error);
            toast.error('Erro ao carregar solicitações');
            setCorrections([]);
            setJustifications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApproveCorrection = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await fetch('/api/requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, type: 'correction', status: 'approved' })
            });
            if (res.ok) {
                setCorrections(prev => prev.map(c =>
                    c.id === id ? { ...c, status: 'approved' } : c
                ));
                toast.success('Correção aprovada e aplicada automaticamente!');
            }
        } catch (error) {
            toast.error('Erro ao aprovar');
        } finally {
            setProcessingId(null);
        }
    };

    const handleApproveJustification = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await fetch('/api/requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, type: 'justification', status: 'approved' })
            });
            if (res.ok) {
                setJustifications(prev => prev.map(j =>
                    j.id === id ? { ...j, status: 'approved' } : j
                ));
                toast.success('Justificativa aprovada!');
            }
        } catch (error) {
            toast.error('Erro ao aprovar');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectCorrection = async (id: string) => {
        setRejectData({ id, type: 'correction' });
        setShowRejectModal(true);
    };

    const handleRejectJustification = async (id: string) => {
        setRejectData({ id, type: 'justification' });
        setShowRejectModal(true);
    };

    const confirmReject = async () => {
        if (!rejectData) return;
        
        setProcessingId(rejectData.id);
        try {
            const res = await fetch('/api/requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: rejectData.id, 
                    type: rejectData.type, 
                    status: 'rejected',
                    adminComment 
                })
            });
            
            if (res.ok) {
                if (rejectData.type === 'correction') {
                    setCorrections(prev => prev.map(c =>
                        c.id === rejectData.id ? { ...c, status: 'rejected' } : c
                    ));
                } else {
                    setJustifications(prev => prev.map(j =>
                        j.id === rejectData.id ? { ...j, status: 'rejected' } : j
                    ));
                }
                toast.success('Solicitação rejeitada e funcionário notificado');
                setShowRejectModal(false);
                setRejectData(null);
                setAdminComment("");
            }
        } catch (error) {
            toast.error('Erro ao rejeitar');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredCorrections = corrections.filter(c =>
        filter === 'all' || c.status === filter
    );

    const filteredJustifications = justifications.filter(j =>
        filter === 'all' || j.status === filter
    );

    const pendingCount = corrections.filter(c => c.status === 'pending').length +
                         justifications.filter(j => j.status === 'pending').length;

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-white">Aprovações</h2>
                    <p className="text-slate-400 mt-1">
                        Gerencie solicitações de correção e justificativas
                        {pendingCount > 0 && (
                            <span className="ml-2 bg-amber-500 text-amber-900 px-2 py-0.5 rounded-full text-xs font-bold">
                                {pendingCount} pendente(s)
                            </span>
                        )}
                    </p>
                </div>
                <button
                    onClick={fetchRequests}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4">
                <button
                    onClick={() => setActiveTab('corrections')}
                    className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'corrections'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                >
                    <Clock className="w-5 h-5" />
                    Correções de Ponto
                    {corrections.filter(c => c.status === 'pending').length > 0 && (
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                            {corrections.filter(c => c.status === 'pending').length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('justifications')}
                    className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'justifications'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                >
                    <MessageSquare className="w-5 h-5" />
                    Justificativas
                    {justifications.filter(j => j.status === 'pending').length > 0 && (
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                            {justifications.filter(j => j.status === 'pending').length}
                        </span>
                    )}
                </button>
            </div>

            {/* Filtros */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                <Filter className="w-5 h-5 text-slate-500" />
                <div className="flex gap-2">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                filter === f
                                    ? 'bg-slate-700 text-white'
                                    : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            {f === 'all' ? 'Todos' :
                             f === 'pending' ? 'Pendentes' :
                             f === 'approved' ? 'Aprovados' : 'Rejeitados'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <p className="text-slate-500">Carregando solicitações...</p>
                </div>
            ) : (
                <>
                    {/* Lista de Correções */}
                    {activeTab === 'corrections' && (
                        <div className="space-y-4">
                            {filteredCorrections.length === 0 ? (
                                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
                                    <CheckSquare className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold">Nenhuma solicitação de correção</p>
                                    <p className="text-slate-600 text-sm mt-1">
                                        {filter === 'pending' ? 'Todas as correções foram processadas' : 'Nenhum registro encontrado'}
                                    </p>
                                </div>
                            ) : (
                                filteredCorrections.map((correction) => (
                                    <div
                                        key={correction.id}
                                        className={`bg-slate-900 border rounded-3xl p-6 transition-all ${
                                            correction.status === 'pending' ? 'border-amber-500/30' :
                                            correction.status === 'approved' ? 'border-emerald-500/30' :
                                            'border-red-500/30'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                    correction.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                                    correction.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                    {correction.status === 'pending' ? <AlertCircle className="w-6 h-6" /> :
                                                     correction.status === 'approved' ? <CheckCircle className="w-6 h-6" /> :
                                                     <XCircle className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h4 className="font-bold text-white text-lg">{correction.employee.name}</h4>
                                                        <span className="text-xs bg-slate-800 px-2 py-1 rounded-lg text-slate-400">
                                                            {correction.employee.dept}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            {correction.date}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {typeLabels[correction.type] || correction.type}
                                                        </span>
                                                    </div>
                                                    <div className="bg-slate-950 rounded-xl p-4 mb-3">
                                                        <div className="flex items-center gap-6 text-sm">
                                                            <div>
                                                                <p className="text-slate-500 text-xs mb-1">Horário Solicitado</p>
                                                                <p className="font-mono text-emerald-400 font-bold">
                                                                    {correction.requestedTime || '--:--'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-400 text-sm">
                                                        <strong className="text-slate-300">Motivo:</strong> {correction.reason}
                                                    </p>
                                                </div>
                                            </div>

                                            {correction.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApproveCorrection(correction.id)}
                                                        disabled={processingId === correction.id}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                                                    >
                                                        {processingId === correction.id ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="w-5 h-5" />
                                                        )}
                                                        Aprovar
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectCorrection(correction.id)}
                                                        disabled={processingId === correction.id}
                                                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                        Rejeitar
                                                    </button>
                                                </div>
                                            )}

                                            {correction.status !== 'pending' && (
                                                <span className={`px-4 py-2 rounded-xl text-sm font-bold ${
                                                    correction.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                    {correction.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Lista de Justificativas */}
                    {activeTab === 'justifications' && (
                        <div className="space-y-4">
                            {filteredJustifications.length === 0 ? (
                                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
                                    <MessageSquare className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold">Nenhuma justificativa</p>
                                    <p className="text-slate-600 text-sm mt-1">
                                        {filter === 'pending' ? 'Todas as justificativas foram processadas' : 'Nenhum registro encontrado'}
                                    </p>
                                </div>
                            ) : (
                                filteredJustifications.map((justification) => (
                                    <div
                                        key={justification.id}
                                        className={`bg-slate-900 border rounded-3xl p-6 transition-all ${
                                            justification.status === 'pending' ? 'border-amber-500/30' :
                                            justification.status === 'approved' ? 'border-emerald-500/30' :
                                            'border-red-500/30'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                    justification.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                                    justification.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                    <MessageSquare className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h4 className="font-bold text-white text-lg">{justification.employee.name}</h4>
                                                        <span className="text-xs bg-slate-800 px-2 py-1 rounded-lg text-slate-400">
                                                            {justification.employee.dept}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            Data da falta: {justification.date}
                                                        </span>
                                                    </div>
                                                    <div className="bg-slate-950 rounded-xl p-4">
                                                        <p className="text-slate-300">{justification.reason}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {justification.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApproveJustification(justification.id)}
                                                        disabled={processingId === justification.id}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                                                    >
                                                        {processingId === justification.id ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="w-5 h-5" />
                                                        )}
                                                        Aprovar
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectJustification(justification.id)}
                                                        disabled={processingId === justification.id}
                                                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                        Rejeitar
                                                    </button>
                                                </div>
                                            )}

                                            {justification.status !== 'pending' && (
                                                <span className={`px-4 py-2 rounded-xl text-sm font-bold ${
                                                    justification.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                    {justification.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Modal de Rejeição */}
            {showRejectModal && rejectData && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl">
                        <div className="p-6 border-b border-slate-800">
                            <h3 className="text-xl font-bold text-white">
                                Rejeitar {rejectData.type === 'correction' ? 'Correção' : 'Justificativa'}
                            </h3>
                            <p className="text-slate-400 mt-1">
                                Adicione um comentário explicando o motivo da rejeição
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Justificativa da Rejeição
                                </label>
                                <textarea
                                    value={adminComment}
                                    onChange={(e) => setAdminComment(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-red-500 transition-all outline-none h-24 resize-none"
                                    placeholder="Explique por que esta solicitação foi rejeitada..."
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectData(null);
                                        setAdminComment("");
                                    }}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmReject}
                                    disabled={processingId === rejectData.id}
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {processingId === rejectData.id ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Rejeitando...
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-5 h-5" />
                                            Confirmar Rejeição
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
