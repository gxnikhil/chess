import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'blitz';

    const topRatings = await prisma.rating.findMany({
      where: { format },
      orderBy: { rating: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            title: true,
            country: true,
            isVerified: true,
          },
        },
      },
    });

    return NextResponse.json({ format, leaderboard: topRatings });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
