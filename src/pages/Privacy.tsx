import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const Privacy = () => {
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
        <h1 className="text-3xl font-bold text-foreground tracking-tight leading-tight">Privacy Policy</h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-2"
      >
        <div className="prose prose-invert max-w-none text-foreground">
          <p className="text-muted-foreground mb-6">Last updated: August 5, 2026</p>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                When you use Repyr Diagnostics, we may collect the following types of information:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                <li>Personal information (such as your name and email address) when you register for an account.</li>
                <li>Vehicle data, including VIN, make, model, and diagnostic codes when you use the app to scan or analyze your vehicle.</li>
                <li>Usage data and analytics about how you interact with our application.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                <li>Provide, maintain, and improve our services.</li>
                <li>Analyze vehicle data to offer accurate diagnostic insights and repair suggestions.</li>
                <li>Communicate with you, including sending updates, security alerts, and support messages.</li>
                <li>Monitor and analyze trends, usage, and activities in connection with our services.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">3. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not share your personal information with third parties except as described in this privacy policy. 
                We may share information with vendors, consultants, and other service providers who need access to such information 
                to carry out work on our behalf.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">4. Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, 
                disclosure, alteration and destruction.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold mb-3">5. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We store the information we collect about you for as long as is necessary for the purpose(s) for which we originally collected it. 
                We may retain certain information for legitimate business purposes or as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">6. Changes to this Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may change this privacy policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy 
                and, in some cases, we may provide you with additional notice (such as adding a statement to our homepage or sending you a notification).
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Privacy;
