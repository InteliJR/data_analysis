// prisma/seed.ts

import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Função auxiliar para hash de senha (mantida a lógica original com pepper)
async function hashPassword(password: string): Promise<string> {
  const pepper = process.env.PASSWORD_PEPPER || '';
  const passwordWithPepper = password + pepper;
  
  return await argon2.hash(passwordWithPepper, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

async function main() {
  console.log('🌱 Iniciando seed simplificado...');

  // Configurações do Admin (variáveis de ambiente ou padrão)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = process.env.ADMIN_NAME || 'Administrador';

  console.log(`👤 Processando usuário admin: ${adminEmail}`);

  // Gera o hash da senha
  const hashedPassword = await hashPassword(adminPass);

  // Cria ou atualiza o usuário Admin
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    // Se o usuário já existir, atualizamos a senha e garantimos que é ADMIN e está ATIVO
    update: {
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
    // Se não existir, cria do zero
    create: {
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log('✅ Usuário Admin criado/atualizado com sucesso!');
  console.log('🆔 ID:', adminUser.id);
  console.log('🔑 Credenciais:');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Senha: ${adminPass}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });