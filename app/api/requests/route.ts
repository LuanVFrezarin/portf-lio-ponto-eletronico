import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Listar todas as solicitações (correções e justificativas)
export async function GET(request: NextRequest) {
    const type = request.nextUrl.searchParams.get('type'); // 'corrections' | 'justifications' | null (ambos)
    const status = request.nextUrl.searchParams.get('status'); // 'pending' | 'approved' | 'rejected' | null (todos)
    const employeeId = request.nextUrl.searchParams.get('employeeId');

    try {
        let corrections: any[] = [];
        let justifications: any[] = [];

        if (!type || type === 'corrections') {
            const where: any = {};
            if (status) where.status = status;
            if (employeeId) where.employeeId = employeeId;

            corrections = await prisma.correctionRequest.findMany({
                where,
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
                    createdAt: 'desc'
                }
            });
        }

        if (!type || type === 'justifications') {
            const where: any = {};
            if (status) where.status = status;
            if (employeeId) where.employeeId = employeeId;

            justifications = await prisma.justificationRequest.findMany({
                where,
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
                    createdAt: 'desc'
                }
            });
        }

        return NextResponse.json({ corrections, justifications });
    } catch (error) {
        console.error('[REQUESTS API] Erro ao buscar solicitações:', error);
        return NextResponse.json({ error: 'Erro ao buscar solicitações' }, { status: 500 });
    }
}

// POST - Criar nova solicitação
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, employeeId, date, reason, requestedTime, correctionType } = body;

        if (type === 'correction') {
            const correction = await prisma.correctionRequest.create({
                data: {
                    employeeId,
                    date,
                    type: correctionType,
                    requestedTime: requestedTime || '',
                    reason,
                    status: 'pending'
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
                    title: "Solicitação de Correção Enviada",
                    message: `Sua solicitação de correção de ponto para ${date} foi enviada para análise.`,
                    type: "info"
                }
            });

            return NextResponse.json(correction);
        } else if (type === 'justification') {
            const justification = await prisma.justificationRequest.create({
                data: {
                    employeeId,
                    date,
                    reason,
                    status: 'pending'
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
                    title: "Solicitação de Justificativa Enviada",
                    message: `Sua solicitação de justificativa para ${date} foi enviada para análise.`,
                    type: "info"
                }
            });

            return NextResponse.json(justification);
        }

        return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    } catch (error) {
        console.error('[REQUESTS API] Erro ao criar solicitação:', error);
        return NextResponse.json({ error: 'Erro ao criar solicitação' }, { status: 500 });
    }
}

// PATCH - Atualizar status da solicitação
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, type, status, adminComment } = body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
        }

        if (type === 'correction') {
            const updated = await prisma.correctionRequest.update({
                where: { id },
                data: { 
                    status, 
                    adminComment: adminComment || undefined 
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

            // Se aprovado, aplicar a correção no registro real
            if (status === 'approved') {
                await applyCorrection(updated);
            }

            // Criar notificação para o funcionário
            const statusMsg = status === 'approved' ? 'aprovada' : 'rejeitada';
            await prisma.employeeNotification.create({
                data: {
                    employeeId: updated.employeeId,
                    title: `Solicitação de Correção ${statusMsg.charAt(0).toUpperCase() + statusMsg.slice(1)}`,
                    message: `Sua solicitação de correção de ponto para ${updated.date} foi ${statusMsg}.${adminComment ? ` Comentário: ${adminComment}` : ''}`,
                    type: status === 'approved' ? 'success' : 'error'
                }
            });

            return NextResponse.json(updated);
        } else if (type === 'justification') {
            const updated = await prisma.justificationRequest.update({
                where: { id },
                data: { 
                    status, 
                    adminComment: adminComment || undefined 
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
            const statusMsg = status === 'approved' ? 'aprovada' : 'rejeitada';
            await prisma.employeeNotification.create({
                data: {
                    employeeId: updated.employeeId,
                    title: `Solicitação de Justificativa ${statusMsg.charAt(0).toUpperCase() + statusMsg.slice(1)}`,
                    message: `Sua solicitação de justificativa para ${updated.date} foi ${statusMsg}.${adminComment ? ` Comentário: ${adminComment}` : ''}`,
                    type: status === 'approved' ? 'success' : 'error'
                }
            });

            return NextResponse.json(updated);
        }

        return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    } catch (error) {
        console.error('[REQUESTS API] Erro ao atualizar solicitação:', error);
        return NextResponse.json({ error: 'Erro ao atualizar solicitação' }, { status: 500 });
    }
}

// Função para aplicar correção no registro real
async function applyCorrection(correction: any) {
    try {
        const { date, type, requestedTime, employeeId } = correction;
        
        // Converter requestedTime para DateTime
        const timeAsDate = new Date(`${date}T${requestedTime}`);
        
        // Atualizar ou criar o registro do dia
        await prisma.dailyRecord.upsert({
            where: {
                employeeId_date: {
                    employeeId,
                    date
                }
            },
            update: {
                [type]: timeAsDate
            },
            create: {
                employeeId,
                date,
                [type]: timeAsDate
            }
        });

        console.log(`[REQUESTS API] Correção aplicada: ${type} em ${date} para employeeId ${employeeId}`);
    } catch (error) {
        console.error('[REQUESTS API] Erro ao aplicar correção:', error);
    }
}
