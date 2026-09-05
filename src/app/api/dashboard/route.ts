import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        title: true,
        country: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch ratings
    const ratings = await prisma.rating.findMany({
      where: { userId },
    });

    const formatRatings = {
      bullet: ratings.find((r) => r.format === 'bullet')?.rating || 1500,
      blitz: ratings.find((r) => r.format === 'blitz')?.rating || 1500,
      rapid: ratings.find((r) => r.format === 'rapid')?.rating || 1500,
      classical: ratings.find((r) => r.format === 'classical')?.rating || 1500,
      bot: ratings.find((r) => r.format === 'bot')?.rating || 1500,
    };

    // Fetch recent games
    const recentGames = await prisma.game.findMany({
      where: {
        OR: [{ whiteId: userId }, { blackId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        whitePlayer: { select: { id: true, username: true, displayName: true, avatar: true } },
        blackPlayer: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });

    // Total stats
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
      ratings: formatRatings,
      stats: {
        wins: totalWins,
        losses: totalLosses,
        draws: totalDraws,
        totalGames: totalWins + totalLosses + totalDraws,
        winRate: (totalWins + totalLosses + totalDraws) > 0 
          ? Math.round((totalWins / (totalWins + totalLosses + totalDraws)) * 100) 
          : 0,
      },
      recentGames,
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
