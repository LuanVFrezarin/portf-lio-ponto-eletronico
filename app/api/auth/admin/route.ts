import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST - Login do admin
export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { message: 'Usuário e senha são obrigatórios' },
                { status: 400 }
            );
        }

        // Buscar admin no banco
        let admin = null;
        try {
            admin = await prisma.admin.findUnique({
                where: { username }
            });

            // Se não existir nenhum admin, criar o padrão
            if (!admin && username === 'admin') {
                const adminCount = await prisma.admin.count();
                if (adminCount === 0) {
                    admin = await prisma.admin.create({
                        data: {
                            username: 'admin',
                            password: 'admin123', // Em produção, usar hash
                            name: 'Administrador'
                        }
                    });
                }
            }
        } catch (dbError) {
            // Se não conseguir conectar ao banco, usar admin padrão para demo
            if (username === 'admin' && password === 'admin123') {
                admin = {
                    id: 'demo-admin',
                    username: 'admin',
                    password: 'admin123',
                    name: 'Administrador Demo'
                };
            }
        }

        if (!admin) {
            return NextResponse.json(
                { message: 'Usuário não encontrado' },
                { status: 401 }
            );
        }

        // Verificar senha (em produção, usar bcrypt)
        if (admin.password !== password) {
            return NextResponse.json(
                { message: 'Senha incorreta' },
                { status: 401 }
            );
        }

        // Gerar token simples (em produção, usar JWT)
        const token = Buffer.from(`${admin.id}:${Date.now()}`).toString('base64');

        return NextResponse.json({
            token,
            admin: {
                id: admin.id,
                username: admin.username
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// GET - Verificar se está logado
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
            { authenticated: false },
            { status: 401 }
        );
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [adminId] = decoded.split(':');

        let admin = null;
        try {
            admin = await prisma.admin.findUnique({
                where: { id: adminId }
            });
        } catch (dbError) {
            // Se não conseguir conectar ao banco, aceitar qualquer token para demo
            admin = {
                id: adminId,
                username: 'admin'
            };
        }

        if (!admin) {
            return NextResponse.json(
                { authenticated: false },
                { status: 401 }
            );
        }

        return NextResponse.json({
            authenticated: true,
            admin: {
                id: admin.id,
                username: admin.username
            }
        });
    } catch {
        return NextResponse.json(
            { authenticated: false },
            { status: 401 }
        );
    }
}
