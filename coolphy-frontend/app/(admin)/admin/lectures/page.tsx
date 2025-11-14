'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { adminApi } from '@/lib/api/endpoints';
import { Lecture } from '@/types';
import { Edit, Trash2, ExternalLink } from 'lucide-react';

export default function AdminLecturesPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const data = await adminApi.listLectures();
        setLectures(data);
      } catch (error) {
        console.error('Failed to fetch lectures:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLectures();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lecture?')) return;

    try {
      await adminApi.deleteLecture(id);
      setLectures(lectures.filter(l => l.id !== id));
    } catch (error) {
      console.error('Failed to delete lecture:', error);
      alert('Failed to delete lecture');
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Lectures</h1>
        <a href={`${process.env.NEXT_PUBLIC_ADMIN_PANEL_URL}/admin-lectures.html`} target="_blank" rel="noopener noreferrer">
          <Button>
            <ExternalLink className="w-4 h-4 mr-2" />
            Create New Lecture
          </Button>
        </a>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Lectures ({lectures.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lectures.map((lecture) => (
              <div key={lecture.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{lecture.title}</h3>
                    <Badge variant={lecture.subject as any}>{lecture.subject}</Badge>
                    <Badge variant="outline">{lecture.level}</Badge>
                    <Badge>{lecture.status}</Badge>
                  </div>
                  <p className="text-sm text-foreground/70">{lecture.summary}</p>
                  <p className="text-xs text-foreground/50 mt-1">
                    {lecture.view_count} views • Created {new Date(lecture.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/lectures/${lecture.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                  <a href={`${process.env.NEXT_PUBLIC_ADMIN_PANEL_URL}/admin-lectures.html?id=${lecture.id}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </a>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(lecture.id)}>
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
