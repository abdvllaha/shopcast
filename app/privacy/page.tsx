export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: May 10, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Who We Are</h2>
            <p>ShopCast ("we", "our", or "us") is an AI-powered retail intelligence platform operated by ShopCast Inc. We help small and medium-sized retail businesses predict foot traffic, analyze market conditions, and optimize their marketing and advertising spend.</p>
            <p className="mt-2">If you have any questions about this policy, contact us at: <a href="mailto:privacy@shopcast.ca" className="text-blue-600 hover:underline">privacy@shopcast.ca</a></p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
            <h3 className="font-semibold text-gray-800 mb-2">Information you provide directly:</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Account information — name, email address, and password when you register</li>
              <li>Store information — store name, address, city, and store description</li>
              <li>Business data — daily traffic check-ins, sales history, and walk-in counts you upload</li>
              <li>Competitor information — names and addresses of competitors you choose to track</li>
              <li>Website URL — if you provide it for website scanning features</li>
              <li>Ad account tokens — if you connect your Google Ads or Meta Ads accounts</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">Information we collect automatically:</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Usage data — which features you use and how often</li>
              <li>Device information — browser type, operating system, and screen size</li>
              <li>IP address — used to determine general location for weather and event data</li>
              <li>Log data — errors, performance data, and API response times</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">Information from third parties:</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Weather data from Open-Meteo (no personal data shared)</li>
              <li>Local event data from Ticketmaster API (no personal data shared)</li>
              <li>Road traffic data from TomTom (no personal data shared)</li>
              <li>AI analysis from Anthropic Claude API (store context only, no personal data)</li>
              <li>If you sign in with Google or Facebook, we receive your name and email from those providers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>To provide and improve the ShopCast service</li>
              <li>To generate AI-powered foot traffic predictions and marketing recommendations for your store</li>
              <li>To send you weekly forecast emails if you have enabled them</li>
              <li>To analyze prediction accuracy and improve our models over time</li>
              <li>To provide customer support</li>
              <li>To detect and prevent fraud or abuse</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p className="mt-3">We do <strong>not</strong> sell your personal data to third parties. We do not use your business data to train AI models or share it with other ShopCast customers.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Ad Account Data</h2>
            <p>If you connect your Google Ads or Meta Ads account to ShopCast:</p>
            <ul className="list-disc ml-6 space-y-2 mt-2">
              <li>We store OAuth access tokens securely in our database to make budget recommendations</li>
              <li>We only access campaign budget data — we never access your billing information, payment methods, or personal financial data</li>
              <li>Budget recommendations are suggestions only — ShopCast does not automatically change your ad budgets without your explicit approval</li>
              <li>You can disconnect your ad accounts at any time from Settings</li>
              <li>When you disconnect, we immediately delete your stored tokens</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Storage and Security</h2>
            <p>Your data is stored securely using Supabase, which is hosted on AWS infrastructure in the United States. We use the following security measures:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>All data is encrypted in transit using HTTPS/TLS</li>
              <li>Passwords are hashed and never stored in plain text</li>
              <li>Row-level security ensures you can only access your own data</li>
              <li>OAuth tokens are stored encrypted</li>
              <li>We perform regular security reviews</li>
            </ul>
            <p className="mt-3">If you are located in Canada, please note that your data may be processed and stored in the United States. By using ShopCast, you consent to this transfer.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Data Retention</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>We retain your account data for as long as your account is active</li>
              <li>Traffic logs, sales history, and check-in data are retained for up to 2 years</li>
              <li>If you delete your account, we delete all your personal data within 30 days</li>
              <li>Some data may be retained longer if required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Your Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
              <li><strong>Correction</strong> — request that we correct inaccurate data</li>
              <li><strong>Deletion</strong> — request that we delete your data (right to be forgotten)</li>
              <li><strong>Portability</strong> — request your data in a machine-readable format</li>
              <li><strong>Objection</strong> — object to certain types of processing</li>
              <li><strong>Withdrawal of consent</strong> — withdraw consent at any time where processing is based on consent</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, email us at <a href="mailto:privacy@shopcast.ca" className="text-blue-600 hover:underline">privacy@shopcast.ca</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Cookies</h2>
            <p>ShopCast uses essential cookies only — specifically session cookies required to keep you logged in. We do not use advertising cookies, tracking pixels, or third-party analytics cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Third-Party Services</h2>
            <p>ShopCast integrates with the following third-party services. Each has their own privacy policy:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>Supabase — database and authentication</li>
              <li>Anthropic Claude — AI analysis (store context data only)</li>
              <li>TomTom — road traffic data</li>
              <li>Open-Meteo — weather forecasts</li>
              <li>Ticketmaster — local event data</li>
              <li>Resend — email delivery</li>
              <li>Vercel — hosting and deployment</li>
              <li>Google — OAuth sign-in and Google Ads integration</li>
              <li>Meta — Facebook OAuth and Meta Ads integration</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Children's Privacy</h2>
            <p>ShopCast is a business tool intended for adults. We do not knowingly collect personal information from anyone under the age of 18. If you believe a minor has provided us with personal information, please contact us and we will delete it immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. We will notify you of significant changes by email or by posting a notice on the dashboard. Your continued use of ShopCast after changes take effect constitutes your acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">12. Contact Us</h2>
            <p>If you have any questions, concerns, or requests regarding this privacy policy or your personal data, please contact us:</p>
            <div className="mt-2 bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">ShopCast Inc.</p>
              <p className="text-gray-600">Email: <a href="mailto:privacy@shopcast.ca" className="text-blue-600 hover:underline">privacy@shopcast.ca</a></p>
              <p className="text-gray-600">Website: <a href="https://shopcast-orpin.vercel.app" className="text-blue-600 hover:underline">shopcast-orpin.vercel.app</a></p>
            </div>
          </section>

        </div>
      </div>
    </main>
  )
}