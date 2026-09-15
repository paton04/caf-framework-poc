"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dismissNotification } from "@/app/actions/notifications";
import type { Notification } from "@/lib/caf-data/types";

export function NotificationStrip({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDismiss(n: Notification) {
    startTransition(async () => {
      await dismissNotification(n.id, n.count);
      router.refresh();
    });
  }

  return (
    <div className="notification-strip">
      {notifications.map((n) => (
        <div className="notification-item" key={n.id}>
          <Link href={n.href}>{n.message}</Link>
          <button
            type="button"
            className="notification-dismiss"
            disabled={isPending}
            onClick={() => handleDismiss(n)}
          >
            Acknowledge
          </button>
        </div>
      ))}
    </div>
  );
}
