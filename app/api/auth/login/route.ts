import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { pin } = await request.json();

        const employee = await prisma.employee.findUnique({
            where: { pin }
        });

        if (!employee) {
            return NextResponse.json({ error: 'PIN inválido' }, { status: 401 });
        }

        return NextResponse.json(employee);
    } catch (error) {
        console.error('[LOGIN] Erro ao autenticar:', error);
        return NextResponse.json({ error: 'Erro ao autenticar' }, { status: 500 });
    }
}
