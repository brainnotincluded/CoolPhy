'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { topicApi } from '@/lib/api/endpoints';
import { Topic } from '@/types';
import { ChevronRight, ChevronDown, Grid } from 'lucide-react';

interface TopicTreeNodeProps {
  topic: Topic;
  level: number;
}

function TopicTreeNode({ topic, level }: TopicTreeNodeProps) {
  const [expanded, setExpanded] = useState(level === 0);
  const hasChildren = topic.children && topic.children.length > 0;

  return (
    <div className="space-y-2">
      <div 
        className="flex items-center gap-2 group cursor-pointer hover:bg-background/50 p-2 rounded-lg transition-colors"
        style={{ paddingLeft: `${level * 24 + 8}px` }}
      >
        {hasChildren && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="w-5 h-5 flex items-center justify-center hover:bg-primary/20 rounded"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}
        
        {topic.icon && <span className="text-lg">{topic.icon}</span>}
        
        <Link href={`/topics/${topic.id}`} className="flex-1">
          <span className="font-medium group-hover:text-primary transition-colors">
            {topic.name}
          </span>
        </Link>
        
        <Badge variant={topic.subject as any} className="text-xs">
          {topic.subject}
        </Badge>
      </div>

      {hasChildren && expanded && (
        <div className="space-y-1">
          {topic.children!.map((child) => (
            <TopicTreeNode key={child.id} topic={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TopicsTreePage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const data = await topicApi.getTree();
        setTopics(data);
      } catch (error) {
        console.error('Failed to fetch topics tree:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Topics Tree</h1>
          <p className="text-foreground/70">Hierarchical view of all learning topics</p>
        </div>
        <Link href="/topics">
          <Button variant="outline">
            <Grid className="w-4 h-4 mr-2" />
            Grid View
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Topics</CardTitle>
        </CardHeader>
        <div className="p-6 space-y-1">
          {topics.map((topic) => (
            <TopicTreeNode key={topic.id} topic={topic} level={0} />
          ))}
          {topics.length === 0 && (
            <div className="text-center py-12">
              <p className="text-foreground/60">No topics found.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
