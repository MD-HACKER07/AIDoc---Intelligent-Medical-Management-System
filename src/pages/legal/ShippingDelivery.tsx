const ShippingDelivery = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Shipping and Delivery Policy</h1>
        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Digital Service Delivery</h2>
            <p>As we provide digital services, there are no physical shipping requirements. Access to our services is provided immediately upon successful payment and account creation.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Service Activation</h2>
            <ul className="list-disc ml-6 mt-2">
              <li>Instant activation upon payment confirmation</li>
              <li>Access credentials sent via email</li>
              <li>24/7 service availability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. Technical Requirements</h2>
            <p>To access our services, you need:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>A stable internet connection</li>
              <li>A modern web browser</li>
              <li>Valid login credentials</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ShippingDelivery;
