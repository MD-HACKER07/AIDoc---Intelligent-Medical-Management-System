const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Personal information (name, email address, phone number)</li>
              <li>Medical reports and health information</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p>We use the collected information for:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Providing and improving our services</li>
              <li>Communicating with you</li>
              <li>Research and development</li>
              <li>Legal compliance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
