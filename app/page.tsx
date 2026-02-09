"use client";

import { useEffect, useState, useRef } from "react";
import { UserCircle, LogIn, Coffee, LogOut, Loader2, Clock, Calendar, TrendingUp, FileSpreadsheet, ChevronRight, AlertCircle, CheckCircle2, History, FileText, MessageSquare, X, Send, ChevronLeft, ArrowDownToLine, Shield, Bell } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Employee {
    id: string;
    name: string;
    dept: string;
    role: string;
    avatar: string;
    hourlyRate?: number;
}

interface TimeLog {
    entry: string | null;
    lunchStart: string | null;
    lunchEnd: string | null;
    exit: string | null;
}

interface DailyRecord {
    id: string;
    date: string;
    entry: string | null;
    lunchStart: string | null;
    lunchEnd: string | null;
    exit: string | null;
}

interface WeekRecord {
    date: string;
    dayName: string;
    hours: number;
    entry: string | null;
    exit: string | null;
}

export default function PontoPage() {
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [time, setTime] = useState(new Date());
    const [todayLog, setTodayLog] = useState<TimeLog>({
        entry: null, lunchStart: null, lunchEnd: null, exit: null
    });
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const pinInputRef = useRef<HTMLInputElement>(null);
    const [isPinFocused, setIsPinFocused] = useState(false);
    const [registering, setRegistering] = useState<string | null>(null);

    // Novas funcionalidades para funcionário
    const [showHistory, setShowHistory] = useState(false);
    const [showCorrection, setShowCorrection] = useState(false);
    const [showMonthSummary, setShowMonthSummary] = useState(false);
    const [showJustification, setShowJustification] = useState(false);
    const [showTimeOffRequest, setShowTimeOffRequest] = useState(false);
    const [weekRecords, setWeekRecords] = useState<WeekRecord[]>([]);
    const [monthRecords, setMonthRecords] = useState<DailyRecord[]>([]);
    const [correctionData, setCorrectionData] = useState({ date: "", type: "", reason: "", requestedTime: "" });
    const [justificationData, setJustificationData] = useState({ date: "", reason: "" });
    const [timeOffData, setTimeOffData] = useState({ startDate: "", endDate: "", type: "personal", reason: "" });
    const [loadingRecords, setLoadingRecords] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Polling automático de notificações a cada 10 segundos quando funcionário está logado
    useEffect(() => {
        if (!employee?.id) return;

        const pollingInterval = setInterval(() => {
            fetchNotifications(employee.id);
        }, 10000); // Verifica a cada 10 segundos

        return () => clearInterval(pollingInterval);
    }, [employee?.id]);

    // Buscar registro do dia ao fazer login
    const fetchTodayRecord = async (empId: string) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await fetch(`/api/ponto/register?employeeId=${empId}&date=${today}`);
            
            if (!res.ok) {
                console.error("Erro na resposta da API:", res.status);
                return;
            }
            
            const data = await res.json();
            console.log("Dados do registro de hoje:", data);
            
            if (data) {
                setTodayLog({
                    entry: data.entry,
                    lunchStart: data.lunchStart,
                    lunchEnd: data.lunchEnd,
                    exit: data.exit
                });
            }
        } catch (error) {
            console.error("Erro ao buscar registro do dia:", error);
        }
    };

    // Buscar registros da semana
    const fetchWeekRecords = async (empId: string) => {
        setLoadingRecords(true);
        try {
            const records: WeekRecord[] = [];
            const today = new Date();
            const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                const res = await fetch(`/api/ponto/register?employeeId=${empId}&date=${dateStr}`);
                const data = await res.json();

                let hours = 0;
                if (data?.entry && data?.exit) {
                    const entry = new Date(data.entry);
                    const exit = new Date(data.exit);
                    hours = (exit.getTime() - entry.getTime()) / 1000 / 60 / 60;
                    if (data.lunchStart && data.lunchEnd) {
                        const lunchStart = new Date(data.lunchStart);
                        const lunchEnd = new Date(data.lunchEnd);
                        hours -= (lunchEnd.getTime() - lunchStart.getTime()) / 1000 / 60 / 60;
                    }
                }

                records.push({
                    date: dateStr,
                    dayName: dayNames[date.getDay()],
                    hours: Math.max(0, hours),
                    entry: data?.entry || null,
                    exit: data?.exit || null
                });
            }

            setWeekRecords(records);
        } catch (error) {
            console.error("Erro ao buscar registros da semana");
        } finally {
            setLoadingRecords(false);
        }
    };

    // Buscar registros do mês
    const fetchMonthRecords = async (empId: string) => {
        setLoadingRecords(true);
        try {
            const today = new Date();
            const month = today.toISOString().slice(0, 7);
            const res = await fetch(`/api/admin/reports?month=${month}&employeeId=${empId}`);
            const data = await res.json();
            setMonthRecords(data || []);
        } catch (error) {
            console.error("Erro ao buscar registros do mês");
        } finally {
            setLoadingRecords(false);
        }
    };

    // Buscar notificações do funcionário
    const fetchNotifications = async (empId: string) => {
        try {
            const res = await fetch(`/api/employee/notifications?employeeId=${empId}`);
            const data = await res.json();
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.read).length);
        } catch (error) {
            console.error("Erro ao buscar notificações");
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await fetch('/api/employee/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: notificationId, read: true })
            });
            
            setNotifications(prev => prev.map(n => 
                n.id === notificationId ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Erro ao marcar como lida");
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin }),
            });

            if (res.ok) {
                const data = await res.json();
                setEmployee({
                    id: data.id,
                    name: data.name,
                    dept: data.dept,
                    role: data.role,
                    avatar: data.avatar || data.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
                    hourlyRate: data.hourlyRate
                });
                await fetchTodayRecord(data.id);
                await fetchNotifications(data.id);
                toast.success(`Bem-vindo, ${data.name}!`);
            } else {
                toast.error("PIN inválido. Tente novamente.");
            }
        } catch (error) {
            toast.error("Erro ao conectar ao servidor");
        } finally {
            setLoading(false);
        }
    };

    const registerTime = async (type: keyof TimeLog) => {
        if (!employee) {
            console.error("[REGISTER TIME] Nenhum funcionário logado");
            toast.error("Nenhum funcionário logado");
            return;
        }

        setRegistering(type);
        console.log("[REGISTER TIME] Iniciando registro:", { employeeId: employee.id, type, timestamp: new Date().toISOString() });

        try {
            const payload = { employeeId: employee.id, type };
            console.log("[REGISTER TIME] Enviando payload:", payload);
            
            const res = await fetch("/api/ponto/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            console.log("[REGISTER TIME] Status da resposta:", res.status);
            const data = await res.json();
            console.log("[REGISTER TIME] Resposta da API:", data);

            if (res.ok) {
                console.log("[REGISTER TIME] Registro salvo com sucesso:", data);
                
                setTodayLog({
                    entry: data.entry,
                    lunchStart: data.lunchStart,
                    lunchEnd: data.lunchEnd,
                    exit: data.exit
                });

                const labels = { entry: "Entrada", lunchStart: "Saída Almoço", lunchEnd: "Retorno", exit: "Saída" };
                toast.success(`${labels[type]} registrada com sucesso!`);
                
                // Buscar dados atualizados
                await fetchTodayRecord(employee.id);
            } else {
                const errorMessage = data.error || data.message || "Erro desconhecido";
                const errorDetails = data.details || data.received || "";
                
                console.error("[REGISTER TIME] Erro na API:", {
                    status: res.status,
                    error: errorMessage,
                    details: errorDetails
                });
                
                if (res.status === 404) {
                    toast.error("Funcionário não encontrado. Por favor, faça login novamente.");
                } else if (res.status === 403) {
                    toast.error("Você está de folga hoje e não pode bater ponto.");
                } else if (res.status === 400) {
                    toast.error(`Erro no registro: ${errorMessage}`);
                } else {
                    toast.error(`Erro ao registrar ponto: ${errorMessage}`);
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("[REGISTER TIME] Erro de conexão:", errorMessage);
            console.error("[REGISTER TIME] Stack:", error);
            toast.error(`Erro de conexão: ${errorMessage}`);
        } finally {
            setRegistering(null);
        }
    };

    const calculateWorkedHours = () => {
        if (!todayLog.entry) return "00:00";
        const entry = new Date(todayLog.entry);
        const exit = todayLog.exit ? new Date(todayLog.exit) : new Date();

        let worked = (exit.getTime() - entry.getTime()) / 1000 / 60;

        if (todayLog.lunchStart && todayLog.lunchEnd) {
            const lunchStart = new Date(todayLog.lunchStart);
            const lunchEnd = new Date(todayLog.lunchEnd);
            worked -= (lunchEnd.getTime() - lunchStart.getTime()) / 1000 / 60;
        }

        const hours = Math.floor(worked / 60);
        const mins = Math.floor(worked % 60);
        return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    };

    const calculateWorkedHoursAsNumber = () => {
        if (!todayLog.entry || !todayLog.exit) return 0;

        let worked = (new Date(todayLog.exit).getTime() - new Date(todayLog.entry).getTime()) / 1000 / 60 / 60;

        if (todayLog.lunchStart && todayLog.lunchEnd) {
            const lunchStart = new Date(todayLog.lunchStart);
            const lunchEnd = new Date(todayLog.lunchEnd);
            worked -= (lunchEnd.getTime() - lunchStart.getTime()) / 1000 / 60 / 60;
        }

        return Math.max(0, worked);
    };

    const calculateMonthTotals = () => {
        let totalHours = 0;
        monthRecords.forEach(record => {
            if (record.entry && record.exit) {
                const entry = new Date(record.entry);
                const exit = new Date(record.exit);
                let hours = (exit.getTime() - entry.getTime()) / 1000 / 60 / 60;
                if (record.lunchStart && record.lunchEnd) {
                    const lunchStart = new Date(record.lunchStart);
                    const lunchEnd = new Date(record.lunchEnd);
                    hours -= (lunchEnd.getTime() - lunchStart.getTime()) / 1000 / 60 / 60;
                }
                totalHours += Math.max(0, hours);
            }
        });
        return totalHours;
    };

    const exportToCSV = () => {
        const headers = ["Data", "Entrada", "Início do Almoço", "Fim do Almoço", "Saída", "Horas Trabalhadas"];
        const data = [
            new Date().toLocaleDateString('pt-BR'),
            todayLog.entry ? new Date(todayLog.entry).toLocaleTimeString('pt-BR') : "--",
            todayLog.lunchStart ? new Date(todayLog.lunchStart).toLocaleTimeString('pt-BR') : "--",
            todayLog.lunchEnd ? new Date(todayLog.lunchEnd).toLocaleTimeString('pt-BR') : "--",
            todayLog.exit ? new Date(todayLog.exit).toLocaleTimeString('pt-BR') : "--",
            calculateWorkedHoursAsNumber().toFixed(2).replace('.', ',')
        ];
        
        const csvContent = [headers.join(";"), data.join(";")].join("\n");
        const BOM = "\uFEFF"; // UTF-8 BOM para Excel
        const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Ponto_${employee?.name?.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        toast.success("Relatório exportado com sucesso!");
    };

    const exportMonthToCSV = () => {
        if (monthRecords.length === 0) return toast.error("Nenhum registro para exportar");

        const headers = ["Data", "Entrada", "Início do Almoço", "Fim do Almoço", "Saída", "Horas Trabalhadas", "Status"];
        const rows = monthRecords.map(r => {
            let hours = 0;
            let status = "Incompleto";
            if (r.entry && r.exit) {
                const entry = new Date(r.entry);
                const exit = new Date(r.exit);
                hours = (exit.getTime() - entry.getTime()) / 1000 / 60 / 60;
                if (r.lunchStart && r.lunchEnd) {
                    hours -= (new Date(r.lunchEnd).getTime() - new Date(r.lunchStart).getTime()) / 1000 / 60 / 60;
                }
                status = "Completo";
            }
            return [
                new Date(r.date + 'T00:00:00').toLocaleDateString('pt-BR'),
                r.entry ? new Date(r.entry).toLocaleTimeString('pt-BR') : "--",
                r.lunchStart ? new Date(r.lunchStart).toLocaleTimeString('pt-BR') : "--",
                r.lunchEnd ? new Date(r.lunchEnd).toLocaleTimeString('pt-BR') : "--",
                r.exit ? new Date(r.exit).toLocaleTimeString('pt-BR') : "--",
                hours.toFixed(2).replace('.', ','),
                status
            ].join(";");
        });

        const csvContent = [headers.join(";"), ...rows].join("\n");
        const BOM = "\uFEFF"; // UTF-8 BOM para Excel
        const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Espelho_Ponto_${employee?.name?.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 7)}.csv`;
        a.click();
        toast.success("Espelho de ponto exportado com sucesso!");
    };

    const handleLogout = () => {
        setEmployee(null);
        setPin("");
        setTodayLog({ entry: null, lunchStart: null, lunchEnd: null, exit: null });
        setWeekRecords([]);
        setMonthRecords([]);
        toast.info("Logout realizado");
    };

    const submitCorrection = async () => {
        if (!correctionData.date || !correctionData.type || !correctionData.reason || !employee) {
            toast.error("Preencha todos os campos");
            return;
        }
        try {
            console.log("Enviando correção:", {
                type: "correction",
                employeeId: employee.id,
                date: correctionData.date,
                correctionType: correctionData.type,
                requestedTime: correctionData.requestedTime,
                reason: correctionData.reason
            });
            
            const res = await fetch("/api/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "correction",
                    employeeId: employee.id,
                    date: correctionData.date,
                    correctionType: correctionData.type,
                    requestedTime: correctionData.requestedTime,
                    reason: correctionData.reason
                }),
            });
            if (res.ok) {
                toast.success("Solicitação de correção enviada para aprovação!");
                setShowCorrection(false);
                setCorrectionData({ date: "", type: "", reason: "", requestedTime: "" });
                // Atualizar notificações
                await fetchNotifications(employee.id);
            } else {
                const errorData = await res.json();
                console.error("Erro ao enviar solicitação:", errorData);
                toast.error("Erro ao enviar solicitação");
            }
        } catch (error) {
            console.error("Erro de conexão:", error);
            toast.error("Erro de conexão");
        }
    };

    const submitJustification = async () => {
        if (!justificationData.date || !justificationData.reason || !employee) {
            toast.error("Preencha todos os campos");
            return;
        }
        try {
            console.log("Enviando justificativa:", {
                type: "justification",
                employeeId: employee.id,
                date: justificationData.date,
                reason: justificationData.reason
            });
            
            const res = await fetch("/api/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "justification",
                    employeeId: employee.id,
                    date: justificationData.date,
                    reason: justificationData.reason
                }),
            });
            if (res.ok) {
                toast.success("Justificativa enviada para análise!");
                setShowJustification(false);
                setJustificationData({ date: "", reason: "" });
                // Atualizar notificações
                await fetchNotifications(employee.id);
            } else {
                const errorData = await res.json();
                console.error("Erro ao enviar justificativa:", errorData);
                toast.error("Erro ao enviar justificativa");
            }
        } catch (error) {
            console.error("Erro de conexão:", error);
            toast.error("Erro de conexão");
        }
    };

    const submitTimeOffRequest = async () => {
        if (!timeOffData.startDate || !timeOffData.endDate || !timeOffData.reason || !employee) {
            toast.error("Preencha todos os campos");
            return;
        }

        if (new Date(timeOffData.startDate) > new Date(timeOffData.endDate)) {
            toast.error("A data de início deve ser menor que a data de fim");
            return;
        }

        try {
            const res = await fetch("/api/employee/timeoff-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employeeId: employee.id,
                    startDate: timeOffData.startDate,
                    endDate: timeOffData.endDate,
                    type: timeOffData.type,
                    reason: timeOffData.reason
                }),
            });

            if (res.ok) {
                toast.success("Solicitação de folga enviada para análise!");
                setShowTimeOffRequest(false);
                setTimeOffData({ startDate: "", endDate: "", type: "personal", reason: "" });
                // Atualizar notificações
                await fetchNotifications(employee.id);
            } else {
                const errorData = await res.json();
                console.error("Erro ao enviar solicitação:", errorData);
                toast.error(errorData.message || "Erro ao enviar solicitação de folga");
            }
        } catch (error) {
            console.error("Erro de conexão:", error);
            toast.error("Erro de conexão");
        }
    };

    if (!employee) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 font-sans">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/25 mb-6">
                            <Clock className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-2">Ponto Digital</h1>
                        <p className="text-slate-400">Sistema de Registro de Ponto Corporativo</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="text-center">
                                <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Digite seu PIN</label>
                            </div>
                            <div className="flex justify-center gap-2 relative" onClick={() => pinInputRef.current?.focus()}>
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all cursor-pointer ${pin.length > i
                                                ? "border-blue-500 bg-blue-500/20 text-white"
                                                : "border-slate-600 text-slate-600"
                                            } ${isPinFocused && i === pin.length ? "ring-2 ring-blue-400" : ""}`}
                                    >
                                        {pin[i]
                                            ? "•"
                                            : (isPinFocused && i === pin.length)
                                                ? <span className="w-[2px] h-8 bg-white rounded animate-pulse" />
                                                : ""
                                        }
                                    </div>
                                ))}

                                <input
                                    ref={pinInputRef}
                                    type="password"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    inputMode="numeric"
                                    maxLength={6}
                                    aria-label="PIN"
                                    onFocus={() => setIsPinFocused(true)}
                                    onBlur={() => setIsPinFocused(false)}
                                    className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-transparent outline-none"
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={pin.length < 6 || loading}
                                className="w-full h-14 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <>Acessar <ChevronRight /></>}
                            </button>
                        </form>
                    </div>

                    {/* Link para Admin */}
                    <div className="mt-6 text-center">
                        <Link
                            href="/admin/login"
                            className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-400 transition-colors text-sm"
                        >
                            <Shield className="w-4 h-4" />
                            Acesso Administrativo
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8 font-sans text-white">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-xl font-black">
                                {employee.avatar}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{employee.name}</h1>
                                <p className="text-slate-400">{employee.role} • {employee.dept}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Botão de Notificações */}
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                                title="Notificações"
                            >
                                <Bell className="w-5 h-5 text-slate-400" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            
                            <div className="text-right">
                                <div className="text-4xl font-mono font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                    {time.toLocaleTimeString()}
                                </div>
                                <div className="text-sm text-slate-400 font-medium">
                                    {time.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                                title="Sair"
                            >
                                <LogOut className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Dropdown de Notificações */}
                        {showNotifications && (
                            <div className="absolute top-24 right-4 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                                    <h3 className="font-bold text-white">Notificações ({unreadCount})</h3>
                                    <button 
                                        onClick={() => setShowNotifications(false)}
                                        className="p-1 hover:bg-slate-800 rounded-lg transition-all"
                                    >
                                        <X className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>
                                
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-6 text-center text-slate-400">
                                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Nenhuma notificação</p>
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <div 
                                                key={notification.id}
                                                onClick={() => !notification.read && markAsRead(notification.id)}
                                                className={`p-4 border-b border-slate-800 hover:bg-slate-800/30 transition-colors cursor-pointer ${
                                                    !notification.read ? 'bg-blue-500/10' : ''
                                                }`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                                        notification.type === "error" ? "bg-red-500" : 
                                                        notification.type === "success" ? "bg-green-500" :
                                                        notification.type === "warning" ? "bg-yellow-500" : 
                                                        "bg-blue-500"
                                                    }`} />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-white text-sm">{notification.title}</h4>
                                                        <p className="text-xs text-slate-400 mt-1">{notification.message}</p>
                                                        <span className="text-xs text-slate-500 mt-2 inline-block">
                                                            {new Date(notification.createdAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Clock Actions */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-400" /> Registrar Ponto
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => registerTime("entry")}
                                    disabled={!!todayLog.entry || registering === "entry"}
                                    className="h-28 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold flex flex-col items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    {registering === "entry" ? <Loader2 className="w-8 h-8 animate-spin" /> : <LogIn className="w-8 h-8" />}
                                    <span>ENTRADA</span>
                                    {todayLog.entry && <span className="text-xs opacity-75">{new Date(todayLog.entry).toLocaleTimeString()}</span>}
                                </button>
                                <button
                                    onClick={() => registerTime("lunchStart")}
                                    disabled={!todayLog.entry || !!todayLog.lunchStart || registering === "lunchStart"}
                                    className="h-28 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold flex flex-col items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                                >
                                    {registering === "lunchStart" ? <Loader2 className="w-8 h-8 animate-spin" /> : <Coffee className="w-8 h-8" />}
                                    <span>ALMOÇO</span>
                                    {todayLog.lunchStart && <span className="text-xs opacity-75">{new Date(todayLog.lunchStart).toLocaleTimeString()}</span>}
                                </button>
                                <button
                                    onClick={() => registerTime("lunchEnd")}
                                    disabled={!todayLog.lunchStart || !!todayLog.lunchEnd || registering === "lunchEnd"}
                                    className="h-28 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold flex flex-col items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                                >
                                    {registering === "lunchEnd" ? <Loader2 className="w-8 h-8 animate-spin" /> : <Coffee className="w-8 h-8" />}
                                    <span>RETORNO</span>
                                    {todayLog.lunchEnd && <span className="text-xs opacity-75">{new Date(todayLog.lunchEnd).toLocaleTimeString()}</span>}
                                </button>
                                <button
                                    onClick={() => registerTime("exit")}
                                    disabled={!todayLog.lunchEnd || !!todayLog.exit || registering === "exit"}
                                    className="h-28 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold flex flex-col items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20"
                                >
                                    {registering === "exit" ? <Loader2 className="w-8 h-8 animate-spin" /> : <LogOut className="w-8 h-8" />}
                                    <span>SAÍDA</span>
                                    {todayLog.exit && <span className="text-xs opacity-75">{new Date(todayLog.exit).toLocaleTimeString()}</span>}
                                </button>
                            </div>
                        </div>

                        {/* Timeline do Dia - NOVO */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <History className="w-5 h-5 text-purple-400" /> Registro do Dia
                            </h2>
                            <div className="relative">
                                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-700" />
                                <div className="space-y-6">
                                    <TimelineItem
                                        label="Entrada"
                                        time={todayLog.entry}
                                        color="emerald"
                                        icon={<LogIn className="w-4 h-4" />}
                                    />
                                    <TimelineItem
                                        label="Saída Almoço"
                                        time={todayLog.lunchStart}
                                        color="amber"
                                        icon={<Coffee className="w-4 h-4" />}
                                    />
                                    <TimelineItem
                                        label="Retorno Almoço"
                                        time={todayLog.lunchEnd}
                                        color="blue"
                                        icon={<Coffee className="w-4 h-4" />}
                                    />
                                    <TimelineItem
                                        label="Saída"
                                        time={todayLog.exit}
                                        color="rose"
                                        icon={<LogOut className="w-4 h-4" />}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl p-6 text-white">
                            <div className="flex items-center gap-2 text-blue-100 mb-2">
                                <TrendingUp className="w-4 h-4" /> Horas Trabalhadas Hoje
                            </div>
                            <div className="text-5xl font-black tracking-tight">
                                {calculateWorkedHours()}
                            </div>
                            <div className="text-sm text-blue-200 mt-2">
                                Meta: 08:00
                            </div>
                            <div className="mt-4 bg-white/20 rounded-full h-2">
                                <div
                                    className="bg-white rounded-full h-2 transition-all duration-500"
                                    style={{ width: `${Math.min(100, (parseFloat(calculateWorkedHours().replace(":", ".")) / 8) * 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Ações do Funcionário - NOVAS */}
                        <div className="space-y-3">
                            <button
                                onClick={() => { setShowHistory(true); fetchWeekRecords(employee.id); }}
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center justify-between transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <History className="w-5 h-5 text-purple-400" />
                                    <span className="font-medium">Histórico da Semana</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-500" />
                            </button>

                            <button
                                onClick={() => { setShowMonthSummary(true); fetchMonthRecords(employee.id); }}
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center justify-between transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-cyan-400" />
                                    <span className="font-medium">Espelho de Ponto</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-500" />
                            </button>

                            <button
                                onClick={() => setShowCorrection(true)}
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center justify-between transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-400" />
                                    <span className="font-medium">Solicitar Correção</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-500" />
                            </button>

                            <button
                                onClick={() => setShowJustification(true)}
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center justify-between transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="w-5 h-5 text-green-400" />
                                    <span className="font-medium">Justificar Ausência</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-500" />
                            </button>

                            <button
                                onClick={() => setShowTimeOffRequest(true)}
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center justify-between transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <Coffee className="w-5 h-5 text-blue-400" />
                                    <span className="font-medium">Solicitar Folga</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-500" />
                            </button>

                            <button
                                onClick={exportToCSV}
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center justify-between transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                                    <span className="font-medium">Exportar Dia (CSV)</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Week Chart com dados reais */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-400" /> Resumo da Semana
                    </h2>
                    {weekRecords.length > 0 ? (
                        <div className="flex items-end justify-between gap-4 h-40">
                            {weekRecords.map((day, i) => (
                                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                                    <div
                                        className={`w-full rounded-xl transition-all ${i === weekRecords.length - 1 ? "bg-gradient-to-t from-blue-600 to-cyan-500" : day.hours > 0 ? "bg-slate-600" : "bg-slate-800"}`}
                                        style={{ height: `${Math.max(5, (day.hours / 10) * 100)}%` }}
                                    />
                                    <span className="text-xs font-bold text-slate-400">{day.dayName}</span>
                                    <span className="text-xs text-slate-500">{day.hours.toFixed(1)}h</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center">
                            <button
                                onClick={() => fetchWeekRecords(employee.id)}
                                className="text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                Clique para carregar dados da semana
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Histórico da Semana */}
            {showHistory && (
                <Modal title="Histórico da Semana" onClose={() => setShowHistory(false)}>
                    {loadingRecords ? (
                        <div className="p-8 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <div className="space-y-3 p-6">
                            {weekRecords.map((record) => (
                                <div key={record.date} className="bg-slate-800/50 rounded-xl p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-white">{record.dayName}</p>
                                        <p className="text-sm text-slate-400">{record.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-blue-400">{record.hours.toFixed(2)}h</p>
                                        <p className="text-xs text-slate-500">
                                            {record.entry ? new Date(record.entry).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'} - {record.exit ? new Date(record.exit).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-400 font-bold">Total da Semana</span>
                                    <span className="text-2xl font-black text-white">
                                        {weekRecords.reduce((acc, r) => acc + r.hours, 0).toFixed(2)}h
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>
            )}

            {/* Modal Espelho de Ponto */}
            {showMonthSummary && (
                <Modal title="Espelho de Ponto - Mês Atual" onClose={() => setShowMonthSummary(false)}>
                    {loadingRecords ? (
                        <div className="p-8 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="max-h-80 overflow-y-auto space-y-2 mb-4">
                                {monthRecords.length === 0 ? (
                                    <p className="text-center text-slate-500 py-8">Nenhum registro encontrado este mês</p>
                                ) : monthRecords.map((record) => {
                                    let hours = 0;
                                    if (record.entry && record.exit) {
                                        hours = (new Date(record.exit).getTime() - new Date(record.entry).getTime()) / 1000 / 60 / 60;
                                        if (record.lunchStart && record.lunchEnd) {
                                            hours -= (new Date(record.lunchEnd).getTime() - new Date(record.lunchStart).getTime()) / 1000 / 60 / 60;
                                        }
                                    }
                                    return (
                                        <div key={record.id} className="bg-slate-800/50 rounded-lg p-3 flex justify-between items-center text-sm">
                                            <span className="font-mono text-slate-400">{record.date}</span>
                                            <div className="flex gap-4 text-xs">
                                                <span className="text-emerald-400">{record.entry ? new Date(record.entry).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</span>
                                                <span className="text-amber-400">{record.lunchStart ? new Date(record.lunchStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</span>
                                                <span className="text-blue-400">{record.lunchEnd ? new Date(record.lunchEnd).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</span>
                                                <span className="text-rose-400">{record.exit ? new Date(record.exit).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</span>
                                            </div>
                                            <span className="font-bold text-white">{hours.toFixed(2)}h</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex justify-between items-center">
                                <div>
                                    <span className="text-blue-400 font-bold">Total do Mês</span>
                                    <p className="text-2xl font-black text-white">{calculateMonthTotals().toFixed(2)}h</p>
                                </div>
                                <button
                                    onClick={exportMonthToCSV}
                                    className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
                                >
                                    <ArrowDownToLine className="w-4 h-4" /> Exportar
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
            )}

            {/* Modal Solicitar Correção */}
            {showCorrection && (
                <Modal title="Solicitar Correção de Ponto" onClose={() => setShowCorrection(false)}>
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400">Data</label>
                            <input
                                type="date"
                                value={correctionData.date}
                                onChange={(e) => setCorrectionData({...correctionData, date: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400">Tipo de Registro</label>
                            <select
                                value={correctionData.type}
                                onChange={(e) => setCorrectionData({...correctionData, type: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500"
                            >
                                <option value="">Selecione...</option>
                                <option value="entry">Entrada</option>
                                <option value="lunchStart">Saída Almoço</option>
                                <option value="lunchEnd">Retorno Almoço</option>
                                <option value="exit">Saída</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400">Horário Correto</label>
                            <input
                                type="time"
                                value={correctionData.requestedTime}
                                onChange={(e) => setCorrectionData({...correctionData, requestedTime: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400">Motivo</label>
                            <textarea
                                value={correctionData.reason}
                                onChange={(e) => setCorrectionData({...correctionData, reason: e.target.value})}
                                placeholder="Descreva o motivo da correção..."
                                rows={3}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500 resize-none"
                            />
                        </div>
                        <button
                            onClick={submitCorrection}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                            <Send className="w-5 h-5" /> Enviar Solicitação
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal Justificar Ausência */}
            {showJustification && (
                <Modal title="Justificar Ausência/Falta" onClose={() => setShowJustification(false)}>
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400">Data da Ausência</label>
                            <input
                                type="date"
                                value={justificationData.date}
                                onChange={(e) => setJustificationData({...justificationData, date: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400">Motivo / Justificativa</label>
                            <textarea
                                value={justificationData.reason}
                                onChange={(e) => setJustificationData({...justificationData, reason: e.target.value})}
                                placeholder="Descreva o motivo da ausência (atestado médico, compromisso, etc.)..."
                                rows={4}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500 resize-none"
                            />
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4 text-sm text-slate-400">
                            <p>Anexar documentos? Envie por email para o RH após submeter esta justificativa.</p>
                        </div>
                        <button
                            onClick={submitJustification}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                            <Send className="w-5 h-5" /> Enviar Justificativa
                        </button>
                    </div>
                </Modal>
            )}

            {showTimeOffRequest && (
                <Modal title="Solicitar Folga" onClose={() => setShowTimeOffRequest(false)}>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400">Data Início *</label>
                                <input
                                    type="date"
                                    value={timeOffData.startDate}
                                    onChange={(e) => setTimeOffData({...timeOffData, startDate: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400">Data Fim *</label>
                                <input
                                    type="date"
                                    value={timeOffData.endDate}
                                    onChange={(e) => setTimeOffData({...timeOffData, endDate: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400">Tipo de Folga *</label>
                            <select
                                value={timeOffData.type}
                                onChange={(e) => setTimeOffData({...timeOffData, type: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500"
                            >
                                <option value="personal">☕ Folga Pessoal</option>
                                <option value="vacation">🏖️ Férias</option>
                                <option value="sick">🤒 Atestado Médico</option>
                                <option value="medical">🏥 Consulta Médica</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400">Motivo / Justificativa *</label>
                            <textarea
                                value={timeOffData.reason}
                                onChange={(e) => setTimeOffData({...timeOffData, reason: e.target.value})}
                                placeholder="Descreva o motivo da folga (férias programadas, consulta, etc.)..."
                                rows={4}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500 resize-none"
                                required
                            />
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300">
                            <p className="font-bold mb-1">ℹ️ Informação Importante</p>
                            <p>Sua solicitação de folga será enviada para análise do administrador. Você receberá uma notificação quando for aprovada ou rejeitada.</p>
                        </div>
                        <button
                            onClick={submitTimeOffRequest}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                            <Send className="w-5 h-5" /> Enviar Solicitação de Folga
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// Componente Timeline Item
function TimelineItem({ label, time, color, icon }: { label: string; time: string | null; color: string; icon: React.ReactNode }) {
    const colors: Record<string, string> = {
        emerald: "bg-emerald-500 border-emerald-500",
        amber: "bg-amber-500 border-amber-500",
        blue: "bg-blue-500 border-blue-500",
        rose: "bg-rose-500 border-rose-500"
    };

    return (
        <div className="flex items-center gap-4 relative">
            <div className={`w-12 h-12 rounded-full ${time ? colors[color] : "bg-slate-800 border-2 border-slate-700"} flex items-center justify-center z-10`}>
                {time ? icon : <span className="w-3 h-3 rounded-full bg-slate-600" />}
            </div>
            <div className="flex-1">
                <p className={`font-bold ${time ? "text-white" : "text-slate-500"}`}>{label}</p>
                {time ? (
                    <p className="text-lg font-mono text-slate-300">{new Date(time).toLocaleTimeString()}</p>
                ) : (
                    <p className="text-sm text-slate-600">Aguardando registro...</p>
                )}
            </div>
            {time && (
                <CheckCircle2 className={`w-5 h-5 text-${color}-500`} />
            )}
        </div>
    );
}

// Componente Modal reutilizável
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-xl font-black text-white">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
