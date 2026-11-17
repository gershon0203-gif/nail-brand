// create-order Edge Function
// ---------------------------------------------------------------------------
// Thin, authenticated entry point for order placement. It verifies the caller's
// JWT and delegates all business logic (trusted price calculation, stock
// validation, snapshotting, stock decrement and cart clearing) to the atomic
// SECURITY DEFINER database function `create_order_from_cart`.
//
// No price or total from the browser is trusted. No service-role key is used.
// Future Razorpay/Shiprocket calls should be added as SEPARATE functions so
// this COD flow stays unchanged.
// ---------------------------------------------------------------------------

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeadersFor } from '../_shared/cors.ts';

const json = (body: unknown, status = 200, req?: Request) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...(req ? corsHeadersFor(req) : {}), 'Content-Type': 'application/json' },
  });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeadersFor(req) });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405, req);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const authHeader = req.headers.get('Authorization');

    if (!supabaseUrl || !anonKey) {
      return json({ error: 'Server is missing Supabase configuration.' }, 500, req);
    }
    if (!authHeader) {
      return json({ error: 'Missing authorization header.' }, 401, req);
    }

    // Forward the caller's JWT so auth.uid() resolves inside the RPC.
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return json({ error: 'Invalid or expired session.' }, 401, req);
    }

    let body: { address_id?: string; payment_method?: string; notes?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid request body.' }, 400, req);
    }

    if (!body.address_id) {
      return json({ error: 'A delivery address is required.' }, 400, req);
    }
    if ((body.payment_method ?? 'cod') !== 'cod') {
      return json({ error: 'Only Cash on Delivery is available in this phase.' }, 400, req);
    }

    const { data, error } = await supabase.rpc('create_order_from_cart', {
      p_address_id: body.address_id,
      p_payment_method: 'cod',
      p_notes: body.notes ?? null,
    });

    if (error) {
      return json({ error: error.message }, 400, req);
    }

    return json({
      orderId: data?.orderId ?? data?.order_id ?? null,
      orderNumber: data?.orderNumber ?? data?.order_number ?? null,
    }, 200, req);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error.';
    return json({ error: message }, 500, req);
  }
});
