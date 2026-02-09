import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { employeeId, startDate, endDate, type, reason } = body;

        if (!employeeId || !startDate || !endDate || !type || !reason) {
            return NextResponse.json(
                { success: false, message: "Campos obrigatórios não preenchidos" },
                { status: 400 }
            );
        }

        // Verificar se o funcionário existe
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId }
        });

        if (!employee) {
            return NextResponse.json(
                { success: false, message: "Funcionário não encontrado" },
                { status: 404 }
            );
        }

        if (new Date(startDate) > new Date(endDate)) {
            return NextResponse.json(
                { success: false, message: "Data de início não pode ser posterior à data de fim" },
                { status: 400 }
            );
        }

        // Verificar se já existe folga aprovada neste período
        const existingApprovedTimeOff = await prisma.timeOff.findFirst({
            where: {
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

        if (existingApprovedTimeOff) {
            return NextResponse.json(
                { success: false, message: "Você já possui uma folga aprovada neste período" },
                { status: 400 }
            );
        }

        // Criar solicitação de folga com status pendente
        const timeOff = await prisma.timeOff.create({
            data: {
                employeeId,
                startDate,
                endDate,
                type,
                reason,
                status: 'pending' // Inicialmente pendente, aguardando aprovação do admin
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

        // Criar notificação para o funcionário
        await prisma.employeeNotification.create({
            data: {
                employeeId,
                title: "Solicitação de Folga Enviada",
                message: `Sua solicitação de ${type === 'vacation' ? 'férias' : 
                                       type === 'sick' ? 'atestado médico' : 
                                       type === 'medical' ? 'consulta médica' : 'folga pessoal'} para o período de ${startDate} a ${endDate} foi enviada para análise.`,
                type: "info"
            }
        });

        // Buscar todos os admins para notificar
        const admins = await prisma.admin.findMany({
            select: { id: true, name: true }
        });

        // Criar notificação para cada admin (como notificação de funcionário com ID do primeiro admin se existir)
        if (admins.length > 0) {
            // Por enquanto, vamos criar uma notificação visível no sistema
            console.log(`[TIMEOFF REQUEST API] Nova solicitação de folga de ${employee.name} (${employee.dept}) - ${startDate} a ${endDate}`);
            console.log(`[TIMEOFF REQUEST API] ATENÇÃO ADMIN: Revisar em Gerenciar Folgas`);
        }

        console.log(`[TIMEOFF REQUEST API] Solicitação de folga criada para funcionário ${employee.name}: ${startDate} a ${endDate}`);

        return NextResponse.json({
            success: true,
            message: "Solicitação de folga enviada com sucesso",
            timeOff
        });

    } catch (error) {
        console.error('[TIMEOFF REQUEST API] Erro:', error);
        return NextResponse.json(
            { success: false, message: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}