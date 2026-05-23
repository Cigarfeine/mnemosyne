"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Mail, MessageSquare, Camera, Code, Globe, MessageCircle } from "lucide-react";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct the mailto link
    const subject = encodeURIComponent(formData.subject || "Contact Form Submission");
    const body = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`);
    const mailtoLink = `mailto:arshadrafi566@gmail.com?subject=${subject}&body=${body}`;
    
    // Open in default mail client
    window.location.href = mailtoLink;
    
    setStatus("success");
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto pt-24 px-4 sm:px-6 mb-24"
    >
      <motion.div 
        variants={itemVariants}
        className="mb-10 sm:mb-16 text-center"
      >
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-sans font-black text-[#1a1a1a] tracking-tighter mb-4 sm:mb-6 leading-[0.95]">
          <span className="font-serif italic font-medium pr-2">Talk</span> to us.
        </h1>
        <p className="text-slate-600 text-base sm:text-lg md:text-2xl font-medium leading-relaxed max-w-2xl mx-auto px-4">
          Have a question, feedback, or just want to say hi? We'd love to hear from you.
        </p>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="bg-white/60 backdrop-blur-md rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 md:p-12 border border-slate-200/60 shadow-soft relative overflow-hidden"
      >
        {status === "success" ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-100">
              <Send className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className="text-5xl font-serif italic text-[#1a1a1a] pr-2 mb-4 tracking-tight">Message Sent!</h2>
            <p className="text-slate-500 text-lg font-medium mb-8">
              We've opened your email client with your message pre-filled.
            </p>
            <button 
              onClick={() => {
                setStatus("idle");
                setFormData({ name: "", email: "", subject: "", message: "" });
              }}
              className="px-8 py-3 rounded-full text-sm font-bold bg-[#1a1a1a] hover:bg-[#2a2a2a] shadow-soft text-white transition-all"
            >
              Send another message
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-bold text-slate-700 ml-1">Name</label>
                <input 
                  id="name"
                  type="text" 
                  required
                  aria-required="true"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full bg-white/40 border border-slate-200/80 rounded-[20px] px-5 py-3 sm:px-6 sm:py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all shadow-sm text-base sm:text-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">Email</label>
                <input 
                  id="email"
                  type="email" 
                  required
                  aria-required="true"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full bg-white/40 border border-slate-200/80 rounded-[20px] px-5 py-3 sm:px-6 sm:py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all shadow-sm text-base sm:text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-bold text-slate-700 ml-1">Subject</label>
              <div className="relative">
                <div className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                </div>
                <input 
                  id="subject"
                  type="text" 
                  required
                  aria-required="true"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="What is this regarding?"
                  className="w-full bg-white/40 border border-slate-200/80 rounded-[20px] pl-12 pr-5 py-3 sm:pl-14 sm:pr-6 sm:py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all shadow-sm text-base sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-bold text-slate-700 ml-1">Message</label>
              <textarea 
                id="message"
                required
                aria-required="true"
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="How can we help you?"
                className="w-full bg-white/40 border border-slate-200/80 rounded-[24px] px-5 py-4 sm:px-6 sm:py-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all shadow-sm resize-none text-base sm:text-sm"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex items-center gap-3 bg-[#f8a8b8] hover:bg-[#f292a5] text-slate-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold transition-colors shadow-sm w-full sm:w-auto justify-center"
              >
                <span className="text-sm sm:text-base">Open in Mail Client</span>
                <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center">
                  <Send className="w-4 h-4 text-[#1a1a1a] ml-0.5" />
                </div>
              </motion.button>
            </div>
          </form>
        )}
      </motion.div>
      
      <motion.div variants={itemVariants} className="mt-10 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <motion.a variants={itemVariants} whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.97 }} href="https://instagram.com/ar.shaed" target="_blank" rel="noopener noreferrer" aria-label="Follow me on Instagram" className="bg-white/60 backdrop-blur-md rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:bg-white/90 hover:shadow-md transition-colors transition-shadow flex items-center justify-center sm:justify-start gap-4 sm:gap-5 group cursor-pointer overflow-hidden">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] sm:rounded-[18px] bg-pink-50 border border-pink-100 flex items-center justify-center flex-shrink-0">
             <Camera className="w-5 h-5 sm:w-7 sm:h-7 text-pink-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-serif italic text-[#1a1a1a] pr-2">Instagram</h3>
        </motion.a>

        <motion.a variants={itemVariants} whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.97 }} href="https://github.com/Cigarfeine" target="_blank" rel="noopener noreferrer" aria-label="Check out my GitHub" className="bg-white/60 backdrop-blur-md rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:bg-white/90 hover:shadow-md transition-colors transition-shadow flex items-center justify-center sm:justify-start gap-4 sm:gap-5 group cursor-pointer overflow-hidden">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] sm:rounded-[18px] bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
             <Code className="w-5 h-5 sm:w-7 sm:h-7 text-slate-800" />
          </div>
          <h3 className="text-lg sm:text-xl font-serif italic text-[#1a1a1a] pr-2">GitHub</h3>
        </motion.a>

        <motion.a variants={itemVariants} whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.97 }} href="https://arshadrafi.dev" target="_blank" rel="noopener noreferrer" aria-label="Visit my Portfolio" className="bg-white/60 backdrop-blur-md rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:bg-white/90 hover:shadow-md transition-colors transition-shadow flex items-center justify-center sm:justify-start gap-4 sm:gap-5 group cursor-pointer overflow-hidden">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] sm:rounded-[18px] bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
             <Globe className="w-5 h-5 sm:w-7 sm:h-7 text-blue-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-serif italic text-[#1a1a1a] pr-2">Portfolio</h3>
        </motion.a>
      </motion.div>
    </motion.div>
  );
}
