import { NextRequest } from 'next/server';
import { getScan } from '@/lib/mockStore';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const encoder = new TextEncoder();
  const scan = getScan(params.id);

  const stream = new ReadableStream({
    async start(controller) {
      const steps = [
        { phase: 'VALIDATING', pct: 15, msg: 'Validating target and security pre-flight' },
        { phase: 'CRAWL_DISCOVERY', pct: 30, msg: 'Crawling navigation links and landmarks' },
        { phase: 'MEASURE_PASS', pct: 50, msg: 'Capturing CDP telemetry and animation deltas' },
        { phase: 'SCREENSHOT_PASS', pct: 70, msg: 'Capturing multi-viewport screenshots' },
        { phase: 'EVAL_CHECKS', pct: 85, msg: 'Evaluating 45+ deterministic audit checks' },
        { phase: 'COMPILE_PROMPTS', pct: 95, msg: 'Compiling AI remediation fix prompts' },
        { phase: 'COMPLETED', pct: 100, msg: 'Audit complete!' },
      ];

      for (const step of steps) {
        const payload = JSON.stringify({
          scan_id: params.id,
          phase: step.phase,
          pct: step.pct,
          message: step.msg,
          timestamp: new Date().toISOString(),
        });

        controller.enqueue(encoder.encode(`event: progress\ndata: ${payload}\n\n`));
        await new Promise((r) => setTimeout(r, 250));
      }

      if (scan) {
        scan.status = 'COMPLETED';
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
