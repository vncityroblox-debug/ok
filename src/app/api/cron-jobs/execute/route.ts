import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  return runCronJobs();
}

export async function POST() {
  return runCronJobs();
}

async function runCronJobs() {
  try {
    const supabase = getSupabaseServer(true);
    const now = new Date().toISOString();

    const { data: jobs, error: fetchError } = await supabase
      .from('cron_jobs')
      .select('*')
      .eq('is_active', true)
      .lte('next_run', now);

    if (fetchError) {
      if (fetchError.message?.includes('does not exist') || fetchError.code === '42P01') {
        return Response.json({ message: 'cron_jobs table not found', executed: 0 });
      }
      throw fetchError;
    }
    if (!jobs || jobs.length === 0) {
      return Response.json({ message: 'No jobs to run', executed: 0 });
    }

    const results = await Promise.allSettled(
      jobs.map(async (job) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15000);

          const response = await fetch(job.url, {
            method: job.method || 'GET',
            signal: controller.signal,
            headers: { 'User-Agent': 'CronJobsFree/1.0' },
          });

          clearTimeout(timeout);

          const next_run = new Date(Date.now() + job.interval_minutes * 60 * 1000).toISOString();

          await supabase
            .from('cron_jobs')
            .update({
              last_run: now,
              next_run,
              total_runs: (job.total_runs || 0) + 1,
              status: response.ok ? 'success' : `error_${response.status}`,
              fail_count: response.ok ? 0 : (job.fail_count || 0) + 1,
            })
            .eq('id', job.id);

          return { id: job.id, status: response.status, ok: response.ok };
        } catch (err: any) {
          const next_run = new Date(Date.now() + job.interval_minutes * 60 * 1000).toISOString();
          await supabase
            .from('cron_jobs')
            .update({
              last_run: now,
              next_run,
              total_runs: (job.total_runs || 0) + 1,
              status: 'error',
              fail_count: (job.fail_count || 0) + 1,
            })
            .eq('id', job.id);

          return { id: job.id, error: err.message, ok: false };
        }
      })
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled' && r.value?.ok).length;
    const failed = results.length - succeeded;

    return Response.json({
      message: `Executed ${jobs.length} jobs: ${succeeded} succeeded, ${failed} failed`,
      executed: jobs.length,
      succeeded,
      failed,
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
