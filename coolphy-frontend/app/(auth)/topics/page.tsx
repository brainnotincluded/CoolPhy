'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { topicApi } from '@/lib/api/endpoints';
import { Topic } from '@/types';
import { Search, FolderTree } from 'lucide-react';

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const data = await topicApi.list();
        setTopics(data);
        setFilteredTopics(data);
      } catch (error) {
        console.error('Failed to fetch topics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  useEffect(() => {
    let filtered = topics;

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(t => t.subject === selectedSubject);
    }

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTopics(filtered);
  }, [searchTerm, selectedSubject, topics]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Topics</h1>
          <p className="text-foreground/70">Explore learning topics organized by subject</p>
        </div>
        <Link href="/topics/tree">
          <Button variant="outline">
            <FolderTree className="w-4 h-4 mr-2" />
            Tree View
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-foreground/60" />
          <Input
            placeholder="Search topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Badge
            variant={selectedSubject === 'all' ? 'default' : 'math'}
            className="cursor-pointer"
            onClick={() => setSelectedSubject('all')}
          >
            All
          </Badge>
          <Badge
            variant="math"
            className="cursor-pointer"
            onClick={() => setSelectedSubject('math')}
          >
            Math
          </Badge>
          <Badge
            variant="physics"
            className="cursor-pointer"
            onClick={() => setSelectedSubject('physics')}
          >
            Physics
          </Badge>
          <Badge
            variant="cs"
            className="cursor-pointer"
            onClick={() => setSelectedSubject('cs')}
          >
            CS
          </Badge>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTopics.map((topic) => (
          <Link key={topic.id} href={`/topics/${topic.id}`}>
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  {topic.icon && <span className="text-2xl">{topic.icon}</span>}
                  <Badge variant={topic.subject as any}>{topic.subject}</Badge>
                </div>
                <CardTitle>{topic.name}</CardTitle>
                <CardDescription className="line-clamp-3">{topic.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {filteredTopics.length === 0 && (
        <div className="text-center py-12">
          <p className="text-foreground/60">No topics found. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
}
