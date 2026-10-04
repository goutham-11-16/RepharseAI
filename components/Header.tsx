// ---------------------------------------------------------------------------
// Header — production-grade navigation bar with engine telemetry and status.
// ---------------------------------------------------------------------------

interface HeaderProps {
  model: string;
}

export default function Header({ model }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
            R
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                RephrazeAI
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                PRO Humanizer Suite
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Detector-Bypassing Engine with Real-Time Perplexity & Burstiness Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Local Engine Online</span>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full text-gray-600 font-mono text-[11px]">
            <span className="text-gray-400">Model:</span>
            <span className="font-semibold text-gray-800">{model}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
