import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEmployees() {
  try {
    const count = await prisma.employee.count();
    console.log(`Total de funcionários: ${count}`);

    if (count > 0) {
      const employees = await prisma.employee.findMany({ select: { name: true, dept: true } });
      console.log('Funcionários:');
      employees.forEach(emp => console.log(`- ${emp.name} (${emp.dept})`));
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployees();