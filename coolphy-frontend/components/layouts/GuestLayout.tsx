'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { BackgroundBeams } from '@/components/ui/BackgroundBeams';

interface GuestLayoutProps {
  children: React.ReactNode;
  showBeams?: boolean;
}

export function GuestLayout({ children, showBeams = false }: GuestLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative">
      {showBeams && <BackgroundBeams />}
      
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            CoolPhy
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/search" className="text-foreground/80 hover:text-foreground transition-colors">
              Explore
            </Link>
            <Link href="/about" className="text-foreground/80 hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/faq" className="text-foreground/80 hover:text-foreground transition-colors">
              FAQ
            </Link>
          </nav>
          
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1 relative z-10">
        {children}
      </main>
      
      <footer className="border-t border-border bg-background/80 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">CoolPhy</h3>
              <p className="text-sm text-foreground/60">
                Master Math, Physics & CS with AI-powered learning
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/lectures" className="text-foreground/60 hover:text-foreground">Lectures</Link></li>
                <li><Link href="/tasks" className="text-foreground/60 hover:text-foreground">Tasks</Link></li>
                <li><Link href="/topics" className="text-foreground/60 hover:text-foreground">Topics</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/guide" className="text-foreground/60 hover:text-foreground">Guide</Link></li>
                <li><Link href="/faq" className="text-foreground/60 hover:text-foreground">FAQ</Link></li>
                <li><Link href="/about" className="text-foreground/60 hover:text-foreground">About</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="text-foreground/60 hover:text-foreground">Terms</Link></li>
                <li><Link href="/privacy" className="text-foreground/60 hover:text-foreground">Privacy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-foreground/60">
            © 2024 CoolPhy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

