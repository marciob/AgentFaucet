export function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const isLoading = value === "...";

  return (
    <div className="group rounded-xl border border-card-border bg-card p-6 transition-all duration-300 hover:border-[#2a2a2a] hover:shadow-[0_0_40px_rgba(240,185,11,0.03)]">
      <p className="text-[13px] font-medium tracking-wide text-muted uppercase">
        {label}
      </p>
      {isLoading ? (
        <div className="mt-3 h-7 w-24 skeleton" />
      ) : (
        <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      )}
    </div>
  );
}
