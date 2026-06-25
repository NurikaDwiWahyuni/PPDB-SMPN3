import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/_lib/db'
import { getSessionFromRequest } from '@/app/_lib/session'

/**
 * GET /api/export?format=xlsx|csv
 *
 * format=xlsx  → file .xlsx asli (OOXML ZIP) — terbuka di semua versi Excel
 * format=csv   → file .csv (UTF-8 BOM)
 */

interface BarisPendaftaran {
  No: number
  'Nomor Pendaftaran': string
  Jalur: string
  Status: string
  'Sumber Pendaftaran': string
  'Tanggal Daftar': string
  'Nama Lengkap Siswa': string
  NISN: string
  'Tempat Lahir': string
  'Tanggal Lahir': string
  'Jenis Kelamin': string
  Agama: string
  'Asal Sekolah': string
  'Nomor KK': string
  'Nama Ayah': string
  'Nama Ibu': string
  'Nomor WA': string
  Alamat: string
  'Hasil Seleksi': string
}

const KOLOM: (keyof BarisPendaftaran)[] = [
  'No', 'Nomor Pendaftaran', 'Jalur', 'Status', 'Sumber Pendaftaran',
  'Tanggal Daftar', 'Nama Lengkap Siswa', 'NISN', 'Tempat Lahir',
  'Tanggal Lahir', 'Jenis Kelamin', 'Agama', 'Asal Sekolah', 'Nomor KK',
  'Nama Ayah', 'Nama Ibu', 'Nomor WA', 'Alamat', 'Hasil Seleksi',
]

const COL_WIDTHS = [5, 22, 12, 22, 16, 20, 30, 14, 18, 16, 14, 10, 28, 20, 24, 24, 18, 36, 16]

const LABEL_STATUS: Record<string, string> = {
  menunggu_verifikasi: 'Menunggu Verifikasi',
  perlu_perbaikan: 'Perlu Perbaikan',
  terverifikasi: 'Terverifikasi',
  diterima: 'Diterima',
  tidak_diterima: 'Tidak Diterima',
}

const LABEL_JALUR: Record<string, string> = {
  zonasi: 'Zonasi', afirmasi: 'Afirmasi', mutasi: 'Mutasi', prestasi: 'Prestasi',
}

// ── Ambil data dari DB ────────────────────────────────────────────────────────
async function getDataDB(): Promise<BarisPendaftaran[]> {
  const tahun = await db.tahunAjaran.findFirst({ where: { status: 'aktif' } })
  if (!tahun) return []

  const rows = await db.pendaftaran.findMany({
    where: { tahun_ajaran_id: tahun.id },
    include: { jalur: true, data_siswa: true, data_orangtua: true, hasil_seleksi: true },
    orderBy: { tanggal_daftar: 'asc' },
  })

  return rows.map((r, i) => ({
    No: i + 1,
    'Nomor Pendaftaran': r.nomor_pendaftaran ?? '-',
    Jalur: LABEL_JALUR[r.jalur.nama_jalur] ?? r.jalur.nama_jalur,
    Status: LABEL_STATUS[r.status] ?? r.status,
    'Sumber Pendaftaran': r.sumber_pendaftaran === 'online' ? 'Online' : 'Offline',
    'Tanggal Daftar': r.tanggal_daftar.toLocaleString('id-ID'),
    'Nama Lengkap Siswa': r.data_siswa?.nama_lengkap ?? '-',
    NISN: r.data_siswa?.nisn ?? '-',
    'Tempat Lahir': r.data_siswa?.tempat_lahir ?? '-',
    'Tanggal Lahir': r.data_siswa?.tanggal_lahir
      ? new Date(r.data_siswa.tanggal_lahir).toLocaleDateString('id-ID') : '-',
    'Jenis Kelamin': r.data_siswa?.jenis_kelamin === 'L' ? 'Laki-laki'
      : r.data_siswa?.jenis_kelamin === 'P' ? 'Perempuan' : '-',
    Agama: r.data_siswa?.agama ?? '-',
    'Asal Sekolah': r.data_siswa?.asal_sekolah ?? '-',
    'Nomor KK': r.data_siswa?.nomor_kk ?? '-',
    'Nama Ayah': r.data_orangtua?.nama_ayah ?? '-',
    'Nama Ibu': r.data_orangtua?.nama_ibu ?? '-',
    'Nomor WA': r.data_orangtua?.nomor_wa ?? '-',
    Alamat: r.data_orangtua?.alamat ?? '-',
    'Hasil Seleksi': r.hasil_seleksi?.hasil === 'diterima' ? 'Diterima'
      : r.hasil_seleksi?.hasil === 'tidak_diterima' ? 'Tidak Diterima' : '-',
  }))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Escape karakter XML dan hapus karakter ilegal XML 1.0 dari data */
function xmlStr(s: string | number): string {
  const str = String(s)
  const out: string[] = []
  for (const ch of str) {
    const cp = ch.codePointAt(0) ?? 0
    // Karakter legal: tab(9), LF(10), CR(13), 0x20-0xD7FF, 0xE000-0xFFFD
    if (cp === 9 || cp === 10 || cp === 13 || (cp >= 0x20 && cp <= 0xD7FF) || (cp >= 0xE000 && cp <= 0xFFFD)) {
      if (ch === '&') out.push('&amp;')
      else if (ch === '<') out.push('&lt;')
      else if (ch === '>') out.push('&gt;')
      else if (ch === '"') out.push('&quot;')
      else out.push(ch)
    }
    // karakter ilegal di-skip
  }
  return out.join('')
}

/** Konversi nomor kolom (1-based) ke huruf Excel: 1→A, 26→Z, 27→AA */
function colLetter(n: number): string {
  let s = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    s = String.fromCharCode(65 + rem) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

// ── CSV ───────────────────────────────────────────────────────────────────────
function generateCSV(rows: BarisPendaftaran[]): string {
  const esc = (v: string | number) => {
    const s = String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s
  }
  return '\uFEFF' + [
    KOLOM.map(esc).join(','),
    ...rows.map((r) => KOLOM.map((k) => esc(r[k])).join(',')),
  ].join('\r\n')
}

// ── XLSX generator ────────────────────────────────────────────────────────────
function generateXLSX(rows: BarisPendaftaran[], judul: string): Buffer {

  // Shared String Table
  const sst: string[] = []
  const sstIdx = (s: string): number => {
    const i = sst.indexOf(s)
    if (i !== -1) return i
    sst.push(s)
    return sst.length - 1
  }

  // Build rows
  const rowsXml: string[] = []

  // Row 1: judul
  rowsXml.push(`<row r="1"><c r="A1" t="s"><v>${sstIdx(judul)}</v></c></row>`)
  // Row 2: tanggal ekspor
  rowsXml.push(`<row r="2"><c r="A2" t="s"><v>${sstIdx(`Diekspor: ${new Date().toLocaleString('id-ID')}`)}</v></c></row>`)
  // Row 3: kosong
  rowsXml.push(`<row r="3"/>`)
  // Row 4: header kolom (style=1 = bold + warna navy)
  rowsXml.push(
    `<row r="4">${KOLOM.map((k, ci) =>
      `<c r="${colLetter(ci + 1)}4" t="s" s="1"><v>${sstIdx(k)}</v></c>`
    ).join('')}</row>`
  )
  // Data rows (mulai row 5)
  rows.forEach((row, ri) => {
    const rn = ri + 5
    const cells = KOLOM.map((k, ci) => {
      const addr = `${colLetter(ci + 1)}${rn}`
      const val = row[k]
      return typeof val === 'number'
        ? `<c r="${addr}" t="n"><v>${val}</v></c>`
        : `<c r="${addr}" t="s"><v>${sstIdx(String(val))}</v></c>`
    }).join('')
    rowsXml.push(`<row r="${rn}">${cells}</row>`)
  })

  const totalRows = rows.length + 4
  const dimRef = `A1:${colLetter(KOLOM.length)}${totalRows}`

  // ── XML files ──
  // FIX: <dimension> wajib SEBELUM <sheetViews> (urutan OOXML spec)
  const sheetXml = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`,
    `<dimension ref="${dimRef}"/>`,
    `<sheetViews><sheetView workbookViewId="0">`,
    `<pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/>`,
    `</sheetView></sheetViews>`,
    `<sheetFormatPr defaultRowHeight="15"/>`,
    `<cols>${COL_WIDTHS.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" bestFit="1" customWidth="1"/>`).join('')}</cols>`,
    `<sheetData>${rowsXml.join('')}</sheetData>`,
    `</worksheet>`,
  ].join('')

  // FIX: SST — setiap string sudah di-sanitize via sstIdx->xmlStr flow
  // (sstIdx menyimpan raw string, xmlStr dipakai saat serialize ke XML)
  const sstXml = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sst.length}" uniqueCount="${sst.length}">`,
    sst.map(s => `<si><t xml:space="preserve">${xmlStr(s)}</t></si>`).join(''),
    `</sst>`,
  ].join('')

  // FIX: styles — bgColor wajib ada, applyAlignment eksplisit
  const stylesXml = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`,
    `<fonts count="2">`,
    `<font><sz val="11"/><name val="Calibri"/></font>`,
    `<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>`,
    `</fonts>`,
    `<fills count="3">`,
    `<fill><patternFill patternType="none"/></fill>`,
    `<fill><patternFill patternType="gray125"/></fill>`,
    `<fill><patternFill patternType="solid"><fgColor rgb="FF355872"/><bgColor indexed="64"/></patternFill></fill>`,
    `</fills>`,
    `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>`,
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>`,
    `<cellXfs count="2">`,
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>`,
    `<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>`,
    `</cellXfs>`,
    `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>`,
    `</styleSheet>`,
  ].join('')

  const workbookXml = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`,
    `<sheets><sheet name="Data Pendaftaran" sheetId="1" r:id="rId1"/></sheets>`,
    `</workbook>`,
  ].join('')

  const contentTypesXml = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`,
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`,
    `<Default Extension="xml" ContentType="application/xml"/>`,
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>`,
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    `<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>`,
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`,
    `</Types>`,
  ].join('')

  const relsXml = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`,
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>`,
    `</Relationships>`,
  ].join('')

  const workbookRelsXml = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`,
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>`,
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>`,
    `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`,
    `</Relationships>`,
  ].join('')

  const enc = new TextEncoder()
  return buildZip([
    { name: '[Content_Types].xml',        data: enc.encode(contentTypesXml) },
    { name: '_rels/.rels',                data: enc.encode(relsXml) },
    { name: 'xl/workbook.xml',            data: enc.encode(workbookXml) },
    { name: 'xl/_rels/workbook.xml.rels', data: enc.encode(workbookRelsXml) },
    { name: 'xl/worksheets/sheet1.xml',   data: enc.encode(sheetXml) },
    { name: 'xl/sharedStrings.xml',       data: enc.encode(sstXml) },
    { name: 'xl/styles.xml',              data: enc.encode(stylesXml) },
  ])
}

// ── ZIP builder (Store, no compression) ──────────────────────────────────────
function buildZip(files: { name: string; data: Uint8Array }[]): Buffer {
  const parts: Uint8Array[]     = []
  const centralDir: Uint8Array[] = []
  const offsets: number[]        = []
  let offset = 0

  const enc  = new TextEncoder()
  const u16  = (n: number) => { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n, true); return b }
  const u32  = (n: number) => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n, true); return b }
  const cat  = (arrs: Uint8Array[]) => {
    const out = new Uint8Array(arrs.reduce((s, a) => s + a.length, 0))
    let off = 0; for (const a of arrs) { out.set(a, off); off += a.length }
    return out
  }

  for (const file of files) {
    const name = enc.encode(file.name)
    const crc  = crc32(file.data)
    const size = file.data.length
    offsets.push(offset)

    const lfh = cat([
      new Uint8Array([0x50, 0x4B, 0x03, 0x04]),
      u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(size), u32(size),
      u16(name.length), u16(0),
      name, file.data,
    ])
    parts.push(lfh)
    offset += lfh.length

    centralDir.push(cat([
      new Uint8Array([0x50, 0x4B, 0x01, 0x02]),
      u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(size), u32(size),
      u16(name.length), u16(0), u16(0), u16(0), u16(0),
      u32(0), u32(offsets[offsets.length - 1]),
      name,
    ]))
  }

  const cdStart = offset
  const cdBytes = (() => { const out = new Uint8Array(centralDir.reduce((s,a)=>s+a.length,0)); let o=0; for(const a of centralDir){out.set(a,o);o+=a.length}; return out })()

  const eocd = (() => {
    const u16 = (n: number) => { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n, true); return b }
    const u32 = (n: number) => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n, true); return b }
    const arrs = [
      new Uint8Array([0x50,0x4B,0x05,0x06]),
      u16(0), u16(0),
      u16(files.length), u16(files.length),
      u32(cdBytes.length), u32(cdStart),
      u16(0),
    ]
    const out = new Uint8Array(arrs.reduce((s,a)=>s+a.length,0)); let o=0; for(const a of arrs){out.set(a,o);o+=a.length}; return out
  })()

  const all = [...parts, cdBytes, eocd]
  const total = all.reduce((s,a)=>s+a.length,0)
  const out = new Uint8Array(total); let o=0; for(const a of all){out.set(a,o);o+=a.length}
  return Buffer.from(out)
}

// CRC-32
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[i] = c
  }
  return t
})()

function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

// ── Route ─────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  if (!await getSessionFromRequest(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const format  = (request.nextUrl.searchParams.get('format') ?? 'xlsx').toLowerCase()
  const tanggal = new Date().toISOString().slice(0, 10)

  let rows: BarisPendaftaran[]
  try {
    rows = await getDataDB()
  } catch (err) {
    console.error('[GET /api/export]', err)
    return NextResponse.json({ success: false, message: 'Gagal mengambil data.' }, { status: 500 })
  }

  if (format === 'csv') {
    return new NextResponse(generateCSV(rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="data-pendaftaran-spmb-2026-${tanggal}.csv"`,
      },
    })
  }

  const buf = generateXLSX(rows, 'Data Pendaftaran SPMB 2026/2027 — SMP Negeri 3 Bagan Sinembah')
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="data-pendaftaran-spmb-2026-${tanggal}.xlsx"`,
      'Content-Length': String(buf.length),
    },
  })
}
