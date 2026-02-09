import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Dynamically import Prisma to avoid static analysis issues
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        const notices = await prisma.notice.findMany({
            where: { active: true },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(notices);
    } catch (error) {
        console.error('Error fetching notices:', error);
        return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        // Dynamically import Prisma to avoid static analysis issues
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        const body = await request.json();
        const { title, content, type } = body;

        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }

        const notice = await prisma.notice.create({
            data: {
                title,
                content,
                type: type || 'info',
                active: true,
            },
        });

        // Buscar todos os funcionários para notificá-los
        const employees = await prisma.employee.findMany({
            select: { id: true, name: true }
        });

        // Criar notificação para cada funcionário
        if (employees.length > 0) {
            await Promise.all(
                employees.map(employee =>
                    prisma.employeeNotification.create({
                        data: {
                            employeeId: employee.id,
                            title: `📢 Aviso: ${title}`,
                            message: content,
                            type: type || 'info'
                        }
                    })
                )
            );
            console.log(`[NOTICES API] Aviso "${title}" criado e notificações enviadas para ${employees.length} funcionários`);
        }

        return NextResponse.json(notice);
    } catch (error) {
        console.error('Error creating notice:', error);
        return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 });
    }
}