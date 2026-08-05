import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const Terms = () => {
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
        <h1 className="text-3xl font-bold text-foreground tracking-tight leading-tight">Terms and Conditions</h1>
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
              <h2 className="text-xl font-bold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Repyr Diagnostics, you accept and agree to be bound by the terms and provision of this agreement. 
                In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                Repyr Diagnostics provides users with access to a rich collection of resources for vehicle diagnostics, including but not limited to 
                OBD-II code analysis, maintenance scheduling, and diagnostic tools (the "Service"). You understand and agree that the Service is provided "AS-IS" 
                and that Repyr Diagnostics assumes no responsibility for the timeliness, deletion, mis-delivery or failure to store any user communications or personalization settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">3. User Registration</h2>
              <p className="text-muted-foreground leading-relaxed">
                In consideration of your use of the Service, you agree to: (a) provide true, accurate, current and complete information about yourself 
                as prompted by the Service's registration form and (b) maintain and promptly update the Registration Data to keep it true, accurate, current and complete.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">4. Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Registration Data and certain other information about you is subject to our Privacy Policy. For more information, see our full privacy policy at the Privacy Policy page.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold mb-3">5. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                You expressly understand and agree that your use of the service is at your sole risk. The service is provided on an "as is" and "as available" basis.
                We expressly disclaim all warranties of any kind, whether express or implied, including, but not limited to the implied warranties of merchantability, 
                fitness for a particular purpose and non-infringement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">6. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                You expressly understand and agree that Repyr Diagnostics shall not be liable for any direct, indirect, incidental, special, consequential or exemplary damages, 
                including but not limited to, damages for loss of profits, goodwill, use, data or other intangible losses.
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Terms;
