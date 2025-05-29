export default function FeaturesSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 cosmic-glow">How It Works</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our advanced AI technology combines voice synthesis with personality modeling to create authentic digital experiences.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="glass-card rounded-xl p-8 text-center">
            <img 
              src="https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240" 
              alt="Digital voice waveform visualization with glowing elements" 
              className="w-full h-48 object-cover rounded-lg mb-6"
            />
            <h3 className="text-xl font-semibold mb-4">Voice Analysis</h3>
            <p className="text-gray-300">Upload voice samples and our AI analyzes speech patterns, tone, and vocal characteristics.</p>
          </div>

          <div className="glass-card rounded-xl p-8 text-center">
            <img 
              src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240" 
              alt="AI neural network visualization representing personality modeling" 
              className="w-full h-48 object-cover rounded-lg mb-6"
            />
            <h3 className="text-xl font-semibold mb-4">Personality Modeling</h3>
            <p className="text-gray-300">Describe personality traits and memories to create a comprehensive behavioral model.</p>
          </div>

          <div className="glass-card rounded-xl p-8 text-center">
            <img 
              src="https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240" 
              alt="Interactive digital communication interface with holographic elements" 
              className="w-full h-48 object-cover rounded-lg mb-6"
            />
            <h3 className="text-xl font-semibold mb-4">Interactive Connection</h3>
            <p className="text-gray-300">Engage in natural conversations with realistic voice responses and authentic personality.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
