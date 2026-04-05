export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🚨 DEPLOYMENT TEST</h1>
      <p><strong>Timestamp:</strong> April 5, 2026 - 21:47 UTC</p>
      <p><strong>Purpose:</strong> Verify if Vercel deployments are working at all</p>
      
      <div style={{ background: '#f0f0f0', padding: '10px', marginTop: '20px' }}>
        <h3>If you can see this page:</h3>
        <ul>
          <li>✅ GitHub → Vercel integration is working</li>
          <li>✅ Next.js builds are successful</li>
          <li>❌ Quiz system has specific routing/build issues</li>
        </ul>
      </div>
      
      <div style={{ background: '#ffe0e0', padding: '10px', marginTop: '10px' }}>
        <h3>If you CANNOT see this page:</h3>
        <ul>
          <li>❌ GitHub → Vercel integration is broken</li>
          <li>❌ Deployments are not triggering at all</li>
          <li>🔧 Need to reconnect Vercel to GitHub</li>
        </ul>
      </div>
      
      <p style={{ marginTop: '20px' }}>
        <strong>Next step:</strong> Check this URL after 3-5 minutes:<br/>
        <code>https://fightsdb.vercel.app/test</code>
      </p>
    </div>
  )
}