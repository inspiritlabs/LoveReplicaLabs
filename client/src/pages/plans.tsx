import { Check, Star, Crown, Heart } from "lucide-react";

export default function Plans() {
  const plans = [
    {
      name: "Starter",
      badge: "First Light",
      price: 24,
      description: "Perfect for keeping precious memories alive",
      features: [
        "20 minutes of voice recreation",
        "1M chat messages per month",
        "5 high-quality photos",
        "3-clip instant voice cloning",
        "Basic personality modeling"
      ],
      highlight: false,
      icon: Heart,
      tagline: "Entry-level keepsake—just enough time each month to hear their voice and share quick updates."
    },
    {
      name: "Pro",
      badge: "Most Popular",
      price: 99,
      description: "Everything you need for meaningful connections",
      features: [
        "30 minutes of voice recreation",
        "1M chat messages with faster GPT-4o",
        "20 high-quality photos",
        "6-clip professional voice cloning",
        "Advanced personality modeling",
        "Priority support",
        "Enhanced memory retention"
      ],
      highlight: true,
      icon: Star,
      tagline: "Unlimited memories feel within reach—better model, richer photos, double the voice time."
    },
    {
      name: "Elite",
      badge: "Legacy",
      price: 279,
      description: "A complete digital monument to their life",
      features: [
        "120 minutes of voice recreation",
        "500K premium GPT-4.5 messages",
        "50 high-quality photos",
        "Quarterly voice model retraining",
        "Premium personality engine",
        "White-glove onboarding",
        "Unlimited memory storage",
        "Family sharing features"
      ],
      highlight: false,
      icon: Crown,
      tagline: "A digital monument—hours of speech, premium reasoning, and space for an entire life's gallery."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Choose Your
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {" "}Memory Plan
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Every plan includes unlimited conversations, premium voice synthesis, 
            and the peace of mind that comes from preserving what matters most.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-6">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl p-8 transition-all duration-300 hover:scale-105 ${
                plan.highlight 
                  ? 'bg-gradient-to-b from-purple-500/20 to-pink-500/20 border-2 border-purple-400 shadow-2xl shadow-purple-500/25' 
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              {/* Most Popular Badge */}
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                    ⭐ {plan.badge}
                  </div>
                </div>
              )}

              {/* Plan Icon */}
              <div className="flex justify-center mb-6">
                <div className={`p-4 rounded-full ${
                  plan.highlight 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                    : 'bg-gradient-to-br from-gray-600 to-gray-700'
                }`}>
                  <plan.icon className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Plan Name & Badge */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                {!plan.highlight && (
                  <div className="text-gray-400 text-sm font-medium">{plan.badge}</div>
                )}
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-gray-400 ml-2">/month</span>
                </div>
                <p className="text-gray-300 text-sm mt-2">{plan.description}</p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      plan.highlight ? 'text-purple-400' : 'text-green-400'
                    }`} />
                    <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Tagline */}
              <div className="bg-black/20 rounded-xl p-4 mb-6">
                <p className="text-gray-200 text-sm italic leading-relaxed">
                  "{plan.tagline}"
                </p>
              </div>

              {/* CTA Button */}
              <button
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }`}
                onClick={() => {
                  // TODO: Implement plan selection
                  alert(`Selected ${plan.name} plan - Payment integration coming soon!`);
                }}
              >
                {plan.highlight ? 'Start Your Journey' : 'Choose Plan'}
              </button>

              {/* Value Proposition for Pro Plan */}
              {plan.highlight && (
                <div className="mt-4 text-center">
                  <div className="text-green-400 text-sm font-medium">
                    💫 Best Value • Most Popular Choice
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-400 mb-6">
            All plans include a 7-day free trial. Cancel anytime.
          </p>
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-8 border border-purple-500/20">
            <h3 className="text-2xl font-semibold text-white mb-4">
              Not sure which plan is right for you?
            </h3>
            <p className="text-gray-300 mb-6">
              Start with our Pro plan and adjust as needed. Most families find it perfect 
              for keeping meaningful connections alive.
            </p>
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all">
              Talk to Our Memory Specialists
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}