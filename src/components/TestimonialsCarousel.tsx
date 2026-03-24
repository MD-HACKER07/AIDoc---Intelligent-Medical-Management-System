import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    quote: "AIDoc has revolutionized how we handle medical reports.",
    author: "Dr. Sarah Johnson",
    role: "Chief Medical Officer"
  },
  {
    quote: "The accuracy and speed of analysis is remarkable.",
    author: "Dr. Michael Chen",
    role: "Healthcare Director"
  },
  {
    quote: "This platform has greatly improved our patient care efficiency.",
    author: "Dr. Emily Rodriguez",
    role: "Head of Diagnostics"
  },
  {
    quote: "An invaluable tool for modern healthcare professionals.",
    author: "Dr. James Wilson",
    role: "Medical Researcher"
  }
];

export const TestimonialsCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [progress, setProgress] = useState(0);
  const controls = useAnimation();

  const handlePrevious = useCallback(() => {
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  }, []);

  const handleNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNext, handlePrevious]);

  // Auto rotation
  useEffect(() => {
    if (!isPaused) {
      const timer = setInterval(handleNext, 5000);
      return () => clearInterval(timer);
    }
  }, [isPaused, handleNext]);

  // Progress bar animation
  useEffect(() => {
    if (!isPaused) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = (elapsed / 5000) * 100;
        
        if (newProgress >= 100) {
          setProgress(0);
        } else {
          setProgress(newProgress);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [current, isPaused]);

  // Touch and mouse gesture handlers
  const handleDragStart = (e: MouseEvent | TouchEvent | PointerEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStart(clientX);
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent) => {
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const delta = dragStart - clientX;

    if (Math.abs(delta) > 50) { // Minimum drag distance
      if (delta > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    } else {
      // Reset position if drag wasn't far enough
      controls.start({ x: 0 });
    }
  };

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 relative">
        {/* Progress Bar */}
        <div className="absolute top-0 left-4 right-4 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-600"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>

        {/* Navigation Buttons with Tooltips */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="group absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hidden md:block"
          onClick={handlePrevious}
          aria-label="Previous testimonial"
        >
          <ChevronLeft size={24} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Previous (←)
          </span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="group absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hidden md:block"
          onClick={handleNext}
          aria-label="Next testimonial"
        >
          <ChevronRight size={24} />
          <span className="absolute right-full mr-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Next (→)
          </span>
        </motion.button>

        {/* Testimonial Content with Swipe Gestures */}
        <motion.div
          className="touch-pan-y cursor-grab active:cursor-grabbing"
          onPointerDown={handleDragStart}
          onPointerUp={handleDragEnd}
          onPointerLeave={handleDragEnd}
          animate={controls}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <AnimatePresence mode='wait'>
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="text-center px-4 md:px-12 py-8"
            >
              <motion.div
                className="relative"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="absolute -top-4 -left-4 text-6xl text-blue-200 opacity-50">"</span>
                <motion.p className="text-2xl italic text-gray-600 dark:text-gray-300 relative z-10">
                  {testimonials[current].quote}
                </motion.p>
                <span className="absolute -bottom-8 -right-4 text-6xl text-blue-200 opacity-50">"</span>
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8"
              >
                <h3 className="text-xl font-semibold dark:text-white">{testimonials[current].author}</h3>
                <p className="text-gray-500 dark:text-gray-400">{testimonials[current].role}</p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Navigation Dots with Counter */}
        <div className="flex flex-col items-center space-y-2 mt-8">
          <div className="flex justify-center space-x-2">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                onClick={() => {
                  setCurrent(index);
                  setIsPaused(true);
                  setTimeout(() => setIsPaused(false), 10000);
                }}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === current ? 'bg-blue-600' : 'bg-gray-300 hover:bg-blue-400'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {current + 1} / {testimonials.length}
          </span>
        </div>
      </div>
    </section>
  );
}; 