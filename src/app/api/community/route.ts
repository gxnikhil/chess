import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    const users = await prisma.user.findMany({
      where: query ? {
        OR: [
          { username: { contains: query } },
          { displayName: { contains: query } },
        ],
      } : {},
      take: 50,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        title: true,
        country: true,
        isVerified: true,
        ratings: {
          select: { format: true, rating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching community users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
