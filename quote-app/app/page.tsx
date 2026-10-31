import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto max-w-md p-6 pt-16 text-center">
      <img src="/api/logo" alt="Fakhri Tools" className="mx-auto mb-10 h-14 w-auto" />
      <div className="grid gap-4">
        <Link href="/quote" className="btn btn-primary text-lg">Make a quote</Link>
        <Link href="/owner" className="btn btn-ghost">Owner</Link>
      </div>
    </main>
  );
}
