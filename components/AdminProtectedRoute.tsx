"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("adminToken");
            
            if (!token) {
                toast.error("Acesso negado. Faça login como administrador.");
                router.push("/admin/login");
                return;
            }

            // Verificar se o token ainda é válido (implementação simples)
            try {
                const tokenData = JSON.parse(atob(token.split('.')[1] || ''));
                const now = Date.now() / 1000;
                
                if (tokenData.exp && tokenData.exp < now) {
                    localStorage.removeItem("adminToken");
                    localStorage.removeItem("adminUser");
                    toast.error("Sessão expirada. Faça login novamente.");
                    router.push("/admin/login");
                    return;
                }
            } catch (error) {
                // Se não conseguir decodificar, assumir que é um token simples válido
                // Em produção, seria melhor validar com o servidor
            }
        };

        checkAuth();
    }, [router]);

    return <>{children}</>;
}