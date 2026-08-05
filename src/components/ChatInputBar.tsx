import { ArrowUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';

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

  // TODO: md:left-64 is hardcoded — should be dynamic based on sidebar collapse state (w-64 vs w-20)
  return (
    <div className="fixed bottom-0 left-0 md:left-64 right-0 px-4 md:px-8 pb-6 pt-4 z-20 flex justify-center pointer-events-none">
      <div className="w-full max-w-7xl flex justify-center">
        <div className="max-w-3xl w-full flex flex-col justify-end">
        
        {/* Quick Replies */}
        {isChatActive && !isTyping && currentOptions?.length > 0 && !isDiagnosisComplete && hasAccess !== false && (
          <div className="flex overflow-x-auto no-scrollbar gap-2 mb-4 pb-2 pointer-events-auto">
            {currentOptions.map((opt: string, i: number) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i}
                className="flex-shrink-0"
              >
                <Button
                  variant={i === 0 ? "default" : "outline"}
                  size="chip"
                  onClick={() => handleSendReply(opt)}
                  className="whitespace-nowrap py-2.5"
                >
                  {opt}
                </Button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Input Field Area */}
        <div className="bg-card border border-border shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-[32px] p-1.5 flex items-center relative transition-all pointer-events-auto">
          
          {/* Vehicle Selector (only shown when not in chat and empty input) */}
          <AnimatePresence>
            {shouldShowSelector && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="overflow-hidden flex-shrink-0 self-center ml-1"
              >
                <Button 
                  variant="outline"
                  onClick={openGarage}
                  disabled={isGuest}
                  className={`h-auto flex items-center px-2 sm:px-3 py-1.5 rounded-full whitespace-nowrap border ${isGuest ? 'bg-muted border-border cursor-default hover:bg-muted' : 'bg-primary/5 border-primary/20 hover:bg-primary/10'}`}
                >
                  <span className={`text-xs font-medium mr-1 w-[75px] sm:w-[100px] text-left truncate ${isGuest ? 'text-muted-foreground' : 'text-primary'}`}>
                    {selectedVehicle.make} {selectedVehicle.model}
                  </span>
                  {!isGuest && <ChevronDown className="text-primary w-3.5 h-3.5 opacity-70" />}
                </Button>
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
            className={`flex-1 max-h-32 min-h-[40px] px-2 sm:px-3 py-2.5 bg-transparent outline-none resize-none text-foreground placeholder:text-muted-foreground text-sm sm:text-base ${!inputValue ? 'whitespace-nowrap overflow-hidden [&::placeholder]:whitespace-nowrap [&::placeholder]:text-ellipsis' : ''}`}
            rows={1}
            style={{ overflowY: 'auto' }}
          />

          <Button 
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              handleStartOrReply();
            }}
            disabled={!isButtonActive}
            className={`h-9 w-9 rounded-full shrink-0 ml-1 mr-0.5 transition-all ${
              isButtonActive ? 'bg-primary text-white hover:bg-primary/90 hover:text-white shadow-md shadow-primary/30 hover:scale-105 active:scale-95' : 'bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground'
            }`}
          >
            <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
          </Button>
        </div>
      </div>
    </div>
  </div>
);
};

export default ChatInputBar;
