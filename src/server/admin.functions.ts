import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ADMIN_EMAIL = "mix.maketing.bc@gmail.com";

async function assertAdmin(token: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new Response("Unauthorized", { status: 401 });
  if (data.user.email !== ADMIN_EMAIL) throw new Response("Forbidden", { status: 403 });
}

export const adminListUsers = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw new Response(error.message, { status: 500 });
    const { data: licenses } = await supabaseAdmin.from("licenses").select("*");
    return {
      users: list.users.map((u) => ({ id: u.id, email: u.email, created_at: u.created_at })),
      licenses: licenses ?? [],
    };
  });

export const adminCreateUser = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; email: string; password: string }) => d)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true,
    });
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true };
  });

export const adminUpsertLicense = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      token: string;
      id?: string;
      user_id: string;
      plan: "monthly" | "annual" | "lifetime";
      expires_at: string;
      active: boolean;
    }) => d
  )
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    const payload = {
      user_id: data.user_id,
      plan: data.plan,
      expires_at: data.expires_at,
      active: data.active,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("licenses").update(payload).eq("id", data.id);
      if (error) throw new Response(error.message, { status: 400 });
    } else {
      const { error } = await supabaseAdmin.from("licenses").upsert(payload, { onConflict: "user_id" });
      if (error) throw new Response(error.message, { status: 400 });
    }
    return { ok: true };
  });

export const adminToggleLicense = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: string; active: boolean }) => d)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    const { error } = await supabaseAdmin
      .from("licenses")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true };
  });

export const adminListTeams = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    const { data: teams, error } = await supabaseAdmin
      .from("teams")
      .select("*")
      .order("name");
    if (error) throw new Response(error.message, { status: 500 });
    return { teams: teams ?? [] };
  });

export const adminCreateTeam = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; name: string }) => d)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    const { error } = await supabaseAdmin.from("teams").insert({ name: data.name.trim() });
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true };
  });

export const adminUpdateTeam = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: string; name: string }) => d)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    const { error } = await supabaseAdmin
      .from("teams")
      .update({ name: data.name.trim() })
      .eq("id", data.id);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true };
  });

export const adminDeleteTeam = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: string }) => d)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    const { error } = await supabaseAdmin.from("teams").delete().eq("id", data.id);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true };
  });
