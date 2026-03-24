import { motion, useScroll, useTransform } from 'framer-motion';

export const ParallaxSection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <motion.div style={{ y }} className="relative">
      {children}
    </motion.div>
  );
}; 