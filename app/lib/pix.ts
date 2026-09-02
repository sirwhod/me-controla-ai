const crc16 = (value: string) => {
  let crc = 0xffff
  for (const char of value) {
    crc ^= char.charCodeAt(0) << 8
    for (let bit = 0; bit < 8; bit++) crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1
    crc &= 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

const byteLength = (value: string) => new TextEncoder().encode(value).length
const field = (id: string, value: string) => `${id}${byteLength(value).toString().padStart(2, '0')}${value}`

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random' | null | undefined

export function normalizePixKey(key: string, keyType?: PixKeyType) {
  const value = key.trim()
  if (keyType === 'cpf' || keyType === 'cnpj') return value.replace(/[.\-\/\s]/g, '')
  if (keyType === 'phone') {
    const digits = value.replace(/\D/g, '')
    const national = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits
    return `+55${national}`
  }
  return value
}

// O padrão BR Code exige a cidade, mas ela não precisa vir do cadastro do usuário.
// Usamos um valor neutro quando a aplicação não possui uma cidade configurada.
export function createPixPayload({ key, keyType, amount, description, merchantName = 'ME CONTROL A AI', merchantCity = 'BRASIL', txid = crypto.randomUUID().replace(/-/g, '').slice(0, 25) }: {
  key: string; keyType?: PixKeyType; amount: number; description?: string; merchantName?: string; merchantCity?: string; txid?: string
}) {
  const normalizedKey = normalizePixKey(key, keyType)
  if (!normalizedKey || !Number.isFinite(amount) || amount <= 0) throw new Error('Chave PIX e valor positivo são obrigatórios.')
  const merchantAccount = field('00', 'BR.GOV.BCB.PIX') + field('01', normalizedKey) + (description?.trim() ? field('02', description.trim().slice(0, 72)) : '')
  const normalizedTxid = txid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || crypto.randomUUID().replace(/-/g, '').slice(0, 25)
  const payload = field('00', '01') + field('26', merchantAccount) + field('52', '0000') + field('53', '986') + field('54', amount.toFixed(2)) + field('58', 'BR') + field('59', merchantName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 25)) + field('60', merchantCity.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 15)) + field('62', field('05', normalizedTxid)) + '6304'
  return payload + crc16(payload)
}

export function isValidPixPayload(payload: string) { return /^.*6304[0-9A-F]{4}$/.test(payload) && crc16(payload.slice(0, -4)) === payload.slice(-4) }
