export function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-2">{title}</h1>
      <p className="text-gray-600">Coming soon.</p>
    </div>
  );
}
