"use client";

import { useState, useRef } from "react";
import { SiteHeader }  from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteHeader";
import { sendSupportEmail } from "@/app/actions/sendSupportEmail";
// 1. Import toast directly from sonner!
import { toast } from "sonner";

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<"buyer" | "freelancer">("buyer");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isPending, setIsPending] = useState(false);
  
  const formRef = useRef<HTMLFormElement>(null);

  const buyerFaqs = [
    {
      question: "How do refunds work?",
      answer: "If a freelancer fails to deliver the agreed-upon work, or the final delivery drastically misses the project requirements, you can open a dispute. If the dispute is resolved in your favor, the funds held in escrow will be returned to your original payment method within 3-5 business days."
    },
    {
      question: "My payment failed, what do I do?",
      answer: "First, ensure your card has sufficient funds and supports online transactions. If OnePay continues to reject the payment, try using a different card or contact your bank to ensure they aren't blocking the transaction for security reasons."
    },
    {
      question: "How do I communicate safely with my freelancer?",
      answer: "Always keep communication within the platform. If you communicate via external apps (like WhatsApp or personal email), our support team cannot verify agreements or protect you in the event of a dispute."
    }
  ];

  const freelancerFaqs = [
    {
      question: "When and how do I get paid?",
      answer: "Once you submit the final project and the buyer approves it, the funds are released to your platform balance. You can withdraw your earnings directly to your linked bank account. Withdrawals typically process within 2-4 business days."
    },
    {
      question: "What if a buyer is unresponsive?",
      answer: "If you have delivered the final work and the buyer does not respond or approve it within 3 days, the system will automatically mark the order as complete and release the funds to your account."
    },
    {
      question: "How do platform fees work?",
      answer: "We charge a standard platform fee on all completed orders to cover payment processing, hosting, and customer support. The exact percentage is calculated at checkout and visible on your earnings dashboard."
    }
  ];

  const currentFaqs = activeTab === "buyer" ? buyerFaqs : freelancerFaqs;

  async function handleSubmit(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;

    // Manual Validation using Sonner Toasts
    if (!name || name.trim() === "") {
      toast.error("Please enter your name");
      return;
    }
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!message || message.trim() === "") {
      toast.error("Please describe your issue so we can help");
      return;
    }

    setIsPending(true);
    
    // Create a loading toast and save its ID
    const toastId = toast.loading("Sending message...");

    const result = await sendSupportEmail(formData);
    
    setIsPending(false);
    
    if (result.success) {
      // Update the exact same toast to show success
      toast.success("Message sent successfully! We will be in touch.", { id: toastId });
      formRef.current?.reset();
    } else {
      // Update the exact same toast to show an error
      toast.error("Failed to send message. Please try again.", { id: toastId });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <SiteHeader />

      <main className="flex-grow pb-24">
        {/* Hero Section */}
        <div className="bg-primary text-primary-foreground py-16 px-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">How can we help?</h1>
          <p className="text-primary-foreground/80 max-w-xl mx-auto">
            Browse our frequently asked questions or send a direct message to our support team.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-6 -mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Left Column: FAQs */}
            <div className="lg:col-span-3 space-y-6">
              
              <div className="bg-card p-2 rounded-2xl shadow-sm border flex space-x-2">
                <button
                  onClick={() => { setActiveTab("buyer"); setOpenFaq(0); }}
                  className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    activeTab === "buyer" 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  I am a Buyer
                </button>
                <button
                  onClick={() => { setActiveTab("freelancer"); setOpenFaq(0); }}
                  className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    activeTab === "freelancer" 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  I am a Freelancer
                </button>
              </div>

              <div className="bg-card rounded-2xl shadow-sm border overflow-hidden">
                {currentFaqs.map((faq, index) => (
                  <div key={index} className="border-b last:border-0">
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full text-left px-6 py-5 flex justify-between items-center hover:bg-accent transition-colors focus:outline-none"
                    >
                      <span className="font-semibold">{faq.question}</span>
                      <svg 
                        className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${openFaq === index ? "rotate-180" : ""}`} 
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div 
                      className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                        openFaq === index ? "max-h-48 pb-5 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-accent/50 border border-accent rounded-2xl p-6 flex items-start space-x-4">
                <svg className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold mb-1">Dispute Resolution Process</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    If you cannot reach an agreement with your counterparty, you can open a dispute from your Order Details page. Our mediation team will review the communications and deliverables to make a final, binding decision.
                  </p>
                </div>
              </div>

            </div>

            {/* Right Column: Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-3xl shadow-xl border p-8">
                <h2 className="text-xl font-bold mb-2">Contact Support</h2>
                <p className="text-sm text-muted-foreground mb-6">Can't find the answer? Send us a message and we'll get back to you within 24 hours.</p>
                
                <form ref={formRef} action={handleSubmit} noValidate className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Your Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      placeholder="John Doe" 
                      className="w-full px-4 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email Address</label>
                    <input 
                      type="email" 
                      name="email" 
                      placeholder="john@example.com" 
                      className="w-full px-4 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Order ID (Optional)</label>
                    <input 
                      type="text" 
                      name="orderId" 
                      placeholder="e.g. #ONEP1234" 
                      className="w-full px-4 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">How can we help?</label>
                    <textarea 
                      rows={4} 
                      name="message" 
                      placeholder="Please describe your issue in detail..." 
                      className="w-full px-4 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm resize-none"
                    ></textarea>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={isPending}
                    className={`w-full text-primary-foreground font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-md mt-2 ${
                      isPending ? "bg-primary/70 cursor-not-allowed" : "bg-primary hover:opacity-90 active:scale-[0.98]"
                    }`}
                  >
                    {isPending ? "Sending..." : "Send Message"}
                  </button>
                </form>
                
              </div>
           </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}