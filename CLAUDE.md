# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Smart Logistics & Truck Management System

Team 1: Admin Dashboard & Backend
Project: Dammam Urban Development Challenge 2025 - Challenge #2
Timeline: 4-day hackathon (February 2026)
Tech Stack: Next.js 16, Supabase (PostgreSQL), TypeScript, Tailwind CSS

## ⚡ MAJOR ARCHITECTURAL UPDATE (Feb 2026)

**NEW PARADIGM: Organization-Based Job Management**

❌ **OLD**: Individual drivers book permits themselves
✅ **NEW**: Logistics companies create jobs → assign drivers → permits auto-generated

**Key Innovation**: Vessel-driven congestion prediction

- Vessels arrive early morning (7-9am)
- Containers ready 2-4 hours later
- Creates 10am-2pm truck surge
- **Solution**: Predict vessel impact, warn companies, spread loads to night shifts (24/7 operation)

## Project Mission

Build an AI-powered traffic management system that reduces port-related truck congestion on King Abdulaziz Road (Dammam) by 30-40% using priority-aware dynamic permit management with vessel schedule integration.

**The Problem**:

- 1,260 trucks per day to Dammam seaport cause massive traffic congestion
- Vessel arrivals drive predictable 10am-2pm truck surges
- Current system treats all trucks equally regardless of cargo urgency

**The Solution**:

- Organizations (SMSA, Aramex, Naqel) create delivery jobs
- System predicts congestion from vessel schedules
- Auto-assigns time slots avoiding vessel-driven surges
- Priority protection: EMERGENCY cargo NEVER delayed
- Night shift incentives to spread load across 24 hours

## System Architecture

```
[Vessel Arrives 8am] → [Containers Ready 10am] → [Truck Surge Predicted]
                                                           ↓
[Organization Dashboard] → Create Job → Assign Driver → [Auto-generate Permit]
                                                           ↓
                                            [Traffic Camera: AI/YOLO] → Detect Congestion
                                                           ↓
                                            [Priority Logic: Protect EMERGENCY]
                                                           ↓
                                            [Driver Mobile App: Receives Job]
```

Three Teams:

- Team 1 (Backend & Dashboard): Backend APIs + Admin Dashboard + Organization Portal
- Team 2 (Mobile App): React Native driver mobile app (receives job assignments)
- Team 3 (AI/Computer Vision): Python + YOLO (sends traffic data to our backend)

## Core Innovation: Priority System

Four-Tier Classification (THIS IS THE CORE VALUE PROPOSITION):

| Priority  | Cargo Type                                  | Max Delay | Can Be Halted |
| --------- | ------------------------------------------- | --------- | ------------- |
| EMERGENCY | Medical supplies, vaccines, perishable food | 0 min     | No            |
| ESSENTIAL | E-commerce, JIT manufacturing               | 2 hours   | No            |
| NORMAL    | Standard containers                         | 8 hours   | Yes           |
| LOW       | Bulk materials                              | 24 hours  | Yes           |

Traffic Status Response:

- NORMAL (< 100 vehicles): Approve all permits
- MODERATE (100-150 vehicles): Warn drivers, prioritize urgent
- CONGESTED (> 150 vehicles): HALT NORMAL & LOW only, protect EMERGENCY & ESSENTIAL

## Database Schema (Supabase PostgreSQL)

Core Tables (Organization-Based System):

1. **organizations** - Logistics companies (SMSA, Aramex, Naqel)
2. **drivers** - Linked to organizations, receive job assignments
3. **jobs** - Shipment assignments created by organizations
4. **permits** - Auto-generated when job is assigned to driver
5. **time_slots** - 24/7 bookable windows (capacity adjusted by vessels)
6. **vessel_schedules** - Port ship arrivals (drives congestion prediction)
7. **priority_rules** - Priority tier definitions
8. **traffic_updates** - AI camera data feed
9. **driver_locations** - GPS tracking
10. **notifications** - Push notification log

Critical Database Functions:

```sql
-- Auto-generate human-readable permit codes
generate_permit_code() → 'P-20260210-1234'

-- Map cargo type to priority level
get_priority_from_cargo('PERISHABLE') → 'EMERGENCY'

-- Adjust slot capacity based on vessel arrivals
adjust_slot_capacity_for_vessels()
-- Reduces capacity 10am-2pm when vessels arrive 8am

-- Find best available slot matching preferences
find_best_slot(date, time, priority) → slot_id

-- Halt low-priority permits during congestion
halt_permits_by_priority(traffic_status text)
-- When CONGESTED: halt NORMAL & LOW, protect EMERGENCY & ESSENTIAL
```

## API Endpoints

### Organization Portal (NEW - Core Workflow)

**POST /api/org/auth/login**
Organization login with email/password (session-based auth)

**GET /api/org/drivers**
List company's drivers with availability status

**POST /api/org/drivers/register**
Register new driver for the organization

**POST /api/org/jobs/create** (CRITICAL)
Create delivery job → Returns vessel warning + available drivers

- Shows: "⚠️ 3 vessels arriving tomorrow, 560 trucks expected 10am-4pm"
- Suggests: Alternative time slots (night shifts, off-peak)

**POST /api/org/jobs/{job_id}/assign** (MOST CRITICAL)
Assign driver to job → Auto-generates permit

- Finds best available slot
- Creates permit with QR code + permit code
- Sends notification (app or SMS based on driver.has_smartphone)
- Returns permit details and delivery method

**GET /api/org/jobs**
List jobs with filters (status, date, priority)

**GET /api/org/jobs/{job_id}/track**
Track job progress (driver location, permit status, timeline)

**POST /api/org/jobs/{job_id}/auto-assign** ⚡ NEW (Feb 12, 2026)
Auto-assign best available driver → Creates permit in one click

- Finds best available driver (first active & available)
- Calls find_best_slot() to get optimal time
- Generates permit with QR code
- Marks driver as unavailable
- Sends notification (SMS or App)
- Returns: driver details, permit code, notification method

### Driver Mobile App (Modified for Job System)

**GET /api/driver/jobs/active**
Get assigned jobs with permit details (replaces individual booking)

**POST /api/driver/jobs/{job_id}/complete**
Mark job as completed

**POST /api/locations**
Record GPS location updates

### Admin Dashboard

**GET /api/traffic** (Team 3: AI/YOLO)
Receives traffic updates from AI camera system

**GET /api/vessels/upcoming**
Vessel schedules with truck surge predictions

**GET /api/analytics/daily**
Dashboard charts (permits by organization, compliance rates)

**All existing endpoints** (permits, slots, drivers) remain functional

## 🆕 Latest Updates (Feb 12, 2026)

### Performance Optimizations

**Login Endpoint** - Reduced from 2 DB calls to 1:

- Before: Fetch org + verify password (2 round-trips)
- After: Single query with .eq('is_active', true) + password check
- Result: ~50% faster login

**Job Creation Endpoint** - Parallel queries:

- Before: Sequential queries for drivers + vessels (2+ round-trips)
- After: Promise.all([drivers, vessels]) - fetched in parallel
- Result: ~40% faster job creation

### Auto-Assign Feature ⚡

**Location**: Jobs list + Job creation page

- Jobs List: "Auto-Assign" button appears for PENDING jobs
- Job Creation: Big blue "🚀 Auto-Assign Best Driver" button after creating job
- One-click operation: Finds driver + creates permit + sends notification
- Manual selection still available as fallback

### Arabic Language Support 🌍

**Scope**: Login page + Navigation bar

- Toggle button: "العربية" / "English"
- URL parameter: `?lang=ar` or `?lang=en`
- RTL layout when Arabic selected
- Translations: Login page, nav labels (Dashboard, Jobs, Drivers, Logout)
- Language persists across pages via URL param

### Loading Skeletons

**Pages with skeletons**:

- `/org` - Dashboard loading state
- `/org/jobs` - Jobs list loading state
- `/org/drivers` - Drivers list loading state
- Smooth transitions, no blank screens

### UI/UX Improvements

- Suspense boundaries for useSearchParams (no hydration errors)
- Tailwind v4 syntax (bg-linear-to-br)
- Optimized form handling
- Auto-refresh after actions (router.refresh())

## Tech Stack Details

Framework: Next.js 16 (App Router) with TypeScript
Database: Supabase PostgreSQL with Row Level Security
Authentication: Supabase Auth (Phone OTP) - Team 2 handles driver auth
State Management: Zustand for client state
Validation: Zod for API schemas and request validation
Styling: Tailwind CSS v4 with @theme inline syntax
Charts: Recharts for analytics visualizations
Deployment: Vercel with automatic HTTPS

Key Dependencies:

- @supabase/supabase-js: Database client
- zod: Schema validation
- zustand: State management
- react-hook-form: Form handling
- recharts: Data visualization

## Integration Contracts

From Team 3 (AI) to Our Backend:
Endpoint: POST /api/traffic
Payload: camera_id, timestamp, status (NORMAL/MODERATE/CONGESTED), vehicle_count, truck_count

Our Response: success boolean, permits_affected count, permits_protected count

From Our Backend to Team 2 (Mobile):
GET /api/slots - Fetch available booking slots with traffic predictions
POST /api/book - Create permits with QR codes
GET /api/permits - View driver's permits and status
POST /api/locations - Send GPS location updates

## Critical Business Logic

When Traffic Status = CONGESTED:

1. Call halt_permits_by_priority('CONGESTED') PostgreSQL function
2. Sets NORMAL & LOW priority permits to status='HALTED'
3. Keeps EMERGENCY & ESSENTIAL permits at status='APPROVED'
4. Triggers notifications to affected drivers
5. Generates alternative slot suggestions

Priority Classification Rules:
EMERGENCY: Medical, perishable (0 min delay, cannot halt)
ESSENTIAL: E-commerce, JIT manufacturing (2 hour delay, cannot halt)
NORMAL: Standard containers (8 hour delay, can halt)
LOW: Bulk materials (24 hour delay, can halt)

Slot Capacity Management:

- Each time slot has capacity of 10 trucks
- Automatically increments booked count on permit approval
- Sets status='FULL' when booked >= capacity
- Database triggers auto-update on permit changes

## Development Workflow

Local Development Setup:

1. npm install - Install all dependencies
2. Create .env.local with Supabase credentials
3. Apply database schema via Supabase SQL Editor
4. npm run dev - Start Next.js dev server at http://localhost:3000

Testing:

- ./scripts/test-endpoints.ps1 - Automated API endpoint testing
- ./scripts/seed-test-data.sql - Populate test data (run in Supabase SQL Editor)
- Invoke-WebRequest -Uri "http://localhost:3000/api/seed-traffic" -Method POST - Seed 48 hours of traffic data
- All 5 core endpoints tested and working

Development Commands:
npm run dev - Start development server (hot reload enabled)
npm run build - Build for production
npm start - Start production server
npm run lint - Run ESLint checks

## Project Structure

app/

- api/ - REST API route handlers
  - traffic/ - Traffic updates from AI system
  - slots/ - Time slot availability queries
  - book/ - Permit booking endpoint
  - permits/ - Permit management queries
  - locations/ - GPS tracking data submission
- page.tsx - Homepage (placeholder)
- layout.tsx - Root layout
- globals.css - Global styles and Tailwind setup

lib/

- supabase.ts - Server and browser Supabase client initialization
- types.ts - TypeScript interfaces for database tables

supabase/

- migrations/001_create_schema.sql - Complete database schema with triggers and functions

scripts/

- seed-test-data.sql - Test data population SQL
- test-endpoints.ps1 - PowerShell test automation script

## Current Status (February 6, 2026)

Completed:

- Database schema fully set up with 9 tables and triggers
- 5 core API endpoints implemented and tested
- Priority-based permit halting logic operational
- Supabase MCP server configured
- Zod validation implemented for all endpoints
- Test suite created and passing

In Progress:

- Vercel deployment configuration

Remaining:

- Admin dashboard pages (Day 2)
- Real-time traffic visualization
- Permit management UI
- Vessel schedule widget
- Analytics charts with Recharts
- Enhanced features (Day 3-4)
- Traffic prediction algorithm
- Alternative slot suggestion system
- GPS tracking display

## Deployment to Vercel

Prerequisites:

- Vercel CLI installed (npm install -g vercel)
- Vercel account created (free tier available)

Deploy Steps:

1. vercel login - Authenticate with Vercel
2. vercel - Deploy from project directory
3. Follow prompts for project name and settings
4. Receive live URL (e.g., https://smart-logistics-xxxxx.vercel.app)

Environment Variables:
Automatically configured from .env.local during deployment. Vercel securely manages:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

Sharing with Teams:

- Share production URL with Team 2 (mobile app developers)
- Share production URL with Team 3 (AI/computer vision team)
- All 5 API endpoints available at: https://your-deployment-url/api/[endpoint]

## Database Notes

Schema Location: supabase/migrations/001_create_schema.sql
Seed Data Included:

- 10 priority rules with color codes for UI
- Time slots for next 7 days (6 AM - 10 PM, 2-hour intervals)
- Sample vessel schedules (5 ships)
- Historical traffic data (7 days at 30-minute intervals)
- Test driver account

RLS Policies:

- Drivers can view only their own data
- Public read access to reference tables (slots, traffic, vessels, rules)
- Service role key bypasses RLS for admin operations

Critical Functions:

- halt_permits_by_priority(): Implements priority-based permit halting
- update_slot_booking_count(): Auto-updates slot capacity when permits are approved/halted
- update_updated_at_column(): Auto-timestamps on all table updates

## Known Limitations (Prototype)

Trust-Based Priority:

- Drivers self-select cargo type (honor system, no verification)
- No document verification in hackathon version
- Estimated 20-30% may falsely claim ESSENTIAL
- Mitigation: Dashboard monitoring and warnings
- Production: API integration with customs/logistics APIs

Simulated Data:

- Vessel schedules manually entered (no live Mawani port API)
- Traffic predictions use heuristics (not ML models)
- Single camera demo footage
- No real-time integration with port operations

Performance Considerations:

- All API endpoints optimized with proper indexing
- Batch queries used for relationships (permits with drivers/slots)
- Supabase Realtime subscriptions ready for dashboard

## Team Coordination

Team 1 (Backend & Dashboard): You are here
Team 2 (Mobile App): Consumes our APIs for driver booking and permit management
Team 3 (AI/Computer Vision): Sends traffic data to POST /api/traffic

Integration Points:

- Team 3 → POST /api/traffic → Backend processes and halts permits
- Backend → GET /api/slots → Team 2 shows available booking times
- Team 2 → POST /api/book → Backend creates permit with QR code
- Team 2 → POST /api/locations → Backend tracks driver progress

Success Criteria for Hackathon:

- All API endpoints working and tested
- Traffic halting logic demonstrated
- EMERGENCY permits protected during congestion
- Real-time backend updates on traffic changes
- Mobile app integration working
- System deployed to production

## References

Full Specification Document: Traffic_Control_System2.pdf

- Database Schema: Pages 19-28 (Section 3)
- API Documentation: Pages 49-52 (Appendix A)
- Priority System Details: Pages 6-8, 29-31 (Sections 1.3, 4.2)
- Team Responsibilities: Pages 10-12 (Section 2.1)

Key Algorithm Implementations:

- Priority halting logic: Page 24, Listing 14
- Slot capacity management: Page 24, Listing 13
- Traffic classification thresholds: Page 17, Listing 1

Port Context and Background:

- Dammam Port processes: 4,310 trucks per week
- Primary corridor: King Abdulaziz Road
- Peak traffic periods: 7-9 AM and 4-6 PM (40-50% of daily volume)
- Target congestion reduction: 30-40%

Team Lead: Mohammad Al-Sadah
Repository: github.com/MOHKSADAH/smart-logistics-web
Deployment: Vercel (production URL shared with teams after deployment)

---

## 🎨 ADMIN DASHBOARD PAGES

```
app/(dashboard)/
├── page.tsx               → Main: Real-time traffic + permit stats
├── permits/page.tsx       → Permit management table
├── traffic/page.tsx       → Traffic monitoring + charts
├── vessels/page.tsx       → Ship arrival schedule
└── analytics/page.tsx     → Charts (Recharts): daily stats, trends
```

**Key Features**:

- Real-time updates (Supabase Realtime subscriptions)
- Traffic status visualization (NORMAL/MODERATE/CONGESTED)
- Priority-colored permit badges
- Vessel schedule widget showing truck surge predictions

---

## 💻 TECH STACK DETAILS

**Framework**: Next.js 16 (App Router) - Server Actions + REST API  
**Database**: Supabase (PostgreSQL with RLS)  
**Auth**: Supabase Auth (Phone OTP) - Team 2 handles driver login  
**State**: Zustand for client state  
**Validation**: Zod for API schemas  
**Styling**: Tailwind CSS  
**Charts**: Recharts (traffic/analytics graphs)  
**Deployment**: Vercel

**Key Dependencies**:

```json
{
  "@supabase/supabase-js": "latest",
  "zustand": "latest",
  "zod": "latest",
  "recharts": "latest"
}
```

---

## 🔄 INTEGRATION CONTRACTS

### **From Team 3 (AI) → Our Backend**

**Endpoint**: `POST /api/traffic`  
**Payload** (page 19):

```json
{
  "camera_id": "CAM_01_KING_ABDULAZIZ",
  "timestamp": "2026-02-05T20:30:00Z",
  "status": "CONGESTED",
  "vehicle_count": 145,
  "truck_count": 12,
  "recommendation": "HALT_TRUCK_PERMITS"
}
```

**Our Response**:

```json
{
  "success": true,
  "permits_affected": 5, // NORMAL/LOW permits halted
  "permits_protected": 2 // EMERGENCY/ESSENTIAL kept active
}
```

### **To Team 2 (Mobile) ← Our Backend**

They call our APIs for:

- Fetching available slots with predictions
- Booking permits with priority selection
- Getting permit status + QR codes
- Receiving alternative slots when halted

---

## 🚨 CRITICAL BUSINESS LOGIC

### **When Traffic Status = CONGESTED**:

1. Call `halt_permits_by_priority('CONGESTED')` function
2. Update `permits` table: Set NORMAL & LOW to `status='HALTED'`
3. Keep EMERGENCY & ESSENTIAL at `status='APPROVED'`
4. Trigger push notifications to affected drivers
5. Generate alternative slot suggestions

### **Priority Classification Rules** (page 20):

```sql
INSERT INTO priority_rules (cargo_type, priority_level, max_delay_minutes, can_be_halted)
VALUES
  ('PERISHABLE', 'EMERGENCY', 0, false),
  ('MEDICAL', 'EMERGENCY', 0, false),
  ('TIME_SENSITIVE', 'ESSENTIAL', 120, false),
  ('STANDARD', 'NORMAL', 480, true),
  ('BULK', 'LOW', 1440, true);
```

### **Slot Capacity Management** (page 24):

- Each slot has `capacity: 10` trucks
- Auto-increment `booked` count on permit approval
- Set `status='FULL'` when `booked >= capacity`
- Trigger: `update_slot_booking_count()` on permit INSERT/UPDATE

---

## 📋 DELIVERABLES CHECKLIST

### **By End of Day 2** (MUST HAVE):

- ✅ Database fully set up with seed data
- ✅ 5 core API endpoints working
- ✅ Deployed to Vercel with URL shared to teams
- ✅ Basic dashboard showing real-time traffic
- ✅ Permit management table
- ✅ Priority-aware halting logic tested

### **By End of Day 4** (NICE TO HAVE):

- ✅ Traffic prediction algorithm
- ✅ Alternative slots suggestion system
- ✅ Vessel schedule widget
- ✅ Analytics dashboard with Recharts
- ✅ One-tap rescheduling API
- ✅ GPS location tracking display

---

## 🎯 SUCCESS METRICS

**Prototype Demo Goals**:

- Show CONGESTED traffic triggers permit halting
- Demonstrate EMERGENCY permit stays active (never halted)
- Display NORMAL permit gets rescheduled with alternatives
- Real-time dashboard updates when AI sends traffic data
- Mobile app (Team 2) successfully books and views permits

**Key Numbers**:

- 1,260 daily truck movements managed
- 30% peak congestion reduction target
- 100% EMERGENCY cargo protection
- <2 hour ESSENTIAL cargo max delay
- 98% on-time delivery for urgent cargo

---

## ⚠️ KNOWN LIMITATIONS (Prototype)

**Trust-Based Priority** (page 30):

- Drivers self-select cargo type (honor system)
- No automated verification in hackathon version
- Risk: 20-30% may falsely claim ESSENTIAL
- Mitigation: Clear warnings, dashboard monitoring
- Production: API integration + documentation checks

**Simulated Data**:

- Vessel schedules manually entered (no real Mawani API)
- Heuristic predictions (not ML models)
- Single camera demo footage

---

## 📚 QUICK REFERENCE

**Full Spec Document**: `Traffic_Control_System2.pdf`

- Database Schema: Pages 19-28 (Section 3)
- API Documentation: Pages 49-52 (Appendix A)
- Priority System: Pages 6-8, 29-31 (Sections 1.3, 4.2)
- Team Responsibilities: Pages 10-12 (Section 2.1)

**Key Algorithms**:

- Priority halting: Page 24, Listing 14
- Slot capacity: Page 24, Listing 13
- Traffic classification: Page 17, Listing 1

**Port Context**:

- Dammam Port: 4,310 trucks entering/week
- King Abdulaziz Road: Primary port corridor
- Peak hours: 7-9 AM, 4-6 PM (40-50% of daily volume)

---

## 🚀 BUILD ORDER

1. **Setup** (30 min): Supabase DB + Next.js project
2. **Core APIs** (3 hours): traffic, slots, book, permits
3. **Deploy** (30 min): Vercel + share URL with teams
4. **Priority Logic** (2 hours): Halting function + testing
5. **Dashboard** (4 hours): Real-time UI + charts
6. **Enhanced** (Day 3-4): Predictions, alternatives, analytics

---

## 💡 REMEMBER

- **Backend before frontend** - Teams 2 & 3 need our APIs first
- **Priority protection is the innovation** - Emergency cargo NEVER delayed
- **Real-time is critical** - Use Supabase Realtime subscriptions
- **This is a hackathon** - Working demo > perfect code
- **Coordination is key** - Daily standups at 9 AM

---

**Team 1 Lead**: Mohammad Al-Sadah  
**Repository**: github.com/MOHKSADAH/smart-logistics-web  
**Deployment**: Vercel (share URL with teams ASAP)
