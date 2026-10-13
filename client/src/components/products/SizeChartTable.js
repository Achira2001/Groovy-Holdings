export default function SizeChartTable({ chart }) {
  if (!chart?.columns?.length || !chart?.rows?.length) {
    return <p className="text-sm text-muted">No size chart for this product yet. Ask us on chat or WhatsApp.</p>;
  }
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[420px] text-sm">
          <thead className="bg-surface-2">
            <tr>
              {chart.columns.map((c, i) => (
                <th key={i} className="px-4 py-2.5 text-left font-bold">
                  {c}
                  {i > 0 && chart.unit ? <span className="ml-1 font-normal text-muted">({chart.unit})</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((r, i) => (
              <tr key={i} className="border-t border-line even:bg-surface-2/40">
                {chart.columns.map((_, j) => (
                  <td key={j} className={j === 0 ? 'px-4 py-2.5 font-bold' : 'px-4 py-2.5 tabular-nums'}>
                    {r[j] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {chart.note && <p className="mt-3 text-sm text-muted">{chart.note}</p>}
    </div>
  );
}
