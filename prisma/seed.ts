import { PrismaClient } from '@prisma/client';
import { INITIAL_EMPLOYEES } from '../lib/initial-employees';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar admin padrão
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'admin123', // Em produção, usar hash
      name: 'Administrador do Sistema'
    }
  });

  console.log('✅ Admin criado:', admin.username);

  // Criar funcionários iniciais
  for (const emp of INITIAL_EMPLOYEES) {
    try {
      await prisma.employee.upsert({
        where: { pin: emp.pin }, // Usar PIN como identificador único
        update: {},
        create: {
          name: emp.name,
          email: emp.email,
          phone: emp.phone,
          cpf: emp.cpf,
          address: emp.address,
          dept: emp.dept,
          role: emp.role,
          hourlyRate: emp.hourlyRate,
          avatar: emp.avatar,
          pin: emp.pin,
          hoursBalance: emp.hoursBalance
        }
      });
      console.log(`✅ Funcionário criado/atualizado: ${emp.name} (PIN: ${emp.pin})`);
    } catch (error) {
      console.log(`⚠️  Funcionário ${emp.name} já existe, pulando...`);
    }
  }

  console.log('🎉 Seed concluído com sucesso!');
  console.log('\n📝 Credenciais de acesso:');
  console.log('Admin: usuario=admin, senha=admin123');
  console.log('Funcionários: use os PINs listados acima (ex: 111111)');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
