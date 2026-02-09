import { NextResponse } from 'next/server';
import { getEmployeeByPin } from '@/lib/employee-storage';

export async function POST(request: Request) {
    try {
        const { pin } = await request.json();

        const employee = getEmployeeByPin(pin);

        if (!employee) {
            return NextResponse.json({ error: 'PIN inválido' }, { status: 401 });
        }

        return NextResponse.json(employee);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao autenticar' }, { status: 500 });
    }
}
