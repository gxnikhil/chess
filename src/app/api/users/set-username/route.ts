import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { isUsernameValid } from '@/lib/utils';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { username } = await req.json();
  const userId = (session.user as any).id;

  // Validate
  const validation = isUsernameValid(username);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Check availability
  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (existing && existing.id !== userId) {
    return NextResponse.json({ error: 'Username is taken' }, { status: 409 });
  }

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: { username },
  });

  return NextResponse.json({ success: true });
}
