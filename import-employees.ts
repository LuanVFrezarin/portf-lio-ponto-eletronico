import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function importEmployees() {
  try {
    const csvPath = path.join(process.cwd(), 'exemplo_funcionarios.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const rows = csvContent.split('\n').filter(row => row.trim() !== '');

    // Skip header
    const dataRows = rows.slice(1);

    let successCount = 0;

    for (const row of dataRows) {
      const [name, dept, role, email, phone, cpf, hourlyRate, ...addressParts] = row.split(',');

      if (!name?.trim()) continue;

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
          name: name.trim(),
          dept: dept?.trim() || 'Geral',
          role: role?.trim() || 'Colaborador',
          email: email?.trim(),
          phone: phone?.trim(),
          cpf: cpf?.trim(),
          address: addressParts.join(',').trim(),
          hourlyRate: hourlyRate?.trim() ? parseFloat(hourlyRate.trim()) : 0,
          pin,
          avatar: name.trim().split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        },
      });

      successCount++;
    }

    console.log(`${successCount} funcionários importados com sucesso!`);
  } catch (error) {
    console.error('Erro ao importar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importEmployees();