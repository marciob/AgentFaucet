-- AgentFaucet tables (prefixed with af_ to share Supabase project)

-- Developer profiles linked to Supabase auth
create table af_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  github_username text,
  github_id bigint,
  avatar_url text,
  reputation_score integer not null default 0,
  tier integer not null default 1,
  agent_token_id bigint,
  daily_limit_wei text not null default '500000000000000000', -- 0.5 tBNB (tier 1)
  jwt_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Claim history
create table af_claims (
  id bigint generated always as identity primary key,
  profile_id uuid not null references af_profiles(id) on delete cascade,
  wallet_address text not null,
  amount_wei text not null,
  tx_hash text,
  agent_token_id bigint,
  created_at timestamptz not null default now()
);

-- Daily usage for rate limiting
create table af_daily_usage (
  id bigint generated always as identity primary key,
  profile_id uuid not null references af_profiles(id) on delete cascade,
  date date not null default current_date,
  amount_claimed_wei text not null default '0',
  unique (profile_id, date)
);

-- Sponsor campaigns
create table af_campaigns (
  id bigint generated always as identity primary key,
  sponsor_address text not null,
  name text not null,
  description text,
  target_protocol text,
  deposit_tx_hash text,
  amount_wei text not null default '0',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Token return history
create table af_token_returns (
  id bigint generated always as identity primary key,
  profile_id uuid not null references af_profiles(id) on delete cascade,
  amount_wei text not null,
  tx_hash text,
  developer_id text,
  created_at timestamptz not null default now()
);

-- Indexes
create index af_claims_profile_id_idx on af_claims(profile_id);
create index af_claims_created_at_idx on af_claims(created_at);
create index af_daily_usage_profile_date_idx on af_daily_usage(profile_id, date);
create index af_token_returns_profile_id_idx on af_token_returns(profile_id);

-- RLS policies
alter table af_profiles enable row level security;
alter table af_claims enable row level security;
alter table af_daily_usage enable row level security;
alter table af_campaigns enable row level security;
alter table af_token_returns enable row level security;

-- Profiles: users can read their own
create policy "Users can read own profile" on af_profiles
  for select using (auth.uid() = id);

-- Claims: users can read their own
create policy "Users can read own claims" on af_claims
  for select using (auth.uid() = profile_id);

-- Campaigns: public read
create policy "Anyone can read campaigns" on af_campaigns
  for select using (true);

-- Token returns: users can read their own
create policy "Users can read own returns" on af_token_returns
  for select using (auth.uid() = profile_id);

-- Service role (used by API routes) bypasses RLS automatically
