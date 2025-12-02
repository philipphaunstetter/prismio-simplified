import ScanScanner from '@/components/scanner/scan-scanner';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            QR Code Scanner
          </h1>
          <p className="mt-3 text-xl text-gray-500 sm:mt-4">
            Upload and scan QR codes directly in your browser - 100% private
          </p>
        </div>

        {/* Scanner Component */}
        <ScanScanner />

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="flex justify-center">
              <svg className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Privacy First</h3>
            <p className="mt-2 text-sm text-gray-500">
              All QR code processing happens entirely in your browser. No data is sent to any server.
            </p>
          </div>

          <div className="text-center">
            <div className="flex justify-center">
              <svg className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Advanced Processing</h3>
            <p className="mt-2 text-sm text-gray-500">
              Multiple image preprocessing strategies ensure even low-quality QR codes are detected.
            </p>
          </div>

          <div className="text-center">
            <div className="flex justify-center">
              <svg className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Smart Detection</h3>
            <p className="mt-2 text-sm text-gray-500">
              Automatically detects and formats URLs, emails, vCards, WiFi credentials, and more.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
