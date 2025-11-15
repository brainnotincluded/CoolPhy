'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { LatexRenderer } from '@/components/ui/LatexRenderer';
import { Input } from '@/components/ui/Input';
import { taskApi } from '@/lib/api/endpoints';
import { Task } from '@/types';
import { ArrowLeft, Send, CheckCircle2, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/I18nContext';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const id = parseInt(params.id as string);
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showProblem, setShowProblem] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await taskApi.get(id);
        setTask(data);
        setMessages([{
          role: 'assistant',
          content: `Hi! I'm your AI tutor for **${data.title}**. I'll guide you through the problem and evaluate your answer when you're ready. Just work through it naturally, and I'll know when to grade your solution!`,
          timestamp: new Date()
        }]);
      } catch (error) {
        console.error('Failed to fetch task:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || sending) return;

    const text = input.trim();
    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://178.255.127.62:8081'}/api/v1/task-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ message: text, context_type: 'task', context_id: id }),
      });
      if (!response.ok) throw new Error('chat failed');
      const data = await response.json();
      const aiMessage: ChatMessage = { role: 'assistant', content: data.ai_reply || '...', timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
      
      // Check if AI triggered evaluation
      if (data.evaluation) {
        if (data.evaluation.is_correct) {
          setIsCompleted(true);
          setEarnedPoints(task?.points || 0);
          setShowSolution(true);
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', timestamp: new Date() }]);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!task) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-foreground/60">{t('tasks.notFound')}</p>
          <Link href="/tasks">
            <Button variant="outline" className="mt-4">
              {t('tasks.backToList')}
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
          {t('common.back')}
        </Button>
        <div className="flex gap-2">
          <Badge variant={task.subject as any}>{t(`subjects.${task.subject}`)}</Badge>
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
          <Badge>+{task.points} {t('tasks.points')}</Badge>
        </div>
      </div>

      {/* Problem Statement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('tasks.problem')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowProblem(!showProblem)}>
              {showProblem ? <><ChevronUp className="w-4 h-4 mr-2" /> Hide</> : <><ChevronDown className="w-4 h-4 mr-2" /> Show</>}
            </Button>
          </div>
        </CardHeader>
        {showProblem && (
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <LatexRenderer content={task.description_latex} />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Hint */}
      {task.hint_latex && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('tasks.hint')}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHint(!showHint)}
              >
                {showHint ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showHint ? t('tasks.hideHint') : t('tasks.showHint')}
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

      {/* Conversational AI Chat */}
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle className="text-primary">AI Tutor</CardTitle>
          <CardDescription>Get help solving the problem. The AI will automatically evaluate your answer when you provide it.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[50vh] overflow-y-auto p-2 bg-slate-900/40 rounded-md border border-slate-800">
            {messages.map((m, idx) => (
              <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={`inline-block px-3 py-2 rounded-lg ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-100'} max-w-[95%]`}>
                  {m.role === 'assistant' ? (
                    <div className="prose prose-invert max-w-none">
                      <LatexRenderer content={m.content} />
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Ask questions or provide your answer..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={sending}>
              <Send className="w-4 h-4 mr-2" />
              {sending ? t('taskChat.thinking') : 'Send'}
            </Button>
          </div>
          {isCompleted && (
            <div className="mt-4 p-3 rounded border border-green-500/50 bg-green-500/10 text-green-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>{t('tasks.taskCompletedTitle')} +{earnedPoints} {t('tasks.points')}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Solution */}
      {task.solution_latex && (isCompleted || showSolution) && (
        <Card className="border-primary/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-primary">{t('tasks.solution')}</CardTitle>
              {!isCompleted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSolution(!showSolution)}
                >
                  {showSolution ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showSolution ? t('tasks.hideSolution') : t('tasks.showSolution')}
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

    </div>
  );
}
