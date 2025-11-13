'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { CardSpotlight } from '@/components/ui/CardSpotlight';
import { TextGenerateEffect } from '@/components/ui/TextGenerateEffect';
import { BackgroundBeams } from '@/components/ui/BackgroundBeams';
import { BookOpen, CheckSquare, Brain, Trophy, Zap, Users } from 'lucide-react';

export default function LandingPage() {
  const subjects = [
    {
      name: 'Mathematics',
      color: 'bg-math/10 border-math/20 hover:border-math',
      icon: '∫',
      description: 'Master calculus, algebra, geometry, and olympiad-level problem solving'
    },
    {
      name: 'Physics',
      color: 'bg-physics/10 border-physics/20 hover:border-physics',
      icon: 'Φ',
      description: 'Explore mechanics, electromagnetism, thermodynamics, and quantum physics'
    },
    {
      name: 'Computer Science',
      color: 'bg-cs/10 border-cs/20 hover:border-cs',
      icon: '</> ',
      description: 'Learn algorithms, data structures, competitive programming, and more'
    },
  ];

  const features = [
    {
      icon: BookOpen,
      title: 'Rich Lecture Library',
      description: 'Access hundreds of LaTeX-formatted lectures covering all topics from basics to olympiad level'
    },
    {
      icon: CheckSquare,
      title: 'Practice Tasks',
      description: 'Solve problems from EGE exams, olympiads, and competitive programming challenges'
    },
    {
      icon: Brain,
      title: 'AI Professor',
      description: 'Get instant feedback, hints, and personalized recommendations from our AI assistant'
    },
    {
      icon: Trophy,
      title: 'Achievements & Leaderboard',
      description: 'Track your progress, earn badges, and compete with peers on the leaderboard'
    },
    {
      icon: Zap,
      title: 'Adaptive Learning',
      description: 'Our system adapts to your level and recommends content based on your progress'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Join a community of learners, share notes, and collaborate on problem solving'
    },
  ];

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <BackgroundBeams />
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <TextGenerateEffect
              words="Master Math, Physics & Computer Science"
              className="text-5xl md:text-7xl mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
            />
            
            <p className="text-xl md:text-2xl text-foreground/80 mb-8">
              Next-gen competitive exam preparation platform powered by AI
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/search">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Explore Content
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Choose Your Path</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {subjects.map((subject, index) => (
              <motion.div
                key={subject.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <CardSpotlight className={`p-8 border-2 transition-all duration-300 ${subject.color}`}>
                  <div className="text-6xl font-bold mb-4 text-center">{subject.icon}</div>
                  <h3 className="text-2xl font-bold mb-4 text-center">{subject.name}</h3>
                  <p className="text-foreground/70 text-center">{subject.description}</p>
                </CardSpotlight>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Why CoolPhy?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Learning?</h2>
          <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of students mastering math, physics, and computer science with AI-powered guidance
          </p>
          <Link href="/register">
            <Button size="lg">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

