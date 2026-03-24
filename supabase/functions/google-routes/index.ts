// @ts-nocheck
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type TravelMode = 'TRANSIT' | 'DRIVE' | 'WALK';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: corsHeaders });
  }

  const googleRoutesApiKey = Deno.env.get('GOOGLE_ROUTES_API_KEY')?.trim();
  if (!googleRoutesApiKey) {
    return Response.json(
      { error: 'GOOGLE_ROUTES_API_KEY is not configured in Supabase Edge Functions.' },
      { status: 500, headers: corsHeaders },
    );
  }

  try {
    const payload = await req.json();
    const from = String(payload?.from ?? '').trim();
    const to = String(payload?.to ?? '').trim();
    const travelMode = String(payload?.travelMode ?? '').trim() as TravelMode;
    const options = payload?.options ?? {};
    const fieldMask = String(payload?.fieldMask ?? '').trim();

    if (!from || !to || !fieldMask) {
      return Response.json(
        { error: 'Missing from, to, or fieldMask.' },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!['TRANSIT', 'DRIVE', 'WALK'].includes(travelMode)) {
      return Response.json(
        { error: 'Invalid travelMode.' },
        { status: 400, headers: corsHeaders },
      );
    }

    const body: Record<string, unknown> = {
      origin: { address: from },
      destination: { address: to },
      travelMode,
      languageCode: 'en',
      units: 'METRIC',
    };

    if (options?.computeAlternativeRoutes) {
      body.computeAlternativeRoutes = true;
    }

    if (travelMode === 'TRANSIT' && options?.transitRoutingPreference) {
      body.transitPreferences = {
        routingPreference: options.transitRoutingPreference,
      };
    }

    const googleResponse = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleRoutesApiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(body),
    });

    const text = await googleResponse.text();

    return new Response(text, {
      status: googleResponse.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected routes proxy error.';
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
