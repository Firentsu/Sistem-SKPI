import { redirect } from 'next/navigation';

export default function MahasiswaIndex() {
  // redirect to dashboard
  redirect('/mahasiswa/dashboard');
}
