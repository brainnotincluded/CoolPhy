'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <AlertCircle className="w-20 h-20 mx-auto text-red-500" />
        <h1 className="text-4xl font-bold">Something went wrong!</h1>
        <p className="text-foreground/70">
          An unexpected error occurred. Don't worry, our team has been notified.
        </p>
        {error.message && (
          <p className="text-sm text-foreground/50 font-mono bg-background/50 p-3 rounded border">
            {error.message}
          </p>
        )}
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
