import { NextResponse } from 'next/server';
import { getEmployeeById, updateEmployee, deleteEmployee } from '@/lib/employee-storage';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { name, dept, role, email, phone, cpf, address, hourlyRate } = body;

        const employee = updateEmployee(params.id, {
            name,
            dept,
            role,
            email,
            phone,
            cpf,
            address,
            hourlyRate: hourlyRate ? parseFloat(hourlyRate) : 0,
            avatar: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        } as any);

        return NextResponse.json(employee);
    } catch (error: any) {
        console.error('Error updating employee:', error);
        return NextResponse.json({ error: error.message || 'Failed to update employee' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const employee = getEmployeeById(params.id);

        if (!employee) {
            return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });
        }

        deleteEmployee(params.id);

        return NextResponse.json({ message: 'Funcionário excluído com sucesso' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
    }
}