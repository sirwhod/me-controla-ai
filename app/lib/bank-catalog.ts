export interface BankCatalogItem { id: string; name: string; code: string; iconPath: string }

export const brazilianBankCatalog: BankCatalogItem[] = [
  ['001', 'Banco do Brasil'], ['033', 'Santander'], ['104', 'Caixa Econômica Federal'], ['237', 'Bradesco'], ['341', 'Itaú'], ['260', 'Nubank'], ['077', 'Inter'], ['336', 'C6 Bank'], ['212', 'Banco Original'], ['290', 'PagBank'], ['208', 'BTG Pactual'], ['422', 'Banco Safra'], ['756', 'Sicoob'], ['748', 'Sicredi'], ['655', 'Neon'], ['323', 'Mercado Pago'], ['380', 'PicPay']
].map(([code, name]) => ({ id: `br-${code}`, name, code, iconPath: '/bank-logos/default.svg' }))
