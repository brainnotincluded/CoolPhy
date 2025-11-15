'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { lectureApi } from '@/lib/api/endpoints';
import { Lecture } from '@/types';
import { Search, BookOpen } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/I18nContext';

export default function LecturesPage() {
  const { t } = useTranslation();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [filteredLectures, setFilteredLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const getSubjectLabel = (subject: string) => {
    const key = `subjects.${subject}`;
    const translated = t(key);
    return translated === key ? subject : translated;
  };

  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const data = await lectureApi.list();
        setLectures(data);
        setFilteredLectures(data);
      } catch (error) {
        console.error('Failed to fetch lectures:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLectures();
  }, []);

  useEffect(() => {
    let filtered = lectures;

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(l => l.subject === selectedSubject);
    }

    if (searchTerm) {
      filtered = filtered.filter(l =>
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.summary.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLectures(filtered);
  }, [searchTerm, selectedSubject, lectures]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('lectures.title')}</h1>
        <p className="text-foreground/70">{t('lectures.description')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-foreground/60" />
          <Input
            placeholder={t('lectures.searchPlaceholder')}
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
            {t('subjects.all')}
          </Badge>
          <Badge
            variant="math"
            className="cursor-pointer"
            onClick={() => setSelectedSubject('math')}
          >
            {t('subjects.math')}
          </Badge>
          <Badge
            variant="physics"
            className="cursor-pointer"
            onClick={() => setSelectedSubject('physics')}
          >
            {t('subjects.physics')}
          </Badge>
          <Badge
            variant="cs"
            className="cursor-pointer"
            onClick={() => setSelectedSubject('cs')}
          >
            {t('subjects.cs')}
          </Badge>
        </div>
      </div>

      {/* Lectures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLectures.map((lecture) => (
          <Link key={lecture.id} href={`/lectures/${lecture.id}`}>
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <Badge variant={lecture.subject as any}>{getSubjectLabel(lecture.subject)}</Badge>
                </div>
                <CardTitle className="line-clamp-2">{lecture.title}</CardTitle>
                <CardDescription className="line-clamp-3">{lecture.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge>{lecture.level}</Badge>
                  <Badge variant="default">{lecture.view_count} {t('lectures.views')}</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredLectures.length === 0 && (
        <div className="text-center py-12">
          <p className="text-foreground/60">{t('lectures.noLectures')}</p>
        </div>
      )}
    </div>
  );
}

