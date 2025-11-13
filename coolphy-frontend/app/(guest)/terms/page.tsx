export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto prose prose-invert">
        <h1>Terms of Service</h1>
        <p className="text-foreground/70">Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using CoolPhy, you accept and agree to be bound by the terms and provision of this agreement.
        </p>

        <h2>2. Use License</h2>
        <p>
          Permission is granted to temporarily access the materials (information or software) on CoolPhy for personal, non-commercial transitory viewing only.
        </p>

        <h2>3. User Accounts</h2>
        <p>
          When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms.
        </p>

        <h2>4. Intellectual Property</h2>
        <p>
          The content, organization, graphics, design, and other matters related to CoolPhy are protected under applicable copyrights and other proprietary laws.
        </p>

        <h2>5. User Content</h2>
        <p>
          Users may post, upload, or submit content to the platform. You retain ownership of your content, but grant us a license to use, display, and distribute it.
        </p>

        <h2>6. Prohibited Uses</h2>
        <p>
          You may not use CoolPhy for any illegal or unauthorized purpose. You must not violate any laws in your jurisdiction.
        </p>

        <h2>7. Termination</h2>
        <p>
          We may terminate or suspend your account immediately, without prior notice, for any reason, including breach of these Terms.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          CoolPhy shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
        </p>

        <h2>9. Changes to Terms</h2>
        <p>
          We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new Terms of Service on this page.
        </p>

        <h2>10. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us through our support page.
        </p>
      </div>
    </div>
  );
}

