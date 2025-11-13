'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { statsApi, lectureApi, taskApi } from '@/lib/api/endpoints';
import { UserStats, Lecture, Task } from '@/types';
import { BookOpen, CheckSquare, Trophy, TrendingUp, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentLectures, setRecentLectures] = useState<Lecture[]>([]);
  const [recommendedTasks, setRecommendedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, lecturesData, tasksData] = await Promise.all([
          statsApi.profile(),
          lectureApi.list({ status: 'active' }),
          taskApi.list({ status: 'active' })
        ]);
        
        setStats(statsData);
        setRecentLectures(lecturesData.slice(0, 3));
        setRecommendedTasks(tasksData.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
        <p className="text-foreground/70">Here's your learning progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_points || 0}</div>
            <p className="text-xs text-foreground/60">
              Level: {stats?.level || 'Beginner'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Solved</CardTitle>
            <CheckSquare className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_tasks_solved || 0}</div>
            <p className="text-xs text-foreground/60">
              Keep it up!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lectures Viewed</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_lectures_viewed || 0}</div>
            <p className="text-xs text-foreground/60">
              Great progress!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.streak || 0} days</div>
            <p className="text-xs text-foreground/60">
              Don't break it!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump right into learning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/lectures">
              <Button variant="outline" className="w-full justify-between">
                <span>Browse Lectures</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/tasks">
              <Button variant="outline" className="w-full justify-between">
                <span>Solve Tasks</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/professor-chat">
              <Button variant="outline" className="w-full justify-between">
                <span>Ask Professor</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Lectures */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Lectures</CardTitle>
          <CardDescription>Continue where you left off</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentLectures.length > 0 ? (
              recentLectures.map((lecture) => (
                <Link
                  key={lecture.id}
                  href={`/lectures/${lecture.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <div>
                    <h4 className="font-medium">{lecture.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={lecture.subject as any}>{lecture.subject}</Badge>
                      <Badge>{lecture.level}</Badge>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-foreground/60" />
                </Link>
              ))
            ) : (
              <p className="text-foreground/60 text-center py-4">No lectures yet. Start exploring!</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Tasks</CardTitle>
          <CardDescription>Based on your progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendedTasks.length > 0 ? (
              recommendedTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <div>
                    <h4 className="font-medium">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={task.subject as any}>{task.subject}</Badge>
                      <Badge>{task.type}</Badge>
                      <span className="text-sm text-foreground/60">{task.points} pts</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-foreground/60" />
                </Link>
              ))
            ) : (
              <p className="text-foreground/60 text-center py-4">No tasks yet. Start solving!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

