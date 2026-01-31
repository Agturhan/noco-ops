import { redirect } from 'next/navigation';

export default function Home() {
  // Ana sayfa login'e yönlendir
  redirect('/login');
}
