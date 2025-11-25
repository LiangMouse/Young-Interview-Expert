const stats = [
  {
    title: "TOTAL INTERVIEWS",
    value: "12",
  },
  {
    title: "AVG. SCORE",
    value: "85",
  },
  {
    title: "STUDY TIME",
    value: "4h 30m",
  },
];

export function StatsGrid() {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {stats.map((stat) => {
        return (
          <div key={stat.title} className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-[#666666]">
              {stat.title}
            </p>
            <p className="text-4xl font-light text-[#141414]">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
}
