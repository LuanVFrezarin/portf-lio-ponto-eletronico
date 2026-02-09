import { NextResponse } from 'next/server';
import { 
    getCorrectionRequests, 
    createCorrectionRequest, 
    updateCorrectionRequest,
    getJustificationRequests,
    createJustificationRequest,
    updateJustificationRequest,
    createOrUpdateDailyRecord,
    getDailyRecord
} from '@/lib/records-storage';
import { getEmployeeById } from '@/lib/employee-storage';

// GET - Listar todas as solicitações (correções e justificativas)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'corrections' | 'justifications' | null (ambos)
    const status = searchParams.get('status'); // 'pending' | 'approved' | 'rejected' | null (todos)
    const employeeId = searchParams.get('employeeId');

    try {
        let corrections: any[] = [];
        let justifications: any[] = [];

        if (!type || type === 'corrections') {
            corrections = getCorrectionRequests().filter(c => {
                if (status && c.status !== status) return false;
                if (employeeId && c.employeeId !== employeeId) return false;
                return true;
            });
            corrections = corrections.map(c => ({
                ...c,
                employee: getEmployeeById(c.employeeId)
            }));
        }

        if (!type || type === 'justifications') {
            justifications = getJustificationRequests().filter(j => {
                if (status && j.status !== status) return false;
                if (employeeId && j.employeeId !== employeeId) return false;
                return true;
            });
            justifications = justifications.map(j => ({
                ...j,
                employee: getEmployeeById(j.employeeId)
            }));
        }

        return NextResponse.json({ corrections, justifications });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Erro ao buscar solicitações' }, { status: 500 });
    }
}

// POST - Criar nova solicitação
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, employeeId, date, reason, requestedTime, correctionType } = body;

        if (type === 'correction') {
            const correction = createCorrectionRequest({
                employeeId,
                date,
                type: correctionType,
                requestedTime: requestedTime || '',
                reason,
                status: 'pending'
            });
            return NextResponse.json({
                ...correction,
                employee: getEmployeeById(correction.employeeId)
            });
        } else if (type === 'justification') {
            const justification = createJustificationRequest({
                employeeId,
                date,
                reason,
                status: 'pending'
            });
            return NextResponse.json({
                ...justification,
                employee: getEmployeeById(justification.employeeId)
            });
        }

        return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Erro ao criar solicitação' }, { status: 500 });
    }
}

// PATCH - Atualizar status da solicitação
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, type, status, adminComment } = body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
        }

        if (type === 'correction') {
            const updated = updateCorrectionRequest(id, { 
                status, 
                adminComment: adminComment || undefined 
            } as any);

            // Se aprovado, aplicar a correção no registro real
            if (status === 'approved') {
                applyCorrection(updated);
            }

            return NextResponse.json({
                ...updated,
                employee: getEmployeeById(updated.employeeId)
            });
        } else if (type === 'justification') {
            const updated = updateJustificationRequest(id, { 
                status, 
                adminComment: adminComment || undefined 
            } as any);

            return NextResponse.json({
                ...updated,
                employee: getEmployeeById(updated.employeeId)
            });
        }

        return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Erro ao atualizar solicitação' }, { status: 500 });
    }
}

// Função para aplicar correção no registro real
function applyCorrection(correction: any) {
    try {
        const { date, type, requestedTime, employeeId } = correction;
        
        // Converter requestedTime para DateTime
        const timeAsDate = new Date(`${date}T${requestedTime}`);
        
        // Buscar o registro do dia
        let record = getDailyRecord(employeeId, date);

        // Se não existe, criar
        if (!record) {
            const createData: any = {
                employeeId,
                date,
                entry: undefined,
                lunchStart: undefined,
                lunchEnd: undefined,
                exit: undefined,
            };
            createData[type] = timeAsDate;
            
            createOrUpdateDailyRecord(createData);
        } else {
            // Atualizar o campo específico
            const updateData: any = {
                ...record,
                [type]: timeAsDate
            };
            
            createOrUpdateDailyRecord(updateData);
        }
    } catch (error) {
        console.error('Erro ao aplicar correção:', error);
    }
}
