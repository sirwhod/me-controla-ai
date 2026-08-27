import { type IconName } from 'lucide-react/dynamic'

export interface IconCatalogItem {
  name: IconName
  label: string
  tags: string[]
}

export const FINANCIAL_ICONS_CATALOG: IconCatalogItem[] = [
  // Alimentação & Mercado
  { name: 'utensils', label: 'Alimentação', tags: ['comida', 'restaurante', 'almoço', 'jantar', 'refeição', 'lanche', 'garfo', 'prato'] },
  { name: 'shopping-cart', label: 'Supermercado', tags: ['mercado', 'compras', 'feira', 'hortifruti', 'carrinho', 'despensa'] },
  { name: 'shopping-bag', label: 'Compras', tags: ['loja', 'roupas', 'shopping', 'varejo', 'sacola'] },
  { name: 'coffee', label: 'Café & Bebidas', tags: ['cafeteria', 'bar', 'bebida', 'copo', 'lanche'] },
  { name: 'pizza', label: 'Lanches & Fast Food', tags: ['pizza', 'ifood', 'delivery', 'hamburguer'] },
  { name: 'wine', label: 'Bares & Festas', tags: ['vinho', 'balada', 'festa', 'cerveja', 'lazer'] },

  // Transporte & Veículos
  { name: 'car', label: 'Carro & Transporte', tags: ['veiculo', 'automovel', 'uber', '99', 'taxi', 'transporte'] },
  { name: 'fuel', label: 'Combustível', tags: ['gasolina', 'alcool', 'diesel', 'posto', 'abastecimento'] },
  { name: 'bus', label: 'Ônibus & Público', tags: ['transporte publico', 'passe', 'passagem', 'metro'] },
  { name: 'plane', label: 'Viagens & Passagens', tags: ['viagem', 'aviao', 'voo', 'turismo', 'ferias', 'hotel'] },
  { name: 'bike', label: 'Bicicleta & Mobilidade', tags: ['ciclismo', 'mobilidade', 'patinete'] },
  { name: 'wrench', label: 'Manutenção & Mecânica', tags: ['oficina', 'conserto', 'reparo', 'ferramenta'] },

  // Moradia & Contas
  { name: 'home', label: 'Moradia & Casa', tags: ['aluguel', 'condominio', 'iptu', 'imovel', 'apartamento'] },
  { name: 'zap', label: 'Energia Elétrica', tags: ['luz', 'eletricidade', 'conta de luz', 'força'] },
  { name: 'droplet', label: 'Água & Saneamento', tags: ['conta de agua', 'hidrometro', 'sanepar', 'sabesp'] },
  { name: 'wifi', label: 'Internet & Telefone', tags: ['banda larga', 'celular', 'fibra', 'conexao', 'rede'] },
  { name: 'tv', label: 'TV & Streamings', tags: ['netflix', 'spotify', 'prime', 'assinatura', 'streaming', 'globo'] },
  { name: 'shield', label: 'Seguros & Proteção', tags: ['seguro auto', 'seguro vida', 'seguro residencial', 'protecao'] },

  // Saúde & Cuidados
  { name: 'heart-pulse', label: 'Saúde & Consultas', tags: ['medico', 'consulta', 'exame', 'hospital', 'plano de saude'] },
  { name: 'pill', label: 'Farmácia & Remédios', tags: ['medicamento', 'drogaria', 'remedio', 'receita'] },
  { name: 'dumbbell', label: 'Academia & Esportes', tags: ['fitness', 'exercicio', 'treino', 'esporte', 'saude'] },
  { name: 'smile', label: 'Dentista & Beleza', tags: ['odonto', 'dente', 'salao', 'estetica', 'cabelo'] },

  // Finanças, Bancos & Investimentos
  { name: 'wallet', label: 'Carteira & Dinheiro', tags: ['dinheiro', 'saldo', 'carteira', 'pagamento'] },
  { name: 'credit-card', label: 'Cartão de Crédito', tags: ['cartao', 'fatura', 'credito', 'debito', 'banco'] },
  { name: 'landmark', label: 'Banco & Conta', tags: ['banco', 'agencia', 'ted', 'pix', 'instituicao'] },
  { name: 'trending-up', label: 'Investimentos', tags: ['acoes', 'cdi', 'selic', 'renda fixa', 'cripto', 'lucro'] },
  { name: 'piggy-bank', label: 'Reserva & Economia', tags: ['poupança', 'cofrinho', 'reserva', 'guardar', 'meta'] },
  { name: 'coins', label: 'Moedas & Rendimentos', tags: ['dividendos', 'juros', 'rendimento', 'renda extra'] },
  { name: 'receipt', label: 'Contas & Boletos', tags: ['boleto', 'nota fiscal', 'pagamento', 'fatura'] },
  { name: 'badge-percent', label: 'Empréstimos & Taxas', tags: ['juros', 'financiamento', 'parcela', 'taxa', 'imposto'] },

  // Educação & Trabalho
  { name: 'graduation-cap', label: 'Educação & Cursos', tags: ['faculdade', 'escola', 'curso', 'pos', 'estudo'] },
  { name: 'book-open', label: 'Livros & Material', tags: ['leitura', 'livro', 'papelaria', 'apostila'] },
  { name: 'briefcase', label: 'Salário & Trabalho', tags: ['salario', 'remuneracao', 'trabalho', 'emprego', 'empresa'] },
  { name: 'laptop', label: 'Tecnologia & Equipamento', tags: ['computador', 'notebook', 'software', 'eletronico'] },

  // Lazer & Família
  { name: 'film', label: 'Cinema & Entretenimento', tags: ['cinema', 'show', 'teatro', 'evento', 'diversao'] },
  { name: 'gamepad-2', label: 'Jogos & Games', tags: ['games', 'playstation', 'xbox', 'steam', 'jogos'] },
  { name: 'gift', label: 'Presentes & Doações', tags: ['aniversario', 'presente', 'natal', 'doacao', 'ajuda'] },
  { name: 'dog', label: 'Pets & Animais', tags: ['cachorro', 'gato', 'veterinario', 'racao', 'pet shop'] },
  { name: 'baby', label: 'Filhos & Crianças', tags: ['bebe', 'fralda', 'crianca', 'brinquedo', 'escola infantil'] },
  { name: 'sparkles', label: 'Outros / Diversos', tags: ['geral', 'outros', 'diversos', 'extra'] },
  { name: 'tag', label: 'Etiqueta / Geral', tags: ['geral', 'tag', 'etiqueta', 'outros', 'categoria'] },
]

export function searchCatalogIcons(query: string): IconName[] {
  if (!query || query.trim() === '') {
    return FINANCIAL_ICONS_CATALOG.map((item) => item.name)
  }

  const cleanQuery = query.toLowerCase().trim()

  return FINANCIAL_ICONS_CATALOG.filter((item) => {
    const matchesLabel = item.label.toLowerCase().includes(cleanQuery)
    const matchesName = item.name.toLowerCase().includes(cleanQuery)
    const matchesTags = item.tags.some((t) => t.toLowerCase().includes(cleanQuery))
    return matchesLabel || matchesName || matchesTags
  }).map((item) => item.name)
}
