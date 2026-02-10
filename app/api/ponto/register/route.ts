import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { employeeId, type } = body;
        
        console.log('[PONTO REGISTER] Recebido:', { employeeId, type, timestamp: new Date().toISOString() });

        // Validações básicas
        if (!employeeId || !type) {
            console.error('[PONTO REGISTER] Campos obrigatórios faltando:', { employeeId, type });
            return NextResponse.json({ 
                error: 'employeeId e type são obrigatórios',
                received: { employeeId, type }
            }, { status: 400 });
        }

        const today = format(new Date(), 'yyyy-MM-dd');
        const now = new Date();

        // Valid types: entry, lunchStart, lunchEnd, exit
        const validTypes = ['entry', 'lunchStart', 'lunchEnd', 'exit'];
        if (!validTypes.includes(type)) {
            console.error('[PONTO REGISTER] Tipo inválido:', type);
            return NextResponse.json({ 
                error: 'Tipo de registro inválido. Deve ser: entry, lunchStart, lunchEnd ou exit',
                received: type,
                expected: validTypes
            }, { status: 400 });
        }

        // Verificar se o funcionário existe
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId }
        });

        if (!employee) {
            console.error('[PONTO REGISTER] Funcionário não encontrado:', employeeId);
            return NextResponse.json({ 
                error: 'Funcionário não encontrado',
                employeeId
            }, { status: 404 });
        }

        console.log('[PONTO REGISTER] Criando/atualizando registro para:', { employeeId, date: today, type });
        
        // Buscar ou criar o registro
        const existingRecord = await prisma.dailyRecord.findUnique({
            where: {
                employeeId_date: {
                    employeeId,
                    date: today
                }
            }
        });

        const record = await prisma.dailyRecord.upsert({
            where: {
                employeeId_date: {
                    employeeId,
                    date: today
                }
            },
            update: {
                [type]: now,
            },
            create: {
                employeeId,
                date: today,
                [type]: now,
            }
        });

        console.log('[PONTO REGISTER] Registro salvo com sucesso:', record.id);
        return NextResponse.json(record);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : '';
        
        console.error('[PONTO REGISTER] Erro:', errorMessage);
        console.error('[PONTO REGISTER] Stack:', errorStack);
        
        return NextResponse.json({ 
            error: 'Erro ao registrar ponto',
            details: errorMessage,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const employeeId = request.nextUrl.searchParams.get('employeeId');
    const date = request.nextUrl.searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');

    if (!employeeId) {
        return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    try {
        const record = await prisma.dailyRecord.findUnique({
            where: {
                employeeId_date: {
                    employeeId,
                    date
                }
            }
        });
        return NextResponse.json(record || null);
    } catch (error) {
        console.error('[PONTO REGISTER GET] Erro ao buscar registro:', error);
        return NextResponse.json({ error: 'Erro ao buscar registros' }, { status: 500 });
    }
}
