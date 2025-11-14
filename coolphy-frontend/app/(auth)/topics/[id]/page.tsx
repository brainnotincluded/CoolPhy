'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { topicApi } from '@/lib/api/endpoints';
import { Topic } from '@/types';
import { ArrowLeft, BookOpen, CheckSquare } from 'lucide-react';

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const data = await topicApi.get(id);
        setTopic(data);
      } catch (error) {
        console.error('Failed to fetch topic:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (!topic) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-foreground/60">Topic not found</p>
          <Link href="/topics">
            <Button variant="outline" className="mt-4">
              Back to Topics
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
        <Badge variant={topic.subject as any}>{topic.subject}</Badge>
      </div>

      {/* Topic Info */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          {topic.icon && <span className="text-4xl">{topic.icon}</span>}
          <div>
            <h1 className="text-4xl font-bold">{topic.name}</h1>
          </div>
        </div>
        <p className="text-foreground/70 text-lg">{topic.description}</p>
      </div>

      {/* Subtopics */}
      {topic.children && topic.children.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subtopics</CardTitle>
            <CardDescription>Explore related areas within this topic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topic.children.map((child) => (
                <Link key={child.id} href={`/topics/${child.id}`}>
                  <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      {child.icon && <span className="text-xl">{child.icon}</span>}
                      <h3 className="font-semibold">{child.name}</h3>
                    </div>
                    <p className="text-sm text-foreground/70 line-clamp-2">
                      {child.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Lectures */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            <CardTitle>Related Lectures</CardTitle>
          </div>
          <CardDescription>Learn more about this topic</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/lectures?subject=${topic.subject}`}>
            <Button variant="outline" className="w-full">
              View {topic.subject} Lectures
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Related Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            <CardTitle>Practice Problems</CardTitle>
          </div>
          <CardDescription>Test your knowledge with related tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/tasks?subject=${topic.subject}`}>
            <Button variant="outline" className="w-full">
              View {topic.subject} Tasks
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
