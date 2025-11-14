'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { adminApi } from '@/lib/api/endpoints';
import { Task } from '@/types';
import { Edit, Trash2, ExternalLink } from 'lucide-react';

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await adminApi.listTasks();
        setTasks(data);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await adminApi.deleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task');
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Tasks</h1>
        <a href={`${process.env.NEXT_PUBLIC_ADMIN_PANEL_URL}/admin-tasks-full.html`} target="_blank" rel="noopener noreferrer">
          <Button>
            <ExternalLink className="w-4 h-4 mr-2" />
            Create New Task
          </Button>
        </a>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tasks ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{task.title}</h3>
                    <Badge variant={task.subject as any}>{task.subject}</Badge>
                    <Badge variant="outline">{task.level}</Badge>
                    <Badge variant="outline">{task.type}</Badge>
                    <Badge>{task.status}</Badge>
                  </div>
                  <p className="text-xs text-foreground/50">
                    +{task.points} points • Created {new Date(task.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/tasks/${task.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                  <a href={`${process.env.NEXT_PUBLIC_ADMIN_PANEL_URL}/admin-tasks-full.html?id=${task.id}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </a>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(task.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
