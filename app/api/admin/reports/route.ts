import { NextResponse } from 'next/server';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const employeeId = request.nextUrl.searchParams.get('employeeId');
    const monthStr = request.nextUrl.searchParams.get('month'); // Expecting YYYY-MM

    console.log('[REPORTS API] Parâmetros recebidos:', { employeeId, monthStr, timestamp: new Date().toISOString() });

    try {
        // Primeiro, vamos verificar quantos registros existem no total
        const totalRecords = await prisma.dailyRecord.count();
        console.log('[REPORTS API] Total de registros no banco:', totalRecords);

        let where: any = {};

        if (employeeId) {
            where.employeeId = employeeId;
        }

        if (monthStr) {
            const date = new Date(monthStr + '-01');
            const start = format(startOfMonth(date), 'yyyy-MM-dd');
            const end = format(endOfMonth(date), 'yyyy-MM-dd');

            console.log('[REPORTS API] Intervalo de datas:', { start, end, monthStr, parsedDate: date.toISOString() });

            where.date = {
                gte: start,
                lte: end
            };
        } else {
            console.log('[REPORTS API] Nenhum mês especificado - buscando todos os registros');
        }

        console.log('[REPORTS API] Query where:', JSON.stringify(where, null, 2));

        const records = await prisma.dailyRecord.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        dept: true,
                        role: true,
                        hourlyRate: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        console.log('[REPORTS API] Registros encontrados:', {
            count: records.length,
            dates: records.map(r => r.date),
            firstRecord: records[0] ? {
                date: records[0].date,
                employee: records[0].employee.name,
                entry: records[0].entry,
                exit: records[0].exit
            } : null
        });
        
        return NextResponse.json(records);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[REPORTS API] Erro:', errorMessage);
        return NextResponse.json({ error: 'Erro ao buscar relatórios', details: errorMessage }, { status: 500 });
    }
}
