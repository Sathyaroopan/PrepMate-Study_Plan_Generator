import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { 
  FiArrowRight, 
  FiCheckCircle, 
  FiCalendar, 
  FiZap, 
  FiLayout, 
  FiShield,
  FiTarget,
  FiClock
} from "react-icons/fi";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  const isAuthenticated = !!token;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-[var(--border)] bg-[var(--bg)]/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo_text_light.png"
              alt="PrepMate Logo"
              width={160}
              height={40}
              className="h-9 w-auto block dark:hidden"
              priority
            />
            <Image
              src="/logo_text_dark.png"
              alt="PrepMate Logo"
              width={160}
              height={40}
              className="h-9 w-auto hidden dark:block"
              priority
            />
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-6 py-2.5 rounded-xl bg-[var(--p-btn)] text-[var(--p-btn-txt)] font-bold hover:bg-[var(--p-btn-hov)] transition-all active:scale-95 text-sm"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-2.5 rounded-xl text-sm font-bold opacity-60 hover:opacity-100 transition-all"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-2.5 rounded-xl bg-[var(--p-btn)] text-[var(--p-btn-txt)] font-bold hover:bg-[var(--p-btn-hov)] transition-all active:scale-95 text-sm shadow-xl shadow-black/5"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-32">
        {/* Hero Section */}
        <section className="px-6 py-20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[120px] animate-pulse" />
          </div>

          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1] animate-slide-up">
              Master Your Semester <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
                Without the Stress.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl opacity-60 mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-up animation-delay-200">
              PrepMate transforms your course requirements into a personalized, actionable study plan. Focus on learning, while we handle the planning.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-400">
              <Link
                href={isAuthenticated ? "/dashboard" : "/register"}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Start Planning Free
                <FiArrowRight />
              </Link>
              <Link
                href="#features"
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-[var(--s-btn)] text-[var(--s-btn-txt)] font-bold text-lg hover:bg-[var(--s-btn-hov)] transition-all flex items-center justify-center"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-32 border-t border-[var(--border)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <FiCalendar className="w-6 h-6" />,
                title: "Smart Scheduling",
                desc: "Automatically distribute your workload based on deadlines and estimated effort."
              },
              {
                icon: <FiLayout className="w-6 h-6" />,
                title: "Interactive Timetable",
                desc: "Visualize your academic week with a clean, drag-and-drop enabled interface."
              },
              {
                icon: <FiCheckCircle className="w-6 h-6" />,
                title: "Task Tracking",
                desc: "Stay on top of your assignments with a prioritized task list and completion tracking."
              }
            ].map((f, i) => (
              <div key={i} className="group p-8 rounded-[2rem] bg-white/[0.02] border border-[var(--border)] hover:border-blue-500/50 hover:bg-white/[0.04] transition-all duration-500">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="opacity-50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Velocity Section */}
        <section className="bg-black/5 dark:bg-white/5 py-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-6">
                  <FiZap className="w-3 h-3" />
                  Velocity Engine
                </div>
                <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tight">Generate Plans at <br /><span className="text-blue-600">Breakneck Speed.</span></h2>
                <p className="text-lg opacity-60 mb-8 leading-relaxed">
                  Our Velocity engine takes your pending tasks and crafts a high-performance study schedule in seconds. No more manual planning—just pure productivity.
                </p>
                <ul className="space-y-4 mb-10">
                  {[
                    "Staggered task prioritization",
                    "Custom study preferences (Morning/Evening)",
                    "Automatic conflict resolution",
                    "Dynamic session duration balancing"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 font-bold text-sm">
                      <FiCheckCircle className="text-emerald-500" /> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-[var(--bg)] rounded-[2.5rem] border border-[var(--border)] overflow-hidden shadow-2xl p-8">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="h-4 w-24 bg-blue-500/20 rounded-full" />
                      <div className="h-4 w-12 bg-[var(--s-btn)] rounded-full" />
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`h-16 w-full rounded-2xl border border-[var(--border)] flex items-center px-4 gap-4 ${i === 1 ? 'bg-blue-500/5 border-blue-500/30' : 'opacity-40'}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 1 ? 'bg-blue-500 text-white' : 'bg-[var(--s-btn)] opacity-50'}`}>
                            {i === 1 ? <FiZap size={14} /> : <FiClock size={14} />}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className={`h-2 rounded-full bg-current opacity-20 ${i === 1 ? 'w-2/3' : 'w-1/2'}`} />
                            <div className="h-1.5 w-1/4 rounded-full bg-current opacity-10" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4">
                      <div className="w-full h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        Optimizing Schedule...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="px-6 py-32 text-center">
          <div className="max-w-2xl mx-auto p-12 rounded-[3rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <FiShield className="w-32 h-32" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-6">Ready to improve <br />your grades?</h2>
            <p className="text-blue-100 mb-10 opacity-80">Join students who are already using PrepMate to stay ahead.</p>
            <Link
              href={isAuthenticated ? "/dashboard" : "/register"}
              className="inline-flex h-14 items-center justify-center px-10 rounded-2xl bg-white text-blue-600 font-bold hover:bg-blue-50 transition-all active:scale-95 shadow-xl"
            >
              Get Started Now
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-[var(--border)] opacity-40 text-sm text-center">
        <p>&copy; {new Date().getFullYear()} PrepMate. Built for students, by students.</p>
      </footer>
    </div>
  );
}

