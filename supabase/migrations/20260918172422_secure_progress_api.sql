-- Security foundation: server-authoritative rewards, streaks, and distributed API quotas.

alter table public.profiles add column if not exists practice_days integer not null default 0;
alter table public.profiles add column if not exists streak_days integer not null default 0;
alter table public.profiles add column if not exists longest_streak integer not null default 0;
alter table public.profiles add column if not exists last_practice_date date;

alter table public.mistakes add column if not exists topic text;

create table if not exists public.reward_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id text not null,
  reward_key text not null,
  xp integer not null check (xp >= 0),
  coins integer not null check (coins >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, attempt_id)
);

alter table public.reward_ledger enable row level security;
create policy "Users can view own rewards" on public.reward_ledger
  for select to authenticated using ((select auth.uid()) = user_id);
grant select on public.reward_ledger to authenticated;

create table if not exists public.api_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  route text not null,
  created_at timestamptz not null default now()
);
alter table public.api_usage enable row level security;
create index if not exists api_usage_user_route_created_idx
  on public.api_usage (user_id, route, created_at desc);
create index if not exists api_usage_route_created_idx
  on public.api_usage (route, created_at desc);

-- Users may edit identity/profile fields, but never their own rewards or counters.
revoke update on public.profiles from authenticated;
grant update (full_name, age, clinic_name) on public.profiles to authenticated;

create or replace function public.mark_practice_day()
returns setof public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  current_last date;
  next_streak integer;
begin
  if uid is null then raise exception 'Not authenticated'; end if;

  select last_practice_date into current_last
  from public.profiles where id = uid for update;

  if current_last = current_date then
    return query select * from public.profiles where id = uid;
    return;
  end if;

  select case
    when current_last = current_date - 1 then streak_days + 1
    else 1
  end into next_streak
  from public.profiles where id = uid;

  update public.profiles
  set last_practice_date = current_date,
      practice_days = practice_days + 1,
      streak_days = next_streak,
      longest_streak = greatest(longest_streak, next_streak)
  where id = uid;

  return query select * from public.profiles where id = uid;
end;
$$;

create or replace function public.award_progress(
  p_user_id uuid,
  p_reward_key text,
  p_attempt_id text,
  p_units integer default 1
)
returns setof public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := p_user_id;
  award_xp integer;
  award_coins integer;
  safe_units integer := greatest(1, least(coalesce(p_units, 1), 20));
begin
  if uid is null then raise exception 'Missing user'; end if;
  if p_attempt_id is null or length(p_attempt_id) < 8 then raise exception 'Invalid attempt'; end if;

  select x, c into award_xp, award_coins from (values
    ('diagnosis:leicht',15,30), ('diagnosis:mittel',30,60),
    ('diagnosis:schwer',50,100), ('diagnosis:pro',90,180),
    ('quiz:leicht:pass',30,60), ('quiz:mittel:pass',60,120),
    ('quiz:schwer:pass',100,200), ('quiz:pro:pass',180,360),
    ('quiz:leicht:perfect',45,90), ('quiz:mittel:perfect',90,180),
    ('quiz:schwer:perfect',150,300), ('quiz:pro:perfect',270,540),
    ('test:correct',8 * safe_units,4 * safe_units)
  ) as rewards(k,x,c) where k = p_reward_key;

  if award_xp is null then raise exception 'Unknown reward'; end if;

  -- Hard daily ceiling limits farming and protects leaderboard integrity.
  if coalesce((select sum(xp) from public.reward_ledger
               where user_id = uid and created_at >= current_date), 0) + award_xp > 1000 then
    raise exception 'Daily reward limit reached';
  end if;

  insert into public.reward_ledger(user_id, attempt_id, reward_key, xp, coins)
  values (uid, p_attempt_id, p_reward_key, award_xp, award_coins)
  on conflict (user_id, attempt_id) do nothing;

  if not found then
    return query select * from public.profiles where id = uid;
    return;
  end if;

  update public.profiles
  set xp = xp + award_xp,
      coins = coins + award_coins,
      level = ((xp + award_xp) / 150) + 1,
      cases_solved = cases_solved + case
        when p_reward_key like 'quiz:%' or p_reward_key like 'diagnosis:%' then 1 else 0 end
  where id = uid;

  return query select * from public.profiles where id = uid;
end;
$$;

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
    when 'tts' then 60 when 'case-image' then 200 else 30 end;
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

revoke all on function public.mark_practice_day() from public, anon;
revoke all on function public.award_progress(uuid,text,text,integer) from public, anon, authenticated;
revoke all on function public.consume_api_quota(text) from public, anon;
grant execute on function public.mark_practice_day() to authenticated;
grant execute on function public.award_progress(uuid,text,text,integer) to service_role;
grant execute on function public.consume_api_quota(text) to authenticated;
