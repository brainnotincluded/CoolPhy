'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { achievementApi } from '@/lib/api/endpoints';
import { Trophy, Lock } from 'lucide-react';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  max_progress?: number;
  category: string;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const data = await achievementApi.list();
        const list = Array.isArray((data as any)?.achievements)
          ? ((data as any).achievements as Achievement[])
          : [];
        setAchievements(list);
      } catch (error) {
        console.error('Failed to fetch achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  if (loading) {
    return <Loading />;
  }

  const categories = [...new Set(achievements.map(a => a.category))];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Achievements</h1>
        <p className="text-foreground/70">
          Track your progress and unlock badges by completing challenges
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-foreground/60">Unlocked</p>
                <p className="text-2xl font-bold">
                  {achievements.filter(a => a.unlocked).length} / {achievements.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Lock className="w-8 h-8 text-foreground/40" />
              <div>
                <p className="text-sm text-foreground/60">Locked</p>
                <p className="text-2xl font-bold">
                  {achievements.filter(a => !a.unlocked).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {categories.map((category) => (
        <div key={category}>
          <h2 className="text-2xl font-bold mb-4 capitalize">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements
              .filter(a => a.category === category)
              .map((achievement) => (
                <Card
                  key={achievement.id}
                  className={achievement.unlocked ? 'border-primary/50' : 'opacity-60'}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{achievement.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{achievement.name}</CardTitle>
                          {achievement.unlocked && (
                            <Badge variant="default" className="mt-1">Unlocked</Badge>
                          )}
                        </div>
                      </div>
                      {!achievement.unlocked && <Lock className="w-5 h-5" />}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/70 mb-3">
                      {achievement.description}
                    </p>
                    {!achievement.unlocked && achievement.progress !== undefined && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>
                            {achievement.progress} / {achievement.max_progress}
                          </span>
                        </div>
                        <div className="h-2 bg-background rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${((achievement.progress || 0) / (achievement.max_progress || 1)) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
