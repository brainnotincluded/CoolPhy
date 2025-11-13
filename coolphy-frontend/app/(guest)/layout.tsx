import { GuestLayout } from '@/components/layouts/GuestLayout';

export default function GuestLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestLayout>{children}</GuestLayout>;
}

