import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

        console.log(`[ABSENT API] Buscando ausentes para data: ${date}`);

        // Buscar todos os funcionários (incluir registros e folgas para a data)
        const allEmployees = await prisma.employee.findMany({
            include: {
                records: {
                    where: { date },
                    take: 1
                },
                timeOffs: {
                    where: {
                        startDate: { lte: date },
                        endDate: { gte: date },
                        status: 'approved'
                    },
                    take: 1
                }
            }
        });

        console.log(`[ABSENT API] Total de funcionários: ${allEmployees.length}`);

        const absentEmployees = [];

        for (const employee of allEmployees) {
            const hasRecord = employee.records.length > 0 && employee.records[0].entry;
            const hasTimeOff = employee.timeOffs.length > 0;

            // Se não tem registro de entrada e não tem folga, está ausente
            if (!hasRecord && !hasTimeOff) {
                // Buscar último registro para mostrar informação adicional
                const lastRecord = await prisma.dailyRecord.findFirst({
                    where: {
                        employeeId: employee.id,
                        entry: {
                            not: null
                        }
                    },
                    orderBy: {
                        date: 'desc'
                    }
                });

                absentEmployees.push({
                    employee: {
                        id: employee.id,
                        name: employee.name,
                        dept: employee.dept,
                        role: employee.role,
                        email: employee.email,
                        phone: employee.phone
                    },
                    status: 'missing',
                    lastEntry: lastRecord?.entry
                });
            }
            // Se não tem registro mas tem folga aprovada
            else if (!hasRecord && hasTimeOff) {
                absentEmployees.push({
                    employee: {
                        id: employee.id,
                        name: employee.name,
                        dept: employee.dept,
                        role: employee.role,
                        email: employee.email,
                        phone: employee.phone
                    },
                    status: 'timeoff',
                    timeOff: {
                        id: employee.timeOffs[0].id,
                        startDate: employee.timeOffs[0].startDate,
                        endDate: employee.timeOffs[0].endDate,
                        type: employee.timeOffs[0].type,
                        reason: employee.timeOffs[0].reason,
                        status: employee.timeOffs[0].status,
                        employee: {
                            id: employee.id,
                            name: employee.name,
                            dept: employee.dept,
                            role: employee.role,
                            email: employee.email,
                            phone: employee.phone
                        }
                    }
                });
            }
        }

        console.log(`[ABSENT API] Funcionários ausentes encontrados: ${absentEmployees.length}`);

        return NextResponse.json({
            success: true,
            date,
            absentEmployees,
            total: absentEmployees.length,
            missing: absentEmployees.filter(a => a.status === 'missing').length,
            timeOff: absentEmployees.filter(a => a.status === 'timeoff').length
        });

    } catch (error) {
        console.error('[ABSENT API] Erro:', error);
        return NextResponse.json(
            { success: false, message: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}