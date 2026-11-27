export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { email, turnstileToken, redirectTo } = await request.json();

    if (!email || !turnstileToken) {
      return new Response(JSON.stringify({ error: 'Missing email or security token.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Server-side Cloudflare Turnstile verification (cannot be spoofed in browser)
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: request.headers.get('CF-Connecting-IP') || '',
      }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return new Response(JSON.stringify({ error: 'Bot verification failed on server.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Forward verified login OTP request to Supabase from the server
    const otpRes = await fetch(`${env.SUPABASE_URL}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        create_user: true,
        options: { emailRedirectTo: redirectTo },
      }),
    });

    const otpData = await otpRes.json();
    return new Response(JSON.stringify(otpData), {
      status: otpRes.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server gate error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
