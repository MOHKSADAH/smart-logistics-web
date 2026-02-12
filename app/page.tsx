export default function HomePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Smart Logistics & Truck Management System</h1>
      <p>Backend API Server - Team 1</p>

      <div style={{ marginTop: '2rem' }}>
        <h2>Quick Links:</h2>
        <ul>
          <li><a href="/org-login">Organization Portal Login</a></li>
          <li><a href="/api/drivers">API: List Drivers</a></li>
          <li><a href="/api/slots?date=2026-02-13">API: Time Slots</a></li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
        <h3>API Status: ✅ Running</h3>
        <p>23 endpoints available</p>
        <p>Server: Next.js 16 + Supabase</p>
      </div>
    </div>
  );
}
