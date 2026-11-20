import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function resolveBackendOrigin(): string {
  const raw =
    process.env.API_URL ||
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:3001';

  const trimmed = raw.trim().replace(/\/$/, '');
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await context.params;
  const targetOrigin = resolveBackendOrigin();
  const queryString = request.nextUrl.search;
  const targetUrl = `${targetOrigin}/api/${path.join('/')}${queryString}`;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const authorization = request.headers.get('authorization');
  if (contentType) headers.set('content-type', contentType);
  if (authorization) headers.set('authorization', authorization);

  const method = request.method;
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const body = hasBody ? Buffer.from(await request.arrayBuffer()) : undefined;

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
      cache: 'no-store',
    });

    const responseHeaders = new Headers();
    const resContentType = upstream.headers.get('content-type');
    const resDisposition = upstream.headers.get('content-disposition');
    if (resContentType) responseHeaders.set('content-type', resContentType);
    if (resDisposition) responseHeaders.set('content-disposition', resDisposition);

    const buffer = await upstream.arrayBuffer();
    return new NextResponse(buffer, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('Proxy upstream error:', targetUrl, err);
    return NextResponse.json(
      {
        statusCode: 502,
        error: 'Bad Gateway',
        message: 'Não foi possível conectar ao servidor da API neste momento.',
      },
      { status: 502 },
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PATCH = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
