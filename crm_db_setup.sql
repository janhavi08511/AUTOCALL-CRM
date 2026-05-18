-- ============================================================
-- CRM AUTO-CALLER LOAN MANAGEMENT SYSTEM
-- Complete Database Setup File for PostgreSQL
-- Database: crm_db
-- ============================================================

-- Step 1: Create Database (run this separately if needed)
-- CREATE DATABASE crm_db;
-- \c crm_db;

-- ============================================================
-- DROP EXISTING TABLES (clean setup)
-- ============================================================
DROP TABLE IF EXISTS "excel_uploads" CASCADE;
DROP TABLE IF EXISTS "pending_details" CASCADE;
DROP TABLE IF EXISTS "call_logs" CASCADE;
DROP TABLE IF EXISTS "staff_sessions" CASCADE;
DROP TABLE IF EXISTS "leads" CASCADE;
DROP TABLE IF EXISTS "loan_categories" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- ============================================================
-- DROP EXISTING ENUMS
-- ============================================================
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "LeadStage" CASCADE;
DROP TYPE IF EXISTS "CallResult" CASCADE;
DROP TYPE IF EXISTS "SessionStatus" CASCADE;

-- ============================================================
-- CREATE ENUMS
-- ============================================================

CREATE TYPE "UserRole" AS ENUM (
  'ADMIN',
  'MANAGER',
  'STAFF'
);

CREATE TYPE "LeadStage" AS ENUM (
  'NEW',
  'CONTACTED',
  'INTERESTED',
  'NOT_INTERESTED',
  'FOLLOW_UP',
  'CLOSED'
);

CREATE TYPE "CallResult" AS ENUM (
  'CONNECTED',
  'NOT_CONNECTED',
  'BUSY',
  'NO_ANSWER',
  'WRONG_NUMBER',
  'NOT_INTERESTED'
);

CREATE TYPE "SessionStatus" AS ENUM (
  'ACTIVE',
  'ON_BREAK',
  'OFFLINE'
);

-- ============================================================
-- TABLE 1: users
-- Stores Admin, Manager, and Staff accounts
-- ============================================================
CREATE TABLE "users" (
  "id"          VARCHAR(30)   NOT NULL,
  "username"    VARCHAR(100)  NOT NULL,
  "email"       VARCHAR(100)  NOT NULL,
  "password"    VARCHAR(255)  NOT NULL,
  "name"        VARCHAR(150)  NOT NULL,
  "role"        "UserRole"    NOT NULL,
  "isActive"    BOOLEAN       NOT NULL DEFAULT true,
  "managerId"   VARCHAR(30),
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "users_username_key" UNIQUE ("username"),
  CONSTRAINT "users_email_key" UNIQUE ("email"),
  CONSTRAINT "users_managerId_fkey"
    FOREIGN KEY ("managerId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================================
-- TABLE 2: loan_categories
-- Master table for loan types
-- ============================================================
CREATE TABLE "loan_categories" (
  "id"          VARCHAR(30)   NOT NULL,
  "name"        VARCHAR(100)  NOT NULL,
  "code"        VARCHAR(50)   NOT NULL,
  "description" TEXT,
  "isActive"    BOOLEAN       NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "loan_categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "loan_categories_name_key" UNIQUE ("name"),
  CONSTRAINT "loan_categories_code_key" UNIQUE ("code")
);

-- ============================================================
-- TABLE 3: leads
-- Customer data uploaded from Excel files
-- ============================================================
CREATE TABLE "leads" (
  "id"              VARCHAR(30)   NOT NULL,
  "name"            VARCHAR(150)  NOT NULL,
  "phone"           VARCHAR(15)   NOT NULL,
  "email"           VARCHAR(100),
  "city"            VARCHAR(100)  NOT NULL,
  "state"           VARCHAR(100),
  "loanCategoryId"  VARCHAR(30)   NOT NULL,
  "stage"           "LeadStage"   NOT NULL DEFAULT 'NEW',
  "retryCount"      INTEGER       NOT NULL DEFAULT 0,
  "nextRetryAt"     TIMESTAMP(3),
  "isCompleted"     BOOLEAN       NOT NULL DEFAULT false,
  "uploadedBy"      VARCHAR(30)   NOT NULL,
  "assignedTo"      VARCHAR(30),
  "createdAt"       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "leads_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "leads_phone_key" UNIQUE ("phone"),
  CONSTRAINT "leads_loanCategoryId_fkey"
    FOREIGN KEY ("loanCategoryId") REFERENCES "loan_categories"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "leads_uploadedBy_fkey"
    FOREIGN KEY ("uploadedBy") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "leads_assignedTo_fkey"
    FOREIGN KEY ("assignedTo") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================================
-- TABLE 4: call_logs
-- Records every call made by staff
-- ============================================================
CREATE TABLE "call_logs" (
  "id"               VARCHAR(30)   NOT NULL,
  "leadId"           VARCHAR(30)   NOT NULL,
  "staffId"          VARCHAR(30)   NOT NULL,
  "callDuration"     INTEGER,
  "callResult"       "CallResult"  NOT NULL,
  "customerResponse" TEXT,
  "attemptNumber"    INTEGER       NOT NULL DEFAULT 1,
  "notes"            TEXT,
  "createdAt"        TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "call_logs_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "leads"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "call_logs_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
-- TABLE 5: staff_sessions
-- Tracks staff login/logout and work time
-- ============================================================
CREATE TABLE "staff_sessions" (
  "id"             VARCHAR(30)     NOT NULL,
  "staffId"        VARCHAR(30)     NOT NULL,
  "loginTime"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "logoutTime"     TIMESTAMP(3),
  "totalWorkTime"  INTEGER,
  "totalBreakTime" INTEGER,
  "status"         "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "staff_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "staff_sessions_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
-- TABLE 6: excel_uploads
-- Tracks every Excel file upload
-- ============================================================
CREATE TABLE "excel_uploads" (
  "id"                VARCHAR(30)   NOT NULL,
  "filename"          VARCHAR(255)  NOT NULL,
  "totalRecords"      INTEGER       NOT NULL,
  "successfulRecords" INTEGER       NOT NULL,
  "failedRecords"     INTEGER       NOT NULL,
  "uploadedBy"        VARCHAR(30)   NOT NULL,
  "loanCategoryId"    VARCHAR(30)   NOT NULL,
  "uploadedAt"        TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "excel_uploads_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- TABLE 7: pending_details
-- Stores incomplete/half-filled customer data fields
-- ============================================================
CREATE TABLE "pending_details" (
  "id"        VARCHAR(30)   NOT NULL,
  "leadId"    VARCHAR(30)   NOT NULL,
  "field"     VARCHAR(100)  NOT NULL,
  "value"     TEXT,
  "isFilled"  BOOLEAN       NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "pending_details_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pending_details_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "leads"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- INDEXES (for performance)
-- ============================================================

-- leads indexes
CREATE INDEX "leads_loanCategoryId_idx"  ON "leads"("loanCategoryId");
CREATE INDEX "leads_phone_idx"           ON "leads"("phone");
CREATE INDEX "leads_createdAt_idx"       ON "leads"("createdAt");
CREATE INDEX "leads_uploadedBy_idx"      ON "leads"("uploadedBy");
CREATE INDEX "leads_assignedTo_idx"      ON "leads"("assignedTo");
CREATE INDEX "leads_stage_idx"           ON "leads"("stage");

-- call_logs indexes
CREATE INDEX "call_logs_leadId_idx"      ON "call_logs"("leadId");
CREATE INDEX "call_logs_staffId_idx"     ON "call_logs"("staffId");
CREATE INDEX "call_logs_createdAt_idx"   ON "call_logs"("createdAt");
CREATE INDEX "call_logs_callResult_idx"  ON "call_logs"("callResult");

-- staff_sessions indexes
CREATE INDEX "staff_sessions_staffId_idx" ON "staff_sessions"("staffId");
CREATE INDEX "staff_sessions_status_idx"  ON "staff_sessions"("status");

-- excel_uploads indexes
CREATE INDEX "excel_uploads_uploadedBy_idx"     ON "excel_uploads"("uploadedBy");
CREATE INDEX "excel_uploads_loanCategoryId_idx" ON "excel_uploads"("loanCategoryId");

-- ============================================================
-- SEED DATA: Loan Categories
-- ============================================================
INSERT INTO "loan_categories" ("id", "name", "code", "description", "isActive", "createdAt", "updatedAt") VALUES
  ('lc_home_001',  'Home Loan',              'HOME',     'Residential property purchase loans',         true, NOW(), NOW()),
  ('lc_per_002',   'Personal Loan',          'PERSONAL', 'Unsecured personal loans for any purpose',    true, NOW(), NOW()),
  ('lc_biz_003',   'Business Loan',          'BUSINESS', 'SME and business financing',                  true, NOW(), NOW()),
  ('lc_car_004',   'Car Loan',               'CAR',      'New and used vehicle financing',              true, NOW(), NOW()),
  ('lc_edu_005',   'Education Loan',         'EDUCATION','Student loans for higher education',          true, NOW(), NOW()),
  ('lc_gld_006',   'Gold Loan',              'GOLD',     'Instant loans against gold jewellery',        true, NOW(), NOW()),
  ('lc_lap_007',   'Loan Against Property',  'LAP',      'Secured loans against residential/commercial property', true, NOW(), NOW());

-- ============================================================
-- SEED DATA: Admin User
-- Password: admin123 (bcrypt hashed)
-- ============================================================
INSERT INTO "users" ("id", "username", "email", "password", "name", "role", "isActive", "managerId", "createdAt", "updatedAt") VALUES
  (
    'usr_admin_001',
    'admin',
    'admin@crm.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'System Administrator',
    'ADMIN',
    true,
    NULL,
    NOW(),
    NOW()
  );

-- ============================================================
-- SEED DATA: Sample Manager
-- Password: manager123 (bcrypt hashed)
-- ============================================================
INSERT INTO "users" ("id", "username", "email", "password", "name", "role", "isActive", "managerId", "createdAt", "updatedAt") VALUES
  (
    'usr_mgr_001',
    'manager1',
    'manager1@crm.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Rajesh Kumar',
    'MANAGER',
    true,
    NULL,
    NOW(),
    NOW()
  );

-- ============================================================
-- SEED DATA: Sample Staff Members
-- Password: staff123 (bcrypt hashed)
-- ============================================================
INSERT INTO "users" ("id", "username", "email", "password", "name", "role", "isActive", "managerId", "createdAt", "updatedAt") VALUES
  (
    'usr_stf_001',
    'staff1',
    'staff1@crm.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Priya Sharma',
    'STAFF',
    true,
    'usr_mgr_001',
    NOW(),
    NOW()
  ),
  (
    'usr_stf_002',
    'staff2',
    'staff2@crm.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Amit Patel',
    'STAFF',
    true,
    'usr_mgr_001',
    NOW(),
    NOW()
  ),
  (
    'usr_stf_003',
    'staff3',
    'staff3@crm.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Sneha Verma',
    'STAFF',
    true,
    'usr_mgr_001',
    NOW(),
    NOW()
  );

-- ============================================================
-- SEED DATA: Sample Leads
-- ============================================================
INSERT INTO "leads" ("id", "name", "phone", "email", "city", "state", "loanCategoryId", "stage", "retryCount", "isCompleted", "uploadedBy", "assignedTo", "createdAt", "updatedAt") VALUES
  ('lead_001', 'Arjun Mehta',    '9876543201', 'arjun@example.com',   'Mumbai',    'Maharashtra', 'lc_home_001', 'NEW',           0, false, 'usr_mgr_001', 'usr_stf_001', NOW(), NOW()),
  ('lead_002', 'Kavya Nair',     '9876543202', 'kavya@example.com',   'Pune',      'Maharashtra', 'lc_per_002',  'CONTACTED',     1, false, 'usr_mgr_001', 'usr_stf_001', NOW(), NOW()),
  ('lead_003', 'Rohit Singh',    '9876543203', 'rohit@example.com',   'Delhi',     'Delhi',       'lc_biz_003',  'INTERESTED',    1, false, 'usr_mgr_001', 'usr_stf_002', NOW(), NOW()),
  ('lead_004', 'Meena Iyer',     '9876543204', 'meena@example.com',   'Chennai',   'Tamil Nadu',  'lc_car_004',  'FOLLOW_UP',     2, false, 'usr_mgr_001', 'usr_stf_002', NOW(), NOW()),
  ('lead_005', 'Suresh Gupta',   '9876543205', 'suresh@example.com',  'Bangalore', 'Karnataka',   'lc_edu_005',  'NEW',           0, false, 'usr_mgr_001', 'usr_stf_003', NOW(), NOW()),
  ('lead_006', 'Pooja Desai',    '9876543206', 'pooja@example.com',   'Ahmedabad', 'Gujarat',     'lc_gld_006',  'NOT_INTERESTED',3, true,  'usr_mgr_001', 'usr_stf_003', NOW(), NOW()),
  ('lead_007', 'Vikram Rao',     '9876543207', 'vikram@example.com',  'Hyderabad', 'Telangana',   'lc_lap_007',  'NEW',           0, false, 'usr_mgr_001', NULL,          NOW(), NOW()),
  ('lead_008', 'Anita Joshi',    '9876543208', 'anita@example.com',   'Jaipur',    'Rajasthan',   'lc_home_001', 'NEW',           0, false, 'usr_mgr_001', NULL,          NOW(), NOW()),
  ('lead_009', 'Deepak Tiwari',  '9876543209', 'deepak@example.com',  'Lucknow',   'Uttar Pradesh','lc_per_002', 'CONTACTED',     1, false, 'usr_mgr_001', 'usr_stf_001', NOW(), NOW()),
  ('lead_010', 'Ritu Kapoor',    '9876543210', 'ritu@example.com',    'Kolkata',   'West Bengal', 'lc_biz_003',  'CLOSED',        3, true,  'usr_mgr_001', 'usr_stf_002', NOW(), NOW());

-- ============================================================
-- SEED DATA: Sample Call Logs
-- ============================================================
INSERT INTO "call_logs" ("id", "leadId", "staffId", "callDuration", "callResult", "customerResponse", "attemptNumber", "notes", "createdAt") VALUES
  ('cl_001', 'lead_002', 'usr_stf_001', 45,  'CONNECTED',     'FOLLOW_UP',      1, 'Customer asked to call back tomorrow',         NOW()),
  ('cl_002', 'lead_003', 'usr_stf_002', 120, 'CONNECTED',     'INTERESTED',     1, 'Very interested in business loan, needs docs', NOW()),
  ('cl_003', 'lead_004', 'usr_stf_002', 30,  'CONNECTED',     'FOLLOW_UP',      1, 'Will decide after discussing with family',     NOW()),
  ('cl_004', 'lead_004', 'usr_stf_002', 0,   'NO_ANSWER',     NULL,             2, 'No answer, scheduled retry',                  NOW()),
  ('cl_005', 'lead_006', 'usr_stf_003', 60,  'CONNECTED',     'NOT_INTERESTED', 1, 'Already has a loan, not interested',           NOW()),
  ('cl_006', 'lead_009', 'usr_stf_001', 90,  'CONNECTED',     'INTERESTED',     1, 'Interested in personal loan for home renovation', NOW()),
  ('cl_007', 'lead_010', 'usr_stf_002', 0,   'NOT_CONNECTED', NULL,             1, 'Phone switched off',                          NOW()),
  ('cl_008', 'lead_010', 'usr_stf_002', 0,   'BUSY',          NULL,             2, 'Line busy',                                   NOW()),
  ('cl_009', 'lead_010', 'usr_stf_002', 0,   'NO_ANSWER',     NULL,             3, 'No answer, marking closed',                   NOW());

-- ============================================================
-- SEED DATA: Sample Excel Upload Log
-- ============================================================
INSERT INTO "excel_uploads" ("id", "filename", "totalRecords", "successfulRecords", "failedRecords", "uploadedBy", "loanCategoryId", "uploadedAt") VALUES
  ('eu_001', 'home_loan_leads_jan.xlsx',     10, 10, 0, 'usr_mgr_001', 'lc_home_001', NOW()),
  ('eu_002', 'personal_loan_leads_jan.xlsx',  5,  4, 1, 'usr_mgr_001', 'lc_per_002',  NOW());

-- ============================================================
-- SEED DATA: Sample Staff Session
-- ============================================================
INSERT INTO "staff_sessions" ("id", "staffId", "loginTime", "logoutTime", "totalWorkTime", "totalBreakTime", "status", "createdAt") VALUES
  ('ss_001', 'usr_stf_001', NOW() - INTERVAL '4 hours', NULL,                          240, 15, 'ACTIVE',   NOW()),
  ('ss_002', 'usr_stf_002', NOW() - '3 hours'::INTERVAL, NULL,                         180, 10, 'ON_BREAK', NOW()),
  ('ss_003', 'usr_stf_003', NOW() - '8 hours'::INTERVAL, NOW() - '1 hour'::INTERVAL,  420, 30, 'OFFLINE',  NOW());

-- ============================================================
-- VERIFICATION QUERIES (run to confirm setup)
-- ============================================================

-- SELECT 'users'          AS table_name, COUNT(*) AS total FROM "users";
-- SELECT 'loan_categories' AS table_name, COUNT(*) AS total FROM "loan_categories";
-- SELECT 'leads'           AS table_name, COUNT(*) AS total FROM "leads";
-- SELECT 'call_logs'       AS table_name, COUNT(*) AS total FROM "call_logs";
-- SELECT 'excel_uploads'   AS table_name, COUNT(*) AS total FROM "excel_uploads";
-- SELECT 'staff_sessions'  AS table_name, COUNT(*) AS total FROM "staff_sessions";

-- ============================================================
-- DEFAULT LOGIN CREDENTIALS
-- ============================================================
-- Admin   : username=admin     | password=admin123
-- Manager : username=manager1  | password=manager123
-- Staff 1 : username=staff1    | password=staff123
-- Staff 2 : username=staff2    | password=staff123
-- Staff 3 : username=staff3    | password=staff123
--
-- NOTE: The hashed password above is for "password" (bcrypt default).
-- Run the following Node.js scripts to generate correct hashes:
--   cd server
--   node create-admin.js          (creates admin with admin123)
--   node prisma/seed-loan-categories.js  (seeds loan types)
-- ============================================================
