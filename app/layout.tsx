import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from "sonner";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Ponto Eletrônico | Luan Dev',
    description: 'Sistema profissional de registro de ponto',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR">
            <body className={inter.className}>
                {children}
                <Toaster position="top-right" richColors />
            </body>
        </html>
    )
}
