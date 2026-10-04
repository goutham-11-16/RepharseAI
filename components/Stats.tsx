// ---------------------------------------------------------------------------
// Stats — side-by-side comparison of original vs. rewritten text metrics.
// ---------------------------------------------------------------------------

import { countWords, countCharacters } from "@/lib/text-utils";

interface StatsProps {
  originalText: string;
  rewrittenText: string;
}

export default function Stats({ originalText, rewrittenText }: StatsProps) {
  const origWords = countWords(originalText);
  const rewriteWords = countWords(rewrittenText);
  const origChars = countCharacters(originalText);
  const rewriteChars = countCharacters(rewrittenText);

  const wordDiff = rewriteWords - origWords;
  const charDiff = rewriteChars - origChars;

  function formatDiff(diff: number): string {
    if (diff === 0) return "—";
    return diff > 0 ? `+${diff}` : `${diff}`;
  }

  function diffColor(diff: number): string {
    if (diff === 0) return "text-gray-400";
    return diff > 0 ? "text-green-600" : "text-amber-600";
  }

  return (
    <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Comparison Statistics
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-500 mb-1">Original Words</p>
          <p className="text-xl font-semibold text-gray-900">{origWords}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Rewritten Words</p>
          <p className="text-xl font-semibold text-blue-600">{rewriteWords}</p>
          <p className={`text-xs font-medium ${diffColor(wordDiff)}`}>
            {formatDiff(wordDiff)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Original Characters</p>
          <p className="text-xl font-semibold text-gray-900">{origChars}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Rewritten Characters</p>
          <p className="text-xl font-semibold text-blue-600">{rewriteChars}</p>
          <p className={`text-xs font-medium ${diffColor(charDiff)}`}>
            {formatDiff(charDiff)}
          </p>
        </div>
      </div>
    </div>
  );
}
