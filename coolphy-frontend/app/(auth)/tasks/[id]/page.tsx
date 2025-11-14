'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { LatexRenderer } from '@/components/ui/LatexRenderer';
import { Input } from '@/components/ui/Input';
import { taskApi } from '@/lib/api/endpoints';
import { Task, SolutionAttempt } from '@/types';
import { ArrowLeft, Send, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState<SolutionAttempt | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await taskApi.get(id);
        setTask(data);
      } catch (error) {
        console.error('Failed to fetch task:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id]);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      alert('Please enter an answer');
      return;
    }

    setSubmitting(true);
    try {
      const result = await taskApi.solve(id, answer);
      setAttempt(result);
      
      if (result.is_correct) {
        setShowSolution(true);
      }
    } catch (error: any) {
      console.error('Failed to submit answer:', error);
      alert(error.response?.data?.error || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!task) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-foreground/60">Task not found</p>
          <Link href="/tasks">
            <Button variant="outline" className="mt-4">
              Back to Tasks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          <Badge variant={task.subject as any}>{task.subject}</Badge>
          <Badge>{task.level}</Badge>
          <Badge variant="outline">{task.type}</Badge>
        </div>
      </div>

      {/* Task Info */}
      <div>
        <h1 className="text-4xl font-bold mb-4">{task.title}</h1>
        <div className="flex flex-wrap gap-2 mb-4">
          {task.tags.map((tag, idx) => (
            <Badge key={idx} variant="outline">{tag}</Badge>
          ))}
          <Badge>+{task.points} points</Badge>
        </div>
      </div>

      {/* Problem Statement */}
      <Card>
        <CardHeader>
          <CardTitle>Problem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none">
            <LatexRenderer content={task.description_latex} />
          </div>
        </CardContent>
      </Card>

      {/* Hint */}
      {task.hint_latex && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Hint</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHint(!showHint)}
              >
                {showHint ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showHint ? 'Hide' : 'Show'} Hint
              </Button>
            </div>
          </CardHeader>
          {showHint && (
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <LatexRenderer content={task.hint_latex} />
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Answer Submission */}
      {!attempt?.is_correct && (
        <Card>
          <CardHeader>
            <CardTitle>Your Answer</CardTitle>
            <CardDescription>Submit your solution to receive AI feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter your answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="flex-1"
              />
              <Button onClick={handleSubmit} disabled={submitting}>
                <Send className="w-4 h-4 mr-2" />
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
            {attempt && (
              <div className="mt-4 p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  {attempt.is_correct ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">
                      {attempt.is_correct ? 'Correct! 🎉' : 'Not quite right'}
                    </h3>
                    <div className="text-sm text-foreground/80">
                      <LatexRenderer content={attempt.feedback} />
                    </div>
                    {attempt.is_correct && (
                      <p className="text-sm text-green-500 mt-2">
                        +{attempt.score} points earned!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Solution */}
      {task.solution_latex && (attempt?.is_correct || showSolution) && (
        <Card className="border-primary/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-primary">Solution</CardTitle>
              {!attempt?.is_correct && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSolution(!showSolution)}
                >
                  {showSolution ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showSolution ? 'Hide' : 'Show'} Solution
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <LatexRenderer content={task.solution_latex} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {attempt?.is_correct && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <CardTitle>Task Completed!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground/80">
              Great job! You've successfully solved this task and earned {attempt.score} points.
            </p>
            <Link href={`/tasks?subject=${task.subject}`}>
              <Button variant="outline" className="w-full">
                Try More {task.subject} Tasks
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Related Lectures */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>Review related lectures</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href={`/lectures?subject=${task.subject}`}>
            <Button variant="outline" className="w-full">
              View {task.subject} Lectures
            </Button>
          </Link>
          <Link href="/professor-chat">
            <Button variant="outline" className="w-full">
              Ask AI Professor
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
