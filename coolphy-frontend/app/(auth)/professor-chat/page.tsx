'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { LatexRenderer } from '@/components/ui/LatexRenderer';
import { chatApi } from '@/lib/api/endpoints';
import { ChatMessage } from '@/types';
import { Send, Bot, User } from 'lucide-react';

export default function ProfessorChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await chatApi.getHistory();
        setMessages(data);
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setSending(true);

    try {
      const response = await chatApi.send(userMessage);
      setMessages([...messages, response]);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Professor</h1>
        <p className="text-foreground/70">Ask questions about lectures, tasks, or any topic</p>
      </div>

      <Card className="h-[calc(100vh-250px)] flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <CardTitle>Chat</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-foreground/40" />
                  <p className="text-foreground/60">
                    No messages yet. Ask me anything!
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                {/* User Message */}
                <div className="flex gap-3 justify-end">
                  <div className="max-w-[80%] bg-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      <span className="font-semibold text-sm">You</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.user_message}</p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex gap-3">
                  <div className="max-w-[80%] bg-background/50 border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">AI Professor</span>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <LatexRenderer content={msg.ai_reply || msg.response || ''} />
                    </div>
                    {msg.context_type && (
                      <div className="mt-3 pt-3 border-t text-xs text-foreground/60">
                        <p>Context: {msg.context_type} {msg.context_id ? `#${msg.context_id}` : ''}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex gap-3">
                <div className="max-w-[80%] bg-background/50 border rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary animate-pulse" />
                    <span className="font-semibold text-sm">AI Professor</span>
                    <span className="text-xs text-foreground/60">typing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 border-t pt-4">
            <Input
              placeholder="Ask a question... (You can use LaTeX: $x^2$)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              disabled={sending}
            />
            <Button onClick={handleSend} disabled={sending || !message.trim()}>
              <Send className="w-4 h-4" />
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
            onClick={() => setMessage("Explain the concept of derivatives")}
          >
            Explain derivatives
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessage("What is Newton's second law?")}
          >
            Newton's laws
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessage("Explain time complexity in algorithms")}
          >
            Time complexity
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
