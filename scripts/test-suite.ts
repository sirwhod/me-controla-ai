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
  console.log('🚀 INICIANDO BATERIA DE TESTES AUTOMATIZADOS - MeControla.AI')
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
  console.log('📦 [1/5] Testando Fluxo de Registro e Criação de Conta...')
  try {
    // Limpar usuário de teste antigo para garantir idempotência
    const existingUserQuery = await db.collection('users').where('email', '==', testUser.email).get()
    for (const doc of existingUserQuery.docs) {
      const data = doc.data()
      // Deletar workspaces associados de teste
      if (data.workspaceIds && Array.isArray(data.workspaceIds)) {
        for (const wsId of data.workspaceIds) {
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
  console.log('🏦 [2/5] Testando Criação de Entidades Financeiras...')
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
        color: '#FF5733',
        type: 'debit',
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
        color: '#8A05BE',
        invoiceClosingDay: 10,
        invoiceDueDate: 17,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const bankDoc = await bankRef.get()
      assert('Bancos & Cartões', 'Banco/Cartão criado com dia de fechamento e vencimento', bankDoc.exists && bankDoc.data()?.invoiceClosingDay === 10)

      // 2.3 Criar Meta Financeira
      const goalRef = db.collection('workspaces').doc(workspaceId).collection('goals').doc()
      goalId = goalRef.id
      await goalRef.set({
        name: 'Reserva de Emergência',
        targetAmount: 10000,
        currentAmount: 2500,
        deadline: new Date('2026-12-31'),
        description: 'Meta para reserva de 6 meses de custos fixos',
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
  console.log('💳 [3/5] Testando Lançamentos de Receitas e Despesas...')
  try {
    if (workspaceId) {
      // 3.1 Criar Receita (Crédito)
      const creditRef = db.collection('workspaces').doc(workspaceId).collection('credits').doc()
      creditId = creditRef.id
      await creditRef.set({
        description: 'Salário Mensal',
        amount: 5000,
        date: new Date(),
        category: 'Salário',
        source: 'Empresa XYZ',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const creditDoc = await creditRef.get()
      assert('Transações - Receitas', 'Receita de R$ 5.000 lançada com sucesso', creditDoc.exists && creditDoc.data()?.amount === 5000)

      // 3.2 Criar Despesa 1 (Pix)
      const debitRef1 = db.collection('workspaces').doc(workspaceId).collection('debits').doc()
      debitId1 = debitRef1.id
      await debitRef1.set({
        description: 'Supermercado Mensal',
        amount: 450,
        date: new Date(),
        category: 'Alimentação',
        categoryId: categoryId,
        paymentMethod: 'pix',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const debitDoc1 = await debitRef1.get()
      assert('Transações - Despesas', 'Despesa via Pix de R$ 450 lançada', debitDoc1.exists && debitDoc1.data()?.paymentMethod === 'pix')

      // 3.3 Criar Despesa 2 (Cartão de Crédito)
      const debitRef2 = db.collection('workspaces').doc(workspaceId).collection('debits').doc()
      debitId2 = debitRef2.id
      await debitRef2.set({
        description: 'Jantar Restaurante',
        amount: 150,
        date: new Date(),
        category: 'Alimentação',
        categoryId: categoryId,
        paymentMethod: 'credit_card',
        bankId: bankId,
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
  console.log('📊 [4/5] Testando Cálculos e Métricas do Dashboard...')
  try {
    if (workspaceId) {
      // Buscar todos os débitos e créditos
      const creditsSnap = await db.collection('workspaces').doc(workspaceId).collection('credits').get()
      const debitsSnap = await db.collection('workspaces').doc(workspaceId).collection('debits').get()

      const totalCredits = creditsSnap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0)
      const totalDebits = debitsSnap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0)
      const currentBalance = totalCredits - totalDebits

      assert('Dashboard Analítico', 'Cálculo de Receitas Totais (R$ 5.000)', totalCredits === 5000)
      assert('Dashboard Analítico', 'Cálculo de Despesas Totais (R$ 600)', totalDebits === 600)
      assert('Dashboard Analítico', 'Cálculo do Saldo Consolidado (R$ 4.400)', currentBalance === 4400)

      // Distribuição por Métodos de Pagamento
      const paymentDistribution: Record<string, number> = {}
      debitsSnap.docs.forEach((doc) => {
        const method = doc.data().paymentMethod || 'other'
        paymentDistribution[method] = (paymentDistribution[method] || 0) + (doc.data().amount || 0)
      })

      assert('Dashboard Analítico', 'Distribuição de pagamento - Pix (R$ 450)', paymentDistribution['pix'] === 450)
      assert('Dashboard Analítico', 'Distribuição de pagamento - Cartão de Crédito (R$ 150)', paymentDistribution['credit_card'] === 150)
    }
  } catch (error: any) {
    assert('Dashboard Analítico', 'Erro nos cálculos analíticos', false, error.message)
  }

  // ==========================================
  // SUÍTE 5: Testes de Rotas HTTP e Proteção do Middleware
  // ==========================================
  console.log('🌐 [5/5] Testando Rotas HTTP da Aplicação...')
  const baseUrl = 'http://localhost:3000'

  try {
    // 5.1 Testar Página Inicial (Pública)
    const homeRes = await axios.get(baseUrl, { timeout: 5000, validateStatus: () => true })
    assert('Rotas HTTP', 'Página Inicial (/) acessível publicamente (Status 200)', homeRes.status === 200)

    // 5.2 Testar Página de Login (Pública)
    const signinRes = await axios.get(`${baseUrl}/sign-in`, { timeout: 5000, validateStatus: () => true })
    assert('Rotas HTTP', 'Página de Login (/sign-in) acessível publicamente (Status 200)', signinRes.status === 200)

    // 5.3 Testar Proteção de Rota Privada (/dashboard)
    const dashRes = await axios.get(`${baseUrl}/dashboard`, {
      timeout: 5000,
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
  console.log('📋 RELATÓRIO FINAL DOS TESTES')
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
