import { Wallet } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-500 to-blue-600 flex items-center justify-center overflow-hidden">
      {/* Animated circles in background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-white/20 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-white/25 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center">
        {/* Wallet icon */}
        <div className="mb-8">
          <div className="relative">
            {/* Rotating border */}
            <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-white rounded-full animate-spin" style={{ animationDuration: '1s' }}></div>
            {/* Icon container */}
            <div className="w-24 h-24 flex items-center justify-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Wallet className="text-white w-8 h-8" strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>

        {/* Loading text */}
        <div className="flex items-center space-x-1">
          <div className="text-white text-base font-medium tracking-wider">読み込み中</div>
          <div className="flex space-x-1 ml-1">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}