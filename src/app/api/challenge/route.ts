import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Expire old challenges first
    await prisma.challenge.updateMany({
      where: {
        status: 'pending',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'expired' },
    });

    // Fetch sent and received pending challenges
    const [sent, received] = await Promise.all([
      prisma.challenge.findMany({
        where: { fromId: userId, status: 'pending' },
        include: {
          to: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.challenge.findMany({
        where: { toId: userId, status: 'pending' },
        include: {
          from: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({ sent, received });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { toUsername, timeControl, increment, rated, color } = body;

    if (!toUsername || !timeControl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the target user
    const targetUser = await prisma.user.findUnique({
      where: { username: toUsername },
      select: { id: true, username: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.id === userId) {
      return NextResponse.json(
        { error: 'Cannot challenge yourself' },
        { status: 400 }
      );
    }

    // Check for existing pending challenge between these users
    const existingChallenge = await prisma.challenge.findFirst({
      where: {
        fromId: userId,
        toId: targetUser.id,
        status: 'pending',
      },
    });

    if (existingChallenge) {
      return NextResponse.json(
        { error: 'You already have a pending challenge to this player' },
        { status: 409 }
      );
    }

    // Create the challenge (expires in 15 minutes)
    const challenge = await prisma.challenge.create({
      data: {
        fromId: userId,
        toId: targetUser.id,
        timeControl: Number(timeControl),
        increment: Number(increment) || 0,
        rated: rated !== false,
        color: color || 'random',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
      include: {
        from: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            title: true,
          },
        },
        to: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            title: true,
          },
        },
      },
    });

    // Create notification for target user
    const fromUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, displayName: true },
    });

    const senderName = fromUser?.displayName || fromUser?.username || 'Someone';
    const tcLabel = `${Math.floor(Number(timeControl) / 60)}+${Number(increment) || 0}`;

    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: 'challenge',
        title: 'New Challenge',
        message: `${senderName} challenged you to a ${tcLabel} ${rated !== false ? 'rated' : 'casual'} game`,
        relatedId: challenge.id,
        link: '/challenge',
      },
    });

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
