import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#52B788', '#D97757', '#5A87AD', '#A39151', '#2D664D', '#91C7AA', '#E3A18B'];

export const ReportPieCard = ({ title, description, data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <article className="rounded-3xl border border-[#E3DFD5] bg-white p-5 shadow-[0_12px_32px_-8px_rgba(27,67,50,0.08)] sm:p-6">
      <h3 className="text-base font-extrabold text-[#1B4332]">{title}</h3>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
      <div className="relative mt-2 h-56 w-full">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} stroke="white" strokeWidth={3}>
                {data.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Items']} contentStyle={{ border: '1px solid #E3DFD5', borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">No report data available</div>
        )}
        {total > 0 && <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-extrabold text-[#1B4332]">{total}</span><span className="text-[10px] font-semibold uppercase text-gray-400">total</span></div>}
      </div>
      {data.length > 0 && <ul className="flex flex-wrap gap-x-4 gap-y-2 border-t border-[#EFECE5] pt-4">{data.map((item, index) => <li key={item.name} className="flex items-center gap-2 text-[11px] text-gray-600"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} /><span>{item.name}</span><strong className="text-[#1B4332]">{item.value}</strong></li>)}</ul>}
    </article>
  );
};

export default ReportPieCard;
