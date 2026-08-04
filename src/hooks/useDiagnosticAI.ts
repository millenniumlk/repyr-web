import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useDiagnosticAI(vehicle: any) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null); // 🔴 Bug fix: ref always holds the latest sessionId regardless of closure age
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [probabilities, setProbabilities] = useState<any[]>([]);

  const startInvestigation = async () => {
    setIsTyping(true);
    let currentSessionId = null;

    try {
      if (vehicle.id !== 'guest-vehicle') {
        const { data: { session } } = await supabase.auth.getSession();
        const { data: sessionData, error } = await supabase
          .from('diagnostic_sessions')
          .insert([{
            vehicle_id: vehicle.id,
            user_id: session?.user?.id,
            vehicle_make: vehicle.make,
            vehicle_model: vehicle.model,
            vehicle_year: vehicle.year?.toString(), 
            vehicle_mileage: vehicle.mileage?.toString(),
            vehicle_engine: vehicle.fuel_type, 
            location: vehicle.location,        
            initial_category: vehicle.category || 'General', 
            user_description: vehicle.description
          }])
          .select()
          .single();

        if (error) {
          console.error("Supabase Session Creation Error:", error);
          setIsTyping(false);
          // If the backend blocked it (e.g. limit reached trigger), stop the chat immediately
          setMessages(prev => [...prev, { role: 'system', content: 'Session creation blocked by server. ' + error.message }]);
          return;
        }

        if (sessionData) {
          setSessionId(sessionData.id);
          sessionIdRef.current = sessionData.id; // 🔴 Bug fix: keep ref in sync so pingOpenAI always has the live value
          currentSessionId = sessionData.id;
        }
      }

      const systemPrompt = `You are a Master ASE Automotive Diagnostician. 
      Analyze the vehicle data and customer complaint, taking into account the vehicle's specific location, mileage, fuel type, and transmission. 
      
      CRITICAL RULES:
      1. NEVER use generic umbrella categories. You MUST identify the specific failing part.
      2. Cross-reference the vehicle Make, Model, and Year for known factory defects.
      3. FIRST STRIKE: Your very first question MUST always ask if the vehicle has had any recent maintenance, repairs, aftermarket modifications, or unusual events (like hitting a pothole) related to the complaint.
      4. VERIFY THE BASICS: After collecting initial context, you MUST verify the primary function of the suspected system using a simple test the user can perform (e.g., if a battery light is on, ask if they can test if it's charging; if brakes are squeaking, ask if the pedal feels spongy). Do not jump to complex conclusions without verifying these fundamental symptoms first.
      5. Ask highly targeted differentiating questions to isolate the exact failing part. Ask only ONE question at a time.
      6. Provide 2 to 4 conversational, short multiple-choice responses that the user can click to directly answer YOUR specific question (e.g., 'Yes, it was cranking slowly', 'No, it was completely dead', 'I didn't notice'). Do NOT put car parts as the suggested options.
      7. Set status to "investigating" while asking questions.
      8. Only when you have isolated the specific part with 90%+ confidence, change the status to "diagnosis_complete".
      9. When "diagnosis_complete", provide a final summary of the specific failing part.

      You must output a raw JSON object strictly matching this format:
      {
        "status": "investigating" | "diagnosis_complete", 
        "current_probabilities": [
          {"cause": "Name of EXACT specific part/failure", "confidence_score": 85, "reasoning": "Why this is likely"}
        ],
        "next_diagnostic_question": "The next question to ask the user OR the final summary if complete.",
        "suggested_options": ["Direct answer 1 to your question", "Direct answer 2 to your question", "I'm not sure"]
      }
      
      10. If the user asks a follow-up question after the diagnosis is complete, answer it helpfully but briefly, and ensure your status remains "diagnosis_complete".`;

      const initialUserMessage = `Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.transmission || 'Unknown Transmission'}, ${vehicle.fuel_type || 'Unknown Fuel'}). Mileage: ${vehicle.mileage || 'Unknown'} KM. Location: ${vehicle.location || 'Unknown'}. Category: ${vehicle.category}. Complaint: "${vehicle.description}"`;

      const chatContext = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: initialUserMessage }
      ];

      await pingOpenAI({ chatContext, currentSessionId });
      
    } catch (error) {
      console.error("Critical error in startInvestigation:", error);
      setIsTyping(false); 
    }
  };

  const pingOpenAI = async ({ chatContext, newMessage, currentSessionId = sessionIdRef.current }: { chatContext?: any[], newMessage?: string, currentSessionId?: string | null }) => {
    setIsTyping(true);
    try {
      const { data, error } = await supabase.functions.invoke('diagnostic-ai', {
        body: { 
          sessionId: currentSessionId,
          ...(chatContext ? { chatContext } : {}),
          ...(newMessage ? { newMessage } : {})
        }
      });

      if (error) {
        throw error;
      }

      const aiResponse = data;

      if (aiResponse.current_probabilities) setProbabilities(aiResponse.current_probabilities);
      
      setMessages(prev => {
        if (chatContext) {
          return [...chatContext, { role: 'assistant', content: JSON.stringify(aiResponse) }];
        } else {
          return [...prev, { role: 'assistant', content: JSON.stringify(aiResponse) }];
        }
      });

    } catch (error) {
      console.error("OpenAI API Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendReply = async (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    await pingOpenAI({ newMessage: text });
  };

  const resetDiagnosis = () => {
    setSessionId(null);
    sessionIdRef.current = null; // 🔴 Bug fix: clear ref so the next session starts fresh
    setMessages([]);
    setProbabilities([]);
    setIsTyping(false);
  };

  const diagnosisCompleteIndex = messages.findIndex(m => {
    if (m.role !== 'assistant') return false;
    try { return JSON.parse(m).status === 'diagnosis_complete'; } 
    catch {
      try { return JSON.parse(m.content).status === 'diagnosis_complete'; }
      catch { return false; }
    }
  });

  const isDiagnosisComplete = diagnosisCompleteIndex !== -1;
  const hasAskedFollowUp = isDiagnosisComplete && messages.slice(diagnosisCompleteIndex + 1).some(m => m.role === 'user');

  let currentOptions: string[] = [];
  if (!isDiagnosisComplete && messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
    try {
      const parsed = JSON.parse(messages[messages.length - 1].content);
      if (parsed.suggested_options && Array.isArray(parsed.suggested_options)) {
        currentOptions = parsed.suggested_options;
      }
    } catch (e) {}
  }

  return {
    messages,
    isTyping,
    probabilities,
    startInvestigation,
    handleSendReply,
    isDiagnosisComplete,
    hasAskedFollowUp,
    currentOptions,
    resetDiagnosis
  };
}
