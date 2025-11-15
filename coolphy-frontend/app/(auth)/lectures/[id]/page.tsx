'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { LatexRenderer } from '@/components/ui/LatexRenderer';
import { Input } from '@/components/ui/Input';
import { lectureApi } from '@/lib/api/endpoints';
import { Lecture, Note } from '@/types';
import { BookOpen, CheckCircle2, ArrowLeft, StickyNote } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/I18nContext';

export default function LectureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const id = parseInt(params.id as string);
  
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    const fetchLecture = async () => {
      try {
        const data = await lectureApi.get(id);
        setLecture(data);
        
        // Fetch notes
        try {
          const notesData = await lectureApi.getNotes(id);
          setNotes(notesData);
        } catch (err) {
          console.error('Failed to fetch notes:', err);
        }
      } catch (error) {
        console.error('Failed to fetch lecture:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLecture();
  }, [id]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await lectureApi.complete(id);
      alert(t('lectures.completeSuccess'));
    } catch (error) {
      console.error('Failed to mark as complete:', error);
      alert(t('lectures.completeError'));
    } finally {
      setCompleting(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setAddingNote(true);
    try {
      const note = await lectureApi.createNote(id, newNote);
      setNotes([...notes, note]);
      setNewNote('');
    } catch (error) {
      console.error('Failed to add note:', error);
      alert(t('lectures.addNoteError'));
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!lecture) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-foreground/60">{t('lectures.notFound')}</p>
          <Link href="/lectures">
            <Button variant="outline" className="mt-4">
              {t('lectures.backToList')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>
        <Button onClick={handleComplete} disabled={completing}>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {completing ? t('lectures.marking') : t('lectures.markAsCompleted')}
        </Button>
      </div>

      {/* Lecture Info */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-6 h-6 text-primary" />
          <Badge variant={lecture.subject as any}>{t(`subjects.${lecture.subject}`)}</Badge>
          <Badge>{lecture.level}</Badge>
        </div>
        <h1 className="text-4xl font-bold mb-2">{lecture.title}</h1>
        <p className="text-foreground/70">{lecture.summary}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {lecture.tags.map((tag, idx) => (
            <Badge key={idx} variant="outline">{tag}</Badge>
          ))}
        </div>
      </div>

      {/* Video Player */}
      {(lecture.video_url || lecture.video_asset) && (
        <Card>
          <CardHeader>
            <CardTitle>{t('lectures.videoLecture')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-background rounded-lg overflow-hidden border">
              <video 
                controls 
                className="w-full h-full"
                src={lecture.video_asset?.url || lecture.video_url}
              >
                {t('lectures.videoUnsupported')}
              </video>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lecture Content */}
      <Card>
        <CardHeader>
          <CardTitle>{t('lectures.contentTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none">
            <LatexRenderer content={lecture.content_latex} />
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StickyNote className="w-5 h-5" />
              <CardTitle>{t('lectures.notesTitle')}</CardTitle>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowNotes(!showNotes)}
            >
              {showNotes ? t('lectures.hideNotes') : t('lectures.showNotes')} ({notes.length})
            </Button>
          </div>
        </CardHeader>
        {showNotes && (
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder={t('lectures.addNotePlaceholder')}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <Button onClick={handleAddNote} disabled={addingNote}>
                {t('lectures.addNoteButton')}
              </Button>
            </div>
            <div className="space-y-2">
              {notes.map((note) => (
                <div key={note.id} className="p-3 bg-background/50 rounded-lg border">
                  <p className="text-sm">{note.content}</p>
                  <p className="text-xs text-foreground/50 mt-2">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-sm text-foreground/60 text-center py-4">
                  {t('lectures.noNotesYet')}
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Related Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>{t('lectures.relatedTasksTitle')}</CardTitle>
          <CardDescription>{t('lectures.relatedTasksDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/tasks?subject=${lecture.subject}`}>
            <Button variant="outline" className="w-full">
              {t('lectures.viewTasksForPrefix')} {t(`subjects.${lecture.subject}`)}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
