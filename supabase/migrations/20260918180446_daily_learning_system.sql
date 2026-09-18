-- Free AI coach, daily challenge, weekly league and certificate progress.

alter table public.profiles add column if not exists daily_points integer not null default 0;

create table if not exists public.daily_training_sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  training_date date not null default current_date,
  focus_topic text not null check (char_length(focus_topic) between 1 and 160),
  score integer not null check (score between 0 and 5),
  points integer not null check (points between 0 and 100),
  completed_at timestamptz not null default now(),
  unique (user_id, training_date)
);

alter table public.daily_training_sessions enable row level security;

create policy "Users can view own daily sessions"
  on public.daily_training_sessions for select to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.daily_training_sessions to authenticated;

create index if not exists daily_training_user_date_idx
  on public.daily_training_sessions (user_id, training_date desc);

create or replace function public.complete_daily_training(
  p_focus_topic text,
  p_score integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  safe_score integer := greatest(0, least(coalesce(p_score, 0), 5));
  earned integer := 20 + safe_score * 10;
  inserted boolean := false;
  total_sessions integer;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if p_focus_topic is null or char_length(trim(p_focus_topic)) not between 1 and 160 then
    raise exception 'Invalid focus topic';
  end if;

  insert into public.daily_training_sessions(user_id, focus_topic, score, points)
  values (uid, trim(p_focus_topic), safe_score, earned)
  on conflict (user_id, training_date) do nothing;
  inserted := found;

  if inserted then
    update public.profiles set daily_points = daily_points + earned where id = uid;
  end if;

  select count(*) into total_sessions
  from public.daily_training_sessions where user_id = uid;

  return jsonb_build_object(
    'completed', true,
    'first_completion_today', inserted,
    'points', case when inserted then earned else 0 end,
    'total_sessions', total_sessions,
    'certificate_unlocked', total_sessions >= 7
  );
end;
$$;

revoke all on function public.complete_daily_training(text,integer) from public, anon;
grant execute on function public.complete_daily_training(text,integer) to authenticated;

-- Add quotas for the two new AI endpoints.
create or replace function public.consume_api_quota(p_route text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  route_limit integer;
  global_limit integer := 0;
  used integer;
begin
  if uid is null then return false; end if;
  route_limit := case p_route
    when 'chat' then 80 when 'quiz' then 15 when 'case' then 30
    when 'grade' then 30 when 'vokabel' then 25 when 'transcribe' then 150
    when 'tts' then 60 when 'case-image' then 200
    when 'coach' then 12 when 'daily-quiz' then 10 else 30 end;
  if p_route = 'tts' then global_limit := 250; end if;

  perform pg_advisory_xact_lock(hashtext(uid::text || ':' || p_route));
  delete from public.api_usage where created_at < now() - interval '2 hours';
  select count(*) into used from public.api_usage
    where user_id = uid and route = p_route and created_at >= now() - interval '1 hour';
  if used >= route_limit then return false; end if;
  if global_limit > 0 and (select count(*) from public.api_usage
      where route = p_route and created_at >= now() - interval '1 hour') >= global_limit then
    return false;
  end if;
  insert into public.api_usage(user_id, route) values (uid, p_route);
  return true;
end;
$$;

revoke all on function public.consume_api_quota(text) from public, anon;
grant execute on function public.consume_api_quota(text) to authenticated;
