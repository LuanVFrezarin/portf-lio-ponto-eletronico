import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const timeOffs = await prisma.timeOff.findMany({
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
            },
            orderBy: {
                startDate: 'desc'
            }
        });

        return NextResponse.json({
            success: true,
            timeOffs
        });

    } catch (error) {
        console.error('[TIMEOFFS API] Erro:', error);
        return NextResponse.json(
            { success: false, message: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { employeeId, startDate, endDate, type, reason, status = 'approved' } = body;

        if (!employeeId || !startDate || !endDate || !type) {
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

        // Verificar se não há sobreposição de datas para o mesmo funcionário
        const existingTimeOff = await prisma.timeOff.findFirst({
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

        if (existingTimeOff) {
            return NextResponse.json(
                { success: false, message: "Funcionário já possui folga aprovada neste período" },
                { status: 400 }
            );
        }

        const timeOff = await prisma.timeOff.create({
            data: {
                employeeId,
                startDate,
                endDate,
                type,
                reason,
                status,
                approvedBy: "Admin" // TODO: pegar do token JWT
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

        console.log(`[TIMEOFFS API] CRIANDO NOTIFICAÇÃO para ${employee.name} (${employeeId})`);

        // Criar notificação para o funcionário
        try {
            const notification = await prisma.employeeNotification.create({
                data: {
                    employeeId,
                    title: "Nova Folga Registrada",
                    message: `Sua folga de ${type === 'vacation' ? 'férias' : 
                                           type === 'sick' ? 'atestado médico' : 
                                           type === 'medical' ? 'consulta médica' : 'folga pessoal'} foi registrada para o período de ${startDate} a ${endDate}.`,
                    type: "info"
                }
            });
            console.log(`[TIMEOFFS API] ✅ NOTIFICAÇÃO CRIADA - ID: ${notification.id}, Para: ${employee.name}`);
        } catch (notificationError) {
            console.error(`[TIMEOFFS API] ❌ ERRO ao criar notificação:`, notificationError);
        }

        console.log(`[TIMEOFFS API] Nova folga criada para funcionário ${employee.name}: ${startDate} a ${endDate}`);

        return NextResponse.json({
            success: true,
            message: "Folga criada com sucesso",
            timeOff
        });

    } catch (error) {
        console.error('[TIMEOFFS API] Erro ao criar folga:', error);
        return NextResponse.json(
            { success: false, message: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}