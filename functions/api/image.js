// functions/api/image.js
export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const prompt = (body.prompt || '').toString();
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const hfResponse = await fetch(
      'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-2-1',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.HF_API}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: prompt })
      }
    );
    if (!hfResponse.ok) {
      const text = await hfResponse.text().catch(() => '');
      return new Response(JSON.stringify({ error: `HF error: ${hfResponse.status}`, detail: text }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const imageBlob = await hfResponse.arrayBuffer();
    return new Response(imageBlob, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
