'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'What is CoolPhy?',
      answer: 'CoolPhy is a next-generation educational platform designed for students preparing for competitive exams in Math, Physics, and Computer Science. We offer AI-powered learning, comprehensive lectures, practice tasks, and personalized recommendations.'
    },
    {
      question: 'Is CoolPhy free to use?',
      answer: 'Yes! CoolPhy offers a free tier with access to most features. Premium features and advanced content may require a subscription in the future.'
    },
    {
      question: 'What subjects does CoolPhy cover?',
      answer: 'We currently cover three main subjects: Mathematics (from basics to olympiad level), Physics (mechanics, electromagnetism, thermodynamics, quantum), and Computer Science (algorithms, data structures, competitive programming).'
    },
    {
      question: 'How does the AI Professor work?',
      answer: "Our AI Professor uses advanced language models to provide instant feedback on your solutions, offer hints when you're stuck, explain concepts, and recommend personalized learning paths based on your progress."
    },
    {
      question: 'Can I track my progress?',
      answer: 'Absolutely! Your dashboard shows detailed statistics including tasks solved, lectures completed, points earned, achievements unlocked, and your position on the leaderboard.'
    },
    {
      question: 'What types of tasks are available?',
      answer: 'We offer various task types including EGE exam problems, olympiad challenges, competitive programming questions, and practice exercises. Each task includes detailed solutions and explanations.'
    },
    {
      question: 'How are lectures formatted?',
      answer: 'All lectures are written in LaTeX for precise mathematical notation. They include theory, examples, practice problems, and often video explanations.'
    },
    {
      question: 'Can I contribute content?',
      answer: 'Currently, content creation is limited to administrators and verified educators. We plan to open community contributions in the future.'
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-foreground/70 mb-8">
          Find answers to common questions about CoolPhy
        </p>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-foreground/60" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-foreground/60" />
                  )}
                </CardHeader>
              </button>
              <div
                className={cn(
                  'transition-all duration-200 overflow-hidden',
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                )}
              >
                <CardContent className="pt-0 text-foreground/80">
                  {faq.answer}
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

