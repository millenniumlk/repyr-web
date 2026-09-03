import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Brain, DollarSign, Zap, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import repyrLogo from '../assets/repyr-logo.png';

const features = [
  {
    icon: <Brain className="w-8 h-8 text-primary" />,
    title: "AI Diagnostics",
    description: "Our AI asks the right questions to pinpoint exactly what's wrong with your vehicle."
  },
  {
    icon: <DollarSign className="w-8 h-8 text-primary" />,
    title: "Cost Estimates",
    description: "Get localized repair cost estimates before visiting a mechanic."
  },
  {
    icon: <Zap className="w-8 h-8 text-primary" />,
    title: "Quick Results",
    description: "Get your diagnosis in under 2 minutes with our streamlined process."
  }
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans overflow-x-hidden">
      <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-16 px-6">
        <motion.div 
          className="max-w-4xl w-full mx-auto flex flex-col items-center text-center mb-24"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Logo */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
            className="mb-8"
          >
            <img 
              src={repyrLogo} 
              alt="Repyr Logo" 
              className="w-48 md:w-56 h-auto object-contain drop-shadow-md mx-auto"
              onError={(e) => {
                // Fallback if logo doesn't exist yet
                e.currentTarget.style.display = 'none';
              }}
            />
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
            AI-Powered Vehicle Diagnostics
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-12">
            Describe your car's symptoms and get an instant expert diagnosis with repair cost estimates.
          </p>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/diagnose" tabIndex={-1}>
              <Button 
                variant="default" 
                className="text-lg md:text-xl py-6 px-10 rounded-full shadow-[0_0_40px_-10px_rgba(0,98,255,0.8)] font-semibold flex items-center gap-3 transition-all hover:shadow-[0_0_60px_-10px_rgba(0,98,255,1)]"
              >
                FREE DIAGNOSE
                <ArrowRight className="w-6 h-6" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mx-auto px-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              variants={itemVariants}
              className="bg-card border border-border rounded-[28px] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col items-center text-center hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Repyr. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
