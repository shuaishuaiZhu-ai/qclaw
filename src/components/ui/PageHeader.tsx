interface PageHeaderProps {
  title: string;
  description: string;
  meta?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, description, meta, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
        {meta ? <p className="mt-2 text-xs text-slate-500">{meta}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
