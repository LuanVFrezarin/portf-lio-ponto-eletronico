import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const today = format(new Date(), 'yyyy-MM-dd');
        
        // Debug info
        const employees = await prisma.employee.findMany({
            select: { id: true, name: true }
        });
        
        const recordsToday = await prisma.dailyRecord.findMany({
            where: { date: today },
            include: { employee: true }
        });
        
        const employeesWithRecord = await prisma.dailyRecord.findMany({
            where: { date: today },
            select: { employeeId: true },
            distinct: ['employeeId']
        });

        const debug = {
            today,
            totalEmployees: employees.length,
            employeesList: employees,
            recordsToday: recordsToday.length,
            recordsList: recordsToday,
            employeesWithRecord: employeesWithRecord.length,
            employeesWithRecordList: employeesWithRecord,
            absentCount: employees.length - employeesWithRecord.length
        };

        return NextResponse.json(debug);
    } catch (error) {
        console.error('Debug error:', error);
        return NextResponse.json({ error: 'Debug failed', details: String(error) }, { status: 500 });
    }
}