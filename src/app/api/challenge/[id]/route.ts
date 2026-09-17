import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // 'accept' | 'decline' | 'cancel'

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        from: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        to: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    if (challenge.status !== 'pending') {
      return NextResponse.json(
        { error: 'Challenge is no longer pending' },
        { status: 400 }
      );
    }

    if (new Date() > challenge.expiresAt) {
      await prisma.challenge.update({
        where: { id },
        data: { status: 'expired' },
      });
      return NextResponse.json(
        { error: 'Challenge has expired' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'accept': {
        // Only the recipient can accept
        if (userId !== challenge.toId) {
          return NextResponse.json(
            { error: 'Only the recipient can accept' },
            { status: 403 }
          );
        }

        // Generate a game ID for the socket server to use
        const chars =
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let gameId = '';
        for (let i = 0; i < 8; i++)
          gameId += chars.charAt(Math.floor(Math.random() * chars.length));

        await prisma.challenge.update({
          where: { id },
          data: { status: 'accepted', gameId },
        });

        // Create notification for the sender
        const acceptorName =
          challenge.to.displayName || challenge.to.username || 'Your opponent';

        await prisma.notification.create({
          data: {
            userId: challenge.fromId,
            type: 'challenge',
            title: 'Challenge Accepted',
            message: `${acceptorName} accepted your challenge!`,
            relatedId: gameId,
            link: `/game/${gameId}`,
          },
        });

        return NextResponse.json({
          status: 'accepted',
          gameId,
          challenge: {
            ...challenge,
            status: 'accepted',
            gameId,
          },
        });
      }

      case 'decline': {
        if (userId !== challenge.toId) {
          return NextResponse.json(
            { error: 'Only the recipient can decline' },
            { status: 403 }
          );
        }

        await prisma.challenge.update({
          where: { id },
          data: { status: 'rejected' },
        });

        // Notify the sender
        const declinerName =
          challenge.to.displayName || challenge.to.username || 'Your opponent';

        await prisma.notification.create({
          data: {
            userId: challenge.fromId,
            type: 'challenge',
            title: 'Challenge Declined',
            message: `${declinerName} declined your challenge`,
            relatedId: id,
            link: '/challenge',
          },
        });

        return NextResponse.json({ status: 'declined' });
      }

      case 'cancel': {
        if (userId !== challenge.fromId) {
          return NextResponse.json(
            { error: 'Only the sender can cancel' },
            { status: 403 }
          );
        }

        await prisma.challenge.update({
          where: { id },
          data: { status: 'cancelled' },
        });

        return NextResponse.json({ status: 'cancelled' });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
