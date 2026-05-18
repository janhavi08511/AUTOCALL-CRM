# DATA DICTIONARY - CRM Auto-Caller System

## 1. Table: users

| Field Name | Data Type | Size | Description |
|------------|-----------|------|-------------|
| id | VARCHAR | 30 | Primary Key (CUID) |
| username | VARCHAR | 100 | Unique login username |
| email | VARCHAR | 100 | Unique email address |
| password | VARCHAR | 255 | Encrypted password (bcrypt) |
| name | VARCHAR | 150 | User full name |
| role | ENUM | - | ADMIN / MANAGER / STAFF |
| isActive | BOOLEAN | - | Account active status |
| managerId | VARCHAR | 30 | Foreign Key (for staff users) |
| createdAt | TIMESTAMP | - | Account creation time |
| updatedAt | TIMESTAMP | - | Last update time |

---

## 2. Table: loan_categories

| Field Name | Data Type | Size | Description |
|------------|-----------|------|-------------|
| id | VARCHAR | 30 | Primary Key (CUID) |
| name | VARCHAR | 100 | Loan type name (unique) |
| code | VARCHAR | 50 | Loan code (unique) |
| description | TEXT | - | Loan description |
| isActive | BOOLEAN | - | Category active status |
| createdAt | TIMESTAMP | - | Creation time |
| updatedAt | TIMESTAMP | - | Last update time |

---

## 3. Table: leads

| Field Name | Data Type | Size | Description |
|------------|-----------|------|-------------|
| id | VARCHAR | 30 | Primary Key (CUID) |
| name | VARCHAR | 150 | Customer full name |
| phone | VARCHAR | 15 | Customer phone (unique) |
| email | VARCHAR | 100 | Customer email |
| city | VARCHAR | 100 | Customer city |
| state | VARCHAR | 100 | Customer state |
| loanCategoryId | VARCHAR | 30 | Foreign Key (loan type) |
| stage | ENUM | - | NEW/CONTACTED/INTERESTED/NOT_INTERESTED/FOLLOW_UP/CLOSED |
| retryCount | INTEGER | - | Number of call attempts |
| nextRetryAt | TIMESTAMP | - | Next scheduled retry time |
| isCompleted | BOOLEAN | - | Lead completion status |
| uploadedBy | VARCHAR | 30 | Foreign Key (manager ID) |
| assignedTo | VARCHAR | 30 | Foreign Key (staff ID) |
| createdAt | TIMESTAMP | - | Lead creation time |
| updatedAt | TIMESTAMP | - | Last update time |

---

## 4. Table: call_logs

| Field Name | Data Type | Size | Description |
|------------|-----------|------|-------------|
| id | VARCHAR | 30 | Primary Key (CUID) |
| leadId | VARCHAR | 30 | Foreign Key (customer) |
| staffId | VARCHAR | 30 | Foreign Key (caller staff) |
| callDuration | INTEGER | - | Call duration in seconds |
| callResult | ENUM | - | CONNECTED/NOT_CONNECTED/BUSY/NO_ANSWER/WRONG_NUMBER/NOT_INTERESTED |
| customerResponse | TEXT | - | Customer feedback |
| attemptNumber | INTEGER | - | Call attempt number |
| notes | TEXT | - | Call remarks/notes |
| createdAt | TIMESTAMP | - | Call timestamp |

---

## 5. Table: excel_uploads

| Field Name | Data Type | Size | Description |
|------------|-----------|------|-------------|
| id | VARCHAR | 30 | Primary Key (CUID) |
| filename | VARCHAR | 255 | Excel file name |
| totalRecords | INTEGER | - | Total rows in Excel |
| successfulRecords | INTEGER | - | Successfully inserted |
| failedRecords | INTEGER | - | Failed insertions |
| uploadedBy | VARCHAR | 30 | Admin/Manager ID |
| loanCategoryId | VARCHAR | 30 | Selected loan type |
| uploadedAt | TIMESTAMP | - | Upload timestamp |

---

## 6. Table: staff_sessions

| Field Name | Data Type | Size | Description |
|------------|-----------|------|-------------|
| id | VARCHAR | 30 | Primary Key (CUID) |
| staffId | VARCHAR | 30 | Foreign Key (staff user) |
| loginTime | TIMESTAMP | - | Session start time |
| logoutTime | TIMESTAMP | - | Session end time |
| totalWorkTime | INTEGER | - | Work time in minutes |
| totalBreakTime | INTEGER | - | Break time in minutes |
| status | ENUM | - | ACTIVE/ON_BREAK/OFFLINE |
| createdAt | TIMESTAMP | - | Session creation time |

---

## 7. Table: pending_details

| Field Name | Data Type | Size | Description |
|------------|-----------|------|-------------|
| id | VARCHAR | 30 | Primary Key (CUID) |
| leadId | VARCHAR | 30 | Foreign Key (lead) |
| field | VARCHAR | 100 | Field name (e.g., "emi_from_bank") |
| value | TEXT | - | Field value |
| isFilled | BOOLEAN | - | Completion status |
| createdAt | TIMESTAMP | - | Creation time |
| updatedAt | TIMESTAMP | - | Last update time |

---

## Relationships

### users → leads
- One user (Manager) can upload many leads
- One user (Staff) can be assigned many leads

### loan_categories → leads
- One loan category can have many leads

### leads → call_logs
- One lead can have many call logs

### users → call_logs
- One staff user can have many call logs

### users → staff_sessions
- One staff user can have many sessions

### leads → pending_details
- One lead can have many pending details

---

## Indexes

### leads table
- Index on `phone` (unique)
- Index on `loanCategoryId`
- Index on `uploadedBy`
- Index on `assignedTo`
- Index on `createdAt`

### call_logs table
- Index on `leadId`
- Index on `staffId`
- Index on `createdAt`

### users table
- Unique index on `username`
- Unique index on `email`

---

## Enums

### UserRole
- ADMIN
- MANAGER
- STAFF

### LeadStage
- NEW
- CONTACTED
- INTERESTED
- NOT_INTERESTED
- FOLLOW_UP
- CLOSED

### CallResult
- CONNECTED
- NOT_CONNECTED
- BUSY
- NO_ANSWER
- WRONG_NUMBER
- NOT_INTERESTED

### SessionStatus
- ACTIVE
- ON_BREAK
- OFFLINE

---

## Data Constraints

1. **Phone numbers**: Must be unique across all leads
2. **Username**: Must be unique across all users
3. **Email**: Must be unique across all users
4. **Loan category code**: Must be unique
5. **Password**: Minimum 6 characters (hashed with bcrypt)
6. **Excel upload**: Maximum 50,000 records per file
7. **Retry attempts**: Maximum 3 attempts per lead

---

## Data Validation Rules

1. Phone number: 10 digits, numeric only
2. Email: Valid email format
3. Role: Must be ADMIN, MANAGER, or STAFF
4. Loan category: Must exist and be active before upload
5. Staff assignment: Staff must belong to the manager
6. Call duration: Non-negative integer
7. Retry count: 0-3 range

---

## Security Measures

1. Passwords stored as bcrypt hash (salt rounds: 10)
2. JWT tokens expire after 24 hours
3. Phone numbers masked for staff (first 5 digits visible)
4. Role-based access control on all endpoints
5. Rate limiting: 100 requests per 15 minutes
6. CORS restricted to allowed origins

---

## Backup & Maintenance

1. Daily automated database backups
2. Transaction logs retained for 90 days
3. Soft delete for critical records
4. Audit trail for user actions
5. Regular index optimization
6. Quarterly data archival for old leads

---

**Note**: This data dictionary follows PostgreSQL with Prisma ORM conventions. CUID is used for primary keys instead of auto-increment integers for better scalability and security.
