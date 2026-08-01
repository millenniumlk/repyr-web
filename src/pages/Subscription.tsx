import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, ChevronLeft, ShieldCheck } from 'lucide-react';
import { initializePaddle } from '@paddle/paddle-js';
import type { Paddle } from '@paddle/paddle-js';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

const Subscription = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [paddle, setPaddle] = useState<Paddle | undefined>();

  useEffect(() => {
    initializePaddle({ 
      environment: 'sandbox', 
      token: 'test_88387b2007b5f5db687e3091f1f',
      eventCallback: async (data) => {
        if (data.name === 'checkout.completed') {
          // Fallback UI update until webhooks are ready
          localStorage.setItem('subscription_tier', 'Pro'); // Safe fallback for both plans for now
          
          let needsCompleteProfile = false;
          const pendingChatRaw = localStorage.getItem('pending_guest_chat');
          if (pendingChatRaw) {
             needsCompleteProfile = true;
          } else if (user) {
             const { data: vData } = await supabase.from('vehicles').select('*').eq('user_id', user.id).limit(1);
             if (vData && vData.length > 0) {
                const v = vData[0];
                if (!v.transmission || !v.fuel_type || !v.location) {
                   needsCompleteProfile = true;
                }
             }
          }
      
          setProcessingPlan(null);
          
          if (needsCompleteProfile) {
             navigate('/complete-profile');
          } else {
             navigate('/');
          }
        }
      }
    }).then(
      (paddleInstance) => {
        if (paddleInstance) {
          setPaddle(paddleInstance);
        }
      }
    );
  }, [navigate, user]);

  const plans = [
    {
      name: 'Repyr Plus',
      icon: Zap,
      priceMonthly: 6.99,
      priceYearly: 67.99,
      description: 'Perfect for enthusiasts who want more control over their garage.',
      features: [
        '5 diagnostics a day',
        '2 follow-up questions upon diagnostics',
        'Smart Garage (Up to 2 Vehicles)',
        'Full Diagnostic History Access',
      ],
      color: 'blue',
      buttonText: 'Start 7-Day Free Trial',
      paddlePriceIdMonthly: 'pri_01kyy15yhbjgftzkcsjyjmm9pm',
      paddlePriceIdYearly: 'pri_01kyy16sh5qt3wyybn04r1ypkr'
    },
    {
      name: 'Repyr Pro',
      icon: Sparkles,
      priceMonthly: 12.99,
      priceYearly: 124.99,
      description: 'The ultimate toolkit for serious gearheads and professionals.',
      features: [
        'Unlimited diagnostics',
        '5 follow-up questions',
        'Up to 10 vehicles in Garage',
        'Full Diagnostic History Access',
        'Priority AI Diagnostics (Zero Wait-Times)',
        'Early Access to New Features',
      ],
      color: 'indigo',
      popular: true,
      buttonText: 'Start 7-Day Free Trial',
      paddlePriceIdMonthly: 'pri_01kyy11tk9bzmpe7jaj4sq74e2',
      paddlePriceIdYearly: 'pri_01kyy14epj1ndxbe4gbwchfn37'
    },
  ];

  const handleUpgrade = async (planName: string) => {
    if (!paddle) {
      alert("Billing system is loading. Please try again in a moment.");
      return;
    }
    setProcessingPlan(planName);
    
    const plan = plans.find(p => p.name === planName);
    const priceId = billingCycle === 'monthly' ? plan?.paddlePriceIdMonthly : plan?.paddlePriceIdYearly;

    if (!priceId) {
      alert("Invalid price ID.");
      setProcessingPlan(null);
      return;
    }

    try {
      paddle.Checkout.open({
        items: [{ priceId: priceId, quantity: 1 }],
      });
    } catch (e) {
      console.error(e);
      alert("Failed to initialize checkout.");
    }
    
    // Safety timeout in case modal fails to open or is closed manually
    setTimeout(() => {
      setProcessingPlan(null);
    }, 2000);
  };

  return (
    <div className="max-w-5xl mx-auto pb-16 px-4 md:px-6 relative min-h-[80vh] flex flex-col">
      {/* Header & Back Button */}
      <div className="flex items-center gap-4 mb-8 mt-2">
        <button 
          onClick={() => navigate('/settings')}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-black tracking-tight leading-tight">Subscription</h1>
      </div>

      <div className="text-center mb-10">
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-4xl font-bold tracking-tight text-foreground leading-tight mb-3"
        >
          Unlock the full potential.
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground font-medium text-[15px] leading-relaxed max-w-md mx-auto"
        >
          Upgrade your plan to get advanced AI diagnostics, unlimited garage space, and priority support.
        </motion.p>
      </div>

      {/* Billing Toggle */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center mb-8 md:mb-12"
      >
        <div className="bg-gray-100 p-1.5 rounded-full flex items-center shadow-inner relative">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all relative z-10 ${
              billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {billingCycle === 'monthly' && (
              <motion.div 
                layoutId="active-pill"
                className="absolute inset-0 bg-white rounded-full shadow-sm -z-10"
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}
            <span className="relative z-10">Monthly</span>
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 md:gap-2 relative z-10 ${
              billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {billingCycle === 'yearly' && (
              <motion.div 
                layoutId="active-pill"
                className="absolute inset-0 bg-white rounded-full shadow-sm -z-10"
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}
            <span className="relative z-10">Yearly</span>
            <span className="relative z-10 bg-green-100 text-green-700 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-green-200">
              Save 20%
            </span>
          </button>
        </div>
      </motion.div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 gap-8 md:gap-6 max-w-4xl mx-auto w-full">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className={`relative rounded-3xl md:rounded-[32px] p-6 md:p-8 flex flex-col transition-all duration-300 ${
              plan.popular 
                ? 'bg-gradient-to-br from-gray-900 to-black text-white shadow-2xl scale-[1.02]' 
                : 'bg-white border border-gray-200 text-gray-900 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)]'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <div className="bg-primary text-white text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg border border-primary/20 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Most Popular
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                plan.popular ? 'bg-white/10' : 'bg-primary/10'
              }`}>
                <plan.icon className={`w-6 h-6 ${plan.popular ? 'text-white' : 'text-primary'}`} />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold tracking-tight">{plan.name}</h3>
                <p className={`text-sm font-medium ${plan.popular ? 'text-gray-400' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
              </div>
            </div>

            <div className="mb-8 flex items-baseline">
              <span className="text-3xl md:text-4xl font-bold tracking-tight">
                ${billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly}
              </span>
              <span className={`ml-2 text-sm font-medium ${plan.popular ? 'text-gray-400' : 'text-gray-500'}`}>
                / {billingCycle === 'monthly' ? 'month' : 'year'}
              </span>
            </div>

            <div className="space-y-4 mb-10 flex-1">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start">
                  <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                    plan.popular ? 'bg-primary/20' : 'bg-primary/10'
                  }`}>
                    <Check className={`w-3 h-3 ${plan.popular ? 'text-primary' : 'text-primary'}`} strokeWidth={3} />
                  </div>
                  <span className={`text-[15px] font-medium leading-snug ${
                    plan.popular ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleUpgrade(plan.name)}
              disabled={processingPlan === plan.name}
              className={`w-full py-4 rounded-full font-bold text-[16px] tracking-tight transition-transform active:scale-[0.98] flex items-center justify-center ${
                plan.popular
                  ? 'bg-primary text-white hover:bg-primary-dark shadow-[0_4px_20px_rgba(0,98,255,0.4)]'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              } ${processingPlan === plan.name ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {processingPlan === plan.name ? 'Processing...' : plan.buttonText}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 md:mt-12 flex items-center justify-center gap-2 text-muted-foreground px-4">
        <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
        <span className="text-xs md:text-sm font-medium text-center">
          Secure payment processed by Paddle. Cancel anytime.
        </span>
      </div>
    </div>
  );
};

export default Subscription;
