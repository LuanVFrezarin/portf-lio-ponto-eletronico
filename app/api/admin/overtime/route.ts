import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const overtimes = await prisma.overtime.findMany({
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
            },
            orderBy: {
                date: 'desc'
            }
        });

        return NextResponse.json({
            success: true,
            overtimes
        });

    } catch (error) {
        console.error('[OVERTIME API] Erro:', error);
        return NextResponse.json(
            { success: false, message: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { employeeId, date, hours, reason, status = 'pending', adminComment } = body;

        if (!employeeId || !date || !hours || !reason) {
            return NextResponse.json(
                { success: false, message: "Campos obrigatórios não preenchidos" },
                { status: 400 }
            );
        }

        if (hours <= 0 || hours > 12) {
            return NextResponse.json(
                { success: false, message: "As horas extras devem estar entre 0.5 e 12 horas" },
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

        // Verificar se já existe registro de horas extras para esta data/funcionário
        const existingOvertime = await prisma.overtime.findFirst({
            where: {
                employeeId,
                date
            }
        });

        if (existingOvertime) {
            return NextResponse.json(
                { success: false, message: "Já existe um registro de horas extras para este funcionário nesta data" },
                { status: 400 }
            );
        }

        const overtime = await prisma.overtime.create({
            data: {
                employeeId,
                date,
                hours: parseFloat(hours),
                reason,
                status,
                adminComment,
                approvedBy: status === 'approved' ? "Admin" : undefined // TODO: pegar do token JWT
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
        const notificationMessage = status === 'approved' 
            ? `Suas ${hours}h extras do dia ${date} foram aprovadas!` 
            : status === 'rejected'
            ? `Suas ${hours}h extras do dia ${date} foram rejeitadas.`
            : `Solicitação de ${hours}h extras registrada para o dia ${date}.`;

        await prisma.employeeNotification.create({
            data: {
                employeeId,
                title: "Horas Extras",
                message: notificationMessage,
                type: status === 'approved' ? "success" : status === 'rejected' ? "error" : "info"
            }
        });

        console.log(`[OVERTIME API] Novo registro de horas extras criado para funcionário ${employee.name}: ${hours}h em ${date}`);

        return NextResponse.json({
            success: true,
            message: "Horas extras registradas com sucesso",
            overtime
        });

    } catch (error) {
        console.error('[OVERTIME API] Erro ao criar horas extras:', error);
        return NextResponse.json(
            { success: false, message: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}