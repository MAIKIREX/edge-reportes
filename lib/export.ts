import * as XLSX from 'xlsx';

// ─── Export to Excel ──────────────────────────────────────────────────────────

export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string = 'reporte'
): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── Export to CSV ────────────────────────────────────────────────────────────

export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string = 'reporte'
): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h];
      const str = val === null || val === undefined ? '' : String(val);
      return str.includes(',') ? `"${str}"` : str;
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
