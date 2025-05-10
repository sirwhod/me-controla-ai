// Importe a interface Workspace se necessário para referências
// import { Workspace } from './workspace'; // Ajuste o caminho

// Importe as interfaces para entidades relacionadas se necessário
// import { Bank } from './bank'; // Ajuste o caminho
// import { PaymentMethod } from './paymentMethod'; // Ajuste o caminho
// import { Category } from './category'; // Ajuste o caminho


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

// Você pode adicionar interfaces para outras entidades aqui ou em arquivos separados
// Ex:
// export interface Bank { ... }
// export interface PaymentMethod { ... }
// export interface Category { ... }
// export interface Goal { ... }

