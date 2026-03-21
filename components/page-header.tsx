type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-10">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground sm:mt-3 sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
