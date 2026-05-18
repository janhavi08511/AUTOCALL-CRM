# 🚀 CRM Auto-Caller System - Quick Start Guide

## Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- npm or yarn

---

## 📦 Installation Steps

### 1. Database Setup

Create PostgreSQL database:
```sql
CREATE DATABASE crm_db;
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create `server/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/crm_db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=5000
NODE_ENV=development
MAX_FILE_SIZE=50000000
UPLOAD_PATH=./uploads
```

Run database migrations:
```bash
npx prisma db push
npx prisma generate
```

Seed loan categories:
```bash
node prisma/seed-loan-categories.js
```

Create admin user:
```bash
node create-admin.js
```

Start backend server:
```bash
npm run dev
```

Server will run on: `http://localhost:5000`

### 3. Frontend Setup

```bash
# From root directory
npm install
```

Create `.env` in root:
```env
VITE_API_URL=http://localhost:5000/api
```

Install axios if not present:
```bash
npm install axios
```

Start frontend:
```bash
npm run dev
```

Frontend will run on: `http://localhost:5173`

---

## 🔐 Default Login Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`
- Email: `admin@crm.com`

---

## 📋 System Flow

### For Admin:
1. Login with admin credentials
2. Create Manager accounts
3. Create Staff accounts (assign to managers)
4. Create/Manage Loan Categories
5. View all leads and call logs
6. Monitor system-wide reports

### For Manager:
1. Login with manager credentials
2. **Select Loan Type** (REQUIRED before upload)
3. Upload Excel file with customer data
4. View uploaded leads
5. Assign leads to staff members
6. Monitor staff performance
7. View reports and analytics

### For Staff:
1. Login with staff credentials
2. View assigned leads (phone masked: 98765XXXXX)
3. Click "Call" to reveal full phone number
4. Make call (auto-dial on mobile)
5. Update call status and notes
6. System auto-schedules retries

---

## 📊 Excel Upload Format

Download template from Manager dashboard or use this format:

| Name | Phone | Email | City | State |
|------|-------|-------|------|-------|
| John Doe | 9876543210 | john@example.com | Mumbai | Maharashtra |
| Jane Smith | 9876543211 | jane@example.com | Delhi | Delhi |

**Requirements:**
- Phone: 10 digits, no duplicates
- Name, Phone, City are mandatory
- Max 50,000 records per file

---

## 🔧 Testing the System

### 1. Test Admin Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2. Create Manager
```bash
curl -X POST http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "manager1",
    "email": "manager1@crm.com",
    "password": "manager123",
    "name": "Manager One",
    "role": "MANAGER"
  }'
```

### 3. Create Staff
```bash
curl -X POST http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "staff1",
    "email": "staff1@crm.com",
    "password": "staff123",
    "name": "Staff One",
    "role": "STAFF",
    "managerId": "MANAGER_ID_HERE"
  }'
```

---

## 🎯 Key Features Checklist

✅ Role-based authentication (Admin/Manager/Staff)  
✅ Loan type selection before Excel upload  
✅ Excel file processing (500+ customers)  
✅ Phone number masking for staff  
✅ Auto-dial integration  
✅ Call status tracking  
✅ Retry logic (3 attempts)  
✅ Lead assignment system  
✅ Dashboard with KPIs  
✅ Reports and analytics  
✅ Staff monitoring  
✅ Secure password hashing  
✅ JWT authentication  

---

## 📱 API Endpoints Summary

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Admin
- `GET /api/admin/dashboard/kpi` - Dashboard stats
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `GET /api/admin/loan-categories` - Loan types

### Manager
- `GET /api/manager/dashboard/stats` - Dashboard
- `POST /api/upload/excel` - Upload Excel
- `GET /api/manager/leads/unassigned` - Unassigned leads
- `POST /api/manager/leads/assign` - Assign leads

### Staff
- `GET /api/staff/leads` - Assigned leads (masked)
- `GET /api/staff/leads/:id/phone` - Get full phone
- `POST /api/staff/call-status` - Update call

---

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Verify DATABASE_URL in .env
# Run migrations again
npx prisma db push
```

### Port Already in Use
```bash
# Change PORT in server/.env
PORT=5001

# Or kill existing process
lsof -ti:5000 | xargs kill -9
```

### Excel Upload Fails
- Ensure loan type is selected first
- Check file format (.xlsx only)
- Verify phone numbers are 10 digits
- Check for duplicate phone numbers

### Staff Can't See Leads
- Verify leads are assigned to staff
- Check JWT token is valid
- Confirm staff role in database

---

## 📈 Production Deployment

### Backend (Node.js)
```bash
cd server
npm install --production
npm start
```

### Frontend (React)
```bash
npm run build
# Serve dist/ folder with nginx or similar
```

### Environment Variables (Production)
```env
NODE_ENV=production
DATABASE_URL=<production-database-url>
JWT_SECRET=<strong-random-secret>
PORT=5000
```

---

## 🔒 Security Best Practices

1. Change default admin password immediately
2. Use strong JWT_SECRET in production
3. Enable HTTPS/SSL
4. Regular database backups
5. Monitor API rate limits
6. Audit user access logs
7. Keep dependencies updated

---

## 📞 Support

For issues or questions:
1. Check SYSTEM_DOCUMENTATION.md
2. Review API logs in server console
3. Check browser console for frontend errors
4. Verify database connections

---

## 🎓 Next Steps

1. ✅ Complete installation
2. ✅ Login as admin
3. ✅ Create manager and staff users
4. ✅ Upload sample Excel data
5. ✅ Assign leads to staff
6. ✅ Test call functionality
7. ✅ Review reports and analytics

---

**System is now ready for use! 🎉**
