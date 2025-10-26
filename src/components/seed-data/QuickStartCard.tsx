import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Zap, Loader2, AlertCircle } from 'lucide-react';

interface QuickStartCardProps {
  onExecute: () => Promise<void>;
  disabled?: boolean;
}

export default function QuickStartCard({ onExecute, disabled }: QuickStartCardProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const handleQuickStart = async () => {
    setIsRunning(true);
    setProgress(0);
    setStatus('Starting full setup...');

    try {
      setProgress(10);
      setStatus('Seeding base data...');
      await onExecute();

      setProgress(100);
      setStatus('Complete!');
    } catch (error) {
      console.error('Quick start error:', error);
      setStatus('Error during setup');
    } finally {
      setTimeout(() => {
        setIsRunning(false);
        setProgress(0);
        setStatus('');
      }, 2000);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Quick Start
        </CardTitle>
        <CardDescription>
          Automatically set up everything you need for testing in one click
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>What this does:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Clears all existing test data</li>
              <li>Creates lanes, workers, skills, and capabilities</li>
              <li>Generates 35 days of worker capacity</li>
              <li>Syncs contribution intervals</li>
            </ul>
            <p className="mt-2 text-sm">
              <strong>Estimated time:</strong> 2-3 minutes
            </p>
          </AlertDescription>
        </Alert>

        {isRunning && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">{status}</p>
          </div>
        )}

        <Button onClick={handleQuickStart} disabled={isRunning || disabled} className="w-full" size="lg">
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting Up...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Quick Start: Full Test Environment
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
