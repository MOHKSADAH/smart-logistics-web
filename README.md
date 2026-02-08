# PORTA - Smart Logistics & Truck Management System

Team 1: Admin Dashboard & Backend
Project: Dammam Urban Development Challenge 2025 - Challenge #2
Timeline: 4-day hackathon (February 2026)
Tech Stack: Next.js 16, Supabase (PostgreSQL), TypeScript, Tailwind CSS

## Project Overview

Build an AI-powered traffic management system that reduces port-related truck congestion on King Abdulaziz Road (Dammam) by 30-40% using priority-aware dynamic permit management.

The problem: 1,260 trucks per day to Dammam seaport cause massive traffic congestion. The current system treats all trucks equally regardless of cargo urgency.

The solution: AI cameras detect traffic, backend prioritizes permits, and urgent cargo (medical, food) is never delayed while regular cargo is rescheduled during congestion.

## System Architecture

```
[Traffic Camera] → [Team 3: AI/YOLO] → POST /api/traffic → [Backend]
                                                              ↓
                                                     [Priority Logic]
                                                              ↓
                                        [Permit Management] ← [Team 2: Mobile]
```

Team 1 (Backend & Dashboard): You are here
Team 2 (Mobile App): Consumes our APIs for booking and permit management
Team 3 (AI/Computer Vision): Sends traffic data to our backend

## Core Innovation: Four-Tier Priority System

| Priority  | Cargo Type                                  | Max Delay | Can Be Halted |
| --------- | ------------------------------------------- | --------- | ------------- |
| EMERGENCY | Medical supplies, vaccines, perishable food | 0 min     | No            |
| ESSENTIAL | E-commerce, JIT manufacturing               | 2 hours   | No            |
| NORMAL    | Standard containers                         | 8 hours   | Yes           |
| LOW       | Bulk materials                              | 24 hours  | Yes           |

Traffic Response Logic:

- NORMAL (< 100 vehicles): Approve all permits
- MODERATE (100-150 vehicles): Warn drivers, prioritize urgent
- CONGESTED (> 150 vehicles): HALT NORMAL & LOW permits, protect EMERGENCY & ESSENTIAL

## Database Schema

Core Tables:

- drivers: User accounts with phone authentication
- time_slots: Bookable 2-hour windows with capacity
- permits: Truck permits with priority levels and QR codes
- priority_rules: Priority tier definitions and constraints
- traffic_updates: AI camera data feed
- vessel_schedules: Port ship arrivals and schedules
- traffic_predictions: Forecast congestion by hour
- driver_locations: GPS tracking data
- notifications: Push notification log

Critical Function: halt_permits_by_priority(traffic_status)
When traffic status is CONGESTED, automatically halts NORMAL and LOW priority permits while protecting EMERGENCY and ESSENTIAL permits.

## API Endpoints

All endpoints are production-ready and tested.

### Traffic Management (Team 3)

POST /api/traffic
Receives traffic updates from AI camera system.

Request:

```json
{
  "camera_id": "CAM_01_KING_ABDULAZIZ",
  "timestamp": "2026-02-06T14:30:00Z",
  "status": "CONGESTED",
  "vehicle_count": 165,
  "truck_count": 18,
  "recommendation": "HALT_TRUCK_PERMITS"
}
```

Response:

```json
{
  "success": true,
  "permits_affected": 5,
  "permits_protected": 2
}
```

### Permit Booking (Team 2)

GET /api/slots?date=YYYY-MM-DD
Returns available time slots for a specific date with traffic predictions.

POST /api/book
Books a permit for a driver with QR code generation.

Request:

```json
{
  "driver_id": "uuid",
  "slot_id": "uuid",
  "cargo_type": "MEDICAL",
  "notes": "Urgent medical supplies"
}
```

Response:

```json
{
  "success": true,
  "permit": {
    "id": "uuid",
    "qr_code": "PERMIT-xxxxx",
    "status": "APPROVED",
    "priority": "EMERGENCY",
    "expires_at": "2026-02-07T14:30:00Z"
  }
}
```

### Permit Management (Team 2)

GET /api/permits?driver_id=UUID
Returns all permits for a driver with full details.

POST /api/locations
Records driver GPS location updates.

Request:

```json
{
  "driver_id": "uuid",
  "permit_id": "uuid",
  "latitude": 26.4207,
  "longitude": 50.0888,
  "speed": 45.5,
  "eta_minutes": 15
}
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Local Development

1. Install dependencies:

```bash
npm install
```

2. Set environment variables in .env.local:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3. Apply database schema:

- Go to Supabase SQL Editor
- Copy contents of supabase/migrations/001_create_schema.sql
- Execute

4. Start development server:

```bash
npm run dev
```

Server runs at http://localhost:3000

5. Run tests:

```bash
./scripts/test-endpoints.ps1
```

## Building and Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Deploy to Vercel

1. Install Vercel CLI:

```bash
npm install -g vercel
```

2. Login and deploy:

```bash
vercel login
vercel
```

3. Follow prompts. You will receive a live URL like:

```
https://smart-logistics-xxxxx.vercel.app
```

4. Share the URL with Team 2 (mobile) and Team 3 (AI)

Environment variables are automatically configured from .env.local during deployment.

## Development Commands

npm run dev: Start development server (http://localhost:3000)
npm run build: Build for production
npm start: Start production server
npm run lint: Run ESLint

## Project Structure

app/

- api/: REST API endpoints
  - traffic/: Traffic updates from AI
  - slots/: Time slot availability
  - book/: Permit booking
  - permits/: Permit management
  - locations/: GPS tracking
- (dashboard)/: Admin dashboard pages (future)

lib/

- supabase.ts: Supabase client initialization
- types.ts: TypeScript types for database tables

supabase/

- migrations/: Database schema and seed data

scripts/

- seed-test-data.sql: Test data SQL
- test-endpoints.ps1: Automated API testing

## Deliverables Checklist

Day 1-2 (MUST HAVE):

- Database schema fully set up with seed data: COMPLETE
- 5 core API endpoints working: COMPLETE
- Deployed to Vercel: PENDING
- Basic dashboard showing real-time traffic: PENDING
- Permit management table: PENDING
- Priority-aware halting logic tested: COMPLETE

Day 3-4 (NICE TO HAVE):

- Traffic prediction algorithm
- Alternative slots suggestion system
- Vessel schedule widget
- Analytics dashboard with charts
- One-tap rescheduling
- GPS location tracking display

## Success Metrics

Target outcomes for demonstration:

- CONGESTED traffic triggers permit halting
- EMERGENCY permits stay active (never halted)
- NORMAL permits get rescheduled with alternatives
- Real-time dashboard updates when AI sends traffic data
- Mobile app (Team 2) successfully books and views permits

Key numbers:

- 1,260 daily truck movements managed
- 30% peak congestion reduction target
- 100% EMERGENCY cargo protection
- Less than 2 hour ESSENTIAL cargo maximum delay
- 98% on-time delivery for urgent cargo

## Known Limitations

Trust-Based Priority (Prototype):

- Drivers self-select cargo type (honor system)
- No automated verification in hackathon version
- Risk: 20-30% may falsely claim ESSENTIAL
- Mitigation: Clear warnings and dashboard monitoring
- Production: API integration and documentation checks

Simulated Data:

- Vessel schedules manually entered
- Heuristic traffic predictions (not ML models)
- Single camera demo footage

## Team Information

Team 1 Lead: Mohammad Al-Sadah
Repository: github.com/MOHKSADAH/smart-logistics-web
Deployment: Vercel

## References

Full Specification: Traffic_Control_System2.pdf

- Database Schema: Pages 19-28
- API Documentation: Pages 49-52
- Priority System: Pages 6-8, 29-31
- Team Responsibilities: Pages 10-12

Key Algorithms:

- Priority halting: Page 24, Listing 14
- Slot capacity: Page 24, Listing 13
- Traffic classification: Page 17, Listing 1

Port Context:

- Dammam Port: 4,310 trucks entering per week
- King Abdulaziz Road: Primary port corridor
- Peak hours: 7-9 AM, 4-6 PM (40-50% of daily volume)
