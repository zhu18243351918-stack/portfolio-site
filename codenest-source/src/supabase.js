import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cnlfvmxwohyvksbbtplw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_F0fVceX3BXHBsCQLZZIVyg_76vniL75";
const CONTENT_TABLE = "portfolio_content";
const CONTENT_ID = "main";
const ASSET_BUCKET = "portfolio-assets";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function fetchRemoteContent() {
  const { data, error } = await supabase
    .from(CONTENT_TABLE)
    .select("content")
    .eq("id", CONTENT_ID)
    .maybeSingle();

  if (error) throw error;
  return data?.content || null;
}

export async function saveRemoteContent(content) {
  const { error } = await supabase.from(CONTENT_TABLE).upsert({
    id: CONTENT_ID,
    content,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function getAdminSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function subscribeAdminSession(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function signInAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

function extensionForType(type) {
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  if (type === "image/gif") return "gif";
  if (type === "image/avif") return "avif";
  if (type === "image/svg+xml") return "svg";
  return "webp";
}

export async function uploadPortfolioImage(source, area = "content") {
  const blob =
    typeof source === "string"
      ? await fetch(source).then((response) => response.blob())
      : source;
  const extension = extensionForType(blob.type);
  const filename = `${area}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(ASSET_BUCKET).upload(filename, blob, {
    cacheControl: "31536000",
    contentType: blob.type,
    upsert: false,
  });

  if (error) throw error;
  const { data } = supabase.storage.from(ASSET_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}
