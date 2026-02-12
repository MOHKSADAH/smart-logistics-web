# Team 2: Mobile App Development Plan
**Dammam Urban Development Challenge 2025 - Challenge #2**
**Last Updated:** February 12, 2026
**Status:** Ready for Integration

---

## 🎯 Executive Summary

### What Changed?
**OLD SYSTEM (Before Feb 12):**
- ❌ Drivers book permits individually
- ❌ Drivers select cargo type themselves
- ❌ Manual booking process

**NEW SYSTEM (Current):**
- ✅ Organizations create jobs → Assign drivers → Permits auto-generated
- ✅ Drivers receive job assignments (push notifications or SMS)
- ✅ Vessel-driven congestion prediction with smart scheduling
- ✅ Priority-aware permit protection (EMERGENCY never halted)

### Your Mission
Build a React Native mobile app that allows drivers to:
1. **Receive job assignments** from their logistics company
2. **View permit details** with QR codes for checkpoint scanning
3. **Track delivery progress** with GPS location updates
4. **Complete jobs** and mark them as done
5. **Respond to congestion alerts** when traffic becomes CONGESTED

---

## 📊 System Architecture

```
[Logistics Company Portal]
         ↓
   Creates Job (e.g., "Deliver 20 containers to Riyadh")
         ↓
   Assigns Driver (Auto or Manual)
         ↓
   System Auto-Generates Permit
         ↓
   [Driver Mobile App] ← Receives Notification
         ↓
   Driver Views Job Details + Permit QR Code
         ↓
   Driver Completes Delivery
         ↓
   Marks Job Complete in App
```

### Data Flow
1. **Backend → Mobile:** Job assignments with permit details
2. **Mobile → Backend:** GPS location updates every 30 seconds
3. **Backend → Mobile:** Real-time congestion alerts
4. **Mobile → Backend:** Job completion confirmations

---

## 🔌 API Integration

### Base URL
```
Production: https://smart-logistics-web.vercel.app
Development: http://localhost:3000
```

### Authentication
**Type:** Supabase Auth (Phone OTP)
**Your Responsibility:** Driver login with phone number

```typescript
// Supabase client configuration
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
)

// Phone OTP Login
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+966501234567',
})
```

---

## 📡 API Endpoints You Need

### 1. GET /api/driver/jobs/active
**Purpose:** Fetch all assigned jobs for logged-in driver

**Request:**
```http
GET /api/driver/jobs/active
Authorization: Bearer {supabase-token}
```

**Response:**
```json
{
  "success": true,
  "jobs": [
    {
      "job_id": "550e8400-e29b-41d4-a716-446655440000",
      "job_number": "JOB-20260212-001",
      "status": "ASSIGNED",
      "customer_name": "ABC Trading Company",
      "pickup_location": "Dammam Port - Gate 3",
      "destination": "Riyadh Industrial Area",
      "cargo_type": "STANDARD",
      "priority": "NORMAL",
      "delivery_date": "2026-02-13",
      "notes": "Fragile items, handle with care",

      "permit": {
        "permit_id": "abc123-permit-id",
        "permit_code": "P-20260212-1234",
        "qr_code": "PERMIT-abc123-1234567890",
        "status": "APPROVED",
        "time_slot": {
          "date": "2026-02-13",
          "start_time": "10:00:00",
          "end_time": "12:00:00"
        }
      },

      "organization": {
        "name": "SMSA Express",
        "contact_phone": "+966501234567"
      }
    }
  ]
}
```

**Key Fields:**
- `job_number`: Human-readable job ID (display prominently)
- `permit.permit_code`: Show this code to traffic officers
- `permit.qr_code`: Generate QR code image for scanning
- `permit.status`: APPROVED, HALTED, EXPIRED
- `time_slot`: When driver must deliver (2-hour window)

---

### 2. POST /api/driver/jobs/{job_id}/complete
**Purpose:** Mark job as completed

**Request:**
```http
POST /api/driver/jobs/{job_id}/complete
Authorization: Bearer {supabase-token}
Content-Type: application/json

{
  "completion_notes": "Delivered successfully, signed by warehouse manager"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job marked as completed. You are now available for new assignments.",
  "job": {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "COMPLETED",
    "completed_at": "2026-02-12T14:30:00Z"
  }
}
```

---

### 3. POST /api/locations
**Purpose:** Send GPS location updates (every 30 seconds when on job)

**Request:**
```http
POST /api/locations
Authorization: Bearer {supabase-token}
Content-Type: application/json

{
  "driver_id": "driver-uuid",
  "latitude": 26.3927,
  "longitude": 50.0888,
  "speed": 45.5,
  "heading": 180,
  "timestamp": "2026-02-12T14:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "location_id": "location-uuid"
}
```

---

### 4. GET /api/slots (Optional - For Manual Booking Fallback)
**Purpose:** Fetch available time slots (if manual booking still supported)

**Request:**
```http
GET /api/slots?date=2026-02-13&status=AVAILABLE
```

**Response:**
```json
{
  "slots": [
    {
      "slot_id": "slot-uuid",
      "date": "2026-02-13",
      "start_time": "10:00:00",
      "end_time": "12:00:00",
      "capacity": 100,
      "booked": 45,
      "status": "AVAILABLE",
      "traffic_prediction": "MODERATE"
    }
  ]
}
```

---

### 5. GET /api/permits (Legacy - View All Permits)
**Purpose:** View driver's historical permits

**Request:**
```http
GET /api/permits?driver_id={driver_id}
```

**Response:**
```json
{
  "permits": [
    {
      "permit_id": "permit-uuid",
      "permit_code": "P-20260212-1234",
      "status": "COMPLETED",
      "time_slot": {...},
      "job": {...}
    }
  ]
}
```

---

## 📱 Mobile App Screens

### 1. Home Screen (Dashboard)
**Purpose:** Overview of driver's current status

**Layout:**
```
┌─────────────────────────────────────┐
│  👤 Ahmed Al-Salem                  │
│  SMSA Express • Driver ID: 12345    │
│  Status: 🟢 Available               │
├─────────────────────────────────────┤
│  📦 Active Jobs (2)                 │
│  ┌───────────────────────────────┐ │
│  │ JOB-20260212-001              │ │
│  │ ABC Trading → Riyadh          │ │
│  │ Time: 10:00 - 12:00           │ │
│  │ Permit: P-20260212-1234       │ │
│  │ Status: ✅ APPROVED           │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │ JOB-20260212-002              │ │
│  │ XYZ Logistics → Jeddah        │ │
│  │ Time: 14:00 - 16:00           │ │
│  │ Permit: P-20260212-5678       │ │
│  │ Status: ⚠️ HALTED            │ │
│  └───────────────────────────────┘ │
├─────────────────────────────────────┤
│  📊 Today's Summary                 │
│  • 1 Completed • 2 Active • 0 Late │
└─────────────────────────────────────┘
```

**Key Features:**
- Real-time job count
- Color-coded status indicators
- Quick access to job details
- Pull-to-refresh for new assignments

---

### 2. Job Details Screen
**Purpose:** Show full job information + permit QR code

**Layout:**
```
┌─────────────────────────────────────┐
│  ← Back     JOB-20260212-001        │
├─────────────────────────────────────┤
│  📦 Job Information                 │
│  Customer: ABC Trading Company      │
│  Pickup: Dammam Port - Gate 3      │
│  Destination: Riyadh Industrial     │
│  Cargo: Standard Containers (20)   │
│  Priority: 🟡 NORMAL                │
├─────────────────────────────────────┤
│  🎫 Permit Details                  │
│  Code: P-20260212-1234              │
│  Status: ✅ APPROVED                │
│  Time Slot: Feb 13, 10:00 - 12:00  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │      [QR CODE IMAGE]        │   │
│  │   PERMIT-abc123-1234567890  │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│  (Show this to checkpoint officers) │
├─────────────────────────────────────┤
│  📍 Navigation                      │
│  [Start Navigation to Pickup]       │
│  [Start Navigation to Destination]  │
├─────────────────────────────────────┤
│  📞 Contact                         │
│  Organization: +966501234567        │
│  Customer: +966507654321            │
├─────────────────────────────────────┤
│  [Mark Job as Complete]             │
└─────────────────────────────────────┘
```

**Key Features:**
- Large QR code (scannable from 1 meter away)
- One-tap navigation integration (Google Maps/Apple Maps)
- Quick contact buttons
- Permit code displayed clearly for manual entry

---

### 3. Notifications Screen
**Purpose:** Show job assignments and alerts

**Notification Types:**

**1. New Job Assigned**
```
🚛 New Job Assigned
JOB-20260212-001
Pickup: Dammam Port → Riyadh
Time: Tomorrow 10:00 - 12:00
Tap to view details
```

**2. Permit Halted (Congestion)**
```
⚠️ Permit Halted
P-20260212-1234
Traffic is CONGESTED on King Abdulaziz Road
Estimated delay: 2 hours
Alternative slots available
```

**3. Permit Approved Again**
```
✅ Permit Reactivated
P-20260212-1234
Traffic cleared. You can proceed.
Original time slot: 10:00 - 12:00
```

**4. Time Slot Reminder**
```
⏰ Job Starting Soon
JOB-20260212-001
Your time slot starts in 30 minutes
Pickup: Dammam Port - Gate 3
```

---

### 4. History Screen
**Purpose:** View completed jobs and permits

**Layout:**
```
┌─────────────────────────────────────┐
│  History                            │
│  [This Week] [This Month] [All]     │
├─────────────────────────────────────┤
│  February 12, 2026                  │
│  ┌───────────────────────────────┐ │
│  │ ✅ JOB-20260212-001           │ │
│  │ ABC Trading → Riyadh          │ │
│  │ Completed at 11:45 AM         │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │ ✅ JOB-20260211-045           │ │
│  │ XYZ Logistics → Jeddah        │ │
│  │ Completed at 3:30 PM          │ │
│  └───────────────────────────────┘ │
├─────────────────────────────────────┤
│  📊 Statistics                      │
│  This Week: 15 jobs completed       │
│  On-Time Rate: 94%                  │
│  Total Distance: 1,240 km           │
└─────────────────────────────────────┘
```

---

### 5. Profile Screen
**Purpose:** Driver settings and information

**Layout:**
```
┌─────────────────────────────────────┐
│  Profile                            │
├─────────────────────────────────────┤
│  👤 Ahmed Al-Salem                  │
│  Driver ID: 12345                   │
│  Phone: +966501234567               │
│  Organization: SMSA Express         │
│  License: Valid until 2028          │
├─────────────────────────────────────┤
│  ⚙️ Settings                        │
│  • Notification Preferences         │
│  • Language (Arabic/English)        │
│  • GPS Tracking: On                 │
│  • Dark Mode: Off                   │
├─────────────────────────────────────┤
│  📞 Support                         │
│  • Contact Organization             │
│  • Report Issue                     │
│  • View Help Center                 │
├─────────────────────────────────────┤
│  [Logout]                           │
└─────────────────────────────────────┘
```

---

## 🔔 Push Notifications Implementation

### Notification Service
Use Firebase Cloud Messaging (FCM) or Supabase Realtime

**Setup Steps:**
1. Register device token on login
2. Subscribe to driver-specific channel: `driver-{driver_id}`
3. Handle notification payloads

**Notification Payload Structure:**
```json
{
  "type": "JOB_ASSIGNED",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "job_number": "JOB-20260212-001",
  "title": "New Job Assigned",
  "message": "Pickup: Dammam Port → Riyadh",
  "time_slot": "2026-02-13 10:00 - 12:00",
  "priority": "NORMAL",
  "action": "open_job_details"
}
```

**Notification Types:**
1. **JOB_ASSIGNED** - New job assigned by organization
2. **PERMIT_HALTED** - Traffic congestion, permit halted
3. **PERMIT_REACTIVATED** - Traffic cleared, can proceed
4. **TIME_SLOT_REMINDER** - Job starts in 30 minutes
5. **JOB_CANCELLED** - Organization cancelled the job

---

## 📍 GPS Tracking Implementation

### Location Update Frequency
- **When on active job:** Every 30 seconds
- **When idle:** Every 5 minutes
- **Background mode:** Every 2 minutes

### React Native Libraries
```bash
npm install react-native-geolocation-service
npm install react-native-background-geolocation
```

### Location Update Code
```typescript
import Geolocation from 'react-native-geolocation-service'

// Get current position
Geolocation.getCurrentPosition(
  async (position) => {
    const { latitude, longitude, speed, heading } = position.coords

    // Send to backend
    await fetch('https://smart-logistics-web.vercel.app/api/locations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseToken}`,
      },
      body: JSON.stringify({
        driver_id: driverId,
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        timestamp: new Date().toISOString(),
      }),
    })
  },
  (error) => console.error(error),
  {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 10000
  }
)
```

---

## 🎨 UI/UX Guidelines

### Design Principles
1. **Large touch targets** - Minimum 48x48 dp (drivers wear gloves)
2. **High contrast** - App used in bright sunlight
3. **Minimal text input** - Use pickers and buttons instead
4. **Offline capability** - Cache job details locally
5. **Arabic/English support** - RTL layout for Arabic

### Color Coding (Priority Levels)
- 🔴 **EMERGENCY** - Red (#EF4444) - Medical, perishable
- 🟠 **ESSENTIAL** - Orange (#F59E0B) - E-commerce, JIT
- 🟡 **NORMAL** - Yellow (#EAB308) - Standard containers
- 🟢 **LOW** - Green (#10B981) - Bulk materials

### Status Indicators
- ✅ **APPROVED** - Green checkmark
- ⏸️ **HALTED** - Orange pause icon
- ⏱️ **PENDING** - Gray clock icon
- ✅ **COMPLETED** - Blue checkmark
- ❌ **EXPIRED** - Red X
- ❌ **CANCELLED** - Red X with strikethrough

---

## 🧪 Testing Plan

### Unit Tests
1. **API Integration**
   - Test GET /api/driver/jobs/active with mock data
   - Test POST /api/driver/jobs/{id}/complete
   - Test POST /api/locations with GPS data

2. **State Management**
   - Test job list updates when new job assigned
   - Test permit status changes (APPROVED → HALTED)
   - Test navigation state transitions

3. **Notifications**
   - Test notification parsing
   - Test deep linking to job details
   - Test background notification handling

### Integration Tests
1. **End-to-End Flow:**
   ```
   Organization creates job
      ↓
   Driver receives notification
      ↓
   Driver opens app → Views job
      ↓
   Driver starts navigation
      ↓
   GPS tracking active
      ↓
   Driver completes job
      ↓
   Backend updates status
   ```

2. **Edge Cases:**
   - No internet connection (offline mode)
   - Permit halted during active delivery
   - Multiple jobs assigned simultaneously
   - App killed/restarted mid-delivery

### Demo Scenarios

**Scenario 1: Happy Path**
1. Driver logs in with phone number
2. Sees 1 new job assigned (JOB-20260212-001)
3. Taps job → Views permit QR code
4. Starts navigation to pickup location
5. GPS tracking sends updates every 30 seconds
6. Arrives at destination → Marks job complete
7. App shows "Job completed successfully"
8. Driver becomes available for new assignments

**Scenario 2: Congestion Handling**
1. Driver has active job (APPROVED status)
2. Traffic becomes CONGESTED
3. Backend calls halt_permits_by_priority('CONGESTED')
4. Driver's NORMAL priority permit → HALTED
5. Push notification: "Permit halted due to congestion"
6. App shows orange banner: "Traffic congested, wait 2 hours"
7. Traffic clears → Backend reactivates permit
8. Push notification: "Permit reactivated, proceed now"
9. App updates status to APPROVED

**Scenario 3: EMERGENCY Protection**
1. Driver has EMERGENCY priority job (medical supplies)
2. Traffic becomes CONGESTED (150+ vehicles)
3. Backend halts NORMAL & LOW permits
4. Driver's EMERGENCY permit stays APPROVED
5. App shows green banner: "Priority protected, proceed now"
6. Driver completes delivery on time

---

## 📋 Implementation Checklist

### Phase 1: Setup (Day 1)
- [ ] Initialize React Native project
- [ ] Install dependencies (Supabase, navigation, maps)
- [ ] Configure Supabase client
- [ ] Implement phone OTP authentication
- [ ] Test login/logout flow

### Phase 2: Core Features (Day 2)
- [ ] Implement GET /api/driver/jobs/active
- [ ] Build Home Screen with job list
- [ ] Build Job Details Screen with QR code
- [ ] Add pull-to-refresh on job list
- [ ] Test job fetching and display

### Phase 3: GPS & Tracking (Day 2 Evening)
- [ ] Install geolocation libraries
- [ ] Implement POST /api/locations
- [ ] Start location tracking on job start
- [ ] Stop location tracking on job complete
- [ ] Test GPS updates in background

### Phase 4: Notifications (Day 3)
- [ ] Setup Firebase Cloud Messaging
- [ ] Register device token on login
- [ ] Handle notification payloads
- [ ] Implement deep linking to job details
- [ ] Test notification delivery

### Phase 5: Job Completion (Day 3)
- [ ] Implement POST /api/driver/jobs/{id}/complete
- [ ] Add "Mark Complete" button
- [ ] Show success message
- [ ] Refresh job list after completion
- [ ] Test completion flow

### Phase 6: Polish (Day 4)
- [ ] Add Arabic language support
- [ ] Implement loading skeletons
- [ ] Add error handling and retry logic
- [ ] Implement offline caching
- [ ] Test edge cases (no internet, etc.)

### Phase 7: Integration Testing (Day 4)
- [ ] Test with Team 1 backend
- [ ] Verify organization assigns job → driver receives it
- [ ] Test congestion scenario (HALTED permits)
- [ ] Test EMERGENCY priority protection
- [ ] End-to-end demo rehearsal

---

## 🤝 Coordination with Team 1

### Daily Standups (9:00 AM)
**What to discuss:**
- API endpoint status (working? any issues?)
- Data format changes (payload structure)
- Testing results (found bugs?)
- Integration blockers (need new endpoints?)

### Critical Handoffs

**1. Job Assignment Flow**
```
Team 1: Organization assigns job via web portal
   ↓
Team 1: Backend creates permit + sends notification
   ↓
Team 2: Mobile app receives notification
   ↓
Team 2: Driver views job in app
```

**Test Together:**
- Team 1 creates job in web portal
- Team 2 verifies notification received
- Team 2 confirms job appears in mobile app
- Team 2 marks job complete
- Team 1 verifies status updated in dashboard

**2. GPS Tracking**
```
Team 2: Mobile app sends location updates
   ↓
Team 1: Backend stores in driver_locations table
   ↓
Team 1: Web dashboard shows driver on map
```

**Test Together:**
- Team 2 starts location tracking
- Team 1 verifies locations appear in database
- Team 1 shows driver moving on map

**3. Congestion Response**
```
Team 3: AI sends traffic update (CONGESTED)
   ↓
Team 1: Backend halts NORMAL/LOW permits
   ↓
Team 2: Mobile app shows "HALTED" status
   ↓
Team 2: Driver sees alternative slots
```

**Test Together:**
- Team 3 sends CONGESTED traffic status
- Team 1 verifies permit halting logic
- Team 2 confirms mobile app shows HALTED
- Team 2 shows notification received

---

## 🚨 Known Issues & Limitations

### Trust-Based Priority (Hackathon Prototype)
- Drivers see priority assigned by organization
- No verification of cargo type (honor system)
- Organizations may falsely claim ESSENTIAL priority
- **Mitigation:** Clear warnings, dashboard monitoring
- **Production:** API integration with customs/port systems

### Simulated Data
- Vessel schedules manually entered (no live Mawani API)
- Traffic predictions use heuristics (not ML)
- Limited test drivers and jobs
- **Production:** Real-time port integration needed

### Performance Considerations
- GPS tracking drains battery (optimize update frequency)
- Offline mode limited (requires internet for job updates)
- QR code scanning requires camera permissions
- **Production:** Implement aggressive battery optimization

---

## 📞 Support & Resources

### Team 1 Contacts
- **Lead:** Mohammad Al-Sadah
- **Backend APIs:** Ready for integration
- **Database:** Supabase with RLS policies

### API Documentation
- **Base URL:** https://smart-logistics-web.vercel.app
- **Test Credentials:** Contact Team 1 for driver test accounts
- **Postman Collection:** Available (request from Team 1)

### Development Tools
- **Backend Status:** [STATUS.md](STATUS.md)
- **Integration Guide:** [TEAM_COORDINATION.md](TEAM_COORDINATION.md)
- **Project Overview:** [CLAUDE.md](CLAUDE.md)

### Testing Resources
- **Supabase Dashboard:** Access to view database records
- **Test Organizations:** SMSA, Aramex, Naqel (pre-seeded)
- **Test Drivers:** 5 drivers per organization (pre-seeded)

---

## 🎯 Success Metrics

### Demo Day Goals
- ✅ Driver logs in with phone OTP < 30 seconds
- ✅ New job notification delivered < 2 seconds
- ✅ Job details with QR code loads instantly
- ✅ GPS tracking sends updates every 30 seconds
- ✅ Job completion updates backend immediately
- ✅ Congestion alert appears within 5 seconds
- ✅ EMERGENCY permit stays active during CONGESTED
- ✅ Arabic/English toggle works smoothly

### Key Performance Indicators
- **Login Time:** < 30 seconds
- **Job Fetch Time:** < 1 second
- **GPS Update Frequency:** 30 seconds (active job)
- **Notification Delivery:** < 5 seconds
- **Offline Resilience:** Cache last 10 jobs
- **Battery Impact:** < 10% per hour (active tracking)

---

## 📅 Timeline

### Day 1 (February 13)
- Setup project, authentication, basic UI

### Day 2 (February 14)
- Core features: Job list, job details, GPS tracking

### Day 3 (February 15)
- Notifications, job completion, error handling

### Day 4 (February 16)
- Polish, testing, integration, demo preparation

---

**Next Steps:**
1. Review this plan with your team
2. Contact Team 1 for API testing access
3. Start with Phase 1 (Setup) immediately
4. Daily standups at 9:00 AM
5. Integration testing on Day 4

**Questions?** Contact Team 1 Lead: Mohammad Al-Sadah

---

**Good luck! Let's build an amazing mobile app that reduces Dammam traffic congestion by 30-40%! 🚛📱**
