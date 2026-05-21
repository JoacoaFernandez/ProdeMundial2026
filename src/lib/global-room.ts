import { db } from './db'

export const GLOBAL_ROOM_CODE = 'GLOBAL'

// Joins a user to the global room if they're not already a member.
// Creates the room first if it doesn't exist (owned by first admin found).
export async function joinGlobalRoom(userId: string): Promise<void> {
  const room = await db.room.findUnique({ where: { code: GLOBAL_ROOM_CODE } })
  if (!room) return // Room not created yet by admin

  const existing = await db.roomMember.findUnique({
    where: { userId_roomId: { userId, roomId: room.id } },
  })
  if (existing) return

  await db.roomMember.create({
    data: { userId, roomId: room.id, status: 'APPROVED' },
  })
}

// Creates the global room and enrolls all existing users.
// Safe to call multiple times (idempotent).
export async function syncGlobalRoom(adminUserId: string): Promise<{ created: boolean; enrolled: number }> {
  let room = await db.room.findUnique({ where: { code: GLOBAL_ROOM_CODE } })

  let created = false
  if (!room) {
    room = await db.room.create({
      data: {
        name: 'Mundial 2026 — Global',
        code: GLOBAL_ROOM_CODE,
        ownerId: adminUserId,
        isPublic: true,
        requireApproval: false,
        maxMembers: null,
      },
    })
    created = true
  }

  // Enroll all users not yet in the room
  const existing = await db.roomMember.findMany({
    where: { roomId: room.id },
    select: { userId: true },
  })
  const enrolledIds = new Set(existing.map((m) => m.userId))

  const allUsers = await db.user.findMany({
    where: { emailVerified: { not: null } },
    select: { id: true },
  })

  const toEnroll = allUsers.filter((u) => !enrolledIds.has(u.id))

  if (toEnroll.length > 0) {
    await db.roomMember.createMany({
      data: toEnroll.map((u) => ({
        userId: u.id,
        roomId: room!.id,
        status: 'APPROVED',
      })),
      skipDuplicates: true,
    })
  }

  return { created, enrolled: toEnroll.length }
}
