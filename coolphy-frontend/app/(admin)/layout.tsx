'use client';

import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { AdminLayout } from '@/components/layouts/AdminLayout';

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}

