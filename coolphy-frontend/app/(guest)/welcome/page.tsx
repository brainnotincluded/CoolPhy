'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookOpen, CheckSquare, Bot, Trophy } from 'lucide-react';

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">Welcome to CoolPhy! 🎉</h1>
          <p className="text-xl text-foreground/70">
            Your journey to mastering Math, Physics, and Computer Science starts here
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <BookOpen className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Learn</CardTitle>
              <CardDescription>
                Access comprehensive lectures with LaTeX-formatted content and video explanations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CheckSquare className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Practice</CardTitle>
              <CardDescription>
                Solve problems ranging from basic exercises to olympiad-level challenges
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Bot className="w-12 h-12 text-primary mb-4" />
              <CardTitle>AI Professor</CardTitle>
              <CardDescription>
                Get instant help and explanations from our AI assistant anytime
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Trophy className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Compete</CardTitle>
              <CardDescription>
                Track your progress, earn achievements, and climb the leaderboard
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              I Have an Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
