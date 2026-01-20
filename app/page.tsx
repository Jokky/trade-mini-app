import ClientHome from '../components/ClientHome';

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-3xl w-full">
        {/* Restored original header/layout to avoid visual regression */}
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold">Trade Mini App</h1>
          <p className="text-sm text-gray-600">Welcome — view your portfolio or enter an API token.</p>
        </header>

        <ClientHome />
      </div>
    </main>
  );
}
