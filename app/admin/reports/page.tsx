"use client";

import { useState, useEffect } from "react";
import { FileSpreadsheet, Download, Filter, Calendar as MenuCalendar, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Record {
    id: string;
    date: string;
    entry: string | null;
    lunchStart: string | null;
    lunchEnd: string | null;
    exit: string | null;
    employee: {
        name: string;
        dept: string;
        hourlyRate: number;
    };
}

export default function ReportsPage() {
    const [records, setRecords] = useState<Record[]>([]);
    const [employees, setEmployees] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
    const [selectedEmployee, setSelectedEmployee] = useState("");

    const fetchEmployees = async () => {
        try {
            const res = await fetch("/api/admin/employees");
            if (!res.ok) {
                console.error('Erro na resposta da API de funcionários:', res.status, res.statusText);
                setEmployees([]);
                return;
            }
            const data = await res.json();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erro ao carregar funcionários:", error);
            setEmployees([]);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const url = new URL("/api/admin/reports", window.location.origin);
            url.searchParams.append("month", selectedMonth);
            if (selectedEmployee) url.searchParams.append("employeeId", selectedEmployee);

            console.log('[REPORTS PAGE] Buscando com URL:', url.toString());

            const res = await fetch(url.toString());
            if (!res.ok) {
                console.error('Erro na resposta da API de relatórios:', res.status, res.statusText);
                setRecords([]);
                return;
            }
            const data = await res.json();
            
            console.log('[REPORTS PAGE] Dados recebidos:', {
                count: Array.isArray(data) ? data.length : 0,
                data: data
            });
            
            setRecords(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[REPORTS PAGE] Erro:', error);
            toast.error("Erro ao carregar relatórios");
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        fetchReports();
    }, [selectedMonth, selectedEmployee]);

    const calculateDailyFinancials = (r: Record) => {
        if (!r.entry || !r.exit) return { hours: 0, pay: 0 };

        const entry = new Date(r.entry);
        const exit = new Date(r.exit);
        const totalMinutes = differenceInMinutes(exit, entry);

        let breakMinutes = 0;
        if (r.lunchStart && r.lunchEnd) {
            breakMinutes = differenceInMinutes(new Date(r.lunchEnd), new Date(r.lunchStart));
        }

        const workedHours = Math.max(0, (totalMinutes - breakMinutes) / 60);
        const pay = workedHours * (r.employee.hourlyRate || 0);

        return { hours: workedHours, pay };
    };

    const totals = records.reduce((acc, curr) => {
        const { hours, pay } = calculateDailyFinancials(curr);
        return {
            hours: acc.hours + hours,
            pay: acc.pay + pay
        };
    }, { hours: 0, pay: 0 });

    const exportAllToCSV = () => {
        if (records.length === 0) return toast.error("Nenhum dado para exportar");

        const headers = ["Nome do Funcionário", "Departamento", "Data", "Horário de Entrada", "Início do Almoço", "Fim do Almoço", "Horário de Saída", "Horas Trabalhadas", "Valor por Hora (R$)", "Valor a Receber (R$)"];
        const rows = records.map(r => {
            const { hours, pay } = calculateDailyFinancials(r);
            return [
                r.employee.name,
                r.employee.dept || "N/A",
                new Date(r.date + 'T00:00:00').toLocaleDateString('pt-BR'),
                r.entry ? format(new Date(r.entry), "HH:mm:ss") : "--",
                r.lunchStart ? format(new Date(r.lunchStart), "HH:mm:ss") : "--",
                r.lunchEnd ? format(new Date(r.lunchEnd), "HH:mm:ss") : "--",
                r.exit ? format(new Date(r.exit), "HH:mm:ss") : "--",
                hours.toFixed(2).replace('.', ',') + "h",
                "R$ " + (r.employee.hourlyRate || 0).toFixed(2).replace('.', ','),
                "R$ " + pay.toFixed(2).replace('.', ',')
            ];
        });

        // Add summary row to CSV
        rows.push([
            "*** TOTAIS ***",
            "",
            "",
            "",
            "",
            "",
            "",
            totals.hours.toFixed(2).replace('.', ',') + "h",
            "",
            "R$ " + totals.pay.toFixed(2).replace('.', ',')
        ]);

        const csvContent = [headers.join(";"), ...rows.map(row => row.join(";"))].join("\n");
        const BOM = "\uFEFF"; // UTF-8 BOM para Excel
        const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Relatório_Financeiro_${selectedMonth.replace('-', '_')}.csv`);
        link.click();
        toast.success("Relatório financeiro exportado com sucesso!");
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">Relatórios Consolidados</h2>
                    <p className="text-slate-400 mt-1">Visualize a jornada e os custos estimados da equipe.</p>
                </div>
                <button
                    onClick={exportAllToCSV}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-emerald-500/10 active:scale-95"
                >
                    <Download className="w-5 h-5" /> Exportar CSV Completo
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 shrink-0">
                        <MenuCalendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="space-y-1 w-full">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mês de Referência</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent text-white font-bold outline-none cursor-pointer hover:text-blue-400 transition-colors w-full"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 shrink-0">
                        <Filter className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="space-y-1 w-full">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Filtrar por Funcionário</label>
                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="bg-transparent text-white font-bold outline-none cursor-pointer hover:text-blue-400 transition-colors w-full appearance-none"
                        >
                            <option value="" className="bg-slate-900">Todos os Funcionários</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id} className="bg-slate-900">{emp.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl flex justify-between items-center group">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Estimado (Período)</p>
                        <p className="text-2xl font-black text-blue-400 tracking-tight">R$ {totals.pay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Horas</p>
                        <p className="text-lg font-black text-white">{totals.hours.toFixed(2)}h</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="p-32 flex flex-col items-center gap-6">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Gerando relatório...</p>
                    </div>
                ) : records.length === 0 ? (
                    <div className="p-32 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-950 rounded-[2rem] mx-auto flex items-center justify-center mb-6">
                            <FileSpreadsheet className="w-10 h-10 text-slate-700" />
                        </div>
                        <p className="text-slate-400 font-bold text-lg">Nenhum registro encontrado para este mês.</p>
                        <p className="text-slate-600 text-sm max-w-xs mx-auto">Selecine outro período ou verifique se os funcionários já registraram seus pontos.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/50">
                                    <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Funcionário</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-center">Data</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-center">Horários</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-center">Horas Trab.</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-right">Valor/Hora</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-right">A Receber</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 text-slate-300">
                                {records.map((record) => {
                                    const { hours, pay } = calculateDailyFinancials(record);
                                    return (
                                        <tr key={record.id} className="hover:bg-slate-800/20 transition-colors group">
                                            <td className="px-6 py-5">
                                                <p className="font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{record.employee.name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{record.employee.dept}</p>
                                            </td>
                                            <td className="px-6 py-5 text-center font-mono font-bold text-sm">
                                                <span className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">{record.date}</span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex items-center justify-center gap-2 font-mono text-xs font-bold">
                                                    <span className="text-emerald-400" title="Entrada">{record.entry ? format(new Date(record.entry), "HH:mm") : "--:--"}</span>
                                                    <span className="text-slate-600">→</span>
                                                    <span className="text-amber-500" title="Almoço">{record.lunchStart ? format(new Date(record.lunchStart), "HH:mm") : "--:--"}</span>
                                                    <span className="text-slate-600">|</span>
                                                    <span className="text-indigo-400" title="Retorno">{record.lunchEnd ? format(new Date(record.lunchEnd), "HH:mm") : "--:--"}</span>
                                                    <span className="text-slate-600">→</span>
                                                    <span className="text-rose-500" title="Saída">{record.exit ? format(new Date(record.exit), "HH:mm") : "--:--"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center font-mono font-black text-white">
                                                {hours.toFixed(2)}h
                                            </td>
                                            <td className="px-6 py-5 text-right font-mono text-slate-400">
                                                R$ {(record.employee.hourlyRate || 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-5 text-right font-mono font-black text-emerald-400">
                                                R$ {pay.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
