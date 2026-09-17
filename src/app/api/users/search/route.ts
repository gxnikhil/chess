import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        username: {
          startsWith: q,
          mode: 'insensitive',
        },
        isBanned: false,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        title: true,
        country: true,
        lastOnline: true,
        ratings: {
          select: {
            format: true,
            rating: true,
          },
        },
      },
      take: 8,
      orderBy: { username: 'asc' },
    });

    const results = users
      .filter((u) => u.username) // Only users who have set a username
      .map((u) => {
        const topRating = u.ratings.reduce(
          (best, r) => (r.rating > best.rating ? r : best),
          { format: 'rapid', rating: 1500 }
        );
        return {
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          avatar: u.avatar,
          title: u.title,
          country: u.country,
          topRating: Math.round(topRating.rating),
          topFormat: topRating.format,
          isOnline:
            Date.now() - new Date(u.lastOnline).getTime() < 5 * 60 * 1000,
        };
      });

    return NextResponse.json({ users: results });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
