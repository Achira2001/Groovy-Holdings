'use client';

import { Plus, Trash2, Wand2 } from 'lucide-react';
import { Input, Textarea } from '@/components/ui';

const PRESETS = {
  'T-shirt (inches)': {
    unit: 'inches',
    columns: ['Size', 'Chest', 'Length', 'Sleeve'],
    rows: [['XS', '34', '26', '7.5'], ['S', '36', '27', '8'], ['M', '38', '28', '8'], ['L', '40', '29', '8.5'], ['XL', '42', '30', '9'], ['2XL', '44', '31', '9'], ['3XL', '46', '32', '9.5']],
    note: 'Measurements are of the garment laid flat (chest measured armpit to armpit × 2). Allow ±0.5" tolerance.',
  },
  'Polo (inches)': {
    unit: 'inches',
    columns: ['Size', 'Chest', 'Length', 'Shoulder'],
    rows: [['S', '38', '27', '16.5'], ['M', '40', '28', '17'], ['L', '42', '29', '18'], ['XL', '44', '30', '19'], ['2XL', '46', '31', '20']],
    note: '',
  },
  'Cap (cm)': {
    unit: 'cm',
    columns: ['Size', 'Head circumference', 'Fits'],
    rows: [['Kids', '52–54', '6–12 yrs'], ['Adult', '56–60', 'Adjustable strap']],
    note: '',
  },
};

/** Spreadsheet-like editor for a product size chart. */
export default function SizeChartEditor({ value, onChange }) {
  const chart = { title: 'Size chart', unit: 'inches', columns: [], rows: [], note: '', ...value };
  const set = (patch) => onChange({ ...chart, ...patch });

  const addColumn = () => set({ columns: [...chart.columns, `Column ${chart.columns.length + 1}`], rows: chart.rows.map((r) => [...r, '']) });
  const removeColumn = (i) => set({ columns: chart.columns.filter((_, j) => j !== i), rows: chart.rows.map((r) => r.filter((_, j) => j !== i)) });
  const addRow = () => set({ rows: [...chart.rows, chart.columns.map(() => '')] });
  const removeRow = (i) => set({ rows: chart.rows.filter((_, j) => j !== i) });
  const setCell = (ri, ci, v) => set({ rows: chart.rows.map((r, j) => (j === ri ? r.map((c, k) => (k === ci ? v : c)) : r)) });
  const setCol = (ci, v) => set({ columns: chart.columns.map((c, k) => (k === ci ? v : c)) });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Wand2 className="h-3.5 w-3.5" /> Start from:</span>
        {Object.keys(PRESETS).map((k) => (
          <button key={k} type="button" className="chip hover:border-brand hover:text-brand" onClick={() => set({ ...PRESETS[k], rows: PRESETS[k].rows.map((r) => [...r]), columns: [...PRESETS[k].columns] })}>
            {k}
          </button>
        ))}
        {chart.columns.length > 0 && (
          <button type="button" className="chip text-danger" onClick={() => set({ columns: [], rows: [], note: '' })}>Clear</button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Chart title" value={chart.title} onChange={(e) => set({ title: e.target.value })} />
        <Input label="Unit" value={chart.unit} onChange={(e) => set({ unit: e.target.value })} placeholder="inches / cm" />
      </div>

      {chart.columns.length === 0 ? (
        <button type="button" onClick={() => set({ columns: ['Size', 'Chest', 'Length'], rows: [['S', '', ''], ['M', '', ''], ['L', '', '']] })} className="w-full rounded-xl border-2 border-dashed border-line py-8 text-sm font-semibold text-muted hover:border-brand hover:text-brand">
          + Create an empty size chart
        </button>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr>
                {chart.columns.map((c, ci) => (
                  <th key={ci} className="min-w-[110px] p-1.5">
                    <div className="flex items-center gap-1">
                      <input className="input px-2 py-1.5 font-bold" value={c} onChange={(e) => setCol(ci, e.target.value)} aria-label={`Column ${ci + 1} name`} />
                      {chart.columns.length > 1 && (
                        <button type="button" className="btn-icon h-7 w-7 shrink-0" onClick={() => removeColumn(ci)} aria-label="Remove column"><Trash2 className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="w-10 p-1.5">
                  <button type="button" className="btn-icon h-8 w-8" onClick={addColumn} aria-label="Add column"><Plus className="h-4 w-4" /></button>
                </th>
              </tr>
            </thead>
            <tbody>
              {chart.rows.map((r, ri) => (
                <tr key={ri} className="border-t border-line">
                  {chart.columns.map((_, ci) => (
                    <td key={ci} className="p-1.5">
                      <input className="input px-2 py-1.5" value={r[ci] || ''} onChange={(e) => setCell(ri, ci, e.target.value)} aria-label={`Row ${ri + 1} ${chart.columns[ci]}`} />
                    </td>
                  ))}
                  <td className="p-1.5">
                    <button type="button" className="btn-icon h-8 w-8 hover:text-danger" onClick={() => removeRow(ri)} aria-label="Remove row"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="flex w-full items-center justify-center gap-1.5 border-t border-line py-2.5 text-sm font-semibold text-brand hover:bg-surface-2" onClick={addRow}>
            <Plus className="h-4 w-4" /> Add size row
          </button>
        </div>
      )}
      <Textarea label="Measuring note" value={chart.note} onChange={(e) => set({ note: e.target.value })} rows={2} maxLength={600} placeholder="How to measure, tolerance, fit advice…" />
    </div>
  );
}
