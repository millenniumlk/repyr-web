import { ArrowUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatInputBar = ({
  isChatActive,
  isTyping,
  isDiagnosisComplete,
  hasAskedFollowUp,
  hasAccess,
  inputValue,
  setInputValue,
  selectedVehicle,
  openGarage,
  category,
  handleStartOrReply,
  currentOptions,
  handleSendReply,
  isGuest
}: any) => {
  
  const canSubmit = isChatActive 
    ? inputValue.trim().length > 0 
    : (inputValue.trim().length > 0 || category !== '');
    
  const isButtonActive = canSubmit && !isTyping && (!isDiagnosisComplete || !hasAskedFollowUp) && hasAccess !== false;

  const shouldShowSelector = !isChatActive && !!selectedVehicle && inputValue.length === 0;

  return (
    <div className={`fixed bottom-0 left-0 md:left-64 right-0 px-4 md:px-8 pb-4 pt-4 z-20 flex justify-center ${
      isChatActive ? 'bg-white/80 backdrop-blur-xl border-t border-gray-100 shadow-[0_-8px_32px_rgba(0,0,0,0.05)]' : 'bg-transparent pointer-events-none'
    }`}>
      <div className="w-full max-w-7xl flex justify-center">
        <div className={`max-w-3xl w-full ${!isChatActive ? 'pointer-events-auto' : ''}`}>
        
        {/* Quick Replies */}
        {isChatActive && !isTyping && currentOptions?.length > 0 && !isDiagnosisComplete && hasAccess !== false && (
          <div className="flex overflow-x-auto no-scrollbar gap-2 mb-4 pb-2">
            {currentOptions.map((opt: string, i: number) => (
              <motion.button 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i}
                onClick={() => handleSendReply(opt)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm flex-shrink-0 active:scale-[0.98] ${
                  i === 0 
                    ? 'bg-primary text-white hover:bg-primary-dark shadow-button-primary' 
                    : 'bg-white border border-border text-foreground hover:bg-secondary'
                }`}
              >
                {opt}
              </motion.button>
            ))}
          </div>
        )}

        {/* Input Field Area */}
        <div className="bg-white border border-gray-100 shadow-soft-card rounded-3xl p-1.5 flex items-end relative transition-all">
          
          {/* Vehicle Selector (only shown when not in chat and empty input) */}
          <AnimatePresence>
            {shouldShowSelector && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="overflow-hidden flex-shrink-0 self-center ml-1"
              >
                <button 
                  onClick={openGarage}
                  disabled={isGuest}
                  className={`flex items-center px-3 py-1.5 rounded-full whitespace-nowrap ${isGuest ? 'bg-gray-100 border border-gray-200 cursor-default' : 'bg-primary/10 border border-primary/20'}`}
                >
                  <span className={`text-xs font-medium mr-1 max-w-[100px] truncate ${isGuest ? 'text-gray-500' : 'text-primary-dark'}`}>
                    {selectedVehicle.make} {selectedVehicle.model}
                  </span>
                  {!isGuest && <ChevronDown className="text-primary w-3.5 h-3.5" />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <textarea 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (isButtonActive) handleStartOrReply();
              }
            }}
            placeholder={isChatActive ? (isDiagnosisComplete && !hasAskedFollowUp ? "Ask a follow-up question..." : "Message Repyr...") : "Describe the issue..."}
            className="flex-1 max-h-32 min-h-[44px] px-4 py-3 bg-transparent outline-none resize-none text-foreground placeholder:text-muted-foreground text-base md:text-sm"
            rows={1}
            style={{ overflowY: 'auto' }}
          />

          <button 
            onClick={handleStartOrReply}
            disabled={!isButtonActive}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ml-1 mr-0.5 transition-all mb-0.5 ${
              isButtonActive ? 'bg-primary text-white hover:scale-105 active:scale-95' : 'bg-gray-100 text-gray-400'
            }`}
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
);
};

export default ChatInputBar;
