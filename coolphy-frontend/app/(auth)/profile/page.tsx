'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { authApi, statsApi } from '@/lib/api/endpoints';
import { User, UserStats } from '@/types';
import { Settings, BarChart3, Trophy, BookOpen, CheckSquare } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [userData, statsData] = await Promise.all([
          authApi.getProfile(),
          statsApi.profile()
        ]);
        setUser(userData);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (!user || !stats) {
    return (
      <div className="p-6">
        <p className="text-foreground/60">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profile</h1>
        <Link href="/profile/settings">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </Link>
      </div>

      {/* User Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-4xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{user.name}</h2>
              <p className="text-foreground/70 mb-4">{user.email}</p>
              <div className="flex flex-wrap gap-2">
                {(user.subjects || []).map((subject, idx) => (
                  <Badge key={idx} variant={subject as any}>
                    {subject}
                  </Badge>
                ))}
                <Badge variant="default">{user.role}</Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{user.points}</div>
              <p className="text-sm text-foreground/60">Total Points</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" />
              <CardTitle>Tasks Solved</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">{stats.total_tasks_solved}</div>
            <p className="text-sm text-foreground/60">across all subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <CardTitle>Lectures Viewed</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">{stats.total_lectures_viewed}</div>
            <p className="text-sm text-foreground/60">and counting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <CardTitle>Current Level</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">{stats.level}</div>
            <p className="text-sm text-foreground/60">{stats.streak} day streak</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Subject</CardTitle>
            <CardDescription>Your problem-solving distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats.tasks_by_subject || {}).map(([subject, count]) => (
              <div key={subject} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={subject as any}>{subject}</Badge>
                </div>
                <span className="font-semibold">{count} tasks</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lectures by Subject</CardTitle>
            <CardDescription>Your learning distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats.lectures_by_subject || {}).map(([subject, count]) => (
              <div key={subject} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={subject as any}>{subject}</Badge>
                </div>
                <span className="font-semibold">{count} lectures</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/profile/stats">
            <Button variant="outline" className="w-full">
              <BarChart3 className="w-4 h-4 mr-2" />
              Detailed Stats
            </Button>
          </Link>
          <Link href="/achievements">
            <Button variant="outline" className="w-full">
              <Trophy className="w-4 h-4 mr-2" />
              Achievements
            </Button>
          </Link>
          <Link href="/history">
            <Button variant="outline" className="w-full">
              View History
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
