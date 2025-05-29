import { ArrowDown } from "lucide-react";

export default function LandingHero() {
  const scrollToDemo = () => {
    const demoSection = document.getElementById("demo-workspace");
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-card border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold cosmic-glow">Inspirt Labs</div>
            <button className="secondary-button px-6 py-2 rounded-lg font-medium text-white">
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="cosmic-glow">Preserve Memories,</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
              Reconnect with Love
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Create interactive, lifelike digital replicas of loved ones through advanced AI voice technology. 
            Upload voice samples, describe their personality, and engage in meaningful conversations that feel authentic.
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center mb-16">
            <button 
              onClick={scrollToDemo}
              className="primary-button px-8 py-4 rounded-xl font-semibold text-lg text-white flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Try Interactive Demo
            </button>
            <button className="secondary-button px-8 py-4 rounded-xl font-semibold text-lg text-white flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Learn More
            </button>
          </div>
          
          {/* Hero Image */}
          <div className="glass-card rounded-2xl p-8 mb-16">
            <img 
              src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600" 
              alt="Digital technology abstract visualization with glowing particles" 
              className="w-full h-64 md:h-96 object-cover rounded-xl"
            />
          </div>

          {/* Scroll indicator */}
          <div className="flex justify-center">
            <button 
              onClick={scrollToDemo}
              className="animate-bounce text-gray-400 hover:text-white transition-colors"
            >
              <ArrowDown className="w-8 h-8" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
