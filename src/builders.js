// src/builders.js — SOW output format builders
import * as XLSX from 'xlsx'
import { SOW_COLS, downloadBlob } from './data.js'

const COL_WIDTHS = [12, 22, 30, 35, 22, 20, 25]

export function buildExcel(weeks, meta) {
  const wb = XLSX.utils.book_new()
  const titleRow = [
    `${meta.subject}${meta.grade ? ' — Grade ' + meta.grade : ''} — Scheme of Work — ${meta.term} ${meta.year} — ${meta.numWeeks} weeks`
  ]
  const rows = [
    titleRow,
    SOW_COLS,
    ...weeks.map(w => [
      `Week ${w.week}\n${w.dates || ''}`,
      w.topics || '', w.objectives || '', w.activities || '',
      w.resources || '', w.assessment || '', w.notes || '',
    ]),
  ]
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: SOW_COLS.length - 1 } }]
  ws['!cols'] = COL_WIDTHS.map(w => ({ wch: w }))
  ws['!rows'] = [{ hpt: 24 }, { hpt: 22 }, ...weeks.map(() => ({ hpt: 90 }))]
  XLSX.utils.book_append_sheet(wb, ws, 'SOW')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  downloadBlob(blob, `SOW_${meta.subject.replace(/\s+/g, '_')}_${meta.term.replace(/\s+/g, '_')}_${meta.year}.xlsx`)
}

export function buildWord(weeks, meta) {
  const hdr = SOW_COLS.map(c =>
    `<th style="background:#2E7D32;color:#fff;font-size:9pt;padding:5pt;border:1pt solid #999;text-align:left;font-weight:bold">${c}</th>`
  ).join('')

  const rows = weeks.map((w, i) =>
    `<tr style="background:${i % 2 === 0 ? '#fff' : '#F1F8E9'}">` +
    [
      `<b>Week ${w.week}</b><br/>${w.dates || ''}`,
      w.topics || '', w.objectives || '', w.activities || '',
      w.resources || '', w.assessment || '', w.notes || '',
    ].map(v =>
      `<td style="font-size:8pt;padding:5pt;border:1pt solid #ddd;vertical-align:top">${(v || '').replace(/\n/g, '<br/>')}</td>`
    ).join('') + '</tr>'
  ).join('')

  const html = `<html><head><meta charset="utf-8"><style>
@page{size:A3 landscape;margin:1.5cm}
body{font-family:Arial,sans-serif;font-size:9pt}
h1{font-size:13pt;color:#1B5E20;margin:0 0 3pt}
p.meta{font-size:9pt;color:#555;margin:0 0 10pt}
table{width:100%;border-collapse:collapse;table-layout:fixed}
</style></head><body>
<h1>${meta.subject}${meta.grade ? ' — Grade ' + meta.grade : ''} — Scheme of Work</h1>
<p class="meta">${meta.term} | Academic Year ${meta.year} | ${meta.numWeeks} weeks</p>
<table><tr>${hdr}</tr>${rows}</table>
</body></html>`

  const blob = new Blob([html], { type: 'application/msword' })
  downloadBlob(blob, `SOW_${meta.subject.replace(/\s+/g, '_')}_${meta.year}.doc`)
}

export function buildPrint(weeks, meta) {
  const w = window.open('', '_blank')
  const hdr = SOW_COLS.map(c => `<th>${c}</th>`).join('')
  const rows = weeks.map((w, i) =>
    `<tr class="${i % 2 ? 'alt' : ''}">` +
    [
      `<b>Week ${w.week}</b><br>${w.dates || ''}`,
      w.topics || '', w.objectives || '', w.activities || '',
      w.resources || '', w.assessment || '', w.notes || '',
    ].map(v =>
      `<td>${(v || '').replace(/\n/g, '<br>')}</td>`
    ).join('') + '</tr>'
  ).join('')

  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>SOW</title><style>
@page{size:A3 landscape;margin:1.5cm}
body{font-family:Arial,sans-serif;font-size:7.5pt}
h1{font-size:12pt;color:#1B5E20;margin:0 0 2pt}
p{font-size:8pt;color:#555;margin:0 0 8pt}
table{width:100%;border-collapse:collapse;table-layout:fixed}
th{background:#2E7D32;color:#fff;padding:5pt;font-size:8pt;border:.5pt solid #999;text-align:left}
td{padding:4pt;font-size:7pt;border:.5pt solid #ccc;vertical-align:top}
tr.alt{background:#F1F8E9}
</style></head><body>
<h1>${meta.subject}${meta.grade ? ' — Grade ' + meta.grade : ''} — Scheme of Work</h1>
<p>${meta.term} | ${meta.year} | ${meta.numWeeks} weeks</p>
<table><tr>${hdr}</tr>${rows}</table>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`)
  w.document.close()
}
