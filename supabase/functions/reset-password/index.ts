// Edge Function: reset-password
//
// Hanya Pemilik yang boleh mereset password Admin/Teknisi yang lupa
// password-nya. Ini HARUS jadi Edge Function (bukan kode di app) karena
// aksi ini butuh service_role key, yang tidak boleh ada di bundle mobile.
//
// Cara deploy: Supabase Dashboard -> Edge Functions -> Create a new function
// -> nama "reset-password" -> paste isi file ini -> Deploy.
// SUPABASE_URL, SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_ROLE_KEY otomatis
// tersedia sebagai env var di Edge Function, tidak perlu diset manual.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Client yang mewarisi sesi si pemanggil, dipakai untuk memverifikasi
  // identitas & role-nya lewat RLS yang sudah ada (bukan bypass RLS).
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Sesi tidak valid" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: profile, error: profileError } = await callerClient
    .from("users")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile || profile.role !== "pemilik") {
    return new Response(
      JSON.stringify({ error: "Hanya Pemilik yang boleh reset password" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { targetUserId?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body request tidak valid" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { targetUserId, newPassword } = body;
  if (!targetUserId || !newPassword || newPassword.length < 6) {
    return new Response(JSON.stringify({ error: "Input tidak valid" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Client dengan service_role -- HANYA dipakai di sini, tidak pernah
  // dikirim ke client/app manapun.
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    targetUserId,
    { password: newPassword }
  );

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
