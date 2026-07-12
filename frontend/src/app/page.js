export default async function Home() {
  let backendData = null;
  let error = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/test`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch from backend: ${res.status}`);
    }
    backendData = await res.json();
  } catch (err) {
    error = err.message;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 text-gray-900 font-sans">
      <div className="z-10 max-w-3xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-600">Full-Stack Connection Test</h1>
        
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 w-full">
          {error ? (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg">
              <h2 className="font-bold text-lg mb-2">Error Connecting to Backend</h2>
              <p>{error}</p>
              <p className="mt-4 text-sm opacity-80">Make sure your backend is running on port 5000 and PostgreSQL is active.</p>
            </div>
          ) : backendData ? (
            <div className="p-4 bg-green-50 text-green-800 rounded-lg">
              <h2 className="font-bold text-xl mb-4 text-green-700">Success! Everything is Connected.</h2>
              <p className="mb-2"><strong>Backend Message:</strong> {backendData.message}</p>
              <div className="mt-4 p-4 bg-gray-900 text-green-400 rounded-md font-mono text-xs overflow-auto">
                <p className="mb-2 text-gray-400">// Data from PostgreSQL Database via Prisma:</p>
                <pre>{JSON.stringify(backendData.data, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg">
              Loading...
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
