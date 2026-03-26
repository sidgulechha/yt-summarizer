import { betterAuth } from "better-auth";
import { createAdapterFactory, type CustomAdapter } from "better-auth/adapters";
import { supabaseAdmin } from "./supabase";

// ── helpers ──────────────────────────────────────────────────────────────────

const TABLE_MAP: Record<string, string> = {
  user: "users",
  session: "sessions",
  account: "accounts",
  verification: "verifications",
};

const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

function snakeObj(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [toSnake(k), v])
  );
}

function camelObj(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [toCamel(k), v])
  );
}

type Where = { field: string; value: unknown; operator?: string; connector?: string };

function applyWhere(
  query: ReturnType<typeof supabaseAdmin.from>,
  where: Where[]
) {
  let q = query as ReturnType<typeof supabaseAdmin.from>;
  for (const { field, value, operator = "eq" } of where) {
    const col = toSnake(field);
    switch (operator) {
      case "eq":          q = (q as any).eq(col, value);                          break;
      case "ne":          q = (q as any).neq(col, value);                         break;
      case "lt":          q = (q as any).lt(col, value);                          break;
      case "lte":         q = (q as any).lte(col, value);                         break;
      case "gt":          q = (q as any).gt(col, value);                          break;
      case "gte":         q = (q as any).gte(col, value);                         break;
      case "in":          q = (q as any).in(col, value as unknown[]);             break;
      case "not_in":      q = (q as any).not(col, "in", `(${(value as unknown[]).join(",")})`); break;
      case "contains":    q = (q as any).ilike(col, `%${value}%`);               break;
      case "starts_with": q = (q as any).ilike(col, `${value}%`);                break;
      case "ends_with":   q = (q as any).ilike(col, `%${value}`);                break;
      default:            q = (q as any).eq(col, value);
    }
  }
  return q;
}

// ── adapter ──────────────────────────────────────────────────────────────────

const supabaseCustomAdapter: CustomAdapter = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async create<T extends Record<string, any>>({ model, data, select }: { model: string; data: T; select?: string[] }) {
    const table = TABLE_MAP[model] ?? model;
    const insertData = snakeObj(data as Record<string, unknown>);
    const cols = select?.length ? select.map(toSnake).join(", ") : "*";
    const { data: row, error } = await supabaseAdmin
      .from(table)
      .insert(insertData)
      .select(cols)
      .single();
    if (error) throw new Error(`DB create error (${table}): ${error.message}`);
    return camelObj(row as unknown as Record<string, unknown>) as unknown as T;
  },

  async findOne({ model, where, select }) {
    const table = TABLE_MAP[model] ?? model;
    const cols = select?.length ? select.map(toSnake).join(", ") : "*";
    let q = supabaseAdmin.from(table).select(cols);
    q = applyWhere(q as any, where ?? []) as any;
    const { data: row, error } = await (q as any).limit(1).maybeSingle();
    if (error) throw new Error(`DB findOne error (${table}): ${error.message}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return row ? (camelObj(row as unknown as Record<string, unknown>) as any) : null;
  },

  async findMany({ model, where, select, limit, offset, sortBy }) {
    const table = TABLE_MAP[model] ?? model;
    const cols = select?.length ? select.map(toSnake).join(", ") : "*";
    let q = supabaseAdmin.from(table).select(cols);
    if (where?.length) q = applyWhere(q as any, where) as any;
    if (sortBy) (q as any).order(toSnake(sortBy.field), { ascending: sortBy.direction === "asc" });
    if (limit  != null) (q as any).limit(limit);
    if (offset != null) (q as any).range(offset, offset + (limit ?? 100) - 1);
    const { data: rows, error } = await q;
    if (error) throw new Error(`DB findMany error (${table}): ${error.message}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((rows ?? []) as unknown as Record<string, unknown>[]).map(camelObj) as any;
  },

  async update({ model, where, update }) {
    const table = TABLE_MAP[model] ?? model;
    let q = supabaseAdmin.from(table).update(snakeObj(update as Record<string, unknown>));
    q = applyWhere(q as any, where ?? []) as any;
    const { data: row, error } = await (q as any).select().maybeSingle();
    if (error) throw new Error(`DB update error (${table}): ${error.message}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return row ? (camelObj(row as unknown as Record<string, unknown>) as any) : null;
  },

  async updateMany({ model, where, update }) {
    const table = TABLE_MAP[model] ?? model;
    let q = supabaseAdmin.from(table).update(snakeObj(update as Record<string, unknown>));
    q = applyWhere(q as any, where ?? []) as any;
    const { error, count } = await (q as any);
    if (error) throw new Error(`DB updateMany error (${table}): ${error.message}`);
    return count ?? 0;
  },

  async delete({ model, where }) {
    const table = TABLE_MAP[model] ?? model;
    let q = supabaseAdmin.from(table).delete();
    q = applyWhere(q as any, where ?? []) as any;
    const { error } = await q;
    if (error) throw new Error(`DB delete error (${table}): ${error.message}`);
  },

  async deleteMany({ model, where }) {
    const table = TABLE_MAP[model] ?? model;
    let q = supabaseAdmin.from(table).delete();
    q = applyWhere(q as any, where ?? []) as any;
    const { error, count } = await (q as any);
    if (error) throw new Error(`DB deleteMany error (${table}): ${error.message}`);
    return count ?? 0;
  },

  async count({ model, where }) {
    const table = TABLE_MAP[model] ?? model;
    let q = supabaseAdmin.from(table).select("*", { count: "exact", head: true });
    if (where?.length) q = applyWhere(q as any, where) as any;
    const { count, error } = await q;
    if (error) throw new Error(`DB count error (${table}): ${error.message}`);
    return count ?? 0;
  },
};

const adapterFactory = createAdapterFactory({
  adapter: () => supabaseCustomAdapter,
  config: {
    adapterId: "supabase",
    supportsJSON: true,
    supportsDates: true,
    supportsBooleans: true,
  },
});

// ── auth instance ─────────────────────────────────────────────────────────────

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET!,
  database: adapterFactory as Parameters<typeof betterAuth>[0]["database"],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});

export type Session = typeof auth.$Infer.Session;
