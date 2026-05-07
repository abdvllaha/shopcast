import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900">
      {/* Nav */}
      <nav className="flex justify-between items-center px-8 py-6">
        <h1 className="text-white text-2xl font-bold tracking-tight">ShopCast</h1>
        <div className="flex gap-4">
          <Link href="/login" className="text-blue-200 hover:text-white transition">Log in</Link>
          <Link href="/signup" className="bg-white text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex flex-col items-center text-center px-4 pt-24 pb-16">
        <div className="bg-blue-800 text-blue-200 text-sm font-medium px-4 py-1 rounded-full mb-6">
          AI-Powered Foot Traffic Forecasting
        </div>
        <h2 className="text-5xl font-bold text-white max-w-3xl leading-tight mb-6">
          Know how busy your store will be — before it happens
        </h2>
        <p className="text-blue-200 text-xl max-w-xl mb-10">
          ShopCast predicts foot traffic using local events and weather so you can plan staffing and promotions with confidence.
        </p>
        <Link href="/signup" className="bg-white text-blue-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition shadow-lg">
          Start Free Trial
        </Link>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-8 pb-24">
        <div className="bg-blue-800 bg-opacity-50 rounded-2xl p-6">
          <div className="text-3xl mb-3">🌤️</div>
          <h3 className="text-white font-bold text-lg mb-2">Weather Intelligence</h3>
          <p className="text-blue-200">Understand how rain, snow and sunshine impact your store traffic.</p>
        </div>
        <div className="bg-blue-800 bg-opacity-50 rounded-2xl p-6">
          <div className="text-3xl mb-3">🎪</div>
          <h3 className="text-white font-bold text-lg mb-2">Local Event Tracking</h3>
          <p className="text-blue-200">Get alerts when nearby events will drive more shoppers to your area.</p>
        </div>
        <div className="bg-blue-800 bg-opacity-50 rounded-2xl p-6">
          <div className="text-3xl mb-3">🤖</div>
          <h3 className="text-white font-bold text-lg mb-2">AI Recommendations</h3>
          <p className="text-blue-200">Receive staffing and promo suggestions tailored to your store type.</p>
        </div>
      </div>
    </main>
  )
}
