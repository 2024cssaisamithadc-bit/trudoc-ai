import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xivhsuhzpugjiqnfublk.supabase.co";

const supabaseAnonKey = "sb_publishable_xyAW3CYOVNcsyUUEfllSfQ_eSGIdLDq";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);