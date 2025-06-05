interface UpgradeOverlayProps {
  onClose?: () => void;
}

export default function UpgradeOverlay({ onClose }: UpgradeOverlayProps) {
  const handlePlanSelect = (plan: string) => {
    // For demo: open Stripe checkout in new tab
    let checkoutUrl = '';
    switch (plan) {
      case 'starter':
        checkoutUrl = 'https://buy.stripe.com/test_starter';
        break;
      case 'pro':
        checkoutUrl = 'https://buy.stripe.com/test_pro';
        break;
      case 'elite':
        checkoutUrl = 'https://buy.stripe.com/test_elite';
        break;
    }
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
  };

  return (
    <div id="upgrade-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-6">
        
        {/* Starter Plan */}
        <div className="plan-card bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_-8px_rgba(0,0,0,0.4)]">
          <h3 className="text-xl font-semibold mb-2 text-white">Starter – First Light</h3>
          <p className="text-3xl font-bold mb-4 text-white">
            $24<span className="text-base font-normal">/mo</span>
          </p>
          <p className="text-gray-300 text-sm mb-4">
            A little hello whenever you need it — 20 minutes of voice, five treasured photos, and space for quick catch-ups.
          </p>
          <ul className="text-sm space-y-1 flex-1 text-gray-400">
            <li>20 min voice time</li>
            <li>1M chat tokens</li>
            <li>5 photos</li>
          </ul>
          <button 
            onClick={() => handlePlanSelect('starter')}
            className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full py-3 px-6 text-white font-semibold w-full hover:from-indigo-600 hover:to-purple-700 transition-all"
          >
            Keep It Simple
          </button>
        </div>

        {/* Pro Plan - Most Loved */}
        <div className="plan-card bg-white/5 border border-orange-400/50 rounded-2xl p-6 flex flex-col relative transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_-8px_rgba(0,0,0,0.4)] ring-2 ring-orange-400/30">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-orange-400 text-black px-3 py-1 rounded-full text-xs font-bold">
              ★ Most Loved ★
            </span>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Pro – Forever Within</h3>
          <p className="text-3xl font-bold mb-4 text-white">
            $99<span className="text-base font-normal">/mo</span>
          </p>
          <p className="text-gray-300 text-sm mb-4">
            Turn memories into daily moments: twice the voice time, richer photo gallery, faster replies, and custom fine-tuning as you grow.
          </p>
          <ul className="text-sm space-y-1 flex-1 text-gray-400">
            <li>40 min voice time</li>
            <li>5M chat tokens</li>
            <li>25 photos</li>
            <li>Priority responses</li>
            <li>Custom fine-tuning</li>
          </ul>
          <button 
            onClick={() => handlePlanSelect('pro')}
            className="mt-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full py-3 px-6 text-white font-semibold w-full hover:from-orange-600 hover:to-red-600 transition-all"
          >
            Choose Forever
          </button>
        </div>

        {/* Elite Plan */}
        <div className="plan-card bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_-8px_rgba(0,0,0,0.4)]">
          <h3 className="text-xl font-semibold mb-2 text-white">Elite – Legacy Vault</h3>
          <p className="text-3xl font-bold mb-4 text-white">
            $279<span className="text-base font-normal">/mo</span>
          </p>
          <p className="text-gray-300 text-sm mb-4">
            A private monument that never fades: hours of conversation, unlimited memories, quarterly re-training, and a dedicated phone number.
          </p>
          <ul className="text-sm space-y-1 flex-1 text-gray-400">
            <li>Unlimited voice time</li>
            <li>Unlimited chat tokens</li>
            <li>Unlimited photos</li>
            <li>Dedicated phone number</li>
            <li>Quarterly re-training</li>
            <li>Priority support</li>
          </ul>
          <button 
            onClick={() => handlePlanSelect('elite')}
            className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full py-3 px-6 text-white font-semibold w-full hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            Go Elite
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-gray-400 text-sm">
          All tiers can be upgraded or downgraded anytime. We'll migrate every memory, voice, and photo for free.
        </p>
      </div>
    </div>
  );
}