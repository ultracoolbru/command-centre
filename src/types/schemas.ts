import { z } from 'zod';

// Base schemas
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const DailyPlanSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.date(),
  priority1: z.string().optional(),
  priority2: z.string().optional(),
  priority3: z.string().optional(),
  morningNotes: z.string().optional(),
  accomplishments: z.string().optional(),
  challenges: z.string().optional(),
  tomorrowFocus: z.string().optional(),
  reflectionNotes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const TaskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high']),
  tags: z.array(z.string()).default([]),
  goalId: z.string().optional(),
  dueDate: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const GoalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  status: z.enum(['planning', 'in-progress', 'review', 'completed']).default('planning'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const HealthLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.date(),
  mood: z.number().min(1).max(10).optional(),
  energy: z.number().min(1).max(10).optional(),
  pain: z.number().min(1).max(10).optional(),
  sleep: z.number().min(0).max(24).optional(),
  weight: z.number().optional(),
  nutrition: z.array(z.string()).default([]),
  supplements: z.array(z.string()).default([]),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const JournalEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.date(),
  title: z.string(),
  content: z.string(),
  mood: z.enum(['positive', 'neutral', 'negative']).default('neutral'),
  tags: z.array(z.string()).default([]),
  sentiment: z.object({
    score: z.number().min(-1).max(1).optional(),
    label: z.string().optional(),
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const VioltPhaseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  status: z.enum(['planning', 'in-progress', 'review', 'completed']).default('planning'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const VioltTaskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  phaseId: z.string(),
  status: z.enum(['todo', 'in-progress', 'review', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const BulletEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.date(),
  type: z.enum(['task', 'event', 'note']),
  content: z.string(),
  completed: z.boolean().optional(),
  collectionId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CollectionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const EchoTaskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  command: z.string(),
  output: z.string(),
  timestamp: z.date(),
  status: z.enum(['success', 'error', 'pending']).default('pending'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ReminderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  date: z.date(),
  time: z.string(),
  method: z.enum(['telegram', 'email', 'both']).default('telegram'),
  repeat: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
  active: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const AIInsightSchema = z.object({
  id: z.string(),
  userId: z.string(),
  category: z.string(),
  title: z.string(),
  description: z.string(),
  date: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Types derived from schemas
export type User = z.infer<typeof UserSchema>;
export type DailyPlan = z.infer<typeof DailyPlanSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type HealthLog = z.infer<typeof HealthLogSchema>;
export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type VioltPhase = z.infer<typeof VioltPhaseSchema>;
export type VioltTask = z.infer<typeof VioltTaskSchema>;
export type BulletEntry = z.infer<typeof BulletEntrySchema>;
export type Collection = z.infer<typeof CollectionSchema>;
export type EchoTask = z.infer<typeof EchoTaskSchema>;
export type Reminder = z.infer<typeof ReminderSchema>;
export type AIInsight = z.infer<typeof AIInsightSchema>;
