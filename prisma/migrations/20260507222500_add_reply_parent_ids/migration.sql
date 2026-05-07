ALTER TABLE "message_replies"
ADD COLUMN IF NOT EXISTS "parentId" TEXT;

ALTER TABLE "event_comments"
ADD COLUMN IF NOT EXISTS "parentId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'message_replies_parentId_fkey'
  ) THEN
    ALTER TABLE "message_replies"
    ADD CONSTRAINT "message_replies_parentId_fkey"
    FOREIGN KEY ("parentId")
    REFERENCES "message_replies"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'event_comments_parentId_fkey'
  ) THEN
    ALTER TABLE "event_comments"
    ADD CONSTRAINT "event_comments_parentId_fkey"
    FOREIGN KEY ("parentId")
    REFERENCES "event_comments"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
  END IF;
END $$;
