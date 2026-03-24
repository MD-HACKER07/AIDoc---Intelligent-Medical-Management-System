import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    content: "AIDoc has transformed how we communicate medical reports to patients. The AI's ability to explain complex terms in simple language is remarkable.",
    author: "Dr. Rajesh Sharma",
    role: "Senior Cardiologist, Apollo Hospitals",
    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=100&h=100"
  },
  {
    content: "As a practicing physician, I'm impressed by AIDoc's accuracy in analyzing medical reports. It helps bridge the communication gap between doctors and patients.",
    author: "Dr. Priya Patel",
    role: "Chief Medical Officer, Fortis Healthcare",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=100&h=100"
  },
  {
    content: "The platform has significantly improved patient understanding of their medical conditions. It's a game-changer in healthcare communication.",
    author: "Dr. Arun Kumar",
    role: "Neurologist, AIIMS Delhi",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=100&h=100"
  },
  {
    content: "AIDoc's ability to provide instant, accurate analysis of medical reports has made patient consultations much more effective and efficient.",
    author: "Dr. Meera Reddy",
    role: "Head of Medicine, Max Healthcare",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=100&h=100"
  }
];

export const TestimonialSection = () => {
  return (
    <div className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Trusted by Leading Healthcare Professionals
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
            See what Indian medical experts say about AIDoc
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg group hover:shadow-xl transition-shadow"
            >
              {/* Background accent */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-xl group-hover:bg-blue-600/20 dark:group-hover:bg-blue-500/20 transition-colors" />

              <div className="relative">
                <Quote className="w-10 h-10 text-blue-500 dark:text-blue-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.author}
                    className="w-14 h-14 rounded-full object-cover ring-4 ring-blue-500/20 dark:ring-blue-400/20"
                  />
                  <div className="ml-4">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {testimonial.author}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}; 