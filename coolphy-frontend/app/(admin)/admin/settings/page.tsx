'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { adminApi } from '@/lib/api/endpoints';
import { Save, Key, MessageSquare, Cpu } from 'lucide-react';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [primaryModel, setPrimaryModel] = useState('anthropic/claude-3.5-sonnet');
  const [fallbackModel, setFallbackModel] = useState('google/gemini-2.0-flash-exp:free');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await adminApi.getSettings();
        setApiKey(data.openrouter_api_key || '');
        setSystemPrompt(data.system_prompt || '');
        setPrimaryModel(data.primary_model || 'anthropic/claude-3.5-sonnet');
        setFallbackModel(data.fallback_model || 'google/gemini-2.0-flash-exp:free');
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateSettings({
        openrouter_api_key: apiKey,
        system_prompt: systemPrompt,
        primary_model: primaryModel,
        fallback_model: fallbackModel,
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Settings</h1>
        <p className="text-foreground/70">Configure OpenRouter API and AI behavior</p>
      </div>

      {/* API Key */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            <CardTitle>OpenRouter API Key</CardTitle>
          </div>
          <CardDescription>
            Get your API key from{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              openrouter.ai/keys
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="password"
            placeholder="sk-or-v1-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="font-mono"
          />
        </CardContent>
      </Card>

      {/* Models */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            <CardTitle>Model Configuration</CardTitle>
          </div>
          <CardDescription>
            Primary model will be used first. If it fails due to insufficient credits, the system will
            automatically fall back to the free model.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Primary Model (Paid)</label>
            <select
              value={primaryModel}
              onChange={(e) => setPrimaryModel(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet (Best quality)</option>
              <option value="anthropic/claude-3-opus">Claude 3 Opus</option>
              <option value="openai/gpt-4-turbo">GPT-4 Turbo</option>
              <option value="openai/gpt-4">GPT-4</option>
              <option value="google/gemini-pro-1.5">Gemini Pro 1.5</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Fallback Model (Free)</label>
            <select
              value={fallbackModel}
              onChange={(e) => setFallbackModel(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash (Free)</option>
              <option value="google/gemini-flash-1.5:free">Gemini Flash 1.5 (Free)</option>
              <option value="meta-llama/llama-3.2-3b-instruct:free">Llama 3.2 3B (Free)</option>
              <option value="mistralai/mistral-7b-instruct:free">Mistral 7B (Free)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* System Prompt */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <CardTitle>System Prompt</CardTitle>
          </div>
          <CardDescription>
            Define how the AI teacher should behave and respond to students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={12}
            className="w-full px-4 py-2 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
            placeholder="You are an expert teacher..."
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
