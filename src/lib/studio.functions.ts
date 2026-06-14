import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getBookedSlots = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(input),
  )
  .handler(async ({ data }) => {
    // Anon client — bookings has no public SELECT policy, only admin reads.
    // We expose only the taken time_slot strings (not any PII) so the UI
    // can disable those slots. Use the service role to read.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("bookings")
      .select("time_slot")
      .eq("booking_date", data.date)
      .not("status", "eq", "cancelled");
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => r.time_slot);
  });
