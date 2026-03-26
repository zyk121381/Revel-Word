'use server';

import { prisma } from '@/lib/db';
import { encrypt, getSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function checkDbConfigured() {
  return !!process.env.DATABASE_URL;
}

export async function getSessionData() {
  return await getSession();
}

export async function login(username: string, password: string) {
  if (!prisma) throw new Error('Database not configured');
  
  // Check for built-in admin
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const session = await encrypt({ id: 'admin', username, role: 'ADMIN', avatarUrl: null });
    const cookieStore = await cookies();
    cookieStore.set('session', session, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7 });
    return { success: true, role: 'ADMIN' };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new Error('Invalid credentials');

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error('Invalid credentials');

  const session = await encrypt({ id: user.id, username: user.username, role: user.role, avatarUrl: user.avatarUrl });
  const cookieStore = await cookies();
  cookieStore.set('session', session, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7 });
  return { success: true, role: user.role, avatarUrl: user.avatarUrl };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

// Admin Actions
export async function getUsers() {
  if (!prisma) return [];
  const session = await getSessionData();
  if (session?.role !== 'ADMIN') throw new Error('Unauthorized');
  return await prisma.user.findMany({ select: { id: true, username: true, role: true, avatarUrl: true, createdAt: true } });
}

export async function createUser(username: string, password: string, avatarUrl?: string) {
  if (!prisma) throw new Error('Database not configured');
  const session = await getSessionData();
  if (session?.role !== 'ADMIN') throw new Error('Unauthorized');
  
  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { username, password: hashedPassword, avatarUrl }
  });
}

export async function updateUser(id: string, data: { username?: string; password?: string; avatarUrl?: string }) {
  if (!prisma) throw new Error('Database not configured');
  const session = await getSessionData();
  if (session?.role !== 'ADMIN') throw new Error('Unauthorized');

  const updateData: any = { ...data };
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  await prisma.user.update({
    where: { id },
    data: updateData
  });
}

export async function deleteUser(id: string) {
  if (!prisma) throw new Error('Database not configured');
  const session = await getSessionData();
  if (session?.role !== 'ADMIN') throw new Error('Unauthorized');
  await prisma.user.delete({ where: { id } });
}

// Category Actions
export async function getCategories() {
  if (!prisma) return [];
  return await prisma.category.findMany({
    include: {
      children: true,
      units: {
        include: {
          _count: { select: { words: true } }
        }
      }
    }
  });
}

export async function createCategory(name: string, parentId?: string | null) {
  if (!prisma) throw new Error('Database not configured');
  const session = await getSessionData();
  if (session?.role !== 'ADMIN') throw new Error('Unauthorized');

  await prisma.category.create({
    data: { name, parentId }
  });
}

export async function updateCategory(id: string, name: string, parentId?: string | null) {
  if (!prisma) throw new Error('Database not configured');
  const session = await getSessionData();
  if (session?.role !== 'ADMIN') throw new Error('Unauthorized');

  await prisma.category.update({
    where: { id },
    data: { name, parentId }
  });
}

export async function deleteCategory(id: string) {
  if (!prisma) throw new Error('Database not configured');
  const session = await getSessionData();
  if (session?.role !== 'ADMIN') throw new Error('Unauthorized');
  await prisma.category.delete({ where: { id } });
}

// Unit Actions
export async function createUnit(name: string, wordsData: any[], categoryId?: string | null) {
  if (!prisma) throw new Error('Database not configured');
  const session = await getSessionData();
  if (session?.role !== 'ADMIN') throw new Error('Unauthorized');

  await prisma.wordUnit.create({
    data: {
      name,
      categoryId,
      words: {
        create: wordsData.map(w => ({
          word: w.word,
          data: w
        }))
      }
    }
  });
}

export async function updateUnit(id: string, name: string, categoryId?: string | null) {
  if (!prisma) throw new Error('Database not configured');
  const session = await getSessionData();
  if (session?.role !== 'ADMIN') throw new Error('Unauthorized');

  await prisma.wordUnit.update({
    where: { id },
    data: { name, categoryId }
  });
}

export async function updateWord(id: string, data: any) {
  if (!prisma) return;
  const session = await getSessionData();
  if (!session || session.role !== 'ADMIN') return;
  await prisma.word.update({
    where: { id },
    data: { 
      word: data.word,
      data 
    }
  });
}

export async function deleteWord(id: string) {
  if (!prisma) return;
  const session = await getSessionData();
  if (!session || session.role !== 'ADMIN') return;
  await prisma.word.delete({
    where: { id }
  });
}

export async function addWordToUnit(unitId: string, wordData: any) {
  if (!prisma) return;
  const session = await getSessionData();
  if (!session || session.role !== 'ADMIN') return;
  await prisma.word.create({
    data: {
      unitId,
      word: wordData.word,
      data: wordData
    }
  });
}

export async function getUnits() {
  if (!prisma) return [];
  const units = await prisma.wordUnit.findMany({
    include: {
      _count: { select: { words: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  return units;
}

export async function deleteUnit(id: string) {
  if (!prisma) throw new Error('Database not configured');
  const session = await getSessionData();
  if (session?.role !== 'ADMIN') throw new Error('Unauthorized');
  await prisma.wordUnit.delete({ where: { id } });
}

// User Actions
export async function saveProgress(unitId: string | null, data: any, isReview: boolean) {
  if (!prisma) return;
  const session = await getSessionData();
  if (!session || session.id === 'admin') return; // Admin doesn't save progress

  const existing = await prisma.progress.findFirst({
    where: { userId: session.id, unitId, isReview }
  });

  if (existing) {
    await prisma.progress.update({
      where: { id: existing.id },
      data: { data }
    });
  } else {
    await prisma.progress.create({
      data: {
        userId: session.id,
        unitId,
        data,
        isReview
      }
    });
  }
}

export async function getProgress(unitId: string | null, isReview: boolean) {
  if (!prisma) return null;
  const session = await getSessionData();
  if (!session || session.id === 'admin') return null;

  const progress = await prisma.progress.findFirst({
    where: { userId: session.id, unitId, isReview }
  });
  return progress?.data || null;
}

export async function deleteProgress(unitId: string | null, isReview: boolean) {
  if (!prisma) return;
  const session = await getSessionData();
  if (!session || session.id === 'admin') return;
  
  await prisma.progress.deleteMany({
    where: { userId: session.id, unitId, isReview }
  });
}

export async function getReviewWords(unitIds: string[], count: number) {
  if (!prisma) return [];
  
  const words = await prisma.word.findMany({
    where: {
      unitId: { in: unitIds }
    }
  });

  // Shuffle and pick
  const shuffled = words.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((w: any) => ({ id: w.id, ...w.data }));
}

export async function getUnitWords(unitId: string) {
  if (!prisma) return [];
  const words = await prisma.word.findMany({
    where: { unitId }
  });
  return words.map((w: any) => ({ id: w.id, ...w.data }));
}

// Session Tracking Actions
export async function startSession(unitId: string | null, isReview: boolean, context?: any) {
  if (!prisma) return null;
  const session = await getSessionData();
  if (!session || session.id === 'admin') return null;

  const practiceSession = await prisma.practiceSession.create({
    data: {
      userId: session.id,
      unitId,
      isReview,
      status: 'IN_PROGRESS',
      events: [{ type: 'START', time: new Date().toISOString() }],
      context: context || null
    }
  });
  return practiceSession.id;
}

export async function pauseSession(sessionId: string, stats?: any, wordStats?: any) {
  if (!prisma) return;
  const session = await getSessionData();
  if (!session || session.id === 'admin') return;

  const practiceSession = await prisma.practiceSession.findUnique({ where: { id: sessionId } });
  if (!practiceSession || practiceSession.userId !== session.id) return;

  const events: any[] = Array.isArray(practiceSession.events) ? practiceSession.events : [];
  events.push({ type: 'PAUSE', time: new Date().toISOString() });

  const dataToUpdate: any = { events, status: 'PAUSED' };
  if (stats) dataToUpdate.stats = stats;
  if (wordStats) dataToUpdate.wordStats = wordStats;

  await prisma.practiceSession.update({
    where: { id: sessionId },
    data: dataToUpdate
  });
}

export async function resumeSession(sessionId: string) {
  if (!prisma) return;
  const session = await getSessionData();
  if (!session || session.id === 'admin') return;

  const practiceSession = await prisma.practiceSession.findUnique({ where: { id: sessionId } });
  if (!practiceSession || practiceSession.userId !== session.id) return;

  const events: any[] = Array.isArray(practiceSession.events) ? practiceSession.events : [];
  events.push({ type: 'RESUME', time: new Date().toISOString() });

  await prisma.practiceSession.update({
    where: { id: sessionId },
    data: { events, status: 'IN_PROGRESS' }
  });
}

export async function endSession(sessionId: string, stats: any, wordStats: any) {
  if (!prisma) return;
  const session = await getSessionData();
  if (!session || session.id === 'admin') return;

  const practiceSession = await prisma.practiceSession.findUnique({ where: { id: sessionId } });
  if (!practiceSession || practiceSession.userId !== session.id) return;

  const events: any[] = Array.isArray(practiceSession.events) ? practiceSession.events : [];
  events.push({ type: 'END', time: new Date().toISOString() });

  await prisma.practiceSession.update({
    where: { id: sessionId },
    data: { 
      events, 
      status: 'COMPLETED',
      endTime: new Date(),
      stats,
      wordStats
    }
  });
}

export async function getUserSessions(userId: string) {
  if (!prisma) return [];
  const session = await getSessionData();
  if (session?.role !== 'ADMIN') throw new Error('Unauthorized');

  return await prisma.practiceSession.findMany({
    where: { userId },
    include: {
      unit: { select: { name: true, categoryId: true, category: { select: { name: true } } } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getMySessions() {
  if (!prisma) return [];
  const session = await getSessionData();
  if (!session) throw new Error('Unauthorized');

  return await prisma.practiceSession.findMany({
    where: { userId: session.id },
    include: {
      unit: { select: { name: true, categoryId: true, category: { select: { name: true } } } }
    },
    orderBy: { createdAt: 'desc' }
  });
}
