'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { adminApi } from '@/lib/api/endpoints';
import { BookOpen, CheckSquare, Users, Plus } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminApi.getDashboard();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <Loading />;
  }

  const adminPanelUrl = process.env.NEXT_PUBLIC_ADMIN_PANEL_URL || '/admin-panel';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-foreground/70">Manage platform content and users</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lectures</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_lectures || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_tasks || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href={`${adminPanelUrl}/admin-lectures.html`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full justify-between">
                <span>Create Lecture</span>
                <Plus className="w-4 h-4" />
              </Button>
            </a>
            <a href={`${adminPanelUrl}/admin-tasks-full.html`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full justify-between">
                <span>Create Task</span>
                <Plus className="w-4 h-4" />
              </Button>
            </a>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-between">
                <span>Manage Users</span>
                <Users className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/admin/logs">
              <Button variant="outline" className="w-full justify-between">
                <span>View Logs</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Content Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lectures</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/admin/lectures">
              <Button className="w-full">Manage Lectures</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/admin/tasks">
              <Button className="w-full">Manage Tasks</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

