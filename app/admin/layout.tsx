"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    Users,
    FileText,
    LogOut,
    Clock,
    BarChart3,
    CheckSquare,
    Settings,
    Bell,
    Loader2,
    X,
    Coffee,
    Timer
} from "lucide-react";
import { cn } from "@/lib/utils";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: Users, label: "Funcionários", href: "/admin/employees" },
    { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
    { icon: FileText, label: "Relatórios", href: "/admin/reports" },
    { icon: CheckSquare, label: "Aprovações", href: "/admin/approvals" },
    { icon: Coffee, label: "Folgas", href: "/admin/timeoffs" },
    { icon: Timer, label: "Horas Extras", href: "/admin/overtime" },
    { icon: Bell, label: "Avisos", href: "/admin/notices" },
    { icon: Settings, label: "Configurações", href: "/admin/settings" },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [adminUser, setAdminUser] = useState<{ username: string } | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/admin/notices");
            if (!res.ok) {
                console.error('Erro na resposta da API de notificações:', res.status, res.statusText);
                setNotifications([]);
                setUnreadCount(0);
                return;
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setNotifications(data);
                setUnreadCount(data.length);
            } else {
                console.error('Dados de notificações inválidos:', data);
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Erro ao buscar notificações:", error);
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    useEffect(() => {
        // Não verificar auth na página de login
        if (pathname === "/admin/login") {
            setIsLoading(false);
            setIsAuthenticated(true); // Permitir acesso à página de login
            return;
        }

        // Verificar se está autenticado
        const token = localStorage.getItem("adminToken");
        const user = localStorage.getItem("adminUser");

        if (!token || !user) {
            router.push("/admin/login");
            return;
        }

        try {
            setAdminUser(JSON.parse(user));
            setIsAuthenticated(true);
            // Buscar notificações após autenticar
            setTimeout(() => fetchNotifications(), 500);
        } catch {
            router.push("/admin/login");
        } finally {
            setIsLoading(false);
        }
    }, [pathname, router]);

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        router.push("/admin/login");
    };

    // Mostrar loading enquanto verifica auth
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    // Se for a página de login, renderizar apenas o children
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    // Se não estiver autenticado, não renderizar nada (vai redirecionar)
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-200">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-800 flex flex-col">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Clock className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-black text-xl tracking-tight text-white">ADM Ponto</span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                pathname === item.href
                                    ? "bg-blue-600/10 text-blue-400 font-bold"
                                    : "hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5",
                                pathname === item.href ? "text-blue-400" : "group-hover:text-blue-400"
                            )} />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all group"
                    >
                        <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
                    <h1 className="text-xl font-bold text-white">
                        {menuItems.find(item => item.href === pathname)?.label || "Painel"}
                    </h1>
                    <div className="flex items-center gap-4 relative">
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 hover:bg-slate-800 rounded-xl transition-all"
                        >
                            <Bell className="w-5 h-5 text-slate-400" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div className="absolute top-16 right-0 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
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
                                        notifications.map((notice) => (
                                            <div 
                                                key={notice.id}
                                                className="p-4 border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                                        notice.type === "urgent" ? "bg-red-500" : 
                                                        notice.type === "warning" ? "bg-yellow-500" : 
                                                        "bg-blue-500"
                                                    }`} />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-white text-sm truncate">{notice.title}</h4>
                                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{notice.content}</p>
                                                        <span className="text-xs text-slate-500 mt-2 inline-block">
                                                            {new Date(notice.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-3 border-t border-slate-800 bg-slate-950/50">
                                    <Link
                                        href="/admin/notices"
                                        className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors"
                                        onClick={() => setShowNotifications(false)}
                                    >
                                        Ver todos os avisos →
                                    </Link>
                                </div>
                            </div>
                        )}
                        
                        <div className="text-right">
                            <p className="text-sm font-bold text-white">{adminUser?.username || "Admin"}</p>
                            <p className="text-xs text-slate-500">Administrador</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white">
                            {adminUser?.username?.charAt(0).toUpperCase() || "A"}
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    <AdminProtectedRoute>
                        {children}
                    </AdminProtectedRoute>
                </div>
            </main>
        </div>
    );
}
