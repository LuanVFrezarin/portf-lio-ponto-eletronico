import { NextResponse } from 'next/server';
import { getEmployees, createEmployee } from '@/lib/employee-storage';

export async function GET() {
    try {
        const employees = getEmployees().sort((a, b) => a.name.localeCompare(b.name));
        return NextResponse.json(employees);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, dept, role, email, phone, cpf, address, hourlyRate, pin } = body;

        // Gerar PIN se não fornecido
        let generatedPin = pin;
        if (!generatedPin) {
            generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
        }

        const employee = createEmployee({
            name,
            dept,
            role,
            email,
            phone,
            cpf,
            address,
            hourlyRate: hourlyRate ? parseFloat(hourlyRate) : 0,
            pin: generatedPin,
            avatar: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
            hoursBalance: 0,
        });

        return NextResponse.json(employee);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to create employee' }, { status: 500 });
    }
}
