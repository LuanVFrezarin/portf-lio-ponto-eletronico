import prisma from "@/lib/prisma";

// GET - Buscar dias de folga de um funcionário
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const offDays = await prisma.employeeWeeklyOffDay.findMany({
            where: { employeeId: params.id },
            orderBy: { dayOfWeek: 'asc' }
        });

        return Response.json(offDays);
    } catch (error) {
        console.error('Erro ao buscar dias de folga:', error);
        return Response.json({ error: 'Erro ao buscar dias de folga' }, { status: 500 });
    }
}

// POST - Adicionar dia de folga
export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const { dayOfWeek } = await request.json();

        if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
            return Response.json({ error: 'dayOfWeek deve ser entre 0-6' }, { status: 400 });
        }

        // Verificar se já existe
        const existing = await prisma.employeeWeeklyOffDay.findUnique({
            where: {
                employeeId_dayOfWeek: {
                    employeeId: params.id,
                    dayOfWeek
                }
            }
        });

        if (existing) {
            return Response.json({ error: 'Este dia de folga já está configurado' }, { status: 400 });
        }

        const offDay = await prisma.employeeWeeklyOffDay.create({
            data: {
                employeeId: params.id,
                dayOfWeek
            }
        });

        return Response.json(offDay);
    } catch (error) {
        console.error('Erro ao adicionar dia de folga:', error);
        return Response.json({ error: 'Erro ao adicionar dia de folga' }, { status: 500 });
    }
}

// DELETE - Remover dia de folga
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { dayOfWeek } = await request.json();

        await prisma.employeeWeeklyOffDay.delete({
            where: {
                employeeId_dayOfWeek: {
                    employeeId: params.id,
                    dayOfWeek
                }
            }
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Erro ao remover dia de folga:', error);
        return Response.json({ error: 'Erro ao remover dia de folga' }, { status: 500 });
    }
}
