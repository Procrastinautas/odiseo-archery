


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."bow_hand" AS ENUM (
    'left',
    'right'
);


ALTER TYPE "public"."bow_hand" OWNER TO "postgres";


CREATE TYPE "public"."bow_type" AS ENUM (
    'recurve',
    'compound',
    'barebow'
);


ALTER TYPE "public"."bow_type" OWNER TO "postgres";


CREATE TYPE "public"."marketplace_category" AS ENUM (
    'bow',
    'arrows',
    'accessory',
    'other'
);


ALTER TYPE "public"."marketplace_category" OWNER TO "postgres";


CREATE TYPE "public"."marketplace_status" AS ENUM (
    'active',
    'sold',
    'removed'
);


ALTER TYPE "public"."marketplace_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'confirmed',
    'rejected'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."score_method" AS ENUM (
    'manual',
    'summary',
    'target_map'
);


ALTER TYPE "public"."score_method" OWNER TO "postgres";


CREATE TYPE "public"."session_status" AS ENUM (
    'pending',
    'confirmed',
    'declined',
    'cancelled'
);


ALTER TYPE "public"."session_status" OWNER TO "postgres";


CREATE TYPE "public"."training_type" AS ENUM (
    'control',
    'training',
    'contest'
);


ALTER TYPE "public"."training_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'user'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."weather_type" AS ENUM (
    'sunny',
    'cloudy',
    'rainy',
    'heavy_rain',
    'windy'
);


ALTER TYPE "public"."weather_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."arrows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "brand" "text" NOT NULL,
    "diameter_mm" numeric,
    "fletchings" "text",
    "shaft_material" "text",
    "point_type" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."arrows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bank_name" "text" NOT NULL,
    "account_holder" "text" NOT NULL,
    "account_number" "text" NOT NULL,
    "account_type" "text",
    "instructions" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid"
);


ALTER TABLE "public"."bank_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "hand" "public"."bow_hand" NOT NULL,
    "type" "public"."bow_type" NOT NULL,
    "draw_weight" numeric NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."bows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."improvement_areas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "training_session_id" "uuid" NOT NULL,
    "comment" "text" NOT NULL,
    "attachment_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."improvement_areas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketplace_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "price" numeric,
    "category" "public"."marketplace_category" NOT NULL,
    "images" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "status" "public"."marketplace_status" DEFAULT 'active'::"public"."marketplace_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."marketplace_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "subject" "text" NOT NULL,
    "body" "text" NOT NULL,
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scheduled_session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "receipt_url" "text",
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status" NOT NULL,
    "admin_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "name" "text",
    "email" "text" NOT NULL,
    "picture_url" "text",
    "role" "public"."user_role" DEFAULT 'user'::"public"."user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."round_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "round_id" "uuid" NOT NULL,
    "method" "public"."score_method" NOT NULL,
    "data" "jsonb" NOT NULL,
    "total_score" integer,
    "tens" integer,
    "xs" integer,
    "nines" integer,
    "below_8_count" integer,
    "misses" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."round_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rounds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "training_session_id" "uuid" NOT NULL,
    "round_number" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rounds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scheduled_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "time" time without time zone NOT NULL,
    "distance" numeric NOT NULL,
    "location_id" "uuid" NOT NULL,
    "status" "public"."session_status" DEFAULT 'pending'::"public"."session_status" NOT NULL,
    "material_bow" boolean DEFAULT false NOT NULL,
    "material_arrows" boolean DEFAULT false NOT NULL,
    "material_karkaj" boolean DEFAULT false NOT NULL,
    "material_protection_gear" boolean DEFAULT false NOT NULL,
    "material_weights" boolean DEFAULT false NOT NULL,
    "material_tap" boolean DEFAULT false NOT NULL,
    "notes" "text",
    "admin_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."scheduled_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scope_marks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bow_id" "uuid" NOT NULL,
    "distance" numeric NOT NULL,
    "mark_value" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."scope_marks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stretching_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."stretching_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."training_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scheduled_session_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "weather" "public"."weather_type",
    "type" "public"."training_type",
    "distance" numeric,
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "target_size" "text",
    "bow_id" "uuid",
    "arrow_id" "uuid",
    "new_gear_notes" "text",
    "physical_status" "text",
    "scoresheet_url" "text",
    "final_thoughts" "text",
    "ai_recap" "text",
    "ai_advice" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."training_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."warmup_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."warmup_plans" OWNER TO "postgres";


ALTER TABLE ONLY "public"."arrows"
    ADD CONSTRAINT "arrows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_settings"
    ADD CONSTRAINT "bank_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bows"
    ADD CONSTRAINT "bows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."improvement_areas"
    ADD CONSTRAINT "improvement_areas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketplace_posts"
    ADD CONSTRAINT "marketplace_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."round_scores"
    ADD CONSTRAINT "round_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."round_scores"
    ADD CONSTRAINT "round_scores_round_id_key" UNIQUE ("round_id");



ALTER TABLE ONLY "public"."rounds"
    ADD CONSTRAINT "rounds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rounds"
    ADD CONSTRAINT "rounds_session_round_unique" UNIQUE ("training_session_id", "round_number");



ALTER TABLE ONLY "public"."scheduled_sessions"
    ADD CONSTRAINT "scheduled_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scope_marks"
    ADD CONSTRAINT "scope_marks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stretching_plans"
    ADD CONSTRAINT "stretching_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_sessions"
    ADD CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."warmup_plans"
    ADD CONSTRAINT "warmup_plans_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "marketplace_posts_updated_at" BEFORE UPDATE ON "public"."marketplace_posts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "training_sessions_updated_at" BEFORE UPDATE ON "public"."training_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."arrows"
    ADD CONSTRAINT "arrows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_settings"
    ADD CONSTRAINT "bank_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bows"
    ADD CONSTRAINT "bows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."improvement_areas"
    ADD CONSTRAINT "improvement_areas_training_session_id_fkey" FOREIGN KEY ("training_session_id") REFERENCES "public"."training_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketplace_posts"
    ADD CONSTRAINT "marketplace_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_scheduled_session_id_fkey" FOREIGN KEY ("scheduled_session_id") REFERENCES "public"."scheduled_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."round_scores"
    ADD CONSTRAINT "round_scores_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rounds"
    ADD CONSTRAINT "rounds_training_session_id_fkey" FOREIGN KEY ("training_session_id") REFERENCES "public"."training_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scheduled_sessions"
    ADD CONSTRAINT "scheduled_sessions_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "public"."scheduled_sessions"
    ADD CONSTRAINT "scheduled_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scope_marks"
    ADD CONSTRAINT "scope_marks_bow_id_fkey" FOREIGN KEY ("bow_id") REFERENCES "public"."bows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stretching_plans"
    ADD CONSTRAINT "stretching_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_sessions"
    ADD CONSTRAINT "training_sessions_arrow_id_fkey" FOREIGN KEY ("arrow_id") REFERENCES "public"."arrows"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."training_sessions"
    ADD CONSTRAINT "training_sessions_bow_id_fkey" FOREIGN KEY ("bow_id") REFERENCES "public"."bows"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."training_sessions"
    ADD CONSTRAINT "training_sessions_scheduled_session_id_fkey" FOREIGN KEY ("scheduled_session_id") REFERENCES "public"."scheduled_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."training_sessions"
    ADD CONSTRAINT "training_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."warmup_plans"
    ADD CONSTRAINT "warmup_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE "public"."arrows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "arrows: insert own rows" ON "public"."arrows" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "arrows: own rows or admin can delete" ON "public"."arrows" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "arrows: own rows or admin can select" ON "public"."arrows" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "arrows: own rows or admin can update" ON "public"."arrows" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."bank_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bank_settings: admin can delete" ON "public"."bank_settings" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "bank_settings: admin can insert" ON "public"."bank_settings" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "bank_settings: admin can update" ON "public"."bank_settings" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "bank_settings: authenticated users can select" ON "public"."bank_settings" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."bows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bows: insert own rows" ON "public"."bows" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "bows: own rows or admin can delete" ON "public"."bows" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "bows: own rows or admin can select" ON "public"."bows" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "bows: own rows or admin can update" ON "public"."bows" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."improvement_areas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "improvement_areas: owner can insert" ON "public"."improvement_areas" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."training_sessions" "ts"
  WHERE (("ts"."id" = "improvement_areas"."training_session_id") AND ("ts"."user_id" = "auth"."uid"())))));



CREATE POLICY "improvement_areas: owner or admin can delete" ON "public"."improvement_areas" FOR DELETE TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."training_sessions" "ts"
  WHERE (("ts"."id" = "improvement_areas"."training_session_id") AND ("ts"."user_id" = "auth"."uid"()))))));



CREATE POLICY "improvement_areas: owner or admin can select" ON "public"."improvement_areas" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."training_sessions" "ts"
  WHERE (("ts"."id" = "improvement_areas"."training_session_id") AND ("ts"."user_id" = "auth"."uid"()))))));



CREATE POLICY "improvement_areas: owner or admin can update" ON "public"."improvement_areas" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."training_sessions" "ts"
  WHERE (("ts"."id" = "improvement_areas"."training_session_id") AND ("ts"."user_id" = "auth"."uid"())))))) WITH CHECK (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."training_sessions" "ts"
  WHERE (("ts"."id" = "improvement_areas"."training_session_id") AND ("ts"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "locations: admin can delete" ON "public"."locations" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "locations: admin can insert" ON "public"."locations" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "locations: admin can update" ON "public"."locations" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "locations: authenticated users can select" ON "public"."locations" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."marketplace_posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "marketplace_posts: insert own rows" ON "public"."marketplace_posts" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "marketplace_posts: own rows or admin can delete" ON "public"."marketplace_posts" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "marketplace_posts: own rows or admin can update" ON "public"."marketplace_posts" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "marketplace_posts: read active or own or admin" ON "public"."marketplace_posts" FOR SELECT TO "authenticated" USING ((("status" = 'active'::"public"."marketplace_status") OR ("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications: admin can delete" ON "public"."notifications" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "notifications: admin can insert" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "notifications: admin can update" ON "public"."notifications" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "notifications: own or broadcast can select" ON "public"."notifications" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL) OR "public"."is_admin"()));



ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payments: admin can delete" ON "public"."payments" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "payments: insert own rows" ON "public"."payments" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "payments: own rows or admin can select" ON "public"."payments" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "payments: own rows or admin can update" ON "public"."payments" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles: admin can delete" ON "public"."profiles" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "profiles: insert own row" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles: own row or admin can select" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "profiles: own row or admin can update" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."round_scores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "round_scores: owner can insert" ON "public"."round_scores" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."rounds" "r"
     JOIN "public"."training_sessions" "ts" ON (("ts"."id" = "r"."training_session_id")))
  WHERE (("r"."id" = "round_scores"."round_id") AND ("ts"."user_id" = "auth"."uid"())))));



CREATE POLICY "round_scores: owner or admin can delete" ON "public"."round_scores" FOR DELETE TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."rounds" "r"
     JOIN "public"."training_sessions" "ts" ON (("ts"."id" = "r"."training_session_id")))
  WHERE (("r"."id" = "round_scores"."round_id") AND ("ts"."user_id" = "auth"."uid"()))))));



CREATE POLICY "round_scores: owner or admin can select" ON "public"."round_scores" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."rounds" "r"
     JOIN "public"."training_sessions" "ts" ON (("ts"."id" = "r"."training_session_id")))
  WHERE (("r"."id" = "round_scores"."round_id") AND ("ts"."user_id" = "auth"."uid"()))))));



CREATE POLICY "round_scores: owner or admin can update" ON "public"."round_scores" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."rounds" "r"
     JOIN "public"."training_sessions" "ts" ON (("ts"."id" = "r"."training_session_id")))
  WHERE (("r"."id" = "round_scores"."round_id") AND ("ts"."user_id" = "auth"."uid"())))))) WITH CHECK (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."rounds" "r"
     JOIN "public"."training_sessions" "ts" ON (("ts"."id" = "r"."training_session_id")))
  WHERE (("r"."id" = "round_scores"."round_id") AND ("ts"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."rounds" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rounds: owner can insert" ON "public"."rounds" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."training_sessions" "ts"
  WHERE (("ts"."id" = "rounds"."training_session_id") AND ("ts"."user_id" = "auth"."uid"())))));



CREATE POLICY "rounds: owner or admin can delete" ON "public"."rounds" FOR DELETE TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."training_sessions" "ts"
  WHERE (("ts"."id" = "rounds"."training_session_id") AND ("ts"."user_id" = "auth"."uid"()))))));



CREATE POLICY "rounds: owner or admin can select" ON "public"."rounds" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."training_sessions" "ts"
  WHERE (("ts"."id" = "rounds"."training_session_id") AND ("ts"."user_id" = "auth"."uid"()))))));



CREATE POLICY "rounds: owner or admin can update" ON "public"."rounds" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."training_sessions" "ts"
  WHERE (("ts"."id" = "rounds"."training_session_id") AND ("ts"."user_id" = "auth"."uid"())))))) WITH CHECK (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."training_sessions" "ts"
  WHERE (("ts"."id" = "rounds"."training_session_id") AND ("ts"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."scheduled_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "scheduled_sessions: insert own rows" ON "public"."scheduled_sessions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "scheduled_sessions: own rows or admin can delete" ON "public"."scheduled_sessions" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "scheduled_sessions: own rows or admin can select" ON "public"."scheduled_sessions" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "scheduled_sessions: own rows or admin can update" ON "public"."scheduled_sessions" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."scope_marks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "scope_marks: owner can insert" ON "public"."scope_marks" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."bows"
  WHERE (("bows"."id" = "scope_marks"."bow_id") AND ("bows"."user_id" = "auth"."uid"())))));



CREATE POLICY "scope_marks: owner or admin can delete" ON "public"."scope_marks" FOR DELETE TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."bows"
  WHERE (("bows"."id" = "scope_marks"."bow_id") AND ("bows"."user_id" = "auth"."uid"()))))));



CREATE POLICY "scope_marks: owner or admin can select" ON "public"."scope_marks" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."bows"
  WHERE (("bows"."id" = "scope_marks"."bow_id") AND ("bows"."user_id" = "auth"."uid"()))))));



CREATE POLICY "scope_marks: owner or admin can update" ON "public"."scope_marks" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."bows"
  WHERE (("bows"."id" = "scope_marks"."bow_id") AND ("bows"."user_id" = "auth"."uid"())))))) WITH CHECK (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."bows"
  WHERE (("bows"."id" = "scope_marks"."bow_id") AND ("bows"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."stretching_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stretching_plans: admin can delete" ON "public"."stretching_plans" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "stretching_plans: admin can insert" ON "public"."stretching_plans" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "stretching_plans: admin can update" ON "public"."stretching_plans" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "stretching_plans: authenticated users can select" ON "public"."stretching_plans" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."training_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "training_sessions: insert own rows" ON "public"."training_sessions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "training_sessions: own rows or admin can delete" ON "public"."training_sessions" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "training_sessions: own rows or admin can select" ON "public"."training_sessions" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "training_sessions: own rows or admin can update" ON "public"."training_sessions" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."warmup_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "warmup_plans: admin can delete" ON "public"."warmup_plans" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "warmup_plans: admin can insert" ON "public"."warmup_plans" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "warmup_plans: admin can update" ON "public"."warmup_plans" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "warmup_plans: authenticated users can select" ON "public"."warmup_plans" FOR SELECT TO "authenticated" USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."arrows" TO "anon";
GRANT ALL ON TABLE "public"."arrows" TO "authenticated";
GRANT ALL ON TABLE "public"."arrows" TO "service_role";



GRANT ALL ON TABLE "public"."bank_settings" TO "anon";
GRANT ALL ON TABLE "public"."bank_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_settings" TO "service_role";



GRANT ALL ON TABLE "public"."bows" TO "anon";
GRANT ALL ON TABLE "public"."bows" TO "authenticated";
GRANT ALL ON TABLE "public"."bows" TO "service_role";



GRANT ALL ON TABLE "public"."improvement_areas" TO "anon";
GRANT ALL ON TABLE "public"."improvement_areas" TO "authenticated";
GRANT ALL ON TABLE "public"."improvement_areas" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON TABLE "public"."marketplace_posts" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_posts" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."round_scores" TO "anon";
GRANT ALL ON TABLE "public"."round_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."round_scores" TO "service_role";



GRANT ALL ON TABLE "public"."rounds" TO "anon";
GRANT ALL ON TABLE "public"."rounds" TO "authenticated";
GRANT ALL ON TABLE "public"."rounds" TO "service_role";



GRANT ALL ON TABLE "public"."scheduled_sessions" TO "anon";
GRANT ALL ON TABLE "public"."scheduled_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."scheduled_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."scope_marks" TO "anon";
GRANT ALL ON TABLE "public"."scope_marks" TO "authenticated";
GRANT ALL ON TABLE "public"."scope_marks" TO "service_role";



GRANT ALL ON TABLE "public"."stretching_plans" TO "anon";
GRANT ALL ON TABLE "public"."stretching_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."stretching_plans" TO "service_role";



GRANT ALL ON TABLE "public"."training_sessions" TO "anon";
GRANT ALL ON TABLE "public"."training_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."training_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."warmup_plans" TO "anon";
GRANT ALL ON TABLE "public"."warmup_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."warmup_plans" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "avatars public read"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "avatars user delete"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "avatars user update"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "avatars user upload"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



