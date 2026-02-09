import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Dynamically import Prisma to avoid static analysis issues
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        const overtimeId = params.id;
        const body = await request.json();

        // Verificar se a hora extra existe
        const existingOvertime = await prisma.overtime.findUnique({
            where: { id: overtimeId },
            include: { employee: true }
        });

        if (!existingOvertime) {
            return NextResponse.json(
                { success: false, message: "Registro de horas extras não encontrado" },
                { status: 404 }
            );
        }

        // Se está apenas mudando o status (aprovação/rejeição)
        if (body.status && !body.employeeId) {
            const updatedOvertime = await prisma.overtime.update({
                where: { id: overtimeId },
                data: {
                    status: body.status,
                    adminComment: body.adminComment,
                    approvedBy: body.status === 'approved' ? "Admin" : undefined
                },
                include: {
                    employee: {
                        select: {
                            id: true,
                            name: true,
                            dept: true,
                            role: true,
                            email: true,
                            hourlyRate: true
                        }
                    }
                }
            });

            // Criar notificação para o funcionário
            const notificationMessage = body.status === 'approved' 
                ? `Suas ${existingOvertime.hours}h extras do dia ${existingOvertime.date} foram aprovadas!` 
                : `Suas ${existingOvertime.hours}h extras do dia ${existingOvertime.date} foram rejeitadas.`;

            const notificationDetail = body.adminComment 
                ? ` Comentário: ${body.adminComment}` 
                : '';

            await prisma.employeeNotification.create({
                data: {
                    employeeId: existingOvertime.employeeId,
                    title: `Horas Extras ${body.status === 'approved' ? 'Aprovadas' : 'Rejeitadas'}`,
                    message: notificationMessage + notificationDetail,
                    type: body.status === 'approved' ? "success" : "error"
                }
            });

            console.log(`[OVERTIME API] Status atualizado para ${body.status}: ${overtimeId}`);

            return NextResponse.json({
                success: true,
                message: `Horas extras ${body.status === 'approved' ? 'aprovadas' : 'rejeitadas'} com sucesso`,
                overtime: updatedOvertime
            });
        }

        // Atualização completa do registro
        const { employeeId, date, hours, reason, status, adminComment } = body;

        if (!employeeId || !date || !hours || !reason) {
            return NextResponse.json(
                { success: false, message: "Campos obrigatórios não preenchidos" },
                { status: 400 }
            );
        }

        if (parseFloat(hours) <= 0 || parseFloat(hours) > 12) {
            return NextResponse.json(
                { success: false, message: "As horas extras devem estar entre 0.5 e 12 horas" },
                { status: 400 }
            );
        }

        // Verificar conflito de datas apenas com outros registros (exceto o atual)
        const conflictingOvertime = await prisma.overtime.findFirst({
            where: {
                id: { not: overtimeId },
                employeeId,
                date
            }
        });

        if (conflictingOvertime) {
            return NextResponse.json(
                { success: false, message: "Já existe um registro de horas extras para este funcionário nesta data" },
                { status: 400 }
            );
        }

        const updatedOvertime = await prisma.overtime.update({
            where: { id: overtimeId },
            data: {
                employeeId,
                date,
                hours: parseFloat(hours),
                reason,
                status,
                adminComment,
                approvedBy: status === 'approved' ? "Admin" : undefined
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        dept: true,
                        role: true,
                        email: true,
                        hourlyRate: true
                    }
                }
            }
        });

        console.log(`[OVERTIME API] Horas extras atualizadas: ${overtimeId}`);

        return NextResponse.json({
            success: true,
            message: "Horas extras atualizadas com sucesso",
            overtime: updatedOvertime
        });

    } catch (error) {
        console.error('[OVERTIME API] Erro ao atualizar horas extras:', error);
        return NextResponse.json(
            { success: false, message: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Dynamically import Prisma to avoid static analysis issues
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        const overtimeId = params.id;

        // Verificar se o registro existe
        const existingOvertime = await prisma.overtime.findUnique({
            where: { id: overtimeId },
            include: { employee: true }
        });

        if (!existingOvertime) {
            return NextResponse.json(
                { success: false, message: "Registro de horas extras não encontrado" },
                { status: 404 }
            );
        }

        await prisma.overtime.delete({
            where: { id: overtimeId }
        });

        // Criar notificação para o funcionário
        await prisma.employeeNotification.create({
            data: {
                employeeId: existingOvertime.employeeId,
                title: "Horas Extras Canceladas",
                message: `Seu registro de ${existingOvertime.hours}h extras do dia ${existingOvertime.date} foi cancelado.`,
                type: "warning"
            }
        });

        console.log(`[OVERTIME API] Horas extras excluídas: ${overtimeId}`);

        return NextResponse.json({
            success: true,
            message: "Horas extras excluídas com sucesso"
        });

    } catch (error) {
        console.error('[OVERTIME API] Erro ao excluir horas extras:', error);
        return NextResponse.json(
            { success: false, message: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}