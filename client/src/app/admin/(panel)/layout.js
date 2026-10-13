import AdminShell from '@/components/admin/AdminShell';

export const metadata = { title: 'Admin', robots: { index: false } };

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
