import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ADMIN_EMAIL = "mix.maketing.bc@gmail.com";

function assertAdmin(claims: any) {
  if (claims?.email !== ADMIN_EMAIL) {
    throw new Response("Forbidden", { status: 403 });
  }
}

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertAdmin(context.claims);
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw new Response(error.message, { status: 500 });
    const { data: licenses } = await supabaseAdmin.from("licenses").select("*");
    return {
      users: data.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
      })),
      licenses: licenses ?? [],
    };
  });

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; password: string }) => d)
  .handler(async ({ data, context }) => {
    assertAdmin(context.claims);
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true };
  });

export const adminUpsertLicense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string;
      user_id: string;
      plan: "monthly" | "annual" | "lifetime";
      expires_at: string;
      active: boolean;
    }) => d
  )
  .handler(async ({ data, context }) => {
    assertAdmin(context.claims);
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("licenses")
        .update({
          user_id: data.user_id,
          plan: data.plan,
          expires_at: data.expires_at,
          active: data.active,
        })
        .eq("id", data.id);
      if (error) throw new Response(error.message, { status: 400 });
    } else {
      const { error } = await supabaseAdmin.from("licenses").upsert(
        {
          user_id: data.user_id,
          plan: data.plan,
          expires_at: data.expires_at,
          active: data.active,
        },
        { onConflict: "user_id" }
      );
      if (error) throw new Response(error.message, { status: 400 });
    }
    return { ok: true };
  });

export const adminToggleLicense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; active: boolean }) => d)
  .handler(async ({ data, context }) => {
    assertAdmin(context.claims);
    const { error } = await supabaseAdmin
      .from("licenses")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true };
  });
