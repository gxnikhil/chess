import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const totalUsers = await prisma.user.count();
    const totalGames = await prisma.game.count();
    const activeGames = await prisma.game.count({ where: { status: 'active' } });
    const pendingReports = await prisma.report.count({ where: { status: 'pending' } });

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        title: true,
        isBanned: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        reporter: { select: { username: true } },
        reported: { select: { username: true } },
      },
    });

    return NextResponse.json({
      stats: { totalUsers, totalGames, activeGames, pendingReports },
      recentUsers,
      reports,
    });
  } catch (error) {
    console.error('Error fetching admin data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
