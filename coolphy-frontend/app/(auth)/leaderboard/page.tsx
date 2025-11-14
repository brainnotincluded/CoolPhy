'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { statsApi } from '@/lib/api/endpoints';
import { LeaderboardEntry } from '@/types';
import { Trophy, Medal } from 'lucide-react';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await statsApi.leaderboard();
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return <Loading />;
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-700" />;
    return <span className="text-foreground/60 font-bold w-6 text-center">{rank}</span>;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-foreground/70">Top learners on the platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.user.id}
                className={`flex items-center gap-4 p-4 rounded-lg border ${
                  entry.rank <= 3 ? 'bg-primary/5 border-primary/30' : 'bg-background/50'
                }`}
              >
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(entry.rank)}
                </div>

                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold">
                  {entry.user.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold">{entry.user.name}</h3>
                  <div className="flex gap-2 mt-1">
                    {entry.user.subjects.map((subject, idx) => (
                      <Badge key={idx} variant={subject as any} className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{entry.points}</p>
                  <p className="text-xs text-foreground/60">{entry.tasks_solved} tasks solved</p>
                </div>
              </div>
            ))}

            {leaderboard.length === 0 && (
              <div className="text-center py-12">
                <p className="text-foreground/60">No leaderboard data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
