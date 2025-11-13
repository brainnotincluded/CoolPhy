export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto prose prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-foreground/70">Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Information We Collect</h2>
        <p>
          We collect information that you provide directly to us, including:
        </p>
        <ul>
          <li>Account information (name, email, password)</li>
          <li>Profile information (subjects, preferences)</li>
          <li>Learning progress and activity data</li>
          <li>Messages and communications with our AI Professor</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>
          We use the information we collect to:
        </p>
        <ul>
          <li>Provide, maintain, and improve our services</li>
          <li>Personalize your learning experience</li>
          <li>Track your progress and provide recommendations</li>
          <li>Communicate with you about updates and features</li>
          <li>Ensure platform security and prevent fraud</li>
        </ul>

        <h2>3. Information Sharing</h2>
        <p>
          We do not sell your personal information. We may share your information only in the following circumstances:
        </p>
        <ul>
          <li>With your consent</li>
          <li>To comply with legal obligations</li>
          <li>To protect our rights and prevent fraud</li>
          <li>With service providers who assist in operating our platform</li>
        </ul>

        <h2>4. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
        </p>

        <h2>5. Cookies and Tracking</h2>
        <p>
          We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or indicate when a cookie is being sent.
        </p>

        <h2>6. Your Rights</h2>
        <p>
          You have the right to:
        </p>
        <ul>
          <li>Access your personal information</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to processing of your data</li>
          <li>Export your data</li>
        </ul>

        <h2>7. Children's Privacy</h2>
        <p>
          Our service is intended for users aged 13 and above. We do not knowingly collect personal information from children under 13.
        </p>

        <h2>8. Changes to Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
        </p>

        <h2>9. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us through our support page.
        </p>
      </div>
    </div>
  );
}

