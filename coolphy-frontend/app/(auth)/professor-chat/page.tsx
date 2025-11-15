'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { LatexRenderer } from '@/components/ui/LatexRenderer';
import { Send } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/I18nContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ProfessorChatPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://178.255.127.62:8081/api/v1';
        // Filter to get only general professor chat (no task context)
        const response = await fetch(`${API_BASE}/professor-chat/history?context_type=professor`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        
        if (response.ok) {
          const history = await response.json();
          if (history && history.length > 0) {
            const loadedMessages: Message[] = [];
            history.forEach((msg: any) => {
              loadedMessages.push(
                { role: 'user', content: msg.user_message, timestamp: new Date(msg.timestamp) },
                { role: 'assistant', content: msg.ai_reply, timestamp: new Date(msg.timestamp) }
              );
            });
            setMessages(loadedMessages);
            return;
          }
        }
      } catch (err) {
        console.log('No chat history:', err);
      }
      
      // Default greeting
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm your AI Professor. I have access to your learning progress, all lectures, and tasks. Ask me anything about physics, math, or computer science, and I can recommend specific materials based on your performance!`,
        timestamp: new Date()
      }]);
      setLoading(false);
    };

    loadHistory();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || sending) return;

    const text = input.trim();
    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://178.255.127.62:8081/api/v1';
      const response = await fetch(`${API_BASE}/professor-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ message: text, context_type: 'professor' }),
      });
      
      if (!response.ok) throw new Error('chat failed');
      const data = await response.json();
      const aiMessage: Message = { role: 'assistant', content: data.ai_reply || '...', timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', timestamp: new Date() }]);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6 space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Professor</h1>
        <p className="text-foreground/70">Get personalized learning recommendations and explanations</p>
      </div>

      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle className="text-primary">AI Professor Chat</CardTitle>
          <CardDescription>
            I have access to your performance stats, all lectures and tasks. Ask for explanations or recommendations!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={chatContainerRef} className="space-y-4 max-h-[60vh] overflow-y-auto p-4 bg-background/50 rounded-lg border border-border">
            {messages.map((m, idx) => (
              <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={`inline-block px-4 py-3 rounded-lg ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'} max-w-[85%] shadow-sm`}>
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
              placeholder="Ask about lectures, tasks, or get learning recommendations..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={sending}>
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Questions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setInput("What topics should I focus on based on my performance?"); }}
          >
            📊 My weak areas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setInput("Recommend some tasks to practice"); }}
          >
            🎯 Task recommendations
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setInput("Explain the concept of derivatives"); }}
          >
            📚 Explain derivatives
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setInput("What is Newton's second law?"); }}
          >
            🔬 Newton's laws
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
