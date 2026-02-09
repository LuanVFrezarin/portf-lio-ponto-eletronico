"use client";

import { useState } from "react";
import {
    Settings,
    Clock,
    Bell,
    Shield,
    Database,
    Download,
    Upload,
    Save,
    Loader2,
    Building,
    Calendar,
    AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        companyName: 'Minha Empresa',
        workHoursPerDay: 8,
        lunchDuration: 60,
        overtimeAlert: 10,
        allowWeekendRegistration: false,
        requireLunchBreak: true,
        autoLogoutMinutes: 30,
        notifyAbsence: true,
        notifyOvertime: true,
        notifyCorrections: true
    });

    const handleSave = async () => {
        setSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Configurações salvas com sucesso!');
        setSaving(false);
    };

    const handleExportData = () => {
        toast.success('Exportação iniciada! O download começará em instantes.');
    };

    const handleBackup = () => {
        toast.success('Backup realizado com sucesso!');
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-white">Configurações</h2>
                    <p className="text-slate-400 mt-1">Personalize o sistema de ponto</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Salvar Alterações
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configurações Gerais */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Building className="w-5 h-5 text-blue-400" />
                        Informações da Empresa
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400">Nome da Empresa</label>
                            <input
                                type="text"
                                value={settings.companyName}
                                onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Configurações de Jornada */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-400" />
                        Jornada de Trabalho
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400">Horas por Dia</label>
                            <input
                                type="number"
                                value={settings.workHoursPerDay}
                                onChange={(e) => setSettings({...settings, workHoursPerDay: Number(e.target.value)})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400">Duração do Almoço (minutos)</label>
                            <input
                                type="number"
                                value={settings.lunchDuration}
                                onChange={(e) => setSettings({...settings, lunchDuration: Number(e.target.value)})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400">Alerta de Hora Extra (após X horas)</label>
                            <input
                                type="number"
                                value={settings.overtimeAlert}
                                onChange={(e) => setSettings({...settings, overtimeAlert: Number(e.target.value)})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Regras de Registro */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-amber-400" />
                        Regras de Registro
                    </h3>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-slate-950 rounded-xl cursor-pointer hover:bg-slate-950/80 transition-all">
                            <div>
                                <p className="font-bold text-white">Permitir registro em fins de semana</p>
                                <p className="text-sm text-slate-500">Habilita ponto aos sábados e domingos</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.allowWeekendRegistration}
                                onChange={(e) => setSettings({...settings, allowWeekendRegistration: e.target.checked})}
                                className="w-5 h-5 accent-blue-500"
                            />
                        </label>
                        <label className="flex items-center justify-between p-4 bg-slate-950 rounded-xl cursor-pointer hover:bg-slate-950/80 transition-all">
                            <div>
                                <p className="font-bold text-white">Exigir registro de almoço</p>
                                <p className="text-sm text-slate-500">Obriga o funcionário a registrar a pausa</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.requireLunchBreak}
                                onChange={(e) => setSettings({...settings, requireLunchBreak: e.target.checked})}
                                className="w-5 h-5 accent-blue-500"
                            />
                        </label>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400">Logout automático após (minutos)</label>
                            <input
                                type="number"
                                value={settings.autoLogoutMinutes}
                                onChange={(e) => setSettings({...settings, autoLogoutMinutes: Number(e.target.value)})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Notificações */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-purple-400" />
                        Notificações
                    </h3>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-slate-950 rounded-xl cursor-pointer hover:bg-slate-950/80 transition-all">
                            <div>
                                <p className="font-bold text-white">Notificar ausências</p>
                                <p className="text-sm text-slate-500">Alerta quando funcionário não registra ponto</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.notifyAbsence}
                                onChange={(e) => setSettings({...settings, notifyAbsence: e.target.checked})}
                                className="w-5 h-5 accent-blue-500"
                            />
                        </label>
                        <label className="flex items-center justify-between p-4 bg-slate-950 rounded-xl cursor-pointer hover:bg-slate-950/80 transition-all">
                            <div>
                                <p className="font-bold text-white">Notificar horas extras</p>
                                <p className="text-sm text-slate-500">Alerta quando funcionário excede jornada</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.notifyOvertime}
                                onChange={(e) => setSettings({...settings, notifyOvertime: e.target.checked})}
                                className="w-5 h-5 accent-blue-500"
                            />
                        </label>
                        <label className="flex items-center justify-between p-4 bg-slate-950 rounded-xl cursor-pointer hover:bg-slate-950/80 transition-all">
                            <div>
                                <p className="font-bold text-white">Notificar solicitações de correção</p>
                                <p className="text-sm text-slate-500">Alerta quando há nova solicitação pendente</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.notifyCorrections}
                                onChange={(e) => setSettings({...settings, notifyCorrections: e.target.checked})}
                                className="w-5 h-5 accent-blue-500"
                            />
                        </label>
                    </div>
                </div>

                {/* Backup e Dados */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Database className="w-5 h-5 text-cyan-400" />
                        Backup e Exportação
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={handleExportData}
                            className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-6 rounded-2xl flex flex-col items-center gap-3 transition-all"
                        >
                            <Download className="w-8 h-8 text-emerald-400" />
                            <div className="text-center">
                                <p className="font-bold text-white">Exportar Dados</p>
                                <p className="text-sm text-slate-500">Baixar todos os registros em CSV</p>
                            </div>
                        </button>
                        <button
                            onClick={handleBackup}
                            className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-6 rounded-2xl flex flex-col items-center gap-3 transition-all"
                        >
                            <Database className="w-8 h-8 text-blue-400" />
                            <div className="text-center">
                                <p className="font-bold text-white">Criar Backup</p>
                                <p className="text-sm text-slate-500">Salvar cópia do banco de dados</p>
                            </div>
                        </button>
                        <button className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-6 rounded-2xl flex flex-col items-center gap-3 transition-all">
                            <Upload className="w-8 h-8 text-amber-400" />
                            <div className="text-center">
                                <p className="font-bold text-white">Restaurar Backup</p>
                                <p className="text-sm text-slate-500">Carregar dados de um backup</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Zona de Perigo */}
                <div className="lg:col-span-2 bg-red-950/20 border border-red-500/20 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-red-400 mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Zona de Perigo
                    </h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-white">Limpar todos os registros</p>
                            <p className="text-sm text-slate-500">Esta ação é irreversível e apagará todos os dados de ponto</p>
                        </div>
                        <button className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold transition-all">
                            Limpar Dados
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
