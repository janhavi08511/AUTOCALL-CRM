# CRM Auto-Caller System - Complete Documentation

## System Architecture

### Tech Stack
- **Frontend**: React.js + Vite + TypeScript
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **File Processing**: XLSX library for Excel handling

---

## Database Schema (Prisma)

### Tables Overview

1. **users** - Admin, Manager, Staff accounts
2. **loan_categories** - Loan types (Home, Personal, Business, etc.)
3. **leads** - Customer data uploaded from Excel
4. **call_logs** - Call history and responses
5. **excel_uploads** - Upload tracking
6. **staff_sessions** - Staff work time monitoring
7. **pending_details** - Half-filled customer data

### Key Fields

**users table:**
- id, username, email, password (hashed), name, role (ADMIN/MANAGER/STAFF)
- managerId (for staff), isActive, createdAt, updatedAt

**leads table:**
- id, name, phone (unique), email, city, state
- loanCategoryId, stage (NEW/CONTACTED/INTERESTED/NOT_INTERESTED/FOLLOW_UP/CLOSED)
- uploadedBy (manager), assignedTo (staff)
- retryCount, nextRetryAt, isCompleted

**call_logs table:**
- id, leadId, staffId, callDuration, callResult
- customerResponse, attemptNumber, notes, createdAt

---

## API Endpoints

### Authentication (`/api/auth`)
- POST `/login` - User login
- GET `/me` - Get current user
- POST `/logout` - Logout

### Admin (`/api/admin`)
- GET `/dashboard/kpi` - Dashboard statistics
- GET `/users` - List all users
- POST `/users` - Create new user
- PUT `/users/:id` - Update user
- GET `/loan-categories` - Manage loan types
- POST `/loan-categories` - Create loan type
- GET `/leads` - View all leads (read-only)
- GET `/call-logs` - Monitor all calls

### Manager (`/api/manager`)
- GET `/dashboard/stats` - Manager dashboard
- GET `/dashboard/charts` - Chart data
- GET `/loan-categories` - Active loan types
- GET `/leads/unassigned` - Unassigned leads
- GET `/staff` - Staff list
- POST `/leads/assign` - Auto-assign leads to staff
- GET `/staff/monitoring` - Live staff monitoring
- GET `/reports` - Filtered reports

### Staff (`/api/staff`)
- GET `/dashboard/stats` - Staff dashboard
- GET `/leads` - Assigned leads (phone masked: 98765XXXXX)
- GET `/leads/:id/phone` - Get full phone for calling
- POST `/call-status` - Update call result
- GET `/call-history` - Call history

### Upload (`/api/upload`)
- POST `/excel` - Upload Excel with loan type selection
- GET `/loan-categories` - Get loan types for upload
- GET `/history` - Upload history
- GET `/template` - Download sample Excel template

---

## Key Features Implementation

### 1. Role-Based Login
- JWT authentication with role verification
- Middleware: `authenticateToken`, `requireRole`
- Roles: ADMIN, MANAGER, STAFF

### 2. Excel Upload with Loan Type Selection
**Flow:**
1. Manager selects loan type (REQUIRED)
2. Uploads Excel file (.xlsx)
3. System validates: phone format, duplicates
4. Batch inserts (1000 records per batch)
5. Creates upload log

**Excel Format:**
```
Name | Phone | Email | City | State
John | 9876543210 | john@example.com | Mumbai | Maharashtra
```

### 3. Phone Number Masking (Staff)
- Staff sees: `98765XXXXX` (first 5 digits only)
- When clicking "Call", API returns full number
- Security: Only assigned leads accessible

### 4. Auto-Caller Integration
- Staff clicks "Call" button
- System reveals full phone number
- `tel:` link for mobile auto-dial
- Staff logs call result immediately

### 5. Call Status Tracking
**Call Results:**
- CONNECTED
- NOT_CONNECTED
- BUSY
- NO_ANSWER
- WRONG_NUMBER
- NOT_INTERESTED

**Customer Responses (if connected):**
- INTERESTED
- NOT_INTERESTED
- FOLLOW_UP

**Retry Logic:**
- Attempt 1: Retry after 2 hours
- Attempt 2: Retry next day
- Attempt 3+: Mark as CLOSED

### 6. Lead Assignment
**Auto-Assignment:**
- Manager selects filters (city, loan type)
- Selects staff members
- System distributes leads equally
- Updates assignedTo field

### 7. Reports & Monitoring
**Manager can filter by:**
- Loan type
- Staff member
- Date range
- Call result
- City

**Admin can view:**
- All leads (phone masked)
- All call logs
- Staff sessions
- Upload history

---

## Setup Instructions

### Backend Setup
```bash
cd server
npm install
```

Create `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/crm_db"
JWT_SECRET="your-secret-key"
PORT=5000
```

Run migrations:
```bash
npx prisma db push
npx prisma generate
```

Start server:
```bash
npm run dev
```

### Frontend Setup
```bash
npm install
```

Create `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

Start dev server:
```bash
npm run dev
```

---

## Security Features

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Tokens**: 24-hour expiration
3. **Rate Limiting**: 100 requests per 15 minutes
4. **Helmet.js**: Security headers
5. **CORS**: Restricted origins
6. **Phone Masking**: Staff can't see full numbers until calling
7. **Role-Based Access**: Middleware enforcement

---

## Production Deployment

### Environment Variables
```
NODE_ENV=production
DATABASE_URL=<production-db-url>
JWT_SECRET=<strong-secret>
PORT=5000
MAX_FILE_SIZE=50000000
```

### Build Commands
```bash
# Frontend
npm run build

# Backend
npm start
```

---

## Sample Data

### Create Admin User
```bash
cd server
node create-admin.js
```

### Seed Loan Categories
```bash
node prisma/seed-loan-categories.js
```

**Default Loan Types:**
- Home Loan (HOME)
- Personal Loan (PERSONAL)
- Business Loan (BUSINESS)
- Car Loan (CAR)
- Education Loan (EDUCATION)

---

## Testing

### Test Admin Login
```bash
POST http://localhost:5000/api/auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

### Test Excel Upload
```bash
POST http://localhost:5000/api/upload/excel
Headers: Authorization: Bearer <token>
Body: FormData
  - file: <excel-file>
  - loanCategoryId: <loan-id>
```

---

## Common Issues & Solutions

**Issue**: Excel upload fails
- Check file format (.xlsx)
- Verify loan type is selected
- Check phone number format (10 digits)

**Issue**: Staff can't see leads
- Verify leads are assigned
- Check JWT token validity
- Confirm staff role in database

**Issue**: Database connection error
- Verify DATABASE_URL in .env
- Check PostgreSQL is running
- Run `npx prisma db push`

---

## Future Enhancements

1. **Real Auto-Dialer Integration**: Twilio/Exotel API
2. **SMS Notifications**: Send follow-up SMS
3. **WhatsApp Integration**: Customer communication
4. **Advanced Analytics**: Conversion rates, performance metrics
5. **Voice Recording**: Store call recordings
6. **AI Suggestions**: Next best action recommendations
7. **Mobile App**: React Native for field staff

---

## Support & Maintenance

- Regular database backups
- Monitor API performance
- Update dependencies monthly
- Review security patches
- Audit user access logs

---

## License
Proprietary - Internal Use Only
