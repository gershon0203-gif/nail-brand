-- ============================================================================
-- READ-ONLY Supabase schema verification.
-- Paste into Supabase Dashboard -> SQL Editor -> New query -> Run,
-- then paste the RESULT back to me. Do not include any secrets.
-- This query does not modify anything.
-- ============================================================================

-- 1) Tables (including any table not listed in the migrations)
select table_name
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'
order by table_name;

-- 2) Columns: table, column, data type, nullable, default
select table_name, ordinal_position, column_name, data_type,
       is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

-- 3) Primary keys and unique constraints
select tc.table_name, tc.constraint_name, tc.constraint_type,
       string_agg(kcu.column_name, ', ' order by kcu.ordinal_position) as columns
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
where tc.table_schema = 'public'
  and tc.constraint_type in ('PRIMARY KEY','UNIQUE')
group by tc.table_name, tc.constraint_name, tc.constraint_type
order by tc.table_name, tc.constraint_type;

-- 4) Foreign keys
select tc.table_name, tc.constraint_name,
       kcu.column_name,
       ccu.table_name as referenced_table,
       ccu.column_name as referenced_column,
       rc.delete_rule
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on tc.constraint_name = ccu.constraint_name and tc.table_schema = ccu.table_schema
join information_schema.referential_constraints rc
  on tc.constraint_name = rc.constraint_name and tc.table_schema = rc.constraint_schema
where tc.table_schema = 'public' and tc.constraint_type = 'FOREIGN KEY'
order by tc.table_name, tc.constraint_name;

-- 5) Indexes
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

-- 6) Triggers
select event_object_table as table_name, trigger_name, event_manipulation, action_timing
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;

-- 7) Functions and their language/volatility
select p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       pg_get_function_result(p.oid) as returns,
       p.provolatile as volatility,
       p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;

-- 8) RLS status per table
select relname as table_name, relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r'
order by relname;

-- 9) RLS policies (names + command + roles + expressions)
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 10) Storage buckets
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by name;

-- 11) Storage policies
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
