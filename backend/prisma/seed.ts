// prisma/seed.ts

import {
  PrismaClient,
  UserRole,
  Currency,
  MeasurementUnit,
  FreightOperationType,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

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
  console.log('🌱 Iniciando seed do banco de dados...');

  // ============================================
  // 1. LIMPEZA DO BANCO (Opcional - Descomente se necessário)
  // ============================================
  // console.log('\n🧹 Limpando banco de dados...');
  // await prisma.productRawMaterial.deleteMany();
  // await prisma.product.deleteMany();
  // await prisma.productGroup.deleteMany();
  // await prisma.fixedCost.deleteMany();
  // await prisma.rawMaterialChangeLog.deleteMany();
  // await prisma.rawMaterial.deleteMany();
  // await prisma.rawMaterialTax.deleteMany();
  // await prisma.freight.deleteMany();
  // await prisma.freightTax.deleteMany();
  // await prisma.revokedToken.deleteMany();
  // await prisma.user.deleteMany();
  // console.log('✅ Banco limpo');

  // ============================================
  // 2. USUÁRIOS
  // ============================================
  console.log('\n👥 Criando usuários...');

  const adminUser = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@example.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      name: process.env.ADMIN_NAME || 'Administrador',
      password: await hashPassword(
        process.env.ADMIN_PASSWORD || 'Admin@123456',
      ),
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const comercialUser = await prisma.user.upsert({
    where: { email: 'comercial@example.com' },
    update: {},
    create: {
      email: 'comercial@example.com',
      name: 'Gerente Comercial',
      password: await hashPassword('Comercial@123'),
      role: UserRole.COMERCIAL,
      isActive: true,
    },
  });

  const logisticaUser = await prisma.user.upsert({
    where: { email: 'logistica@example.com' },
    update: {},
    create: {
      email: 'logistica@example.com',
      name: 'Gerente de Logística',
      password: await hashPassword('Logistica@123'),
      role: UserRole.LOGISTICA,
      isActive: true,
    },
  });

  const impostoUser = await prisma.user.upsert({
    where: { email: 'imposto@example.com' },
    update: {},
    create: {
      email: 'imposto@example.com',
      name: 'Analista Fiscal',
      password: await hashPassword('Imposto@123'),
      role: UserRole.IMPOSTO,
      isActive: true,
    },
  });

  console.log('✅ 4 usuários criados/atualizados');

  // ============================================
  // 3. IMPOSTOS DE FRETE
  // ============================================
  console.log('\n💰 Criando impostos de frete...');

  const freightTaxICMS = await prisma.freightTax.upsert({
    where: { name: 'ICMS' },
    update: { rate: 12.0 },
    create: { name: 'ICMS', rate: 12.0 },
  });

  const freightTaxPIS = await prisma.freightTax.upsert({
    where: { name: 'PIS' },
    update: { rate: 1.65 },
    create: { name: 'PIS', rate: 1.65 },
  });

  const freightTaxCOFINS = await prisma.freightTax.upsert({
    where: { name: 'COFINS' },
    update: { rate: 7.6 },
    create: { name: 'COFINS', rate: 7.6 },
  });

  const freightTaxII = await prisma.freightTax.upsert({
    where: { name: 'II (Imposto de Importação)' },
    update: { rate: 14.0 },
    create: { name: 'II (Imposto de Importação)', rate: 14.0 },
  });

  console.log('✅ 4 impostos de frete criados');

  // ============================================
  // 4. FRETES
  // ============================================
  console.log('\n🚚 Criando opções de frete...');

  const freightNacional = await prisma.freight.create({
    data: {
      name: 'Frete Rodoviário Nacional',
      description: 'Transporte rodoviário dentro do Brasil',
      unitPrice: 150.0,
      currency: Currency.BRL,
      originUf: 'SP',
      originCity: 'São Paulo',
      destinationUf: 'RJ',
      destinationCity: 'Rio de Janeiro',
      cargoType: 'Carga Seca',
      operationType: FreightOperationType.INTERNAL,
      freightTaxes: {
        connect: [
          { id: freightTaxICMS.id },
          { id: freightTaxPIS.id },
          { id: freightTaxCOFINS.id },
        ],
      },
    },
  });

  const freightInternacional = await prisma.freight.create({
    data: {
      name: 'Frete Marítimo Internacional',
      description: 'Transporte marítimo para importação',
      unitPrice: 2500.0,
      currency: Currency.USD,
      originUf: 'EXTERIOR',
      originCity: 'Shanghai',
      destinationUf: 'SP',
      destinationCity: 'Santos',
      cargoType: 'Container 40 pés',
      operationType: FreightOperationType.EXTERNAL,
      freightTaxes: {
        connect: [
          { id: freightTaxII.id },
          { id: freightTaxPIS.id },
          { id: freightTaxCOFINS.id },
        ],
      },
    },
  });

  const freightExpresso = await prisma.freight.create({
    data: {
      name: 'Frete Expresso',
      description: 'Entrega rápida para regiões metropolitanas',
      unitPrice: 280.0,
      currency: Currency.BRL,
      originUf: 'SP',
      originCity: 'Campinas',
      destinationUf: 'SP',
      destinationCity: 'São Paulo',
      cargoType: 'Carga Fracionada',
      operationType: FreightOperationType.INTERNAL,
      freightTaxes: {
        connect: [
          { id: freightTaxICMS.id },
          { id: freightTaxPIS.id },
          { id: freightTaxCOFINS.id },
        ],
      },
    },
  });

  console.log('✅ 3 fretes criados');

  // ============================================
  // 5. IMPOSTOS DE MATÉRIA-PRIMA
  // ============================================
  console.log('\n💰 Criando impostos de matéria-prima...');

  const rmTaxPISRecuperavel = await prisma.rawMaterialTax.upsert({
    where: { name: 'PIS (AC)' },
    update: { rate: 1.65, recoverable: true },
    create: { name: 'PIS (AC)', rate: 1.65, recoverable: true },
  });

  const rmTaxCOFINSRecuperavel = await prisma.rawMaterialTax.upsert({
    where: { name: 'COFINS (SP)' },
    update: { rate: 7.6, recoverable: true },
    create: { name: 'COFINS (SP)', rate: 7.6, recoverable: true },
  });

  const rmTaxICMS = await prisma.rawMaterialTax.upsert({
    where: { name: 'ICMS' },
    update: { rate: 18.0, recoverable: true },
    create: { name: 'ICMS', rate: 18.0, recoverable: true },
  });

  const rmTaxIPI5 = await prisma.rawMaterialTax.upsert({
    where: { name: 'IPI' },
    update: { rate: 5.0, recoverable: false },
    create: { name: 'IPI', rate: 5.0, recoverable: false },
  });

  const rmTaxIPI10 = await prisma.rawMaterialTax.upsert({
    where: { name: 'IPI (BA)' },
    update: { rate: 10.0, recoverable: false },
    create: { name: 'IPI (BA)', rate: 10.0, recoverable: false },
  });

  const rmTaxII = await prisma.rawMaterialTax.upsert({
    where: { name: 'II (Imposto Importação)' },
    update: { rate: 14.0, recoverable: false },
    create: { name: 'II (Imposto Importação)', rate: 14.0, recoverable: false },
  });

  const rmTaxPISNaoRecuperavel = await prisma.rawMaterialTax.upsert({
    where: { name: 'PIS' },
    update: { rate: 2.1, recoverable: false },
    create: { name: 'PIS', rate: 2.1, recoverable: false },
  });

  const rmTaxCOFINSNaoRecuperavel = await prisma.rawMaterialTax.upsert({
    where: { name: 'COFINS (RS)' },
    update: { rate: 9.65, recoverable: false },
    create: { name: 'COFINS (RS)', rate: 9.65, recoverable: false },
  });

  const rmTaxSIMPLES = await prisma.rawMaterialTax.upsert({
    where: { name: 'SIMPLES' },
    update: { rate: 8.0, recoverable: false },
    create: { name: 'SIMPLES', rate: 8.0, recoverable: false },
  });

  const rmTaxPISPresumido = await prisma.rawMaterialTax.upsert({
    where: { name: 'PIS (MG)' },
    update: { rate: 0.65, recoverable: false },
    create: { name: 'PIS (MG)', rate: 0.65, recoverable: false },
  });

  const rmTaxCOFINSPresumido = await prisma.rawMaterialTax.upsert({
    where: { name: 'COFINS' },
    update: { rate: 3.0, recoverable: false },
    create: { name: 'COFINS', rate: 3.0, recoverable: false },
  });

  console.log('✅ 11 impostos de matéria-prima criados');

  // ============================================
  // 6. MATÉRIAS-PRIMAS
  // ============================================
  console.log('\n📦 Criando matérias-primas...');

  const mpAcoCarbono = await prisma.rawMaterial.upsert({
    where: { code: 'MP001' },
    update: {
      name: 'Aço Carbono 1020',
      description: 'Aço carbono laminado a quente',
      measurementUnit: MeasurementUnit.KG,
      inputGroup: 'Metais',
      paymentTerm: 30,
    },
    create: {
      code: 'MP001',
      name: 'Aço Carbono 1020',
      description: 'Aço carbono laminado a quente',
      measurementUnit: MeasurementUnit.KG,
      inputGroup: 'Metais',
      paymentTerm: 30,
    },
  });

  // Localidade padrão para MP001
  await prisma.rawMaterialLocation.create({
    data: {
      rawMaterialId: mpAcoCarbono.id,
      country: 'BR',
      stateUf: 'SP',
      city: 'São Paulo',
      acquisitionPrice: 8.5,
      currency: Currency.BRL,
      priceConvertedBrl: 8.5,
      additionalCost: 0.5,
      freights: { connect: [{ id: freightNacional.id }] },
      locationTaxes: {
        create: [
          { taxId: rmTaxPISRecuperavel.id, rate: 1.65, recoverable: true },
          { taxId: rmTaxCOFINSRecuperavel.id, rate: 7.6, recoverable: true },
          { taxId: rmTaxICMS.id, rate: 18.0, recoverable: true },
          { taxId: rmTaxIPI5.id, rate: 5.0, recoverable: false },
        ],
      },
    },
  });

  const mpPolietileno = await prisma.rawMaterial.upsert({
    where: { code: 'MP002' },
    update: {
      name: 'Polietileno de Alta Densidade',
      description: 'PEAD virgem para embalagens',
      measurementUnit: MeasurementUnit.KG,
      inputGroup: 'Plásticos',
      paymentTerm: 45,
    },
    create: {
      code: 'MP002',
      name: 'Polietileno de Alta Densidade',
      description: 'PEAD virgem para embalagens',
      measurementUnit: MeasurementUnit.KG,
      inputGroup: 'Plásticos',
      paymentTerm: 45,
    },
  });

  await prisma.rawMaterialLocation.create({
    data: {
      rawMaterialId: mpPolietileno.id,
      country: 'BR',
      stateUf: 'SP',
      city: 'Campinas',
      acquisitionPrice: 12.0,
      currency: Currency.BRL,
      priceConvertedBrl: 12.0,
      additionalCost: 0.8,
      freights: { connect: [{ id: freightNacional.id }] },
      locationTaxes: {
        create: [
          { taxId: rmTaxPISRecuperavel.id, rate: 1.65, recoverable: true },
          { taxId: rmTaxCOFINSRecuperavel.id, rate: 7.6, recoverable: true },
          { taxId: rmTaxICMS.id, rate: 18.0, recoverable: true },
          { taxId: rmTaxIPI10.id, rate: 10.0, recoverable: false },
        ],
      },
    },
  });

  const mpResinaEpoxi = await prisma.rawMaterial.upsert({
    where: { code: 'MP003' },
    update: {
      name: 'Resina Epóxi',
      description: 'Resina epóxi bi-componente importada',
      measurementUnit: MeasurementUnit.L,
      inputGroup: 'Químicos',
      paymentTerm: 60,
    },
    create: {
      code: 'MP003',
      name: 'Resina Epóxi',
      description: 'Resina epóxi bi-componente importada',
      measurementUnit: MeasurementUnit.L,
      inputGroup: 'Químicos',
      paymentTerm: 60,
    },
  });

  await prisma.rawMaterialLocation.create({
    data: {
      rawMaterialId: mpResinaEpoxi.id,
      country: 'CN',
      stateUf: 'EX',
      city: 'Shanghai',
      acquisitionPrice: 45.0,
      currency: Currency.USD,
      priceConvertedBrl: 225.0,
      additionalCost: 15.0,
      freights: { connect: [{ id: freightInternacional.id }] },
      locationTaxes: {
        create: [
          { taxId: rmTaxII.id, rate: 14.0, recoverable: false },
          { taxId: rmTaxPISNaoRecuperavel.id, rate: 2.1, recoverable: false },
          { taxId: rmTaxCOFINSNaoRecuperavel.id, rate: 9.65, recoverable: false },
          { taxId: rmTaxICMS.id, rate: 18.0, recoverable: true },
        ],
      },
    },
  });

  const mpParafuso = await prisma.rawMaterial.upsert({
    where: { code: 'MP004' },
    update: {
      name: 'Parafuso Sextavado M8',
      description: 'Parafuso sextavado inox M8x30mm',
      measurementUnit: MeasurementUnit.UN,
      inputGroup: 'Fixação',
      paymentTerm: 30,
    },
    create: {
      code: 'MP004',
      name: 'Parafuso Sextavado M8',
      description: 'Parafuso sextavado inox M8x30mm',
      measurementUnit: MeasurementUnit.UN,
      inputGroup: 'Fixação',
      paymentTerm: 30,
    },
  });

  await prisma.rawMaterialLocation.create({
    data: {
      rawMaterialId: mpParafuso.id,
      country: 'BR',
      stateUf: 'SP',
      city: 'São Paulo',
      acquisitionPrice: 0.85,
      currency: Currency.BRL,
      priceConvertedBrl: 0.85,
      additionalCost: 0.05,
      freights: { connect: [{ id: freightExpresso.id }] },
      locationTaxes: {
        create: [
          { taxId: rmTaxSIMPLES.id, rate: 8.0, recoverable: false },
        ],
      },
    },
  });

  const mpTinta = await prisma.rawMaterial.upsert({
    where: { code: 'MP005' },
    update: {
      name: 'Tinta Automotiva Base Água',
      description: 'Tinta automotiva ecológica',
      measurementUnit: MeasurementUnit.L,
      inputGroup: 'Acabamento',
      paymentTerm: 45,
    },
    create: {
      code: 'MP005',
      name: 'Tinta Automotiva Base Água',
      description: 'Tinta automotiva ecológica',
      measurementUnit: MeasurementUnit.L,
      inputGroup: 'Acabamento',
      paymentTerm: 45,
    },
  });

  await prisma.rawMaterialLocation.create({
    data: {
      rawMaterialId: mpTinta.id,
      country: 'BR',
      stateUf: 'RJ',
      city: 'Rio de Janeiro',
      acquisitionPrice: 89.0,
      currency: Currency.BRL,
      priceConvertedBrl: 89.0,
      additionalCost: 5.0,
      freights: { connect: [{ id: freightNacional.id }] },
      locationTaxes: {
        create: [
          { taxId: rmTaxPISPresumido.id, rate: 0.65, recoverable: false },
          { taxId: rmTaxCOFINSPresumido.id, rate: 3.0, recoverable: false },
          { taxId: rmTaxICMS.id, rate: 18.0, recoverable: true },
        ],
      },
    },
  });

  const mpEmbalagem = await prisma.rawMaterial.upsert({
    where: { code: 'MP006' },
    update: {
      name: 'Caixa de Papelão 40x30x20',
      description: 'Embalagem papelão ondulado',
      measurementUnit: MeasurementUnit.UN,
      inputGroup: 'Embalagens',
      paymentTerm: 30,
    },
    create: {
      code: 'MP006',
      name: 'Caixa de Papelão 40x30x20',
      description: 'Embalagem papelão ondulado',
      measurementUnit: MeasurementUnit.UN,
      inputGroup: 'Embalagens',
      paymentTerm: 30,
    },
  });

  await prisma.rawMaterialLocation.create({
    data: {
      rawMaterialId: mpEmbalagem.id,
      country: 'BR',
      stateUf: 'SP',
      city: 'Sorocaba',
      acquisitionPrice: 2.5,
      currency: Currency.BRL,
      priceConvertedBrl: 2.5,
      additionalCost: 0.15,
      freights: { connect: [{ id: freightNacional.id }] },
      locationTaxes: {
        create: [
          { taxId: rmTaxSIMPLES.id, rate: 8.0, recoverable: false },
        ],
      },
    },
  });

  console.log('✅ 6 matérias-primas criadas');

  // ============================================
  // 7. CUSTOS FIXOS
  // ============================================
  console.log('\n💼 Criando custos fixos...');

  const fixedCostJan = await prisma.fixedCost.upsert({
    where: { code: 'CF001' },
    update: {
      description: 'Custos Fixos Mensais - Janeiro 2025',
      personnelExpenses: 45000.0,
      generalExpenses: 18000.0,
      proLabore: 12000.0,
      depreciation: 5000.0,
      totalCost: 80000.0,
      considerationPercentage: 100.0,
      calculationDate: new Date('2025-01-01'),
    },
    create: {
      code: 'CF001',
      description: 'Custos Fixos Mensais - Janeiro 2025',
      personnelExpenses: 45000.0,
      generalExpenses: 18000.0,
      proLabore: 12000.0,
      depreciation: 5000.0,
      totalCost: 80000.0,
      considerationPercentage: 100.0,
      calculationDate: new Date('2025-01-01'),
    },
  });

  const fixedCostFev = await prisma.fixedCost.upsert({
    where: { code: 'CF002' },
    update: {
      description: 'Custos Fixos Mensais - Fevereiro 2025',
      personnelExpenses: 47000.0,
      generalExpenses: 19500.0,
      proLabore: 12000.0,
      depreciation: 5000.0,
      totalCost: 83500.0,
      considerationPercentage: 100.0,
      calculationDate: new Date('2025-02-01'),
    },
    create: {
      code: 'CF002',
      description: 'Custos Fixos Mensais - Fevereiro 2025',
      personnelExpenses: 47000.0,
      generalExpenses: 19500.0,
      proLabore: 12000.0,
      depreciation: 5000.0,
      totalCost: 83500.0,
      considerationPercentage: 100.0,
      calculationDate: new Date('2025-02-01'),
    },
  });

  console.log('✅ 2 custos fixos criados');

  // ============================================
  // 8. GRUPOS DE PRODUTOS
  // ============================================
  console.log('\n📂 Criando grupos de produtos...');

  const groupEstruturais = await prisma.productGroup.upsert({
    where: { name: 'Componentes Estruturais' },
    update: {
      description: 'Produtos para aplicações estruturais e suporte',
      porcentage: 25,
      volumevendasconsiderar: 5000,
      overheadPerUnit: 0,
    },
    create: {
      name: 'Componentes Estruturais',
      description: 'Produtos para aplicações estruturais e suporte',
      porcentage: 25,
      volumevendasconsiderar: 5000,
      overheadPerUnit: 0,
    },
  });

  const groupEmbalagens = await prisma.productGroup.upsert({
    where: { name: 'Containers e Embalagens' },
    update: {
      description: 'Soluções de armazenamento e embalagem',
      porcentage: 40,
      volumevendasconsiderar: 8000,
      overheadPerUnit: 0,
    },
    create: {
      name: 'Containers e Embalagens',
      description: 'Soluções de armazenamento e embalagem',
      porcentage: 40,
      volumevendasconsiderar: 8000,
      overheadPerUnit: 0,
    },
  });

  const groupKits = await prisma.productGroup.upsert({
    where: { name: 'Kits e Conjuntos' },
    update: {
      description: 'Kits completos para diversas aplicações',
      porcentage: 35,
      volumevendasconsiderar: 6000,
      overheadPerUnit: 0,
    },
    create: {
      name: 'Kits e Conjuntos',
      description: 'Kits completos para diversas aplicações',
      porcentage: 35,
      volumevendasconsiderar: 6000,
      overheadPerUnit: 0,
    },
  });

  // Compute considered fixed costs total
  const fixedCosts = await prisma.fixedCost.findMany({
    select: { totalCost: true, considerationPercentage: true },
  });
  const totalConsidered = fixedCosts.reduce((sum, fc) => {
    const t = Number(fc.totalCost);
    const pct = Number(fc.considerationPercentage);
    return sum + t * (pct / 100);
  }, 0);

  // Update overheadPerUnit for groups based on formula
  const computeOverhead = (pct: number | null | undefined, vol: number | null | undefined) => {
    const p = (pct ?? 0) / 100;
    const v = vol ?? 0;
    // round to 2 decimals safely without string conversions
    const value = v > 0 ? (totalConsidered * p) / v : 0;
    return Math.round(value * 100) / 100;
  };

  // persist overheads atomically for all groups
  const overheadEstruturais = computeOverhead(
    groupEstruturais.porcentage,
    groupEstruturais.volumevendasconsiderar,
  );
  const overheadEmbalagens = computeOverhead(
    groupEmbalagens.porcentage,
    groupEmbalagens.volumevendasconsiderar,
  );
  const overheadKits = computeOverhead(
    groupKits.porcentage,
    groupKits.volumevendasconsiderar,
  );

  await prisma.$transaction([
    prisma.productGroup.update({
      where: { id: groupEstruturais.id },
      data: { overheadPerUnit: overheadEstruturais },
    }),
    prisma.productGroup.update({
      where: { id: groupEmbalagens.id },
      data: { overheadPerUnit: overheadEmbalagens },
    }),
    prisma.productGroup.update({
      where: { id: groupKits.id },
      data: { overheadPerUnit: overheadKits },
    }),
  ]);

  console.log(
    `   ↳ Overhead/Unidade calculado: Estruturais=${overheadEstruturais.toFixed(2)}, Embalagens=${overheadEmbalagens.toFixed(2)}, Kits=${overheadKits.toFixed(2)}`,
  );

  console.log('✅ 3 grupos de produtos criados');

  // ============================================
  // 9. PRODUTOS
  // ============================================
  console.log('\n📦 Criando produtos...');

  const productSuporteMetalico = await prisma.product.upsert({
    where: { code: '10001' },
    update: {
      name: 'Suporte Metálico Modelo A',
      description: 'Suporte estrutural em aço carbono com acabamento pintado',
      creatorId: adminUser.id,
      fixedCostId: fixedCostJan.id,
      productGroupId: groupEstruturais.id,
      priceWithoutTaxesAndFreight: 125.5,
      priceWithTaxesAndFreight: 185.75,
      productRawMaterials: {
        deleteMany: {},
        create: [
          { rawMaterialId: mpAcoCarbono.id, quantity: 5.0 },
          { rawMaterialId: mpParafuso.id, quantity: 8.0 },
          { rawMaterialId: mpTinta.id, quantity: 0.5 },
          { rawMaterialId: mpEmbalagem.id, quantity: 1.0 },
        ],
      },
      freights: { set: [{ id: freightNacional.id }] },
    },
    create: {
      code: '10001',
      name: 'Suporte Metálico Modelo A',
      description: 'Suporte estrutural em aço carbono com acabamento pintado',
      creatorId: adminUser.id,
      fixedCostId: fixedCostJan.id,
      productGroupId: groupEstruturais.id,
      priceWithoutTaxesAndFreight: 125.5,
      priceWithTaxesAndFreight: 185.75,
      productRawMaterials: {
        create: [
          { rawMaterialId: mpAcoCarbono.id, quantity: 5.0 },
          { rawMaterialId: mpParafuso.id, quantity: 8.0 },
          { rawMaterialId: mpTinta.id, quantity: 0.5 },
          { rawMaterialId: mpEmbalagem.id, quantity: 1.0 },
        ],
      },
      freights: {
        connect: [{ id: freightNacional.id }],
      },
    },
  });

  const productContainer = await prisma.product.upsert({
    where: { code: '10002' },
    update: {
      name: 'Container Plástico Premium',
      description: 'Container de armazenamento em PEAD alta resistência',
      creatorId: comercialUser.id,
      fixedCostId: fixedCostJan.id,
      productGroupId: groupEmbalagens.id,
      priceWithoutTaxesAndFreight: 78.0,
      priceWithTaxesAndFreight: 112.5,
      productRawMaterials: {
        deleteMany: {},
        create: [
          { rawMaterialId: mpPolietileno.id, quantity: 2.5 },
          { rawMaterialId: mpEmbalagem.id, quantity: 1.0 },
        ],
      },
      freights: { set: [{ id: freightNacional.id }, { id: freightExpresso.id }] },
    },
    create: {
      code: '10002',
      name: 'Container Plástico Premium',
      description: 'Container de armazenamento em PEAD alta resistência',
      creatorId: comercialUser.id,
      fixedCostId: fixedCostJan.id,
      productGroupId: groupEmbalagens.id,
      priceWithoutTaxesAndFreight: 78.0,
      priceWithTaxesAndFreight: 112.5,
      productRawMaterials: {
        create: [
          { rawMaterialId: mpPolietileno.id, quantity: 2.5 },
          { rawMaterialId: mpEmbalagem.id, quantity: 1.0 },
        ],
      },
      freights: {
        connect: [{ id: freightNacional.id }, { id: freightExpresso.id }],
      },
    },
  });

  const productPecaComposta = await prisma.product.upsert({
    where: { code: '10003' },
    update: {
      name: 'Peça Composta Industrial',
      description: 'Peça industrial com revestimento epóxi',
      creatorId: adminUser.id,
      fixedCostId: fixedCostFev.id,
      productGroupId: groupEstruturais.id,
      priceWithoutTaxesAndFreight: 385.0,
      priceWithTaxesAndFreight: 520.0,
      productRawMaterials: {
        deleteMany: {},
        create: [
          { rawMaterialId: mpAcoCarbono.id, quantity: 12.0 },
          { rawMaterialId: mpResinaEpoxi.id, quantity: 1.5 },
          { rawMaterialId: mpParafuso.id, quantity: 24.0 },
          { rawMaterialId: mpEmbalagem.id, quantity: 2.0 },
        ],
      },
      freights: { set: [{ id: freightInternacional.id }] },
    },
    create: {
      code: '10003',
      name: 'Peça Composta Industrial',
      description: 'Peça industrial com revestimento epóxi',
      creatorId: adminUser.id,
      fixedCostId: fixedCostFev.id,
      productGroupId: groupEstruturais.id,
      priceWithoutTaxesAndFreight: 385.0,
      priceWithTaxesAndFreight: 520.0,
      productRawMaterials: {
        create: [
          { rawMaterialId: mpAcoCarbono.id, quantity: 12.0 },
          { rawMaterialId: mpResinaEpoxi.id, quantity: 1.5 },
          { rawMaterialId: mpParafuso.id, quantity: 24.0 },
          { rawMaterialId: mpEmbalagem.id, quantity: 2.0 },
        ],
      },
      freights: {
        connect: [{ id: freightInternacional.id }],
      },
    },
  });

  const productKitFixacao = await prisma.product.upsert({
    where: { code: '10004' },
    update: {
      name: 'Kit Fixação Completo',
      description: 'Kit com componentes de fixação diversos',
      creatorId: comercialUser.id,
      productGroupId: groupKits.id,
      priceWithoutTaxesAndFreight: 45.0,
      priceWithTaxesAndFreight: 58.5,
      productRawMaterials: {
        deleteMany: {},
        create: [
          { rawMaterialId: mpParafuso.id, quantity: 50.0 },
          { rawMaterialId: mpEmbalagem.id, quantity: 1.0 },
        ],
      },
      freights: { set: [{ id: freightExpresso.id }] },
    },
    create: {
      code: '10004',
      name: 'Kit Fixação Completo',
      description: 'Kit com componentes de fixação diversos',
      creatorId: comercialUser.id,
      productGroupId: groupKits.id,
      priceWithoutTaxesAndFreight: 45.0,
      priceWithTaxesAndFreight: 58.5,
      productRawMaterials: {
        create: [
          { rawMaterialId: mpParafuso.id, quantity: 50.0 },
          { rawMaterialId: mpEmbalagem.id, quantity: 1.0 },
        ],
      },
      freights: {
        connect: [{ id: freightExpresso.id }],
      },
    },
  });

  const productSemGrupo = await prisma.product.upsert({
    where: { code: '10005' },
    update: {
      name: 'Produto Sem Grupo',
      description: 'Produto avulso sem categoria definida',
      creatorId: adminUser.id,
      fixedCostId: fixedCostJan.id,
      priceWithoutTaxesAndFreight: 35.0,
      priceWithTaxesAndFreight: 48.0,
      productRawMaterials: {
        deleteMany: {},
        create: [{ rawMaterialId: mpEmbalagem.id, quantity: 1.0 }],
      },
      freights: { set: [{ id: freightNacional.id }] },
    },
    create: {
      code: '10005',
      name: 'Produto Sem Grupo',
      description: 'Produto avulso sem categoria definida',
      creatorId: adminUser.id,
      fixedCostId: fixedCostJan.id,
      priceWithoutTaxesAndFreight: 35.0,
      priceWithTaxesAndFreight: 48.0,
      productRawMaterials: {
        create: [{ rawMaterialId: mpEmbalagem.id, quantity: 1.0 }],
      },
      freights: {
        connect: [{ id: freightNacional.id }],
      },
    },
  });

  console.log('✅ 5 produtos criados');

  // ============================================
  // 10. LOGS DE ALTERAÇÃO
  // ============================================
  console.log('\n📝 Criando logs de exemplo...');

  await prisma.rawMaterialChangeLog.create({
    data: {
      rawMaterialId: mpAcoCarbono.id,
      field: 'acquisitionPrice',
      oldValue: '8.00',
      newValue: '8.50',
      userId: impostoUser.id,
      changedAt: new Date('2025-01-15'),
    },
  });

  await prisma.rawMaterialChangeLog.create({
    data: {
      rawMaterialId: mpPolietileno.id,
      field: 'additionalCost',
      oldValue: '0.60',
      newValue: '0.80',
      userId: logisticaUser.id,
      changedAt: new Date('2025-01-20'),
    },
  });

  console.log('✅ 2 logs de alteração criados');

  // ============================================
  // RESUMO FINAL
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('✅ SEED CONCLUÍDO COM SUCESSO!');
  console.log('='.repeat(60));
  console.log('\n📊 Resumo dos dados criados:');
  console.log('   👥 Usuários: 4');
  console.log('      • Admin, Comercial, Logística, Imposto');
  console.log('   💰 Impostos de Frete: 4');
  console.log('      • ICMS, PIS, COFINS, II');
  console.log('   🚚 Fretes: 3');
  console.log('      • Nacional, Internacional, Expresso');
  console.log('   💰 Impostos de Matéria-Prima: 11');
  console.log('      • PIS, COFINS, ICMS, IPI, II, SIMPLES (várias alíquotas)');
  console.log('   📦 Matérias-Primas: 6');
  console.log('      • MP001: Aço Carbono (Lucro Real)');
  console.log('      • MP002: Polietileno (Lucro Real)');
  console.log('      • MP003: Resina Epóxi (Importado)');
  console.log('      • MP004: Parafuso (Simples Nacional)');
  console.log('      • MP005: Tinta (Lucro Presumido)');
  console.log('      • MP006: Embalagem (Simples Nacional)');
  console.log('   💼 Custos Fixos: 2');
  console.log('      • Janeiro 2025 (R$ 80.000,00)');
  console.log('      • Fevereiro 2025 (R$ 83.500,00)');
  console.log('   📂 Grupos de Produtos: 3');
  console.log('      • Componentes Estruturais');
  console.log('      • Containers e Embalagens');
  console.log('      • Kits e Conjuntos');
  console.log('   📦 Produtos: 5');
  console.log('      • 10001: Suporte Metálico');
  console.log('      • 10002: Container Plástico');
  console.log('      • 10003: Peça Composta');
  console.log('      • 10004: Kit Fixação');
  console.log('      • 10005: Produto Sem Grupo');
  console.log('   📝 Logs de Alteração: 2');
  console.log('\n🔑 Credenciais de acesso:');
  console.log('   ┌─────────────────────────────────────────────────────┐');
  console.log('   │ ADMIN:      admin@example.com / Admin@123456       │');
  console.log('   │ COMERCIAL:  comercial@example.com / Comercial@123  │');
  console.log('   │ LOGISTICA:  logistica@example.com / Logistica@123  │');
  console.log('   │ IMPOSTO:    imposto@example.com / Imposto@123      │');
  console.log('   └─────────────────────────────────────────────────────┘');
  console.log(
    '\n⚠️  IMPORTANTE: Altere as senhas padrão após o primeiro login!',
  );
  console.log('📌 Todos os IDs foram gerados como UUIDs válidos.');
  console.log('='.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
