import prisma from "@/lib/prisma";

export async function isEmployeeOffDay(employeeId: string, date: Date): Promise<boolean> {
    try {
        const dayOfWeek = date.getDay();
        
        const offDay = await prisma.employeeWeeklyOffDay.findUnique({
            where: {
                employeeId_dayOfWeek: {
                    employeeId,
                    dayOfWeek
                }
            }
        });

        return !!offDay;
    } catch (error) {
        console.error('Erro ao verificar dia de folga:', error);
        return false;
    }
}

export async function getEmployeeWeeklyOffDays(employeeId: string): Promise<number[]> {
    try {
        const offDays = await prisma.employeeWeeklyOffDay.findMany({
            where: { employeeId },
            select: { dayOfWeek: true }
        });

        return offDays.map(d => d.dayOfWeek);
    } catch (error) {
        console.error('Erro ao buscar dias de folga:', error);
        return [];
    }
}
