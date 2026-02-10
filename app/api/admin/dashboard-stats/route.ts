export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { format, subDays } from "date-fns";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

        const [employeeCount, recordsToday, totalRecords, recordsYesterday, recentRecords] = await Promise.all([
            prisma.employee.count(),
            prisma.dailyRecord.count({ where: { date: today } }),
            prisma.dailyRecord.count(),
            prisma.dailyRecord.count({ where: { date: yesterday } }),
            prisma.dailyRecord.findMany({
                where: {
                    OR: [
                        { date: today },
                        { date: yesterday }
                    ]
                },
                include: {
                    employee: true
                },
                orderBy: {
                    updatedAt: 'desc'
                },
                take: 10
            })
        ]);

        // Calcular funcionários que não bateram ponto hoje
        const employeesWithRecordToday = await prisma.dailyRecord.findMany({
            where: { date: today },
            select: { employeeId: true },
            distinct: ['employeeId']
        });
        const employeeIdsWithRecord = new Set(employeesWithRecordToday.map(r => r.employeeId));
        const absentCount = Math.max(0, employeeCount - employeeIdsWithRecord.size);

        return NextResponse.json({
            employeeCount,
            recordsToday,
            totalRecords,
            recordsYesterday,
            recentRecords,
            absentCount
        });
    } catch (error) {
        console.error('Erro ao buscar stats:', error);
        return NextResponse.json({
            employeeCount: 0,
            recordsToday: 0,
            totalRecords: 0,
            recordsYesterday: 0,
            recentRecords: [],
            absentCount: 0
        }, { status: 500 });
    }
}
