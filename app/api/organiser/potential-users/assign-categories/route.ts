import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { AWARD_CATEGORIES } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const guard = async () => {
  const session = await getSessionUser();
  return session && session.role === "organiser" ? session : null;
};

const ALL_CATEGORY_NAMES = AWARD_CATEGORIES.flatMap((group) => [
  ...group.popular,
  ...group.prime,
  ...group.more,
]);

export async function POST(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const ids = Array.isArray(body?.recipientIds)
    ? Array.from(
        new Set(
          body.recipientIds
            .map((id: unknown) => Number(id))
            .filter((id: number) => Number.isInteger(id)),
        ),
      )
    : [];
  const categories: string[] = Array.isArray(body?.categories)
    ? Array.from(
        new Set(
          body.categories
            .filter((cat: unknown): cat is string => typeof cat === "string")
            .map((cat: string) => cat.trim())
            .filter(Boolean),
        ),
      )
    : [];

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "Select at least one recipient." },
      { status: 400 },
    );
  }

  const validCategories = categories.filter((cat) =>
    ALL_CATEGORY_NAMES.includes(cat),
  );
  if (validCategories.length < 2) {
    return NextResponse.json(
      {
        error: "Choose at least two valid award categories to assign randomly.",
      },
      { status: 400 },
    );
  }

  const assignedArrays = ids.map(() => {
    const source = [...validCategories];
    const result: string[] = [];
    const count = Math.min(4, Math.max(2, Math.floor(Math.random() * 3) + 2));
    while (result.length < count && source.length > 0) {
      const index = Math.floor(Math.random() * source.length);
      result.push(source.splice(index, 1)[0]);
    }
    return JSON.stringify(result);
  });

  await query(
    `UPDATE potential_users AS p
       SET assigned_categories = x.assigned_categories::jsonb
       FROM unnest($1::int[], $2::text[]) AS x(id, assigned_categories)
       WHERE p.id = x.id AND p.deleted_at IS NULL`,
    [ids, assignedArrays],
  );

  return NextResponse.json({ ok: true, updated: ids.length });
}
