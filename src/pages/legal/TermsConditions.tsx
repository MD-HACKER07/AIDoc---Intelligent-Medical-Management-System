const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Terms and Conditions</h1>
        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>By accessing and using our services, you agree to be bound by these terms and conditions.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Service Description</h2>
            <p>We provide AI-powered medical report analysis and diagnostic support services. Our services are intended to assist healthcare professionals and should not be considered as a replacement for professional medical advice.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. User Responsibilities</h2>
            <ul className="list-disc ml-6 mt-2">
              <li>Provide accurate information</li>
              <li>Maintain account security</li>
              <li>Comply with applicable laws and regulations</li>
              <li>Not misuse or abuse our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Limitation of Liability</h2>
            <p>We are not liable for any damages arising from the use or inability to use our services.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
