import { CalculatorForm } from './calculator-form'; // Import komponen borang
import { UsageDashboard } from '@/components/UsageDashboard'; // Import usage dashboard

// Halaman utama dengan search-based approach
export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(59, 130, 246, 0.15) 2px, transparent 0),
                           radial-gradient(circle at 75px 75px, rgba(139, 69, 219, 0.1) 2px, transparent 0)`,
          backgroundSize: '100px 100px'
        }}></div>
      </div>
      
      {/* Gradient Orbs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      
      <div className="relative z-10 container mx-auto flex min-h-screen flex-col items-center justify-center p-8">
        <CalculatorForm />
      </div>
      
      {/* Usage Dashboard - floating widget */}
      <UsageDashboard />
    </main>
  );
}