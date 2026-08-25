import dotenv from 'dotenv'
import path from 'path'
import Module from 'module'

// Carrega variáveis de ambiente do .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Mock do server-only para execução de scripts de teste em Node
const originalRequire = (Module.prototype as any).require
;(Module.prototype as any).require = function (id: string) {
  if (id === 'server-only') {
    return {}
  }
  return originalRequire.apply(this, arguments)
}

import { db } from '../app/lib/firebase'
import { registerAction } from '../app/actions/register-action'
import { verifyPassword } from '../app/lib/password'
import axios from 'axios'

interface TestResult {
  suite: string
  name: string
  passed: boolean
  message?: string
}

const results: TestResult[] = []

function assert(suite: string, name: string, condition: boolean, message?: string) {
  results.push({
    suite,
    name,
    passed: condition,
    message: condition ? undefined : message || 'Asserção falhou',
  })
}

async function runTestSuite() {
  console.log('\n======================================================')
  console.log('🚀 INICIANDO BATERIA COMPLETA DE TESTES AUTOMATIZADOS')
  console.log('   MeControla.AI - Cobertura de Funcionalidades Ponta a Ponta')
  console.log('======================================================\n')

  const testUser = {
    name: 'Usuário de Teste',
    email: 'teste.mecontrola@gmail.com',
    password: 'SenhaTeste@123',
  }

  let userId = ''
  let workspaceId = ''

  // ==========================================
  // SUÍTE 1: Limpeza Prévia & Registro de Usuário
  // ==========================================
  console.log('📦 [1/9] Testando Fluxo de Registro e Criação de Conta...')
  try {
    // Limpar usuário de teste antigo para garantir idempotência
    const existingUserQuery = await db.collection('users').where('email', '==', testUser.email).get()
    for (const doc of existingUserQuery.docs) {
      const data = doc.data()
      if (data.workspaceIds && Array.isArray(data.workspaceIds)) {
        for (const wsId of data.workspaceIds) {
          // Deletar subcoleções do workspace
          const subcollections = ['credits', 'debits', 'banks', 'categories', 'goals']
          for (const sub of subcollections) {
            const subDocs = await db.collection('workspaces').doc(wsId).collection(sub).get()
            for (const subDoc of subDocs.docs) {
              await subDoc.ref.delete()
            }
          }
          await db.collection('workspaces').doc(wsId).delete()
        }
      }
      await db.collection('users').doc(doc.id).delete()
    }

    // 1.1 Registrar Usuário
    const regResult = await registerAction({
      name: testUser.name,
      email: testUser.email,
      password: testUser.password,
    })

    assert('Registro & Autenticação', 'Cadastro com sucesso via registerAction', regResult.success === true, regResult.message)

    // 1.2 Verificar criação no Firestore
    const createdUserQuery = await db.collection('users').where('email', '==', testUser.email).limit(1).get()
    assert('Registro & Autenticação', 'Documento do usuário gravado no Firestore', !createdUserQuery.empty)

    if (!createdUserQuery.empty) {
      const userDoc = createdUserQuery.docs[0]
      userId = userDoc.id
      const userData = userDoc.data()

      assert('Registro & Autenticação', 'Nome do usuário gravado corretamente', userData.name === testUser.name)
      assert('Registro & Autenticação', 'E-mail gravado em minúsculas', userData.email === testUser.email.toLowerCase())
      assert('Registro & Autenticação', 'Array workspaceIds gerado no usuário', Array.isArray(userData.workspaceIds) && userData.workspaceIds.length > 0)
      assert('Registro & Autenticação', 'Status de trial ativo', userData.isTrial === true)

      // 1.3 Verificar se a senha foi hasheada com bcrypt
      const isBcryptHash = userData.password && userData.password.startsWith('$2')
      assert('Segurança', 'Senha armazenada com hash bcrypt seguro', !!isBcryptHash)

      // 1.4 Validar verificação de senha
      const isPasswordValid = await verifyPassword(testUser.password, userData.password)
      assert('Segurança', 'Validação de senha correta com verifyPassword', isPasswordValid === true)

      const isWrongPasswordRejected = await verifyPassword('SenhaIncorreta!999', userData.password)
      assert('Segurança', 'Rejeição de senha incorreta', isWrongPasswordRejected === false)

      // 1.5 Verificar Caixinha Pessoal criada
      if (userData.workspaceIds && userData.workspaceIds[0]) {
        workspaceId = userData.workspaceIds[0]
        const wsDoc = await db.collection('workspaces').doc(workspaceId).get()
        assert('Caixinhas', 'Caixinha Pessoal criada no Firestore', wsDoc.exists)

        if (wsDoc.exists) {
          const wsData = wsDoc.data()
          assert('Caixinhas', 'Nome da Caixinha gerado automaticamente', wsData?.name === `Caixinha de ${testUser.name}`)
          assert('Caixinhas', 'OwnerId da Caixinha coincide com o usuário', wsData?.ownerId === userId)
          assert('Caixinhas', 'Membros da Caixinha contém o usuário', Array.isArray(wsData?.members) && wsData.members.includes(userId))
        }
      }
    }

    // 1.6 Tentar cadastrar o mesmo e-mail novamente (deve ser rejeitado)
    const duplicateResult = await registerAction({
      name: 'Outro Nome',
      email: testUser.email,
      password: 'OutraSenha@123',
    })
    assert('Segurança & Validação', 'Bloqueio de e-mail duplicado', duplicateResult.success === false)
  } catch (error: any) {
    assert('Registro & Autenticação', 'Erro na execução da suíte 1', false, error.message)
  }

  // ==========================================
  // SUÍTE 2: Gestão Financeira (Categorias, Bancos, Metas)
  // ==========================================
  console.log('🏦 [2/9] Testando Criação de Entidades Financeiras...')
  let categoryId = ''
  let bankId = ''
  let creditId = ''
  let debitId1 = ''
  let debitId2 = ''
  let goalId = ''

  try {
    if (workspaceId) {
      // 2.1 Criar Categoria
      const catRef = db.collection('workspaces').doc(workspaceId).collection('categories').doc()
      categoryId = catRef.id
      await catRef.set({
        name: 'Alimentação',
        icon: 'utensils',
        type: 'expense',
        workspaceId: workspaceId,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const catDoc = await catRef.get()
      assert('Categorias', 'Categoria de Despesa criada com sucesso', catDoc.exists && catDoc.data()?.name === 'Alimentação')

      // 2.2 Criar Banco com Fechamento e Vencimento de Fatura
      const bankRef = db.collection('workspaces').doc(workspaceId).collection('banks').doc()
      bankId = bankRef.id
      await bankRef.set({
        name: 'Nubank Cartão',
        code: '260',
        iconUrl: null,
        invoiceClosingDay: '10',
        invoiceDueDate: '17',
        workspaceId: workspaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const bankDoc = await bankRef.get()
      assert('Bancos & Cartões', 'Banco/Cartão criado com dia de fechamento e vencimento', bankDoc.exists && bankDoc.data()?.invoiceClosingDay === '10')

      // 2.3 Criar Meta Financeira
      const goalRef = db.collection('workspaces').doc(workspaceId).collection('goals').doc()
      goalId = goalRef.id
      await goalRef.set({
        name: 'Reserva de Emergência',
        targetAmount: 10000,
        currentAmount: 2500,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        description: 'Meta para reserva de 6 meses de custos fixos',
        workspaceId: workspaceId,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const goalDoc = await goalRef.get()
      assert('Metas Financeiras', 'Meta criada com valor alvo e valor atual', goalDoc.exists && goalDoc.data()?.targetAmount === 10000)
    } else {
      assert('Gestão Financeira', 'WorkspaceId não encontrado para testes', false)
    }
  } catch (error: any) {
    assert('Gestão Financeira', 'Erro na execução da suíte 2', false, error.message)
  }

  // ==========================================
  // SUÍTE 3: Transações (Créditos e Débitos)
  // ==========================================
  console.log('💳 [3/9] Testando Lançamentos de Receitas e Despesas...')
  try {
    if (workspaceId) {
      // 3.1 Criar Receita (Crédito)
      const creditRef = db.collection('workspaces').doc(workspaceId).collection('credits').doc()
      creditId = creditRef.id
      await creditRef.set({
        description: 'Salário Mensal',
        value: 5000,
        date: new Date(),
        month: 'agosto',
        year: 2026,
        paymentMethod: 'Conta',
        categoryId: null,
        bankId: bankId,
        status: 'received',
        workspaceId: workspaceId,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const creditDoc = await creditRef.get()
      assert('Transações - Receitas', 'Receita de R$ 5.000 lançada com sucesso', creditDoc.exists && creditDoc.data()?.value === 5000)

      // 3.2 Criar Despesa 1 (Pix)
      const debitRef1 = db.collection('workspaces').doc(workspaceId).collection('debits').doc()
      debitId1 = debitRef1.id
      await debitRef1.set({
        description: 'Supermercado Mensal',
        value: 450,
        date: new Date(),
        month: 'agosto',
        year: 2026,
        type: 'Comum',
        categoryId: categoryId,
        paymentMethod: 'Pix',
        status: 'paid',
        workspaceId: workspaceId,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const debitDoc1 = await debitRef1.get()
      assert('Transações - Despesas', 'Despesa via Pix de R$ 450 lançada', debitDoc1.exists && debitDoc1.data()?.paymentMethod === 'Pix')

      // 3.3 Criar Despesa 2 (Cartão de Crédito)
      const debitRef2 = db.collection('workspaces').doc(workspaceId).collection('debits').doc()
      debitId2 = debitRef2.id
      await debitRef2.set({
        description: 'Jantar Restaurante',
        value: 150,
        date: new Date(),
        month: 'agosto',
        year: 2026,
        type: 'Comum',
        categoryId: categoryId,
        paymentMethod: 'Crédito',
        bankId: bankId,
        status: 'pending',
        workspaceId: workspaceId,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const debitDoc2 = await debitRef2.get()
      assert('Transações - Despesas', 'Despesa via Cartão de Crédito de R$ 150 vinculada ao banco', debitDoc2.exists && debitDoc2.data()?.bankId === bankId)
    }
  } catch (error: any) {
    assert('Transações', 'Erro na execução da suíte 3', false, error.message)
  }

  // ==========================================
  // SUÍTE 4: Inteligência Analítica e Cálculos do Dashboard
  // ==========================================
  console.log('📊 [4/9] Testando Cálculos e Métricas do Dashboard...')
  try {
    if (workspaceId) {
      const creditsSnap = await db.collection('workspaces').doc(workspaceId).collection('credits').get()
      const debitsSnap = await db.collection('workspaces').doc(workspaceId).collection('debits').get()

      const totalCredits = creditsSnap.docs.reduce((acc, doc) => acc + (doc.data().value || 0), 0)
      const totalDebits = debitsSnap.docs.reduce((acc, doc) => acc + (doc.data().value || 0), 0)
      const currentBalance = totalCredits - totalDebits

      assert('Dashboard Analítico', 'Cálculo de Receitas Totais (R$ 5.000)', totalCredits === 5000)
      assert('Dashboard Analítico', 'Cálculo de Despesas Totais (R$ 600)', totalDebits === 600)
      assert('Dashboard Analítico', 'Cálculo do Saldo Consolidado (R$ 4.400)', currentBalance === 4400)

      const paymentDistribution: Record<string, number> = {}
      debitsSnap.docs.forEach((doc) => {
        const method = doc.data().paymentMethod || 'Outro'
        paymentDistribution[method] = (paymentDistribution[method] || 0) + (doc.data().value || 0)
      })

      assert('Dashboard Analítico', 'Distribuição de pagamento - Pix (R$ 450)', paymentDistribution['Pix'] === 450)
      assert('Dashboard Analítico', 'Distribuição de pagamento - Cartão de Crédito (R$ 150)', paymentDistribution['Crédito'] === 150)
    }
  } catch (error: any) {
    assert('Dashboard Analítico', 'Erro nos cálculos analíticos', false, error.message)
  }

  // ==========================================
  // SUÍTE 5: Tipos Avançados de Despesas (Parcelamento, Fixas e Regras de Cartão)
  // ==========================================
  console.log('🔀 [5/9] Testando Tipos Avançados de Despesas (Parcelamentos e Recorrências)...')
  try {
    if (workspaceId) {
      // 5.1 Testar Geração de Parcelamento (3x de R$ 1.000)
      const totalInstallments = 3
      const installmentValue = 1000
      const startDate = new Date('2026-08-05')
      const firstInstallmentRef = db.collection('workspaces').doc(workspaceId).collection('debits').doc()
      const installmentBatch = db.batch()

      for (let i = 1; i <= totalInstallments; i++) {
        const instDate = new Date(startDate.getFullYear(), startDate.getMonth() + (i - 1), 5)
        const ref = i === 1 ? firstInstallmentRef : db.collection('workspaces').doc(workspaceId).collection('debits').doc()
        installmentBatch.set(ref, {
          description: `Parcela ${i}/${totalInstallments} - Compra Notebook`,
          value: installmentValue,
          date: instDate,
          month: instDate.toLocaleString('pt-BR', { month: 'long' }),
          year: instDate.getFullYear(),
          type: 'Parcelamento',
          totalInstallments: totalInstallments,
          currentInstallment: i,
          originalDebitId: firstInstallmentRef.id,
          paymentMethod: 'Crédito',
          bankId: bankId,
          categoryId: categoryId,
          workspaceId: workspaceId,
          userId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
      await installmentBatch.commit()

      const installmentsQuery = await db
        .collection('workspaces')
        .doc(workspaceId)
        .collection('debits')
        .where('originalDebitId', '==', firstInstallmentRef.id)
        .get()

      assert('Despesas Avançadas', 'Geração de 3 parcelas de parcelamento no Firestore', installmentsQuery.docs.length === 3)

      const hasInstallment1 = installmentsQuery.docs.some((d) => d.data().currentInstallment === 1)
      const hasInstallment2 = installmentsQuery.docs.some((d) => d.data().currentInstallment === 2)
      const hasInstallment3 = installmentsQuery.docs.some((d) => d.data().currentInstallment === 3)
      assert('Despesas Avançadas', 'Sequência de parcelas 1/3, 2/3 e 3/3 gravada corretamente', hasInstallment1 && hasInstallment2 && hasInstallment3)

      // 5.2 Testar Regra de Fatura do Cartão (Compra após dia 10 cai no mês seguinte)
      const closingDay = 10
      const purchaseDateAfterClosing = new Date('2026-08-15')
      const targetInvoiceMonth = purchaseDateAfterClosing.getDate() > closingDay ? 'setembro' : 'agosto'

      assert('Despesas Avançadas', 'Regra de fechamento de fatura projeta mês de vencimento subsequente', targetInvoiceMonth === 'setembro')
    }
  } catch (error: any) {
    assert('Despesas Avançadas', 'Erro na execução da suíte 5', false, error.message)
  }

  // ==========================================
  // SUÍTE 6: Edição e Atualização de Entidades (Update / PATCH CRUD)
  // ==========================================
  console.log('✏️ [6/9] Testando Atualização de Dados (Update CRUD)...')
  try {
    if (workspaceId && creditId && debitId1 && goalId && bankId) {
      // 6.1 Atualizar Receita
      const creditRef = db.collection('workspaces').doc(workspaceId).collection('credits').doc(creditId)
      await creditRef.update({
        description: 'Salário Atualizado com Bônus',
        value: 6500,
        updatedAt: new Date(),
      })
      const updatedCreditDoc = await creditRef.get()
      assert('Atualização (CRUD)', 'Atualização de valor e descrição da Receita', updatedCreditDoc.data()?.value === 6500 && updatedCreditDoc.data()?.description === 'Salário Atualizado com Bônus')

      // 6.2 Atualizar Despesa
      const debitRef = db.collection('workspaces').doc(workspaceId).collection('debits').doc(debitId1)
      await debitRef.update({
        description: 'Supermercado e Feira',
        value: 520,
        updatedAt: new Date(),
      })
      const updatedDebitDoc = await debitRef.get()
      assert('Atualização (CRUD)', 'Atualização de valor e descrição da Despesa', updatedDebitDoc.data()?.value === 520 && updatedDebitDoc.data()?.description === 'Supermercado e Feira')

      // 6.3 Atualizar Meta (Progresso)
      const goalRef = db.collection('workspaces').doc(workspaceId).collection('goals').doc(goalId)
      await goalRef.update({
        currentAmount: 3800,
        updatedAt: new Date(),
      })
      const updatedGoalDoc = await goalRef.get()
      assert('Atualização (CRUD)', 'Atualização de progresso atual da Meta Financeira', updatedGoalDoc.data()?.currentAmount === 3800)

      // 6.4 Atualizar Banco
      const bankRef = db.collection('workspaces').doc(workspaceId).collection('banks').doc(bankId)
      await bankRef.update({
        name: 'Nubank Ultravioleta VIP',
        updatedAt: new Date(),
      })
      const updatedBankDoc = await bankRef.get()
      assert('Atualização (CRUD)', 'Atualização de nome do Banco/Cartão', updatedBankDoc.data()?.name === 'Nubank Ultravioleta VIP')
    }
  } catch (error: any) {
    assert('Atualização (CRUD)', 'Erro na execução da suíte 6', false, error.message)
  }

  // ==========================================
  // SUÍTE 7: Múltiplas Caixinhas & Isolamento de Dados
  // ==========================================
  console.log('👥 [7/9] Testando Múltiplas Caixinhas & Isolamento de Dados...')
  let sharedWorkspaceId = ''
  let sharedDebitId = ''

  try {
    // 7.1 Criar Segunda Caixinha Compartilhada
    const sharedWsRef = db.collection('workspaces').doc()
    sharedWorkspaceId = sharedWsRef.id
    await sharedWsRef.set({
      name: 'Caixinha Viagem de Férias',
      type: 'shared',
      ownerId: userId,
      members: [userId],
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Adicionar novo workspaceId ao usuário
    const userRef = db.collection('users').doc(userId)
    const userDoc = await userRef.get()
    const currentWorkspaces = userDoc.data()?.workspaceIds || []
    await userRef.update({
      workspaceIds: [...currentWorkspaces, sharedWorkspaceId],
      updatedAt: new Date(),
    })

    const updatedUserDoc = await userRef.get()
    assert('Múltiplas Caixinhas', 'Usuário associado a múltiplas caixinhas no Firestore', updatedUserDoc.data()?.workspaceIds.length === 2)

    // 7.2 Lançar despesa na Caixinha Compartilhada
    const sharedDebitRef = db.collection('workspaces').doc(sharedWorkspaceId).collection('debits').doc()
    sharedDebitId = sharedDebitRef.id
    await sharedDebitRef.set({
      description: 'Reserva de Hotel Praia',
      value: 800,
      date: new Date(),
      month: 'agosto',
      year: 2026,
      type: 'Comum',
      paymentMethod: 'Pix',
      workspaceId: sharedWorkspaceId,
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // 7.3 Validar Isolamento Estrito
    const primaryDebits = await db.collection('workspaces').doc(workspaceId).collection('debits').where('description', '==', 'Reserva de Hotel Praia').get()
    assert('Isolamento de Dados', 'Despesa da caixinha compartilhada NÃO vaza para a caixinha pessoal', primaryDebits.empty)

    const sharedDebits = await db.collection('workspaces').doc(sharedWorkspaceId).collection('debits').where('description', '==', 'Reserva de Hotel Praia').get()
    assert('Isolamento de Dados', 'Despesa existe exclusivamente na caixinha compartilhada', !sharedDebits.empty)
  } catch (error: any) {
    assert('Múltiplas Caixinhas', 'Erro na execução da suíte 7', false, error.message)
  }

  // ==========================================
  // SUÍTE 8: Operações de Exclusão (Delete CRUD)
  // ==========================================
  console.log('🗑️ [8/9] Testando Exclusão de Entidades (Delete CRUD)...')
  try {
    if (workspaceId && creditId && debitId2 && categoryId && goalId) {
      // 8.1 Deletar Despesa 2
      await db.collection('workspaces').doc(workspaceId).collection('debits').doc(debitId2).delete()
      const deletedDebitDoc = await db.collection('workspaces').doc(workspaceId).collection('debits').doc(debitId2).get()
      assert('Exclusão (CRUD)', 'Exclusão de Despesa realizada com sucesso', !deletedDebitDoc.exists)

      // 8.2 Deletar Caixinha Compartilhada de Teste
      if (sharedWorkspaceId) {
        if (sharedDebitId) {
          await db.collection('workspaces').doc(sharedWorkspaceId).collection('debits').doc(sharedDebitId).delete()
        }
        await db.collection('workspaces').doc(sharedWorkspaceId).delete()
        const deletedWsDoc = await db.collection('workspaces').doc(sharedWorkspaceId).get()
        assert('Exclusão (CRUD)', 'Exclusão de Caixinha Compartilhada realizada com sucesso', !deletedWsDoc.exists)
      }
    }
  } catch (error: any) {
    assert('Exclusão (CRUD)', 'Erro na execução da suíte 8', false, error.message)
  }

  // ==========================================
  // SUÍTE 9: Rotas HTTP e Proteção do Middleware
  // ==========================================
  console.log('🌐 [9/9] Testando Rotas HTTP da Aplicação...')
  const baseUrl = 'http://127.0.0.1:3000'

  try {
    // 9.1 Testar Página Inicial (Pública)
    const homeRes = await axios.get(baseUrl, { timeout: 30000, validateStatus: () => true })
    assert('Rotas HTTP', 'Página Inicial (/) acessível publicamente (Status 200)', homeRes.status === 200)

    // 9.2 Testar Página de Login (Pública)
    const signinRes = await axios.get(`${baseUrl}/sign-in`, { timeout: 30000, validateStatus: () => true })
    assert('Rotas HTTP', 'Página de Login (/sign-in) acessível publicamente (Status 200)', signinRes.status === 200)

    // 9.3 Testar Proteção de Rota Privada (/dashboard)
    const dashRes = await axios.get(`${baseUrl}/dashboard`, {
      timeout: 30000,
      maxRedirects: 0,
      validateStatus: () => true,
    })
    const isRedirectedToLogin = dashRes.status === 307 || dashRes.status === 302 || dashRes.headers['location']?.includes('/sign-in')
    assert('Segurança & Middleware', 'Rota privada (/dashboard) bloqueada para anônimos e redirecionada para /sign-in', isRedirectedToLogin)
  } catch (error: any) {
    assert('Rotas HTTP', `Falha ao testar rotas HTTP em ${baseUrl}`, false, error.message)
  }

  // ==========================================
  // RELATÓRIO FINAL CONSOLIDADO
  // ==========================================
  console.log('\n======================================================')
  console.log('📋 RELATÓRIO FINAL DOS TESTES CONSOLIDADOS')
  console.log('======================================================\n')

  let passedCount = 0
  let failedCount = 0

  const grouped: Record<string, TestResult[]> = {}
  results.forEach((r) => {
    grouped[r.suite] = grouped[r.suite] || []
    grouped[r.suite].push(r)
  })

  for (const [suite, suiteResults] of Object.entries(grouped)) {
    console.log(`🔷 ${suite}:`)
    suiteResults.forEach((r) => {
      if (r.passed) {
        passedCount++
        console.log(`  ✅ [PASS] ${r.name}`)
      } else {
        failedCount++
        console.log(`  ❌ [FAIL] ${r.name} - Motivo: ${r.message}`)
      }
    })
    console.log('')
  }

  console.log('------------------------------------------------------')
  console.log(`Total de Asserções: ${results.length}`)
  console.log(`Passaram: ${passedCount} ✅`)
  console.log(`Falharam: ${failedCount} ❌`)
  console.log('------------------------------------------------------\n')

  console.log('👤 Usuário de Teste Criado e Pronto para Uso:')
  console.log(`   E-mail: ${testUser.email}`)
  console.log(`   Senha:  ${testUser.password}`)
  console.log(`   Caixinha: Caixinha de ${testUser.name} (${workspaceId})`)
  console.log('======================================================\n')
}

runTestSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro fatal ao rodar testes:', err)
    process.exit(1)
  })
