"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Records the count a notification was dismissed at, not just that it was
// dismissed — getNotifications only suppresses it while the count stays
// the same, so a fresh instance of the same issue reappears. RLS scopes
// this to the calling user's own row regardless of what userId claims.
export async function dismissNotification(notificationId: string, count: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("notification_dismissals").upsert(
    {
      user_id: user.id,
      notification_id: notificationId,
      dismissed_count: count,
      dismissed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,notification_id" }
  );

  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
