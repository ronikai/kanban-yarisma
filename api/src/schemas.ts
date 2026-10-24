import { z } from 'zod';

export const titleSchema = z
  .string({ required_error: 'title zorunlu' })
  .trim()
  .min(1, 'title zorunlu')
  .max(500, 'title en fazla 500 karakter');

const optionalText = z
  .string()
  .trim()
  .max(20000, 'metin çok uzun')
  .nullable()
  .optional();

export const dueDateSchema = z
  .union([
    z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), 'geçersiz tarih'),
    z.null(),
  ])
  .optional();

export const createColumnSchema = z.object({
  title: titleSchema,
});

export const updateColumnSchema = z.object({
  title: titleSchema.optional(),
  order: z.number().int('order tam sayı olmalı').min(0, 'order negatif olamaz').optional(),
});

export const createCardSchema = z.object({
  columnId: z.string({ required_error: 'columnId zorunlu' }).trim().min(1, 'columnId zorunlu'),
  title: titleSchema,
  description: optionalText,
  label: optionalText,
  dueDate: dueDateSchema,
});

export const updateCardSchema = z.object({
  title: titleSchema.optional(),
  description: optionalText,
  label: optionalText,
  dueDate: dueDateSchema,
});

export const moveCardSchema = z.object({
  toColumnId: z
    .string({ required_error: 'toColumnId zorunlu' })
    .trim()
    .min(1, 'toColumnId zorunlu'),
  toIndex: z
    .number({ required_error: 'toIndex zorunlu' })
    .int('toIndex tam sayı olmalı')
    .min(0, 'toIndex negatif olamaz'),
});

const importCardSchema = z.object({
  id: z.string().min(1, 'kart id zorunlu'),
  title: titleSchema,
  description: optionalText,
  label: optionalText,
  dueDate: dueDateSchema,
  order: z.number().int().optional(),
});

const importColumnSchema = z.object({
  id: z.string().min(1, 'kolon id zorunlu'),
  title: titleSchema,
  order: z.number().int().optional(),
  cards: z.array(importCardSchema),
});

export const importSchema = z.object({
  board: z.object({
    columns: z.array(importColumnSchema),
  }),
});
