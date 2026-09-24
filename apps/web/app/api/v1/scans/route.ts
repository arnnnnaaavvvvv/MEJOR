import { NextRequest, NextResponse } from 'next/server';
import { auditWebsite } from '@/lib/auditor';

interface NormalizedUrlResult {
  valid: boolean;
  cleanUrl?: string;
  domain?: string;
  error?: string;
}

function normalizeAndValidateUrl(input: string): NormalizedUrlResult {
  if (!input || typeof input !== 'string' || !input.trim()) {
    return { valid: false, error: 'URL cannot be empty.' };
  }

  let raw = input.trim().replace(/^["'`]+|["'`]+$/g, '');

  // Detect explicit protocol scheme
  const schemeMatch = raw.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== 'http' && scheme !== 'https') {
      return {
        valid: false,
        error: `Scheme '${scheme}:' disallowed. Only HTTP and HTTPS are permitted.`,
      };
    }
  } else {
    raw = 'https://' + raw;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format. Please provide a valid web address.',
    };
  }

  const host = parsed.hostname.toLowerCase();
  if (!host || (!host.includes('.') && host !== 'localhost')) {
    return {
      valid: false,
      error: 'Invalid hostname. Please provide a valid domain name.',
    };
  }

  // SSRF Protection: Loopback, private IP ranges, cloud metadata
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '[::1]' ||
    host.startsWith('127.') ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    host.startsWith('172.16.') ||
    host.startsWith('172.31.') ||
    host === '169.254.169.254'
  ) {
    return {
      valid: false,
      error: 'SSRF Security Violation: Target IP is in a restricted or private subnet.',
    };
  }

  return {
    valid: true,
    cleanUrl: parsed.toString(),
    domain: host,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, mode = 'quick' } = body;

    const validation = normalizeAndValidateUrl(url);
    if (!validation.valid || !validation.cleanUrl || !validation.domain) {
      return NextResponse.json({ detail: validation.error }, { status: 400 });
    }

    const cleanUrl = validation.cleanUrl;

    // Run real live dynamic auditor against the target site
    const scan = await auditWebsite(cleanUrl, mode);

    return NextResponse.json(
      {
        id: scan.id,
        target_url: scan.target_url,
        normalized_domain: scan.normalized_domain,
        mode: scan.mode,
        status: 'QUEUED',
        progress_url: `/api/v1/scans/${scan.id}/events`,
        created_at: scan.created_at,
      },
      { status: 202 }
    );
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 500 });
  }
}
