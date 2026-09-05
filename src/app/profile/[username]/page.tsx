import { redirect } from 'next/navigation';

export default async function ProfileRedirect({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  redirect(`/user/${username}`);
}
