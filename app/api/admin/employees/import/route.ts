import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { employees } = body;

        let successCount = 0;
        let errors = [];

        for (const emp of employees) {
            try {
                // Generate unique PIN
                let pin = '';
                let isUnique = false;
                while (!isUnique) {
                    pin = Math.floor(100000 + Math.random() * 900000).toString();
                    const existing = await prisma.employee.findUnique({ where: { pin } });
                    if (!existing) isUnique = true;
                }

                await prisma.employee.create({
                    data: {
                        name: emp.name,
                        dept: emp.dept || 'Geral',
                        role: emp.role || 'Colaborador',
                        email: emp.email,
                        phone: emp.phone,
                        cpf: emp.cpf,
                        address: emp.address,
                        hourlyRate: emp.hourlyRate ? parseFloat(emp.hourlyRate) : 0,
                        pin,
                        avatar: emp.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
                    },
                });
                successCount++;
            } catch (err) {
                console.error(err);
                errors.push({ name: emp.name, error: "Falha ao importar" });
            }
        }

        return NextResponse.json({ success: true, count: successCount, errors });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao processar importação' }, { status: 500 });
    }
}
