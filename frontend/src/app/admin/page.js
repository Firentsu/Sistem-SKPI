import { redirect } from 'next/navigation';

export default function AdminIndex() {
  // redirect to dashboard
  redirect('/admin/dashboard');
}
