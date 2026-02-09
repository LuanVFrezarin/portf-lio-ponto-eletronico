"use client";

import { Activity } from "lucide-react";

export function RefreshButton() {
    return (
        <button
            onClick={() => window.location.reload()}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
        >
            <Activity className="w-4 h-4" />
            Atualizar
        </button>
    );
}