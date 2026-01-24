import { Wallet } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-blue-500 flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        {/* Wallet icon with subtle rotation */}
        <div style={{ animation: 'rotate 2s linear infinite' }}>
          <Wallet className="text-white w-14 h-14" strokeWidth={1.5} />
        </div>

        {/* Loading text */}
        <div className="text-white text-sm font-medium tracking-widest">
          読み込み中
        </div>
      </div>

      <style jsx>{`
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}