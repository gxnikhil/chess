import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        country: true,
        title: true,
        bio: true,
        isVerified: true,
        createdAt: true,
        lastOnline: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch ratings
    const ratings = await prisma.rating.findMany({
      where: { userId: user.id },
    });

    // Fetch recent games
    const games = await prisma.game.findMany({
      where: {
        OR: [{ whiteId: user.id }, { blackId: user.id }],
        status: 'completed',
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        whitePlayer: { select: { id: true, username: true, displayName: true, avatar: true } },
        blackPlayer: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });

    // Calculate total stats
    let totalWins = 0;
    let totalLosses = 0;
    let totalDraws = 0;

    ratings.forEach((r) => {
      totalWins += r.wins;
      totalLosses += r.losses;
      totalDraws += r.draws;
    });

    return NextResponse.json({
      user,
      ratings,
      stats: {
        wins: totalWins,
        losses: totalLosses,
        draws: totalDraws,
        totalGames: totalWins + totalLosses + totalDraws,
      },
      recentGames: games,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
