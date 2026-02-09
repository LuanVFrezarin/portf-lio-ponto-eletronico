import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const timeOffId = params.id;
        const body = await request.json();
        const { employeeId, startDate, endDate, type, reason, status } = body;

        console.log(`[TIMEOFFS API PUT] INICIANDO - Recebido:`, { 
            timeOffId, 
            status, 
            employeeId, 
            startDate, 
            endDate,
            reason,
            bodyKeys: Object.keys(body)
        });

        if (!employeeId || !startDate || !endDate || !type || !status) {
            console.error(`[TIMEOFFS API PUT] Campos obrigatórios faltando:`, { employeeId, startDate, endDate, type, status });
            return NextResponse.json(
                { success: false, message: "Campos obrigatórios não preenchidos" },
                { status: 400 }
            );
        }

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            console.error(`[TIMEOFFS API PUT] Status inválido recebido: "${status}"`);
            return NextResponse.json(
                { success: false, message: "Status inválido" },
                { status: 400 }
            );
        }

        // Verificar se a folga existe
        const existingTimeOff = await prisma.timeOff.findUnique({
            where: { id: timeOffId },
            include: { employee: true }
        });

        console.log(`[TIMEOFFS API PUT] Folga encontrada:`, { 
            id: existingTimeOff?.id,
            employeeName: existingTimeOff?.employee?.name,
            currentStatus: existingTimeOff?.status
        });

        if (!existingTimeOff) {
            return NextResponse.json(
                { success: false, message: "Folga não encontrada" },
                { status: 404 }
            );
        }

        // Verificar sobreposição apenas com outras folgas (exceto a atual)
        const conflictingTimeOff = await prisma.timeOff.findFirst({
            where: {
                id: { not: timeOffId },
                employeeId,
                status: 'approved',
                OR: [
                    {
                        AND: [
                            { startDate: { lte: endDate } },
                            { endDate: { gte: startDate } }
                        ]
                    }
                ]
            }
        });

        if (conflictingTimeOff) {
            return NextResponse.json(
                { success: false, message: "Funcionário já possui folga aprovada neste período" },
                { status: 400 }
            );
        }

        const updatedTimeOff = await prisma.timeOff.update({
            where: { id: timeOffId },
            data: {
                employeeId,
                startDate,
                endDate,
                type,
                reason,
                status
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        dept: true,
                        role: true,
                        email: true
                    }
                }
            }
        });

        console.log(`[TIMEOFFS API PUT] Folga atualizada com sucesso, status agora: ${status}`);

        // Criar notificação para o funcionário sobre a atualização
        const statusMessage = status === 'approved' 
            ? 'aprovada' 
            : status === 'rejected' 
            ? 'recusada' 
            : 'atualizada';
        
        console.log(`[TIMEOFFS API] CRIANDO NOTIFICAÇÃO - Funcionário: ${updatedTimeOff.employee.name} (${updatedTimeOff.employeeId}), Status: ${statusMessage}`);

        try {
            const notification = await prisma.employeeNotification.create({
                data: {
                    employeeId: updatedTimeOff.employeeId,
                    title: `Solicitação de Folga ${statusMessage.charAt(0).toUpperCase() + statusMessage.slice(1)}`,
                    message: `Sua solicitação de folga para o período de ${updatedTimeOff.startDate} a ${updatedTimeOff.endDate} foi ${statusMessage}.${
                        reason ? ` Observação: ${reason}` : ''
                    }`,
                    type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info'
                }
            });

            console.log(`[TIMEOFFS API] ✅ NOTIFICAÇÃO CRIADA - ID: ${notification.id}, Para: ${updatedTimeOff.employee.name}`);
        } catch (notificationError) {
            console.error(`[TIMEOFFS API] ❌ ERRO AO CRIAR NOTIFICAÇÃO:`, notificationError);
        }

        return NextResponse.json({
            success: true,
            message: "Folga atualizada com sucesso",
            timeOff: updatedTimeOff
        });

    } catch (error) {
        console.error('[TIMEOFFS API] Erro ao atualizar folga:', error);
        return NextResponse.json(
            { success: false, message: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const timeOffId = params.id;

        // Verificar se a folga existe
        const existingTimeOff = await prisma.timeOff.findUnique({
            where: { id: timeOffId },
            include: { employee: true }
        });

        if (!existingTimeOff) {
            return NextResponse.json(
                { success: false, message: "Folga não encontrada" },
                { status: 404 }
            );
        }

        await prisma.timeOff.delete({
            where: { id: timeOffId }
        });

        // Criar notificação para o funcionário
        await prisma.employeeNotification.create({
            data: {
                employeeId: existingTimeOff.employeeId,
                title: "Folga Cancelada",
                message: `Sua folga do período de ${existingTimeOff.startDate} a ${existingTimeOff.endDate} foi cancelada.`,
                type: "warning"
            }
        });

        console.log(`[TIMEOFFS API] Folga excluída: ${timeOffId}`);

        return NextResponse.json({
            success: true,
            message: "Folga excluída com sucesso"
        });

    } catch (error) {
        console.error('[TIMEOFFS API] Erro ao excluir folga:', error);
        return NextResponse.json(
            { success: false, message: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}