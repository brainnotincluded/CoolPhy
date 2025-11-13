'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { taskApi } from '@/lib/api/endpoints';
import { Task } from '@/types';
import { Search, CheckSquare, Trophy } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await taskApi.list();
        setTasks(data);
        setFilteredTasks(data);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    let filtered = tasks;

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(t => t.subject === selectedSubject);
    }

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
  }, [searchTerm, selectedSubject, tasks]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Tasks</h1>
        <p className="text-foreground/70">Challenge yourself with practice problems</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-foreground/60" />
          <Input
            placeholder="Search tasks..."
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

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <Link key={task.id} href={`/tasks/${task.id}`}>
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  {task.type === 'olympiad' ? (
                    <Trophy className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  )}
                  <Badge variant={task.subject as any}>{task.subject}</Badge>
                </div>
                <CardTitle className="line-clamp-2">{task.title}</CardTitle>
                <CardDescription>Level: {task.level}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge>{task.type}</Badge>
                  <Badge variant="success">{task.points} pts</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-foreground/60">No tasks found. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
}

