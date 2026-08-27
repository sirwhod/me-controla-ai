import { z } from "zod";
import {
  iconNames, 
  type IconName, 
} from 'lucide-react/dynamic'

// --- Interface para Débito (Debit) ---
export type TypeDebit = 'Comum' | 'Fixo' | 'Assinatura' | 'Parcelamento'

export interface Debit {
  id?: string; // O ID do documento do Firestore
  workspaceId: string;
  userId: string; // UID do usuário que registrou
  description: string;
  value: number;
  date: Date | null; // Convertido de Timestamp para Date na API
  month: string; // Ex: "junho"
  year: number; // Ex: 2025
  type: 'Comum' | 'Fixo' | 'Assinatura' | 'Parcelamento'; // Tipos de débito
  bankId: string | null; // ID do banco associado (pode ser null)
  bankName: string | null; // Nome do banco associado (pode ser null)
  bankImageUrl: string | null; // Imagem do banco associado (pode ser null)
  creditCardId?: string | null; // ID do cartão de crédito específico
  paymentMethod: 'Crédito' | 'Débito' | 'Pix' | 'Conta'; // método de pagamento associado
  categoryId: string | null; // ID da categoria associada (pode ser null)
  categoryName: string | null; // Nome da categoria associada (pode ser null)
  categoryUrl: string | null; // Imagem da categoria associada (pode ser null)
  responsibleId?: string | null; // ID do responsável vinculado à despesa
  responsibleName?: string | null;
  proofUrl: string | null; // URL do comprovante (pode ser null)
  status: string; // Status do débito (ex: 'pending', 'paid', 'overdue')
  createdAt: Date | null; // Convertido de Timestamp para Date
  updatedAt: Date | null; // Convertido de Timestamp para Date

  // Campos específicos para tipos complexos
  isTemplate?: boolean; // Para Fixo/Assinatura: True se modelo, False se instância
  templateId?: string | null; // Para Instâncias: ID do modelo original
  recurrenceId?: string | null; // ID do registro mestre de recorrência
  originalDebitId?: string | null; // ID da primeira parcela do grupo
  frequency?: 'monthly'; // Para Modelos Fixo/Assinatura: Frequência
  startDate?: Date | null; // Para Modelos Fixo/Assinatura/Parcelamento: Data de início
  endDate?: Date | null; // Opcional para Assinatura: Data de término
  isActive?: boolean; // Para Modelos Assinatura: True se ativo
  totalInstallments?: number; // Para Parcelamento: Número total de parcelas
  currentInstallment?: number; // Para Parcelamento: Número da parcela atual
  originalValueAtCreation?: number; // Opcional para Instâncias Fixo/Assinatura: Valor do modelo na geração
  lastGeneratedMonthYear?: string; // Para Modelos Fixo/Assinatura: Último período gerado (string "Mês Ano")
}

const safeUrlSchema = z.string().url('URL inválida.').refine((url) => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}, { message: 'URL deve utilizar protocolo HTTP ou HTTPS seguro.' }).optional().or(z.literal('')).nullable()

export const createDebitSchema = z.object({
  description: z.string().trim().min(1, { message: 'A descrição do débito é obrigatória.' }).max(255, { message: 'Descrição não pode exceder 255 caracteres.' }),
  value: z.number().positive({ message: 'O valor do débito deve ser positivo.' }).max(1_000_000_000, { message: 'Valor excede o limite máximo.' }),
  date: z.string().datetime({ message: 'Data da transação inválida.' }),
  type: z.enum(['Comum', 'Fixo', 'Assinatura', 'Parcelamento'], {
    errorMap: () => ({ message: 'Tipo de débito inválido.' }),
  }).optional(),
  bankId: z.string().optional().nullable(),
  creditCardId: z.string().optional().nullable(),
  paymentMethod: z.enum(['Crédito', 'Débito', 'Pix', 'Conta'], {
    errorMap: () => ({ message: 'Método de pagamento inválido.' }),
  }),
  categoryId: z.string().optional().nullable(),
  responsibleId: z.string().optional().nullable(),
  proofUrl: safeUrlSchema,
  status: z.enum(['pending', 'paid', 'overdue']).optional(),
  frequency: z.enum(['monthly']).optional(),
  startDate: z.string().datetime({ message: 'Data de início inválida.' }).optional(),
  endDate: z.string().datetime({ message: 'Data de término inválida.' }).optional().or(z.literal('')).nullable(),
  totalInstallments: z.number().int().min(2, { message: 'Mínimo de 2 parcelas.' }).max(120, { message: 'Máximo de 120 parcelas permitido.' }).optional(),
  currentInstallment: z.number().int().min(1, { message: 'Número da parcela atual deve ser 1 ou maior.' }).optional(),
})

export type CreateDebit = z.infer<typeof createDebitSchema>

export const updateDebitSchema = z.object({
  description: z.string().trim().min(1, { message: 'A descrição não pode ser vazia.' }).max(255, { message: 'Descrição não pode exceder 255 caracteres.' }).optional(),
  value: z.number().positive({ message: 'O valor deve ser positivo.' }).max(1_000_000_000, { message: 'Valor excede o limite máximo.' }).optional(),
  date: z.string().datetime({ message: 'Data inválida.' }).optional(),
  bankId: z.string().optional().nullable(),
  creditCardId: z.string().optional().nullable(),
  paymentMethod: z.enum(['Crédito', 'Débito', 'Pix', 'Conta'], {
    errorMap: () => ({ message: 'Método de pagamento inválido.' }),
  }).nullable().optional(),
  categoryId: z.string().optional().nullable(),
  responsibleId: z.string().optional().nullable(),
  proofUrl: safeUrlSchema,
  status: z.string().max(50).optional(),
  frequency: z.enum(['monthly']).optional(),
  startDate: z.string().datetime({ message: 'Data de início inválida.' }).optional(),
  endDate: z.string().datetime({ message: 'Data de término inválida.' }).optional().or(z.literal('')).nullable(),
  isActive: z.boolean().optional(),
  totalInstallments: z.number().int().min(2, { message: 'Mínimo de 2 parcelas.' }).max(120, { message: 'Máximo de 120 parcelas permitido.' }).optional(),
  currentInstallment: z.number().int().min(1, { message: 'Número da parcela atual deve ser 1 ou maior.' }).optional(),
  updateFutureOnly: z.boolean().optional(), // Quando atualizando recorrência mestre
})

export type UpdateDebit = z.infer<typeof updateDebitSchema>

// --- Interface para Crédito (Credit) ---
export interface Credit {
  id: string; // O ID do documento do Firestore
  workspaceId: string;
  userId: string; // UID do usuário que registrou
  description: string;
  value: number;
  date: Date | null; // Convertido de Timestamp para Date na API
  month: string; // Ex: "junho"
  year: number; // Ex: 2025
  bankId: string | null; // ID do banco associado (pode ser null)
  bankName?: string | null;
  bankImageUrl?: string | null;
  paymentMethod: 'Crédito' | 'Débito' | 'Pix' | 'Conta'; // método de pagamento associado
  categoryId: string | null; // ID da categoria associada (pode ser null)
  categoryName?: string | null;
  categoryUrl?: string | null;
  proofUrl: string | null; // URL do comprovante (pode ser null)
  responsibleId?: string | null;
  responsibleName?: string | null;
  status: string; // Status do crédito (ex: 'pending', 'received')
  createdAt: Date | null; // Convertido de Timestamp para Date
  updatedAt: Date | null; // Convertido de Timestamp para Date
}

export const createCreditSchema = z.object({
  description: z.string().trim().min(1, { message: 'A descrição do crédito é obrigatória.' }).max(255, { message: 'Descrição não pode exceder 255 caracteres.' }),
  value: z.number().positive({ message: 'O valor do crédito deve ser positivo.' }).max(1_000_000_000, { message: 'Valor excede o limite máximo.' }),
  date: z.string().datetime({ message: 'Data da transação inválida.' }),
  bankId: z.string().optional().nullable(),
  paymentMethod: z.enum(['Crédito', 'Débito', 'Pix', 'Conta'], {
    errorMap: () => ({ message: 'Método de pagamento inválido.' }),
  }),
  categoryId: z.string().optional().nullable(),
  responsibleId: z.string().optional().nullable(),
  proofUrl: safeUrlSchema,
  status: z.string().max(50).optional(),
})

export type CreateCredit = z.infer<typeof createCreditSchema>

export const updateCreditSchema = z.object({
  description: z.string().trim().min(1, { message: 'A descrição não pode ser vazia.' }).max(255, { message: 'Descrição não pode exceder 255 caracteres.' }).optional(),
  value: z.number().positive({ message: 'O valor deve ser positivo.' }).max(1_000_000_000, { message: 'Valor excede o limite máximo.' }).optional(),
  date: z.string().datetime({ message: 'Data inválida.' }).optional(),
  bankId: z.string().optional().nullable(),
  paymentMethod: z.enum(['Crédito', 'Débito', 'Pix', 'Conta'], {
    errorMap: () => ({ message: 'Método de pagamento inválido.' }),
  }).nullable().optional(),
  categoryId: z.string().optional().nullable(),
  responsibleId: z.string().optional().nullable(),
  proofUrl: safeUrlSchema,
  status: z.string().max(50).optional(),
})

export type UpdateCredit = z.infer<typeof updateCreditSchema>

// --- Interface para Banco / Conta (Bank) ---
export interface Bank {
  id: string; // O ID do documento do Firestore
  workspaceId: string; // ID do workspace pai
  name: string;
  code: string | null; // Código do banco (pode ser null)
  iconUrl: string | null; // URL do ícone (pode ser null)
  pixKey?: string | null;
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random' | null;
  createdAt: Date | null; // Data de criação (Timestamp convertido)
  updatedAt: Date | null; // Data de atualização (Timestamp convertido)
  invoiceClosingDay: string | null; // Dia de fechamento (para Crédito, pode ser null)
  invoiceDueDate: string | null; // Dia de vencimento (para Crédito, pode ser null)
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const createBankSchema = z.object({
  name: z.string().trim().min(1, { message: 'O nome do banco é obrigatório.' }).max(100, { message: 'Nome do banco não pode exceder 100 caracteres.' }),
  code: z.string().trim().max(20, { message: 'Código não pode exceder 20 caracteres.' }).optional(),
  iconUrl: safeUrlSchema,
  pixKey: z.string().trim().optional().or(z.literal('')),
  pixKeyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random']).optional().nullable(),
  imageFile: z
    .custom<FileList>()
    .refine((files) => files && files.length > 0, "A imagem do logo é obrigatória.")
    .refine(
      (files) => files?.[0]?.size <= MAX_FILE_SIZE_BYTES,
      `O tamanho máximo da imagem é ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`
    )
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Tipo de arquivo inválido. Apenas .jpg, .jpeg, .png e .webp são permitidos."
    )
    .optional(),
  invoiceClosingDay: z.string().regex(/^([1-9]|[12][0-9]|3[01])$/, { message: 'O dia de fechamento deve ser entre 1 e 31.' }).optional().or(z.literal('')),
  invoiceDueDate: z.string().regex(/^([1-9]|[12][0-9]|3[01])$/, { message: 'O dia de vencimento deve ser entre 1 e 31.' }).optional().or(z.literal('')),
})

export type CreateBank = z.infer<typeof createBankSchema>

export const updateBankSchema = z.object({
  name: z.string().trim().min(1, { message: 'O nome do banco não pode ser vazio.' }).max(100, { message: 'Nome do banco não pode exceder 100 caracteres.' }).optional(),
  code: z.string().trim().max(20, { message: 'Código não pode exceder 20 caracteres.' }).optional().nullable(),
  iconUrl: safeUrlSchema,
  pixKey: z.string().trim().optional().or(z.literal('')).nullable(),
  pixKeyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random']).optional().nullable(),
  invoiceClosingDay: z.string().regex(/^([1-9]|[12][0-9]|3[01])$/, { message: 'O dia de fechamento deve ser entre 1 e 31.' }).optional().or(z.literal('')).nullable(),
  invoiceDueDate: z.string().regex(/^([1-9]|[12][0-9]|3[01])$/, { message: 'O dia de vencimento deve ser entre 1 e 31.' }).optional().or(z.literal('')).nullable(),
})

export type UpdateBank = z.infer<typeof updateBankSchema>

// --- Interface para Cartão de Crédito (CreditCard) ---
export interface CreditCard {
  id: string;
  workspaceId: string;
  bankId: string;
  bankName?: string;
  name: string;
  last4Digits?: string | null;
  limit?: number | null;
  closingDay: number;
  dueDay: number;
  color?: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export const createCreditCardSchema = z.object({
  bankId: z.string().min(1, { message: 'Selecione a conta/banco emissor.' }),
  name: z.string().trim().min(1, { message: 'Nome do cartão é obrigatório.' }).max(100),
  last4Digits: z.string().length(4, { message: 'Informe os 4 últimos dígitos.' }).optional().or(z.literal('')),
  limit: z.number().positive({ message: 'Limite deve ser positivo.' }).optional().nullable(),
  closingDay: z.number().int().min(1).max(31, { message: 'Dia de fechamento inválido (1-31).' }),
  dueDay: z.number().int().min(1).max(31, { message: 'Dia de vencimento inválido (1-31).' }),
  color: z.string().optional(),
})

export type CreateCreditCard = z.infer<typeof createCreditCardSchema>

export const updateCreditCardSchema = z.object({
  bankId: z.string().min(1, { message: 'Selecione a conta/banco emissor.' }).optional(),
  name: z.string().trim().min(1, { message: 'Nome do cartão é obrigatório.' }).max(100).optional(),
  last4Digits: z.string().length(4, { message: 'Informe os 4 últimos dígitos.' }).optional().or(z.literal('')).nullable(),
  limit: z.number().positive({ message: 'Limite deve ser positivo.' }).optional().nullable(),
  closingDay: z.number().int().min(1).max(31, { message: 'Dia de fechamento inválido (1-31).' }).optional(),
  dueDay: z.number().int().min(1).max(31, { message: 'Dia de vencimento inválido (1-31).' }).optional(),
  color: z.string().optional().nullable(),
})

export type UpdateCreditCard = z.infer<typeof updateCreditCardSchema>

// --- Interface para Categoria Universal (Category) ---
export interface Category {
  id: string;
  workspaceId: string;
  name: string;
  icon: IconName | null;
  type: 'all' | 'expense' | 'income'; // 'all' = universal para receitas e despesas
  createdAt: Date | null;
  updatedAt: Date | null;
}

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, { message: 'O nome da categoria é obrigatório.' }).max(100, { message: 'Nome da categoria não pode exceder 100 caracteres.' }),
  icon: z.custom<IconName>(
    (val) => typeof val === 'string' && iconNames.includes(val as IconName),
    { message: 'Por favor, selecione um ícone válido.' },
  ),
  type: z.enum(['all', 'expense', 'income'], {
    errorMap: () => ({ message: 'Tipo inválido.' }),
  }),
})

export type CreateCategory = z.infer<typeof createCategorySchema>

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, { message: 'O nome da categoria não pode ser vazio.' }).max(100, { message: 'Nome da categoria não pode exceder 100 caracteres.' }).optional(),
  icon: z.custom<IconName>(
    (val) => typeof val === 'string' && iconNames.includes(val as IconName),
    { message: 'Por favor, selecione um ícone válido.' },
  ).refine((val) => val !== undefined && val !== null, { message: 'Por favor, selecione um ícone.' }).optional(),
  type: z.enum(['all', 'expense', 'income']).optional(),
})

export type UpdateCategory = z.infer<typeof updateCategorySchema>

// --- Interface para Meta Financeira (Goal) ---
export interface Goal {
  id: string;
  workspaceId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  startDate: Date | null;
  endDate: Date | null;
  userId: string | null;
  description: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export const createGoalSchema = z.object({
  name: z.string().trim().min(1, { message: 'O nome da meta é obrigatório.' }).max(100, { message: 'Nome da meta não pode exceder 100 caracteres.' }),
  targetAmount: z.number().positive({ message: 'O valor alvo da meta deve ser positivo.' }).max(1_000_000_000, { message: 'Valor excede o limite permitido.' }),
  startDate: z.string().datetime({ message: 'Data de início inválida.' }),
  endDate: z.string().datetime({ message: 'Data de término inválida.' }).optional().or(z.literal('')),
  description: z.string().trim().max(500, { message: 'Descrição não pode exceder 500 caracteres.' }).optional().or(z.literal('')),
  userId: z.string().optional().nullable(),
})

export type CreateGoal = z.infer<typeof createGoalSchema>

export const updateGoalSchema = z.object({
  name: z.string().trim().min(1, { message: 'O nome da meta não pode ser vazio.' }).max(100, { message: 'Nome da meta não pode exceder 100 caracteres.' }).optional(),
  targetAmount: z.number().positive({ message: 'O valor alvo da meta deve ser positivo.' }).max(1_000_000_000, { message: 'Valor excede o limite permitido.' }).optional(),
  currentAmount: z.number().min(0, { message: 'O progresso atual não pode ser negativo.' }).max(1_000_000_000, { message: 'Valor excede o limite permitido.' }).optional(),
  startDate: z.string().datetime({ message: 'Data de início inválida.' }).optional(),
  endDate: z.string().datetime({ message: 'Data de término inválida.' }).optional().or(z.literal('')).nullable(),
  description: z.string().trim().max(500, { message: 'Descrição não pode exceder 500 caracteres.' }).optional().or(z.literal('')).nullable(),
  userId: z.string().optional().nullable(),
})

export type UpdateGoal = z.infer<typeof updateGoalSchema>

// --- Interface para Aportes na Meta (GoalContribution) ---
export interface GoalContribution {
  id: string;
  goalId: string;
  workspaceId: string;
  userId: string;
  value: number;
  date: Date | null;
  description?: string | null;
  createdAt: Date | null;
}

export const createGoalContributionSchema = z.object({
  value: z.number().positive({ message: 'O valor do aporte deve ser positivo.' }),
  date: z.string().datetime({ message: 'Data do aporte inválida.' }),
  description: z.string().trim().max(255).optional().or(z.literal('')),
})

export type CreateGoalContribution = z.infer<typeof createGoalContributionSchema>

// --- Interface para Responsável / Terceiro (PersonResponsible) ---
export interface PersonResponsible {
  id: string;
  workspaceId: string;
  name: string;
  email?: string | null;
  userImage?: string | null;
  isRegisteredUser?: boolean;
  status: 'active' | 'invited' | 'linked';
  linkedUserId?: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export const createPersonResponsibleSchema = z.object({
  name: z.string().trim().min(1, { message: 'O nome do responsável é obrigatório.' }).max(100),
  email: z.string().email('E-mail inválido.').optional().or(z.literal('')),
})

export type CreatePersonResponsible = z.infer<typeof createPersonResponsibleSchema>

export const updatePersonResponsibleSchema = z.object({
  name: z.string().trim().min(1, { message: 'O nome não pode ser vazio.' }).max(100).optional(),
  email: z.string().email('E-mail inválido.').optional().or(z.literal('')).nullable(),
})

export type UpdatePersonResponsible = z.infer<typeof updatePersonResponsibleSchema>

// --- Interface para Convites de Caixinha (BoxInvitation) ---
export interface BoxInvitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  inviterName: string;
  inviterEmail: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  token: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export const createBoxInvitationSchema = z.object({
  inviteeEmail: z.string().email({ message: 'E-mail do convidado inválido.' }),
})

export type CreateBoxInvitation = z.infer<typeof createBoxInvitationSchema>