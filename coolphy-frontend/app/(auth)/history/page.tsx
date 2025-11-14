'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { historyApi } from '@/lib/api/endpoints';
import { SolutionAttempt } from '@/types';
import { BookOpen, CheckSquare, Clock } from 'lucide-react';

export default function HistoryPage() {
  const [taskHistory, setTaskHistory] = useState<SolutionAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await historyApi.tasks();
        setTaskHistory(data);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Activity History</h1>
        <p className="text-foreground/70">Your learning journey timeline</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/history">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <CardTitle>All Activity</CardTitle>
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/lectures">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <CardTitle>Lectures</CardTitle>
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/tasks">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                <CardTitle>Tasks</CardTitle>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Task Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {taskHistory.map((attempt) => (
              <div key={attempt.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    <Link href={`/tasks/${attempt.task_id}`}>
                      <span className="font-semibold hover:text-primary">Task #{attempt.task_id}</span>
                    </Link>
                  </div>
                  <Badge variant={attempt.is_correct ? 'default' : 'outline'}>
                    {attempt.is_correct ? '✓ Correct' : '✗ Incorrect'}
                  </Badge>
                </div>
                <p className="text-sm text-foreground/70 mb-2">Answer: {attempt.answer}</p>
                <div className="flex items-center justify-between text-xs text-foreground/60">
                  <span>Score: {attempt.score}</span>
                  <span>{new Date(attempt.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}

            {taskHistory.length === 0 && (
              <div className="text-center py-12">
                <p className="text-foreground/60">No activity yet. Start learning!</p>
                <div className="flex gap-2 justify-center mt-4">
                  <Link href="/lectures">
                    <Button variant="outline">Browse Lectures</Button>
                  </Link>
                  <Link href="/tasks">
                    <Button variant="outline">Try Tasks</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
