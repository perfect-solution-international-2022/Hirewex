import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteHeader";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <SiteHeader />

      <main className="flex-grow py-16 px-6">
        <div className="max-w-3xl mx-auto bg-card rounded-3xl shadow-sm border p-8 md:p-12">
          
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8 pb-8 border-b">
            Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <div className="space-y-8 text-muted-foreground leading-relaxed">
            
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
              <p>
                Welcome to Hirewex. We respect your privacy and are committed to protecting your personal data. 
                This Privacy Policy explains how we collect, use, and share information about you when you use our 
                website and platform to connect buyers with freelance services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Information We Collect</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Account Information:</strong> When you register as a buyer or freelancer, we collect your name, email address, and account credentials.</li>
                <li><strong className="text-foreground">Profile Data:</strong> For freelancers, we collect information you choose to display on your profile, including portfolios, skills, and rates.</li>
                <li><strong className="text-foreground">Payment Information:</strong> We use a secure third-party payment processor (OnePay). We do not store your full credit card numbers or bank account details on our servers.</li>
                <li><strong className="text-foreground">Communications:</strong> We collect the contents of messages sent between buyers and freelancers on our platform for dispute resolution and safety purposes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. How We Use Your Information</h2>
              <p className="mb-2">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, operate, and maintain the Hirewex platform.</li>
                <li>Process transactions and send related information, including confirmations and receipts.</li>
                <li>Facilitate communication between buyers and freelancers.</li>
                <li>Resolve disputes, collect fees, and troubleshoot problems.</li>
                <li>Send you technical notices, security alerts, and support messages.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. How We Share Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">With Other Users:</strong> If you are a freelancer, your public profile and portfolio are visible to potential buyers. When you enter into a contract, relevant contact info may be shared with your counterparty.</li>
                <li><strong className="text-foreground">With Service Providers:</strong> We share information with third-party vendors who help us operate our business, such as our payment processor (OnePay) and email delivery services.</li>
                <li><strong className="text-foreground">For Legal Reasons:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Data Security</h2>
              <p>
                We implement reasonable security measures designed to protect your information from unauthorized access, 
                alteration, disclosure, or destruction. However, no internet transmission is ever fully secure, and we cannot 
                guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Your Rights</h2>
              <p>
                Depending on your location, you may have the right to access, update, or delete the personal information 
                we hold about you. You can update your account information directly in your dashboard or contact our 
                support team for assistance with account deletion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please reach out to our team using our secure contact form.
              </p>
              <div className="mt-6">
                <Link 
                  href="/support" 
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-primary-foreground bg-primary hover:opacity-90 transition-opacity"
                >
                  Contact Support
                </Link>
              </div>
            </section>

          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}