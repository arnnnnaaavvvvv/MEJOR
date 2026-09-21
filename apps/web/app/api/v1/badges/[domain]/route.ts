import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { domain: string } }
) {
  const domain = params.domain.replace(/\.svg$/, '');
  const scoreStr = '94 (A)';
  const color = '#10b981';

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="24" viewBox="0 0 160 24">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="160" height="24" rx="4" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <path fill="#1f2937" d="M0 0h90v24H0z"/>
    <path fill="${color}" d="M90 0h70v24H90z"/>
    <path fill="url(#b)" d="M0 0h160v24H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="45" y="16" fill="#010101" fill-opacity=".3">vibe audit</text>
    <text x="45" y="15">vibe audit</text>
    <text x="125" y="16" fill="#010101" fill-opacity=".3">${scoreStr}</text>
    <text x="125" y="15">${scoreStr}</text>
  </g>
</svg>`;

  return new Response(svgContent, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache',
    },
  });
}
