import { z } from "zod";

// --- Interface para Débito (Debit) ---
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
  paymentMethodId: string | null; // ID do método de pagamento associado (pode ser null)
  categoryId: string | null; // ID da categoria associada (pode ser null)
  proofUrl: string | null; // URL do comprovante (pode ser null)
  status: string; // Status do débito (ex: 'pending', 'paid', 'overdue')
  createdAt: Date | null; // Convertido de Timestamp para Date
  updatedAt: Date | null; // Convertido de Timestamp para Date

  // Campos específicos para tipos complexos (podem ser undefined ou null dependendo do tipo e se é modelo/instância)
  isTemplate?: boolean; // Para Fixo/Assinatura: True se modelo, False se instância
  templateId?: string | null; // Para Instâncias: ID do modelo original
  frequency?: 'monthly'; // Para Modelos Fixo/Assinatura: Frequência
  startDate?: Date | null; // Para Modelos Fixo/Assinatura/Parcelamento: Data de início
  endDate?: Date | null; // Opcional para Assinatura: Data de término
  isActive?: boolean; // Para Modelos Assinatura: True se ativo
  totalInstallments?: number; // Para Parcelamento: Número total de parcelas
  currentInstallment?: number; // Para Parcelamento: Número da parcela atual
  originalValueAtCreation?: number; // Opcional para Instâncias Fixo/Assinatura: Valor do modelo na geração
  lastGeneratedMonthYear?: string; // Para Modelos Fixo/Assinatura: Último período gerado (string "Mês Ano")
}


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
  paymentMethodId: string | null; // ID do método de pagamento associado (pode ser null)
  categoryId: string | null; // ID da categoria associada (pode ser null)
  proofUrl: string | null; // URL do comprovante (pode ser null)
  status: string; // Status do crédito (ex: 'pending', 'received')
  createdAt: Date | null; // Convertido de Timestamp para Date
  updatedAt: Date | null; // Convertido de Timestamp para Date
}

// --- Interface para Banco (Bank) ---
// Corresponde ao documento em 'workspaces/{workspaceId}/banks/{bankId}'
export interface Bank {
  id: string; // O ID do documento do Firestore
  workspaceId: string; // ID do workspace pai
  name: string;
  code: string | null; // Código do banco (pode ser null)
  iconUrl: string | null; // URL do ícone (pode ser null)
  createdAt: Date | null; // Data de criação (Timestamp convertido)
  updatedAt: Date | null; // Data de atualização (Timestamp convertido)
}

export const createBankSchema = z.object({
  name: z.string().min(1, { message: 'O nome do banco é obrigatório.' }),
  code: z.string().optional(),
  iconUrl: z.string().url('URL do ícone inválida.').optional().or(z.literal('')),
})

export type CreateBank = z.infer<typeof createBankSchema>

export const updateBankSchema = z.object({
  name: z.string().min(1, { message: 'O nome do banco não pode ser vazio.' }).optional(),
  code: z.string().optional().nullable(),
  iconUrl: z.string().url('URL do ícone inválida.').optional().or(z.literal('')).nullable(),
})

export type UpdateBank = z.infer<typeof updateBankSchema>

// --- Interface para Método de Pagamento (PaymentMethod) ---
// Corresponde ao documento em 'workspaces/{workspaceId}/paymentMethods/{paymentMethodId}'
export interface PaymentMethod {
  id: string; // O ID do documento do Firestore
  workspaceId: string; // ID do workspace pai
  name: string;
  type: 'Crédito' | 'Débito' | 'Pix' | 'Conta'; // Tipo de método
  bankId: string | null; // ID do banco associado (pode ser null)
  invoiceClosingDay: number | null; // Dia de fechamento (para Crédito, pode ser null)
  invoiceDueDate: number | null; // Dia de vencimento (para Crédito, pode ser null)
  createdAt: Date | null; // Data de criação (Timestamp convertido)
  updatedAt: Date | null; // Data de atualização (Timestamp convertido)
}


// --- Interface para Categoria (Category) ---
// Corresponde ao documento em 'workspaces/{workspaceId}/categories/{categoryId}'
export interface Category {
  id: string; // O ID do documento do Firestore
  workspaceId: string; // ID do workspace pai
  name: string;
  type: 'expense' | 'income'; // Tipo de categoria
  createdAt: Date | null; // Data de criação (Timestamp convertido)
  updatedAt: Date | null; // Data de atualização (Timestamp convertido)
}


// --- Interface para Meta (Goal) ---
// Corresponde ao documento em 'workspaces/{workspaceId}/goals/{goalId}'
export interface Goal {
  id: string; // O ID do documento do Firestore
  workspaceId: string; // ID do workspace pai
  name: string;
  targetAmount: number;
  currentAmount: number; // Progresso atual (atualizado manualmente)
  startDate: Date | null; // Data de início (Timestamp convertido)
  endDate: Date | null; // Data de término (Timestamp convertido, pode ser null)
  userId: string | null; // UID do usuário responsável (pode ser null)
  description: string | null; // Descrição (pode ser null)
  createdAt: Date | null; // Data de criação (Timestamp convertido)
  updatedAt: Date | null; // Data de atualização (Timestamp convertido)
}

