'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { authApi } from '@/lib/api/endpoints';
import { User } from '@/types';
import { ArrowLeft, Save } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [language, setLanguage] = useState<'en' | 'ru' | 'zh'>('en');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authApi.getProfile();
        setUser(data);
        setName(data.name);
        setEmail(data.email);
        setSubjects(data.subjects || []);
        const langFromSettings = (data.settings && (data.settings as any).language) as
          | 'en'
          | 'ru'
          | 'zh'
          | undefined;
        setLanguage(langFromSettings || 'en');
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile({
        name,
        email,
        subjects,
        settings: {
          ...(user?.settings || {}),
          language,
        },
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      await authApi.changePassword({ current_password: currentPassword, new_password: newPassword });
      alert('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Failed to change password:', error);
      alert(error.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const toggleSubject = (subject: string) => {
    if (subjects.includes(subject)) {
      setSubjects(subjects.filter(s => s !== subject));
    } else {
      setSubjects([...subjects, subject]);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Subjects</label>
            <div className="flex gap-2">
              <Badge
                variant={subjects.includes('math') ? 'math' : 'default'}
                className="cursor-pointer"
                onClick={() => toggleSubject('math')}
              >
                Math
              </Badge>
              <Badge
                variant={subjects.includes('physics') ? 'physics' : 'default'}
                className="cursor-pointer"
                onClick={() => toggleSubject('physics')}
              >
                Physics
              </Badge>
              <Badge
                variant={subjects.includes('cs') ? 'cs' : 'default'}
                className="cursor-pointer"
                onClick={() => toggleSubject('cs')}
              >
                CS
              </Badge>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={language === 'en' ? 'primary' : 'outline'}
                onClick={() => setLanguage('en')}
              >
                English
              </Button>
              <Button
                type="button"
                variant={language === 'ru' ? 'primary' : 'outline'}
                onClick={() => setLanguage('ru')}
              >
                Русский
              </Button>
              <Button
                type="button"
                variant={language === 'zh' ? 'primary' : 'outline'}
                onClick={() => setLanguage('zh')}
              >
                中文
              </Button>
            </div>
          </div>
          <Button onClick={handleUpdateProfile} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Current Password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          <Button onClick={handleChangePassword} disabled={saving}>
            {saving ? 'Changing...' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
