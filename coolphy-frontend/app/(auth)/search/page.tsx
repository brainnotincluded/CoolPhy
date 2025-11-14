'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { lectureApi, taskApi, topicApi } from '@/lib/api/endpoints';
import { Lecture, Task, Topic } from '@/types';
import { Search, BookOpen, CheckSquare, FolderTree } from 'lucide-react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(false);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const [lecturesData, tasksData, topicsData] = await Promise.all([
        lectureApi.list({ search: query }),
        taskApi.list({ search: query }),
        topicApi.list({ search: query })
      ]);

      setLectures(lecturesData);
      setTasks(tasksData);
      setTopics(topicsData);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalResults = lectures.length + tasks.length + topics.length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Search</h1>
        <p className="text-foreground/70">Find lectures, tasks, and topics</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-foreground/60" />
              <Input
                placeholder="Search for lectures, tasks, topics..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && <Loading />}

      {searched && !loading && (
        <>
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
            </h2>
          </div>

          {/* Lectures */}
          {lectures.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Lectures ({lectures.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lectures.map((lecture) => (
                  <Link key={lecture.id} href={`/lectures/${lecture.id}`}>
                    <Card className="hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <BookOpen className="w-4 h-4 text-primary" />
                          <Badge variant={lecture.subject as any}>{lecture.subject}</Badge>
                        </div>
                        <CardTitle className="text-base">{lecture.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{lecture.summary}</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Tasks ({tasks.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <Card className="hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <CheckSquare className="w-4 h-4 text-primary" />
                          <div className="flex gap-1">
                            <Badge variant={task.subject as any} className="text-xs">{task.subject}</Badge>
                            <Badge variant="outline" className="text-xs">{task.type}</Badge>
                          </div>
                        </div>
                        <CardTitle className="text-base">{task.title}</CardTitle>
                        <CardDescription>{task.level} • +{task.points} points</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Topics */}
          {topics.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FolderTree className="w-5 h-5" />
                Topics ({topics.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topics.map((topic) => (
                  <Link key={topic.id} href={`/topics/${topic.id}`}>
                    <Card className="hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          {topic.icon && <span className="text-2xl">{topic.icon}</span>}
                          <Badge variant={topic.subject as any}>{topic.subject}</Badge>
                        </div>
                        <CardTitle className="text-base mt-2">{topic.name}</CardTitle>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {totalResults === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="w-12 h-12 mx-auto mb-4 text-foreground/40" />
                <p className="text-foreground/60 mb-4">No results found for "{query}"</p>
                <p className="text-sm text-foreground/50">Try different keywords or browse by category</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!searched && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-foreground/40" />
            <p className="text-foreground/60">Enter a search query to find content</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
