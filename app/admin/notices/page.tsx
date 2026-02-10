"use client";

import { useState, useEffect } from "react";
import { Bell, Plus, X, Edit, Trash2, AlertCircle, Info, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Notice {
    id: string;
    title: string;
    content: string;
    type: "info" | "warning" | "urgent";
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function NoticesPage() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        type: "info" as "info" | "warning" | "urgent"
    });

    const fetchNotices = async () => {
        try {
            const res = await fetch("/api/admin/notices");
            if (!res.ok) {
                console.error('Erro na resposta da API de avisos:', res.status, res.statusText);
                setNotices([]);
                return;
            }
            const data = await res.json();
            setNotices(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erro ao carregar avisos:", error);
            toast.error("Erro ao carregar avisos");
            setNotices([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title || !formData.content) {
            toast.error("Preencha todos os campos");
            return;
        }

        try {
            const url = editingNotice ? `/api/admin/notices/${editingNotice.id}` : "/api/admin/notices";
            const method = editingNotice ? "PUT" : "POST";
            
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success(editingNotice ? "Aviso atualizado!" : "Aviso criado!");
                setShowModal(false);
                setEditingNotice(null);
                setFormData({ title: "", content: "", type: "info" });
                fetchNotices();
            } else {
                toast.error("Erro ao salvar aviso");
            }
        } catch (error) {
            toast.error("Erro de conexão");
        }
    };

    const handleEdit = (notice: Notice) => {
        setEditingNotice(notice);
        setFormData({
            title: notice.title,
            content: notice.content,
            type: notice.type
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este aviso?")) return;
        
        try {
            const res = await fetch(`/api/admin/notices/${id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                toast.success("Aviso excluído!");
                fetchNotices();
            } else {
                toast.error("Erro ao excluir aviso");
            }
        } catch (error) {
            toast.error("Erro de conexão");
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "warning": return <AlertTriangle className="w-5 h-5" />;
            case "urgent": return <AlertCircle className="w-5 h-5" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "warning": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
            case "urgent": return "text-red-400 bg-red-500/10 border-red-500/20";
            default: return "text-blue-400 bg-blue-500/10 border-blue-500/20";
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-white">Sistema de Avisos</h2>
                    <p className="text-slate-400 mt-2">Gerencie avisos e comunicados para os funcionários</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/25"
                >
                    <Plus className="w-5 h-5" />
                    Novo Aviso
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
            ) : (
                <div className="grid gap-6">
                    {notices.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhum aviso cadastrado</p>
                        </div>
                    ) : (
                        notices.map((notice) => (
                            <div key={notice.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex gap-4 flex-1">
                                        <div className={`p-2 rounded-xl border ${getTypeColor(notice.type)}`}>
                                            {getTypeIcon(notice.type)}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white mb-2">{notice.title}</h3>
                                            <p className="text-slate-300 mb-3">{notice.content}</p>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <span>Criado em {new Date(notice.createdAt).toLocaleDateString()}</span>
                                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${notice.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {notice.active ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(notice)}
                                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(notice.id)}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">
                                {editingNotice ? "Editar Aviso" : "Novo Aviso"}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingNotice(null);
                                    setFormData({ title: "", content: "", type: "info" });
                                }}
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Título
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-blue-500 transition-all outline-none"
                                    placeholder="Título do aviso"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Conteúdo
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-blue-500 transition-all outline-none h-32 resize-none"
                                    placeholder="Conteúdo do aviso"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Tipo
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "info" | "warning" | "urgent" })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-blue-500 transition-all outline-none"
                                >
                                    <option value="info">Informativo</option>
                                    <option value="warning">Aviso</option>
                                    <option value="urgent">Urgente</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all"
                            >
                                {editingNotice ? "Atualizar" : "Criar"} Aviso
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}