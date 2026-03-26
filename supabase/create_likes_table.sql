-- ═══════════════════════════════════════════════════════════════
-- PATCH D: Preemptive likes schema with anti-abuse constraints
-- Run in Supabase SQL Editor WHEN likes feature is implemented
-- ═══════════════════════════════════════════════════════════════
-- 1. Create likes table
CREATE TABLE IF NOT EXISTS likes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    talent_id BIGINT NOT NULL REFERENCES talents(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    -- CRITICAL: One vote per user per asset
    CONSTRAINT unique_like_per_user UNIQUE (user_id, talent_id)
);
-- 2. Anti-self-vote trigger
CREATE OR REPLACE FUNCTION prevent_self_like() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN IF EXISTS (
        SELECT 1
        FROM talents
        WHERE id = NEW.talent_id
            AND (
                owner_id = NEW.user_id
                OR user_id = NEW.user_id
            )
    ) THEN RAISE EXCEPTION 'Cannot like your own asset';
END IF;
RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS check_self_like ON likes;
CREATE TRIGGER check_self_like BEFORE
INSERT ON likes FOR EACH ROW EXECUTE FUNCTION prevent_self_like();
-- 3. RLS: Users can insert/delete their own likes, see all likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own likes" ON likes;
CREATE POLICY "Users can insert own likes" ON likes FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
CREATE POLICY "Users can delete own likes" ON likes FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
CREATE POLICY "Anyone can view likes" ON likes FOR
SELECT TO authenticated USING (true);
-- 4. Denormalized counter on talents (updated by trigger)
ALTER TABLE talents
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
CREATE OR REPLACE FUNCTION update_likes_count() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN IF TG_OP = 'INSERT' THEN
UPDATE talents
SET likes_count = likes_count + 1
WHERE id = NEW.talent_id;
RETURN NEW;
ELSIF TG_OP = 'DELETE' THEN
UPDATE talents
SET likes_count = GREATEST(likes_count - 1, 0)
WHERE id = OLD.talent_id;
RETURN OLD;
END IF;
RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS sync_likes_count ON likes;
CREATE TRIGGER sync_likes_count
AFTER
INSERT
    OR DELETE ON likes FOR EACH ROW EXECUTE FUNCTION update_likes_count();
-- 5. Index for fast queries
CREATE INDEX IF NOT EXISTS idx_likes_talent_id ON likes(talent_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);