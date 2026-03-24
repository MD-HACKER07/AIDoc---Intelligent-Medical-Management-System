const CancellationRefund = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Cancellation and Refund Policy</h1>
        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Cancellation Policy</h2>
            <p>You may cancel your subscription at any time. The cancellation will take effect at the end of your current billing period.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Refund Policy</h2>
            <ul className="list-disc ml-6 mt-2">
              <li>We offer a 30-day money-back guarantee for new subscriptions</li>
              <li>Refund requests must be submitted within 30 days of purchase</li>
              <li>Refunds will be processed within 5-7 business days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. How to Request a Refund</h2>
            <p>To request a refund:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Contact our support team</li>
              <li>Provide your order number and reason for refund</li>
              <li>Allow up to 48 hours for our team to review your request</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CancellationRefund;
