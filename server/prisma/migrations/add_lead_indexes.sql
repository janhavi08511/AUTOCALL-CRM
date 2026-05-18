-- Migration: Add indexes to leads table for Excel Upload feature
-- This migration adds performance indexes for the Excel Upload feature

-- Add index on loan_category_id for filtering by loan type
CREATE INDEX IF NOT EXISTS "leads_loanCategoryId_idx" ON "leads"("loanCategoryId");

-- Add index on phone for duplicate checking (if not already unique)
CREATE INDEX IF NOT EXISTS "leads_phone_idx" ON "leads"("phone");

-- Add index on created_at for date-based queries
CREATE INDEX IF NOT EXISTS "leads_createdAt_idx" ON "leads"("createdAt");

-- Add index on uploaded_by for user-based filtering
CREATE INDEX IF NOT EXISTS "leads_uploadedBy_idx" ON "leads"("uploadedBy");

-- Verify indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    tablename = 'leads'
ORDER BY 
    indexname;
