'use client';

import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { AuthLayout } from '@/components/layouts/AuthLayout';

export default function AuthLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AuthLayout>{children}</AuthLayout>
    </ProtectedRoute>
  );
}

