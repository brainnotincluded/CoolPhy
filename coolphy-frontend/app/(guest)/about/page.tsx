import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Target, Users, Zap, Award } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To democratize access to high-quality STEM education and help students achieve their academic goals through AI-powered personalized learning.'
    },
    {
      icon: Users,
      title: 'Community First',
      description: 'We believe in building a supportive community where students can learn together, share knowledge, and grow collectively.'
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Leveraging cutting-edge AI technology to provide instant feedback, adaptive learning paths, and intelligent tutoring.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Maintaining the highest standards in content quality, from basic concepts to olympiad-level challenges.'
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">About CoolPhy</h1>
        <p className="text-xl text-foreground/70 mb-12">
          Empowering the next generation of scientists, engineers, and problem solvers
        </p>

        <div className="prose prose-invert max-w-none mb-12">
          <h2 className="text-2xl font-bold mb-4">Our Story</h2>
          <p className="text-foreground/80 mb-4">
            CoolPhy was born from a simple observation: traditional exam preparation methods often fail to adapt to individual learning styles and paces. We set out to create a platform that combines the rigor of classical education with the power of modern AI technology.
          </p>
          <p className="text-foreground/80 mb-4">
            Our platform serves students preparing for competitive exams like the Russian Unified State Exam (ЕГЭ/ОГЭ), international olympiads, and university entrance tests. We cover Mathematics, Physics, and Computer Science with comprehensive content ranging from foundational concepts to advanced problem-solving techniques.
          </p>
          <p className="text-foreground/80">
            What sets CoolPhy apart is our AI Professor—an intelligent assistant that provides instant feedback, personalized hints, and adaptive recommendations. It's like having a personal tutor available 24/7, helping you master even the most challenging concepts.
          </p>
        </div>

        <h2 className="text-2xl font-bold mb-6">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <Card key={value.title}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/70">{value.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="bg-primary/5 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Join Our Community</h2>
          <p className="text-foreground/70 mb-6">
            Thousands of students are already using CoolPhy to achieve their academic goals. Start your learning journey today!
          </p>
        </div>
      </div>
    </div>
  );
}

