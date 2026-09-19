-- Growth features: referrals, Bundesland targeting, web push, and a new reward key.

alter table public.profiles add column if not exists referral_code text unique;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id);
alter table public.profiles add column if not exists bundesland text;

-- Generate a short, unique referral code for every existing and future profile.
create or replace function public.gen_referral_code()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := substr(md5(gen_random_uuid()::text), 1, 7);
    exit when not exists (select 1 from public.profiles where referral_code = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.set_referral_code()
returns trigger
language plpgsql
as $$
begin
  if new.referral_code is null then
    new.referral_code := public.gen_referral_code();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_referral_code on public.profiles;
create trigger trg_set_referral_code
  before insert on public.profiles
  for each row execute function public.set_referral_code();

update public.profiles set referral_code = public.gen_referral_code() where referral_code is null;

-- Web push subscriptions, one row per browser/device a user enabled notifications on.
create table if not exists public.push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;

create policy "Users can view own push subscriptions"
  on public.push_subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can insert own push subscriptions"
  on public.push_subscriptions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update own push subscriptions"
  on public.push_subscriptions for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own push subscriptions"
  on public.push_subscriptions for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.push_subscriptions to authenticated;
-- The daily reminder cron job reads across all users with the service role, which
-- bypasses RLS by design — no extra grant needed for that path.

-- Extend award_progress with referral bonuses (server-authoritative, same guard rails).
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
    ('test:correct',8 * safe_units,4 * safe_units),
    ('referral:referrer',60,120), ('referral:invitee',30,60)
  ) as rewards(k,x,c) where k = p_reward_key;

  if award_xp is null then raise exception 'Unknown reward'; end if;

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

-- Claims a referral code for a brand-new profile and pays out both sides once.
create or replace function public.claim_referral(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  referrer record;
  attempt_a text;
  attempt_b text;
begin
  if uid is null then raise exception 'Not authenticated'; end if;

  select id, referred_by into referrer from public.profiles where id = uid;
  if referrer.referred_by is not null then
    return jsonb_build_object('claimed', false, 'reason', 'already_linked');
  end if;

  select id into referrer from public.profiles
    where referral_code = trim(p_code) and id <> uid;
  if referrer.id is null then
    return jsonb_build_object('claimed', false, 'reason', 'invalid_code');
  end if;

  update public.profiles set referred_by = referrer.id where id = uid and referred_by is null;
  if not found then
    return jsonb_build_object('claimed', false, 'reason', 'already_linked');
  end if;

  attempt_a := 'ref-invitee-' || uid::text;
  attempt_b := 'ref-referrer-' || uid::text;
  perform public.award_progress(uid, 'referral:invitee', attempt_a);
  perform public.award_progress(referrer.id, 'referral:referrer', attempt_b);

  return jsonb_build_object('claimed', true);
end;
$$;

revoke all on function public.claim_referral(text) from public, anon;
grant execute on function public.claim_referral(text) to authenticated;
