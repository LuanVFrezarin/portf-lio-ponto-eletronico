import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const employeeId = request.nextUrl.searchParams.get('employeeId');
    
    if (!employeeId) {
        return NextResponse.json({ error: 'employeeId é obrigatório' }, { status: 400 });
    }

    try {
        const notifications = await prisma.employeeNotification.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(notifications);
    } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, read } = body;

        const notification = await prisma.employeeNotification.update({
            where: { id },
            data: { read }
        });

        return NextResponse.json(notification);
    } catch (error) {
        console.error('Erro ao atualizar notificação:', error);
        return NextResponse.json({ error: 'Erro ao atualizar notificação' }, { status: 500 });
    }
}