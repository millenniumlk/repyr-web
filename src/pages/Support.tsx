import { motion } from 'framer-motion';
import { ArrowLeft, Mail, MessageCircle, FileQuestion } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const Support = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto pb-10 px-4 md:px-0">
      <div className="flex items-center mb-6 px-1 mt-2 md:mt-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)} 
          className="mr-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight leading-tight">Help & Support</h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-2 space-y-8"
      >
        <div className="prose prose-invert max-w-none text-foreground">
          <p className="text-muted-foreground mb-6">
            Need assistance with Repyr Diagnostics? We're here to help you get your vehicle back on the road.
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border p-5 rounded-[24px] shadow-sm flex flex-col items-start">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-1">Email Support</h3>
            <p className="text-muted-foreground text-sm mb-4 flex-1">
              Drop us an email anytime. We typically respond within 24 hours.
            </p>
            <Button 
              onClick={() => window.location.href = 'mailto:support@repyrai.com'}
              className="w-full mt-auto"
            >
              Contact Support
            </Button>
          </div>

          <div className="bg-card border border-border p-5 rounded-[24px] shadow-sm flex flex-col items-start">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-1">Live Chat</h3>
            <p className="text-muted-foreground text-sm mb-4 flex-1">
              Chat with our diagnostics AI assistant for immediate help with vehicle codes.
            </p>
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full mt-auto"
            >
              Start Chat
            </Button>
          </div>
        </div>

        {/* FAQs */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <FileQuestion className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-muted p-5 rounded-[20px] border border-border">
              <h4 className="font-bold mb-2">How do I connect my OBD-II scanner?</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Repyr Diagnostics currently allows you to manually input diagnostic trouble codes (DTCs) that you've retrieved from any standard OBD-II scanner. In the future, we plan to support direct Bluetooth integration.
              </p>
            </div>

            <div className="bg-muted p-5 rounded-[20px] border border-border">
              <h4 className="font-bold mb-2">What is the difference between Pro and Free?</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The Free plan allows for a limited number of diagnostic queries per month. Pro users get unlimited AI-powered diagnostics, detailed maintenance schedules, and priority support.
              </p>
            </div>
            
            <div className="bg-muted p-5 rounded-[20px] border border-border">
              <h4 className="font-bold mb-2">Can I delete my account and data?</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Yes. You can permanently delete your account and all associated data at any time from the Settings &gt; Edit Profile page. This will securely erase all your vehicle profiles and diagnostic history.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Support;
