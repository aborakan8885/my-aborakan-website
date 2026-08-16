import React, { useState } from 'react';

interface AccessGateProps {
  children: React.ReactNode;
}

export default function AccessGate({ children }: AccessGateProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (password === 's1068575628') {
        setIsUnlocked(true);
      } else {
        setError(true);
        setTimeout(() => setError(false), 500);
        setPassword('');
      }
    }
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#023d38]">
      <div className="w-full max-w-md px-6">
        <div className={`transition-all duration-300 ${error ? 'translate-x-1' : ''}`}>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="············"
            className={`w-full px-6 py-4 text-center text-2xl font-mono tracking-widest text-white bg-white/10 border-2 rounded-2xl outline-hidden transition-all placeholder:text-white/20 ${
              error ? 'border-red-500 bg-red-500/10' : 'border-white/20 focus:border-teal-400 focus:bg-white/20 shadow-2xl'
            }`}
          />
          <div className="mt-4 text-center">
             <span className="text-teal-200/50 text-[10px] font-bold tracking-[0.2em] uppercase">
               Access Protected
             </span>
          </div>
        </div>
      </div>
    </div>
  );
}
