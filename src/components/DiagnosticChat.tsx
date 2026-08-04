import { useEffect, useRef } from 'react';
import { Sparkles, CheckCircle, Zap, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';
import { Button } from './ui/Button';

const DiagnosticChat = ({
  hasAccess,
  handleUpgrade,
  isUpgrading,
  exitChat,
  probabilities,
  displayMessages,
  isTyping,
  isDiagnosisComplete,
}: any) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { subscriptionTier } = useAuth();
  
  const trialTier = subscriptionTier || 'Trial';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, isTyping, probabilities]);

  if (hasAccess === false) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-5">
          <Lock className="text-primary w-8 h-8" />
        </div>
        <h2 className="text-center font-bold mb-3 text-2xl">Limit Reached</h2>
        <p className="text-center text-muted-foreground mb-8 px-4 text-sm max-w-sm">
          {trialTier === 'Trial' 
            ? "You've used your free diagnostic. Upgrade to Repyr Pro for unlimited access."
            : "You've reached your daily limit of 5 diagnostics. Upgrade to Repyr Pro for unlimited access."}
        </p>
        <Button 
          onClick={handleUpgrade} 
          disabled={isUpgrading}
          isLoading={isUpgrading}
          className="w-full max-w-[240px] font-medium"
        >
          {trialTier === 'Trial' ? "View Subscription Plans" : "Upgrade to Pro"}
        </Button>
        <Button variant="ghost" onClick={exitChat} className="mt-6 font-medium text-muted-foreground hover:text-foreground hover:bg-transparent">
          Back to Home
        </Button>
      </div>
    );
  }

  const parseMessage = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      return parsed.next_diagnostic_question || (parsed.status === 'diagnosis_complete' ? "Diagnosis complete. Check the final report above." : "Processing...");
    } catch {
      return content;
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full max-w-3xl mx-auto px-4 pb-6 pt-6">
      
      {/* Header Probabilities */}
      {!isDiagnosisComplete && probabilities?.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden mb-6 border border-white/60 p-3 shadow-lg">
          <h3 className="text-sm font-medium text-primary mb-2">Most Likely</h3>
          {probabilities.slice(0, 2).map((prob: any, i: number) => (
            <div key={i} className={`flex justify-between items-center ${i === 0 ? 'mb-1.5' : ''}`}>
              <span className="text-sm text-foreground flex-1 pr-3 leading-tight font-medium">{prob.cause}</span>
              <span className="font-bold text-sm text-foreground">{prob.confidence_score}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex flex-col">
        <AnimatePresence>
          {displayMessages.map((item: any, index: number) => {
            const isAI = item.role === 'assistant';
            const content = isAI ? parseMessage(item.content) : item.content;
            const isLastInGroup = index === displayMessages.length - 1 || displayMessages[index + 1]?.role !== item.role;
            const isFirstInGroup = index === 0 || displayMessages[index - 1]?.role !== item.role;
            
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex w-full ${isAI ? 'justify-start' : 'justify-end'} ${isFirstInGroup && index > 0 ? 'mt-4' : 'mt-1.5'}`}
              >
                <div className={`max-w-[85%] px-5 py-3.5 text-[15px] leading-[22px] font-medium ${
                  isAI 
                    ? `bg-white text-gray-800 border border-gray-50 shadow-soft-card ${isLastInGroup ? 'rounded-[20px] rounded-bl-sm' : 'rounded-[20px]'}` 
                    : `bg-gradient-primary text-white shadow-button-primary ${isLastInGroup ? 'rounded-[20px] rounded-br-sm' : 'rounded-[20px]'}`
                }`}>
                  {content}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Typing Indicator */}
      {isTyping && (
        <motion.div 
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="flex justify-start mt-1.5"
        >
          <div className="bg-white border border-gray-50 shadow-soft-card rounded-[20px] rounded-bl-sm px-4 py-3 flex items-center space-x-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -4, 0],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.15,
                }}
                className="w-1.5 h-1.5 bg-primary rounded-full"
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Diagnosis Complete Footer */}
      {isDiagnosisComplete && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 bg-primary/5 border border-primary/20 rounded-3xl p-6"
        >
          <div className="flex items-center mb-4 text-primary">
            <CheckCircle className="w-6 h-6" />
            <h3 className="font-bold text-lg ml-3 tracking-tight">Diagnosis Complete</h3>
          </div>
          
          {probabilities?.length > 0 && (
            <div className="mb-4 bg-white rounded-xl p-3 border border-primary/10 shadow-sm">
              <p className="text-xs font-medium text-primary mb-1">Most Likely</p>
              <h4 className="text-sm font-bold text-foreground leading-tight">{probabilities[0].cause}</h4>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{probabilities[0].confidence_score}% Match Confidence</p>
            </div>
          )}

          {trialTier === 'Trial' && (
            <div className="mb-6 bg-gradient-indigo rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
                  <Zap className="w-16 h-16" />
               </div>
               <h4 className="font-bold text-lg mb-2 relative z-10 flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-indigo-200" />
                 Want Unlimited Diagnostics?
               </h4>
               <p className="text-indigo-100 text-sm mb-4 relative z-10 leading-relaxed">
                 You've used your free chat! Upgrade to Pro to get unlimited diagnostics, personalized maintenance schedules, and expert repair guidance.
               </p>
               <Button 
                 onClick={() => navigate('/settings/subscription')}
                 className="w-full bg-white text-indigo-700 hover:bg-indigo-50 py-3 rounded-xl shadow-lg hover:text-indigo-800"
               >
                 Start 7-Day Free Trial
               </Button>
            </div>
          )}

          <Button 
            variant={trialTier === 'Trial' ? 'outline' : 'default'}
            onClick={exitChat}
            className="w-full font-medium"
          >
            Back to Garage
          </Button>
        </motion.div>
      )}

      {/* Spacer to prevent overlap with fixed input bar */}
      <div className="h-48 flex-shrink-0" />
      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
};

export default DiagnosticChat;
