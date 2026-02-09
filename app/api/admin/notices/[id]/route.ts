import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Dynamically import Prisma to avoid static analysis issues
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        const body = await request.json();
        const { title, content, type, active } = body;

        const notice = await prisma.notice.update({
            where: { id: params.id },
            data: {
                title,
                content,
                type,
                active,
            },
        });

        return NextResponse.json(notice);
    } catch (error) {
        console.error('Error updating notice:', error);
        return NextResponse.json({ error: 'Failed to update notice' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Dynamically import Prisma to avoid static analysis issues
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        await prisma.notice.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ message: 'Notice deleted successfully' });
    } catch (error) {
        console.error('Error deleting notice:', error);
        return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 });
    }
}