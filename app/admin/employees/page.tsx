"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Search, MoreVertical, Shield, Briefcase, Building2, Key, Loader2, X, FileUp } from "lucide-react";
import { toast } from "sonner";

interface Employee {
    id: string;
    name: string;
    dept: string;
    role: string;
    pin: string;
    avatar: string;
    email?: string;
    phone?: string;
    cpf?: string;
    address?: string;
    hourlyRate?: number;
}

interface EmployeeWeeklyOffDay {
    id: string;
    employeeId: string;
    dayOfWeek: number;
}

const DAYS_OF_WEEK = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' }
];

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [weeklyOffDays, setWeeklyOffDays] = useState<EmployeeWeeklyOffDay[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [creating, setCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const [formData, setFormData] = useState({
        name: "",
        dept: "",
        role: "",
        email: "",
        phone: "",
        cpf: "",
        address: "",
        hourlyRate: ""
    });

    const handleEditEmployee = (employee: Employee) => {
        setFormData({
            name: employee.name,
            dept: employee.dept,
            role: employee.role,
            email: employee.email || "",
            phone: employee.phone || "",
            cpf: employee.cpf || "",
            address: employee.address || "",
            hourlyRate: employee.hourlyRate?.toString() || ""
        });
        setSelectedEmployee(employee);
        setIsEditing(true);
        setShowDetailModal(false);
        setShowModal(true);
    };

    const fetchWeeklyOffDays = async (employeeId: string) => {
        try {
            const res = await fetch(`/api/admin/employees/${employeeId}/weekly-off-days`);
            const data = await res.json();
            setWeeklyOffDays(data);
        } catch (error) {
            console.error('Erro ao buscar folgas:', error);
        }
    };

    const handleToggleOffDay = async (dayOfWeek: number) => {
        if (!selectedEmployee) return;

        const hasDay = weeklyOffDays.some(d => d.dayOfWeek === dayOfWeek);

        try {
            if (hasDay) {
                // Remover
                const res = await fetch(`/api/admin/employees/${selectedEmployee.id}/weekly-off-days`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dayOfWeek })
                });
                if (res.ok) {
                    toast.success('Folga removida!');
                    await fetchWeeklyOffDays(selectedEmployee.id);
                }
            } else {
                // Adicionar
                const res = await fetch(`/api/admin/employees/${selectedEmployee.id}/weekly-off-days`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dayOfWeek })
                });
                if (res.ok) {
                    toast.success('Folga adicionada!');
                    await fetchWeeklyOffDays(selectedEmployee.id);
                }
            }
        } catch (error) {
            toast.error('Erro ao atualizar folga');
        }
    };

    const handleDeleteEmployee = async (employeeId: string) => {
        if (!confirm("Tem certeza que deseja excluir este funcionário?")) return;
        
        try {
            const res = await fetch(`/api/admin/employees/${employeeId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                toast.success("Funcionário excluído com sucesso!");
                setShowDetailModal(false);
                fetchEmployees();
            } else {
                toast.error("Erro ao excluir funcionário");
            }
        } catch (error) {
            toast.error("Erro de conexão");
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch("/api/admin/employees");
            const data = await res.json();
            setEmployees(data);
        } catch (error) {
            toast.error("Erro ao carregar funcionários");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            const rows = text.split('\n').filter(row => row.trim() !== '');
            const startIndex = rows[0].toLowerCase().includes('nome') ? 1 : 0;

            const importedEmployees = rows.slice(startIndex).map(row => {
                const [name, dept, role, email, phone, cpf, hourlyRate, ...addressParts] = row.split(',');
                return {
                    name: name?.trim(),
                    dept: dept?.trim(),
                    role: role?.trim(),
                    email: email?.trim(),
                    phone: phone?.trim(),
                    cpf: cpf?.trim(),
                    hourlyRate: hourlyRate?.trim(),
                    address: addressParts.join(',').trim()
                };
            }).filter(e => e.name);

            if (importedEmployees.length === 0) return toast.error("Nenhum dado válido encontrado");

            const toastId = toast.loading("Importando funcionários...");

            try {
                const res = await fetch("/api/admin/employees/import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ employees: importedEmployees }),
                });

                const data = await res.json();

                if (data.success) {
                    toast.success(`${data.count} funcionários importados com sucesso!`, { id: toastId });
                    fetchEmployees();
                } else {
                    toast.error("Erro na importação", { id: toastId });
                }
            } catch (error) {
                toast.error("Erro de conexão", { id: toastId });
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const url = isEditing ? `/api/admin/employees/${selectedEmployee?.id}` : "/api/admin/employees";
            const method = isEditing ? "PUT" : "POST";
            
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success(isEditing ? "Funcionário atualizado com sucesso!" : "Funcionário cadastrado com sucesso!");
                setShowModal(false);
                setIsEditing(false);
                setFormData({
                    name: "",
                    dept: "",
                    role: "",
                    email: "",
                    phone: "",
                    cpf: "",
                    address: "",
                    hourlyRate: ""
                });
                setSelectedEmployee(null);
                fetchEmployees();
            } else {
                toast.error(isEditing ? "Erro ao atualizar funcionário" : "Erro ao cadastrar funcionário");
            }
        } catch (error) {
            toast.error("Erro na comunicação com o servidor");
        } finally {
            setCreating(false);
        }
    };
    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-white">Equipe</h2>
                    <p className="text-slate-400 mt-1">Gerencie todos os funcionários e seus acessos.</p>
                </div>
                <div className="flex gap-4">
                    <label className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-slate-900/20 active:scale-95">
                        <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
                        <FileUp className="w-5 h-5 text-slate-400" />
                        <span className="text-slate-300">Importar CSV</span>
                    </label>

                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Novo Funcionário
                    </button>
                </div>
            </div>

            {/* Filters/Search */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por nome, cargo ou departamento..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-slate-200 outline-none focus:border-blue-500 transition-all"
                    />
                </div>
            </div>

            {/* Employee List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                {loading ? (
                    <div className="p-20 flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                        <p className="text-slate-500 font-medium">Carregando sua equipe...</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/50">
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Funcionário</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Departamento/Cargo</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">PIN de Acesso</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredEmployees.map((emp) => (
                                <tr
                                    key={emp.id}
                                    className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                                    onClick={() => {
                                        setSelectedEmployee(emp);
                                        fetchWeeklyOffDays(emp.id);
                                        setShowDetailModal(true);
                                    }}
                                >
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center font-black text-blue-400">
                                                {emp.avatar}
                                            </div>
                                            <span className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{emp.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <Building2 className="w-3 h-3 text-slate-500" />
                                                <span className="text-sm">{emp.dept}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Briefcase className="w-3 h-3" />
                                                <span className="text-xs">{emp.role}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-center">
                                        <div className="inline-flex items-center gap-2 bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl font-mono text-xl font-black text-blue-500 tracking-widest shadow-inner">
                                            {emp.pin}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-500">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedEmployee && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-blue-500/20 uppercase">
                                    {selectedEmployee.avatar}
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">{selectedEmployee.name}</h3>
                                    <p className="text-blue-400 font-bold uppercase tracking-widest text-xs mt-1">{selectedEmployee.dept} • {selectedEmployee.role}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="p-3 hover:bg-slate-800 rounded-2xl transition-colors">
                                <X className="w-6 h-6 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-10">
                            <div className="grid grid-cols-2 gap-8">
                                <DetailItem label="Email" value={selectedEmployee.email || "Não informado"} />
                                <DetailItem label="Telefone" value={selectedEmployee.phone || "Não informado"} />
                                <DetailItem label="CPF" value={selectedEmployee.cpf || "Não informado"} />
                                <DetailItem label="Valor Hora" value={`R$ ${(selectedEmployee.hourlyRate || 0).toFixed(2)}`} />
                                <div className="col-span-2">
                                    <DetailItem label="Endereço" value={selectedEmployee.address || "Não informado"} />
                                </div>
                                <div className="col-span-2 bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Dias de Folga na Semana</p>
                                    <div className="grid grid-cols-7 gap-2">
                                        {DAYS_OF_WEEK.map(day => {
                                            const hasDay = weeklyOffDays.some(d => d.dayOfWeek === day.value);
                                            return (
                                                <button
                                                    key={day.value}
                                                    onClick={() => handleToggleOffDay(day.value)}
                                                    className={`p-3 rounded-xl font-bold text-xs transition-all ${
                                                        hasDay
                                                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 border'
                                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                                                    }`}
                                                >
                                                    {day.label.slice(0, 3)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="col-span-2 bg-slate-950/50 p-6 rounded-3xl border border-slate-800 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PIN de Acesso</p>
                                        <p className="text-3xl font-mono font-black text-blue-500 tracking-[0.3em] mt-2">{selectedEmployee.pin}</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => handleEditEmployee(selectedEmployee)}
                                            className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 px-6 py-3 rounded-2xl font-bold transition-all"
                                        >
                                            Editar
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteEmployee(selectedEmployee.id)}
                                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-3 rounded-2xl font-bold transition-all"
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Registration Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden">
                        <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-2xl font-black text-white">{isEditing ? "Editar Funcionário" : "Novo Funcionário"}</h3>
                            <button 
                                onClick={() => {
                                    setShowModal(false);
                                    setIsEditing(false);
                                    setSelectedEmployee(null);
                                    setFormData({
                                        name: "",
                                        dept: "",
                                        role: "",
                                        email: "",
                                        phone: "",
                                        cpf: "",
                                        address: "",
                                        hourlyRate: ""
                                    });
                                }} 
                                className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <X className="w-6 h-6 text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Nome Completo</label>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        type="text"
                                        placeholder="Ex: João Silva"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Email</label>
                                    <input
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        type="email"
                                        placeholder="email@empresa.com"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Telefone</label>
                                    <input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        type="text"
                                        placeholder="(99) 99999-9999"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">CPF</label>
                                    <input
                                        value={formData.cpf}
                                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                        type="text"
                                        placeholder="000.000.000-00"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Valor Hora (R$)</label>
                                    <input
                                        value={formData.hourlyRate}
                                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Endereço</label>
                                    <input
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        type="text"
                                        placeholder="Rua, Número, Bairro"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Departamento</label>
                                    <input
                                        required
                                        value={formData.dept}
                                        onChange={(e) => setFormData({ ...formData, dept: e.target.value })}
                                        type="text"
                                        placeholder="Ex: RH"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Cargo</label>
                                    <input
                                        required
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        type="text"
                                        placeholder="Ex: Analista"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex gap-4">
                                <div className="p-2 bg-blue-500/20 rounded-xl h-fit">
                                    <Key className="w-5 h-5 text-blue-400" />
                                </div>
                                <p className="text-xs text-blue-200/60 leading-relaxed">
                                    Ao cadastrar, o sistema gerará automaticamente um <span className="text-blue-400 font-bold">PIN de 6 dígitos</span> exclusivo para este colaborador.
                                </p>
                            </div>

                            <button
                                disabled={creating}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {creating ? <Loader2 className="w-6 h-6 animate-spin" /> : (isEditing ? "Atualizar Funcionário" : "Finalizar Cadastro")}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
            <p className="text-white font-bold">{value}</p>
        </div>
    );
}
