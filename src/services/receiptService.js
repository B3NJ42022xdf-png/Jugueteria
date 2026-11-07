/**
 * Emisión de comprobantes electrónicos (simulación de backend).
 *
 * El navegador no puede enviar correos ni firmar documentos tributarios, así
 * que este servicio:
 *  - calcula los impuestos y arma el comprobante,
 *  - genera un PDF y un XML descargables de verdad,
 *  - registra el envío del correo en una "bandeja de salida" (localStorage),
 *  - guarda el comprobante y su asiento en la "base de datos contable".
 *
 * En producción, `issueReceipt` debe llamar a una API que firme el XML, envíe
 * el correo por SMTP y registre el comprobante en la base de datos fiscal.
 */

import {
  assertNoPaymentCardData,
  safeSetItem,
  sanitizeEmail,
  sanitizePlainText,
} from '../lib/security.js'

const RECEIPTS_STORAGE_KEY = 'jugueteria.receipts.v1'
const LEDGER_STORAGE_KEY = 'jugueteria.ledger.v1'
const EMAILS_STORAGE_KEY = 'jugueteria.emails.v1'
const MOCK_LATENCY_MS = 400

export const IVA_RATE = 0.19

export const STORE_FISCAL = {
  name: 'Mi Juguetería S.A.S.',
  tradeName: 'Mi Juguetería',
  taxIdLabel: 'NIT',
  taxId: '900.123.456-7',
  regime: 'Régimen común',
  address: 'Calle 123 # 45-67, Bogotá D.C., Colombia',
  phone: '+57 601 555 0123',
  email: 'facturacion@mijugueteria.co',
  resolution: 'Resolución DIAN 18764000001234 del 01/01/2026',
}

/* ------------------------------------------------------------------ */
/* Persistencia                                                        */
/* ------------------------------------------------------------------ */

function readArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeJson(key, value) {
  // Nunca se persiste un PAN/CVV: el guard lanza antes de escribir.
  safeSetItem(key, value)
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/* ------------------------------------------------------------------ */
/* Cálculos y datos del comprobante                                    */
/* ------------------------------------------------------------------ */

const moneyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function formatMoney(value) {
  return moneyFormatter.format(Math.round(value))
}

function formatDateTime(isoDate) {
  const date = new Date(isoDate)

  return `${date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })} ${date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

function roundMoney(value) {
  return Math.round(value)
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function getReceiptTypeLabel(type) {
  return type === 'factura' ? 'Factura' : 'Boleta'
}

function nextReceiptNumber(receipts, type) {
  const series = type === 'factura' ? 'F001' : 'B001'
  const lastSequence = receipts
    .filter((receipt) => receipt.type === type)
    .reduce((max, receipt) => {
      const sequence = Number(String(receipt.number).split('-')[1])
      return Number.isFinite(sequence) ? Math.max(max, sequence) : max
    }, 0)
  const sequence = lastSequence + 1

  return {
    series,
    sequence,
    number: `${series}-${String(sequence).padStart(8, '0')}`,
  }
}

function buildReceiptItems(items) {
  return items.map((item, index) => {
    const product = item.product ?? {}
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1))
    const unitPrice = Number(item.unitPrice ?? product.price ?? 0)
    const subtotal = Number(item.subtotal ?? unitPrice * quantity)
    const taxableBase = roundMoney(subtotal / (1 + IVA_RATE))
    const tax = subtotal - taxableBase

    return {
      index: index + 1,
      productId: sanitizePlainText(
        item.id ?? product.id ?? `item-${index + 1}`,
        { max: 64 },
      ),
      name: sanitizePlainText(product.name ?? item.name, {
        max: 80,
        fallback: 'Artículo',
      }),
      brand: sanitizePlainText(product.brand, { max: 40 }),
      quantity,
      unitPrice,
      subtotal,
      taxableBase,
      tax,
    }
  })
}

function buildVerificationCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */

function pdfSafe(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
}

function escapePdfText(value) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildReceiptLines(receipt) {
  const lines = []
  const push = (text, { size = 9.5, bold = false, gap = 6 } = {}) =>
    lines.push({ text, size, bold, gap })

  push(receipt.store.tradeName.toUpperCase(), { size: 18, bold: true, gap: 3 })
  push('Jugueteria y articulos de entretenimiento', { size: 9, gap: 2 })
  push(
    `${receipt.store.taxIdLabel}: ${receipt.store.taxId} | ${receipt.store.regime}`,
    { size: 9, gap: 2 },
  )
  push(`Direccion: ${receipt.store.address}`, { size: 9, gap: 2 })
  push(`Telefono: ${receipt.store.phone} | ${receipt.store.email}`, {
    size: 9,
    gap: 14,
  })

  push(`${receipt.typeLabel.toUpperCase()} ELECTRONICA`, {
    size: 14,
    bold: true,
    gap: 3,
  })
  push(`Numero: ${receipt.number}`, { size: 11, bold: true, gap: 3 })
  push(`Fecha de emision: ${formatDateTime(receipt.issuedAt)}`, {
    size: 9,
    gap: 2,
  })
  push(`Moneda: ${receipt.currency}`, { size: 9, gap: 14 })

  push('DATOS DEL CLIENTE', { size: 11, bold: true, gap: 3 })
  push(`Nombre: ${receipt.customer.name}`, { size: 9.5, gap: 2 })
  push(`Correo: ${receipt.customer.email}`, { size: 9.5, gap: 2 })
  push(
    `${receipt.customer.taxIdLabel}: ${receipt.customer.taxId || 'No informado'}`,
    { size: 9.5, gap: 14 },
  )

  push('DETALLE DE ITEMS', { size: 11, bold: true, gap: 4 })
  receipt.items.forEach((item) => {
    push(`${item.index}. ${item.name}`, { size: 9.5, bold: true, gap: 2 })
    push(
      `   ${item.quantity} x ${formatMoney(item.unitPrice)} = ${formatMoney(item.subtotal)}`,
      { size: 9.5, gap: 5 },
    )
  })

  if (receipt.totals.shipping > 0) {
    push(`Envio: ${formatMoney(receipt.totals.shipping)}`, { size: 9.5, gap: 8 })
  }

  push(`Subtotal: ${formatMoney(receipt.totals.subtotal)}`, { size: 9.5, gap: 3 })
  push(`Base gravable: ${formatMoney(receipt.totals.taxableBase)}`, {
    size: 9.5,
    gap: 3,
  })
  push(
    `IVA (${Math.round(receipt.totals.taxRate * 100)}%): ${formatMoney(receipt.totals.tax)}`,
    { size: 9.5, gap: 3 },
  )
  push(`TOTAL PAGADO: ${formatMoney(receipt.totals.total)}`, {
    size: 13,
    bold: true,
    gap: 14,
  })

  push(`Correo de envio: ${receipt.customer.email}`, { size: 8.5, gap: 2 })
  push(`Adjuntos: ${receipt.number}.pdf, ${receipt.number}.xml`, {
    size: 8.5,
    gap: 2,
  })
  push(`Codigo de verificacion: ${receipt.verificationCode}`, {
    size: 8.5,
    gap: 2,
  })
  push(
    'Comprobante electronico generado automaticamente y registrado para auditoria.',
    { size: 8.5, gap: 2 },
  )
  push(receipt.store.resolution, { size: 8, gap: 2 })

  return lines
}

function paginateLines(lines) {
  const pages = []
  let current = []
  let y = 800

  for (const line of lines) {
    const lineHeight = line.size + line.gap

    if (current.length > 0 && y - lineHeight < 50) {
      pages.push(current)
      current = []
      y = 800
    }

    current.push(line)
    y -= lineHeight
  }

  if (current.length > 0) pages.push(current)

  return pages
}

function buildPageStream(lines) {
  let y = 800
  const operations = []

  for (const line of lines) {
    const font = line.bold ? '/F2' : '/F1'
    const text = escapePdfText(pdfSafe(line.text))
    operations.push(`BT ${font} ${line.size} Tf 40 ${y} Td (${text}) Tj ET`)
    y -= line.size + line.gap
  }

  return operations.join('\n')
}

export function generateReceiptPdf(receipt) {
  const pages = paginateLines(buildReceiptLines(receipt))
  const objects = []

  const kids = pages.map((_, index) => `${5 + index * 2} 0 R`).join(' ')

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`
  objects[3] =
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
  objects[4] =
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'

  pages.forEach((pageLines, index) => {
    const pageObject = 5 + index * 2
    const contentObject = pageObject + 1
    const stream = buildPageStream(pageLines)

    objects[pageObject] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> ` +
      `/Contents ${contentObject} 0 R >>`
    objects[contentObject] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  })

  let pdf = '%PDF-1.4\n'
  const offsets = []

  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`
  }

  const xrefStart = pdf.length
  const size = objects.length

  pdf += `xref\n0 ${size}\n0000000000 65535 f \n`

  for (let id = 1; id < size; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

  return new Blob([pdf], { type: 'application/pdf' })
}

/* ------------------------------------------------------------------ */
/* XML (estructura tipo UBL)                                           */
/* ------------------------------------------------------------------ */

function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function xmlMoney(value) {
  return Number(value).toFixed(2)
}

export function generateReceiptXml(receipt) {
  const taxPercent = (receipt.totals.taxRate * 100).toFixed(2)
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"',
    '  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"',
    '  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">',
    '  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>',
    '  <cbc:CustomizationID>2.1</cbc:CustomizationID>',
    `  <cbc:ID>${xmlEscape(receipt.number)}</cbc:ID>`,
    `  <cbc:UUID>${xmlEscape(receipt.verificationCode)}</cbc:UUID>`,
    `  <cbc:IssueDate>${xmlEscape(receipt.issuedAt.slice(0, 10))}</cbc:IssueDate>`,
    `  <cbc:IssueTime>${xmlEscape(receipt.issuedAt.slice(11, 19))}</cbc:IssueTime>`,
    `  <cbc:InvoiceTypeCode>${receipt.type === 'factura' ? '01' : '03'}</cbc:InvoiceTypeCode>`,
    `  <cbc:DocumentCurrencyCode>${xmlEscape(receipt.currency)}</cbc:DocumentCurrencyCode>`,
    '  <cac:AccountingSupplierParty>',
    '    <cac:Party>',
    '      <cac:PartyIdentification>',
    `        <cbc:ID schemeID="${xmlEscape(receipt.store.taxIdLabel)}">${xmlEscape(receipt.store.taxId)}</cbc:ID>`,
    '      </cac:PartyIdentification>',
    '      <cac:PartyName>',
    `        <cbc:Name>${xmlEscape(receipt.store.name)}</cbc:Name>`,
    '      </cac:PartyName>',
    '      <cac:PostalAddress>',
    `        <cbc:StreetName>${xmlEscape(receipt.store.address)}</cbc:StreetName>`,
    '        <cbc:CountrySubentity>Colombia</cbc:CountrySubentity>',
    '      </cac:PostalAddress>',
    '      <cac:PartyTaxScheme>',
    `        <cbc:CompanyID>${xmlEscape(receipt.store.taxId)}</cbc:CompanyID>`,
    '        <cac:TaxScheme>',
    '          <cbc:ID>IVA</cbc:ID>',
    '          <cbc:Name>IVA</cbc:Name>',
    '        </cac:TaxScheme>',
    '      </cac:PartyTaxScheme>',
    '      <cac:Contact>',
    `        <cbc:ElectronicMail>${xmlEscape(receipt.store.email)}</cbc:ElectronicMail>`,
    '      </cac:Contact>',
    '    </cac:Party>',
    '  </cac:AccountingSupplierParty>',
    '  <cac:AccountingCustomerParty>',
    '    <cac:Party>',
    '      <cac:PartyIdentification>',
    `        <cbc:ID schemeID="${xmlEscape(receipt.customer.taxIdLabel)}">${xmlEscape(receipt.customer.taxId || '0000000000')}</cbc:ID>`,
    '      </cac:PartyIdentification>',
    '      <cac:PartyName>',
    `        <cbc:Name>${xmlEscape(receipt.customer.name)}</cbc:Name>`,
    '      </cac:PartyName>',
    '      <cac:Contact>',
    `        <cbc:ElectronicMail>${xmlEscape(receipt.customer.email)}</cbc:ElectronicMail>`,
    '      </cac:Contact>',
    '    </cac:Party>',
    '  </cac:AccountingCustomerParty>',
    '  <cac:TaxTotal>',
    `    <cbc:TaxAmount currencyID="${xmlEscape(receipt.currency)}">${xmlMoney(receipt.totals.tax)}</cbc:TaxAmount>`,
    '    <cac:TaxSubtotal>',
    `      <cbc:TaxableAmount currencyID="${xmlEscape(receipt.currency)}">${xmlMoney(receipt.totals.taxableBase)}</cbc:TaxableAmount>`,
    `      <cbc:TaxAmount currencyID="${xmlEscape(receipt.currency)}">${xmlMoney(receipt.totals.tax)}</cbc:TaxAmount>`,
    '      <cac:TaxCategory>',
    `        <cbc:Percent>${taxPercent}</cbc:Percent>`,
    '        <cac:TaxScheme>',
    '          <cbc:ID>IVA</cbc:ID>',
    '          <cbc:Name>IVA</cbc:Name>',
    '        </cac:TaxScheme>',
    '      </cac:TaxCategory>',
    '    </cac:TaxSubtotal>',
    '  </cac:TaxTotal>',
    '  <cac:LegalMonetaryTotal>',
    `    <cbc:LineExtensionAmount currencyID="${xmlEscape(receipt.currency)}">${xmlMoney(receipt.totals.subtotal)}</cbc:LineExtensionAmount>`,
    `    <cbc:TaxExclusiveAmount currencyID="${xmlEscape(receipt.currency)}">${xmlMoney(receipt.totals.taxableBase)}</cbc:TaxExclusiveAmount>`,
    `    <cbc:TaxInclusiveAmount currencyID="${xmlEscape(receipt.currency)}">${xmlMoney(receipt.totals.total)}</cbc:TaxInclusiveAmount>`,
    `    <cbc:PayableAmount currencyID="${xmlEscape(receipt.currency)}">${xmlMoney(receipt.totals.total)}</cbc:PayableAmount>`,
    '  </cac:LegalMonetaryTotal>',
  ]

  receipt.items.forEach((item) => {
    lines.push(
      '  <cac:InvoiceLine>',
      `    <cbc:ID>${item.index}</cbc:ID>`,
      `    <cbc:InvoicedQuantity unitCode="NIU">${item.quantity}</cbc:InvoicedQuantity>`,
      `    <cbc:LineExtensionAmount currencyID="${xmlEscape(receipt.currency)}">${xmlMoney(item.subtotal)}</cbc:LineExtensionAmount>`,
      '    <cac:Item>',
      `      <cbc:Description>${xmlEscape(item.name)}</cbc:Description>`,
      '    </cac:Item>',
      '    <cac:Price>',
      `      <cbc:PriceAmount currencyID="${xmlEscape(receipt.currency)}">${xmlMoney(item.unitPrice)}</cbc:PriceAmount>`,
      '    </cac:Price>',
      '    <cac:TaxTotal>',
      `      <cbc:TaxAmount currencyID="${xmlEscape(receipt.currency)}">${xmlMoney(item.tax)}</cbc:TaxAmount>`,
      '      <cac:TaxSubtotal>',
      `        <cbc:TaxableAmount currencyID="${xmlEscape(receipt.currency)}">${xmlMoney(item.taxableBase)}</cbc:TaxableAmount>`,
      `        <cbc:TaxAmount currencyID="${xmlEscape(receipt.currency)}">${xmlMoney(item.tax)}</cbc:TaxAmount>`,
      '        <cac:TaxCategory>',
      `          <cbc:Percent>${taxPercent}</cbc:Percent>`,
      '          <cac:TaxScheme>',
      '            <cbc:ID>IVA</cbc:ID>',
      '            <cbc:Name>IVA</cbc:Name>',
      '          </cac:TaxScheme>',
      '        </cac:TaxCategory>',
      '      </cac:TaxSubtotal>',
      '    </cac:TaxTotal>',
      '  </cac:InvoiceLine>',
    )
  })

  lines.push('</Invoice>')

  return new Blob([lines.join('\n')], {
    type: 'application/xml;charset=utf-8',
  })
}

/* ------------------------------------------------------------------ */
/* Correo y contabilidad                                               */
/* ------------------------------------------------------------------ */

async function sendReceiptEmail(receipt, pdfBlob, xmlBlob) {
  await wait(MOCK_LATENCY_MS)

  const email = {
    id: crypto.randomUUID(),
    receiptId: receipt.id,
    to: receipt.customer.email,
    subject: `${receipt.typeLabel} electrónica ${receipt.number} - Mi Juguetería`,
    status: 'enviado',
    provider: 'SMTP simulado (demo)',
    sentAt: new Date().toISOString(),
    attachments: [
      {
        name: `${receipt.number}.pdf`,
        type: 'application/pdf',
        size: pdfBlob.size,
      },
      {
        name: `${receipt.number}.xml`,
        type: 'application/xml',
        size: xmlBlob.size,
      },
    ],
  }

  writeJson(EMAILS_STORAGE_KEY, [...readArray(EMAILS_STORAGE_KEY), email])

  return email
}

/**
 * Correo automático al cliente cuando el administrador cambia la etapa del
 * despacho. No adjunta archivos: informa el nuevo estado y la guía.
 */
export async function sendShipmentStatusEmail({ receipt, shipment, statusMeta }) {
  await wait(MOCK_LATENCY_MS)

  const tracking = sanitizePlainText(shipment.trackingNumber, { max: 40 })
  const trackingLine = tracking
    ? ` Número de guía asignado por la transportadora: ${tracking}.`
    : ''

  const customerName = sanitizePlainText(receipt.customer?.name, { max: 80 })

  const email = {
    id: crypto.randomUUID(),
    type: 'shipment',
    receiptId: receipt.id,
    orderNumber: receipt.number,
    to: receipt.customer.email,
    customerName,
    subject: `Tu pedido ${receipt.number}: ${statusMeta.label} - Mi Juguetería`,
    status: 'enviado',
    provider: 'SMTP simulado (demo)',
    sentAt: new Date().toISOString(),
    shipmentStatus: shipment.status,
    trackingNumber: tracking,
    body: `Hola ${customerName}: el estado de tu pedido ${receipt.number} cambió a "${statusMeta.label}". ${statusMeta.description}${trackingLine} Total pagado: ${formatMoney(receipt.totals.total)}.`,
    attachments: [],
  }

  writeJson(EMAILS_STORAGE_KEY, [...readArray(EMAILS_STORAGE_KEY), email])

  return email
}

function registerAccountingEntry(receipt) {
  const entries = readArray(LEDGER_STORAGE_KEY)
  const year = new Date(receipt.issuedAt).getFullYear()
  const ledgerEntry = `CC-${year}-${String(entries.length + 1).padStart(6, '0')}`
  const registeredAt = new Date().toISOString()

  const entry = {
    id: ledgerEntry,
    receiptId: receipt.id,
    receiptNumber: receipt.number,
    receiptType: receipt.type,
    issuedAt: receipt.issuedAt,
    registeredAt,
    customer: receipt.customer.name,
    taxId: receipt.customer.taxId,
    currency: receipt.currency,
    taxableBase: receipt.totals.taxableBase,
    tax: receipt.totals.tax,
    total: receipt.totals.total,
    status: 'registrado',
  }

  writeJson(LEDGER_STORAGE_KEY, [...entries, entry])

  return {
    status: 'registrado',
    ledgerEntry,
    registeredAt,
    database: LEDGER_STORAGE_KEY,
  }
}

function updateStoredReceipt(receipt) {
  const receipts = readArray(RECEIPTS_STORAGE_KEY)
  writeJson(
    RECEIPTS_STORAGE_KEY,
    receipts.map((item) => (item.id === receipt.id ? receipt : item)),
  )
}

/* ------------------------------------------------------------------ */
/* API pública                                                         */
/* ------------------------------------------------------------------ */

/**
 * Emite el comprobante, envía el correo simulado y registra la contabilidad.
 * Debe llamarse solo cuando la transacción ya fue confirmada.
 */
export async function issueReceipt({
  items,
  type = 'boleta',
  customer = {},
  shipping = 0,
  currency = 'COP',
}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('El comprobante necesita al menos un artículo.')
  }

  if (type !== 'boleta' && type !== 'factura') {
    throw new Error('El tipo de comprobante no es válido.')
  }

  const email = sanitizeEmail(customer.email)
  const taxId = sanitizePlainText(customer.taxId, { max: 30 })
  const customerName = sanitizePlainText(customer.name, {
    max: 80,
    fallback: 'Cliente de demostración',
  })

  if (!isValidEmail(email)) {
    throw new Error('El correo del cliente no es válido.')
  }

  if (type === 'factura' && !taxId) {
    throw new Error('La factura requiere el NIT/RUC del cliente.')
  }

  // Bloqueo explícito: el comprobante jamás debe contener datos de tarjeta.
  assertNoPaymentCardData(
    { customer: { ...customer, email, taxId, name: customerName }, items },
    'el comprobante',
  )

  const receipts = readArray(RECEIPTS_STORAGE_KEY)
  const numbering = nextReceiptNumber(receipts, type)
  const receiptItems = buildReceiptItems(items)
  const subtotal = receiptItems.reduce((total, item) => total + item.subtotal, 0)
  const shippingValue = Math.max(0, roundMoney(Number(shipping) || 0))
  const total = subtotal + shippingValue
  const taxableBase = roundMoney(total / (1 + IVA_RATE))

  const receipt = {
    id: crypto.randomUUID(),
    type,
    typeLabel: getReceiptTypeLabel(type),
    series: numbering.series,
    sequence: numbering.sequence,
    number: numbering.number,
    issuedAt: new Date().toISOString(),
    currency,
    store: STORE_FISCAL,
    customer: {
      name: customerName,
      email,
      taxId,
      taxIdLabel: type === 'factura' ? 'NIT' : 'Documento',
    },
    items: receiptItems,
    totals: {
      subtotal,
      shipping: shippingValue,
      taxableBase,
      tax: total - taxableBase,
      taxRate: IVA_RATE,
      total,
    },
    verificationCode: buildVerificationCode(),
    email: null,
    accounting: null,
  }

  writeJson(RECEIPTS_STORAGE_KEY, [...receipts, receipt])

  const pdfBlob = generateReceiptPdf(receipt)
  const xmlBlob = generateReceiptXml(receipt)

  receipt.email = await sendReceiptEmail(receipt, pdfBlob, xmlBlob)
  receipt.accounting = registerAccountingEntry(receipt)
  updateStoredReceipt(receipt)

  return receipt
}

export function getReceipt(receiptId) {
  return readArray(RECEIPTS_STORAGE_KEY).find((receipt) => receipt.id === receiptId) ?? null
}

export function listReceipts() {
  return readArray(RECEIPTS_STORAGE_KEY).sort(
    (a, b) => new Date(b.issuedAt) - new Date(a.issuedAt),
  )
}

export function listLedgerEntries() {
  return readArray(LEDGER_STORAGE_KEY)
}

export function listSentEmails() {
  return readArray(EMAILS_STORAGE_KEY)
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadReceiptPdf(receipt) {
  triggerDownload(generateReceiptPdf(receipt), `${receipt.number}.pdf`)
}

export function downloadReceiptXml(receipt) {
  triggerDownload(generateReceiptXml(receipt), `${receipt.number}.xml`)
}

export function formatReceiptMoney(value) {
  return formatMoney(value)
}
