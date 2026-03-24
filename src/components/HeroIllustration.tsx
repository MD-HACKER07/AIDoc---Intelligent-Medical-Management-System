import { motion } from 'framer-motion';
import { Brain, Activity, Stethoscope, HeartPulse, Shield, Bot, Sparkles } from 'lucide-react';

export const HeroIllustration = () => {
  const iconVariants = {
    hidden: { opacity: 0, scale: 0, rotate: -180 },
    visible: { 
      opacity: 1, 
      scale: 1,
      rotate: 0,
      transition: { 
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const pulseVariants = {
    initial: { scale: 1, opacity: 0.8 },
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.8, 0.4, 0.8],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const orbitVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 30,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const sparkleVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Define icons with their positions and colors
  const icons = [
    { 
      Icon: Activity,
      color: "text-green-500 dark:text-green-400",
      position: { x: -200, y: -200 }, // Top left
      delay: 0
    },
    { 
      Icon: Stethoscope,
      color: "text-purple-500 dark:text-purple-400",
      position: { x: 200, y: -200 }, // Top right
      delay: 0.2
    },
    { 
      Icon: HeartPulse,
      color: "text-red-500 dark:text-red-400",
      position: { x: 200, y: 200 }, // Bottom right
      delay: 0.4
    },
    { 
      Icon: Shield,
      color: "text-yellow-500 dark:text-yellow-400",
      position: { x: -200, y: 200 }, // Bottom left
      delay: 0.6
    },
    { 
      Icon: Bot,
      color: "text-blue-500 dark:text-blue-400",
      position: { x: 0, y: -250 }, // Top center
      delay: 0.8
    }
  ];

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-400/20 dark:via-purple-400/20 dark:to-pink-400/20 blur-3xl" />

      {/* Center Brain Icon with glow */}
      <motion.div
        className="absolute z-20"
        variants={pulseVariants}
        initial="initial"
        animate="animate"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/30 dark:bg-blue-400/30 blur-xl rounded-full" />
          <Brain className="w-40 h-40 text-blue-500 dark:text-blue-400 relative z-10" />
        </div>
      </motion.div>

      {/* Icons Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        {icons.map(({ Icon, color, position, delay }, index) => (
          <motion.div
            key={index}
            className="absolute"
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: position.x,
              y: position.y,
            }}
            transition={{ 
              duration: 1,
              delay: delay,
              type: "spring",
              stiffness: 100
            }}
          >
            <motion.div
              animate={{
                y: [-10, 10, -10],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.5, 1]
              }}
              className={`w-20 h-20 ${color}`}
            >
              <Icon className="w-full h-full" />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Connecting Lines */}
      <svg className="absolute w-full h-full" style={{ zIndex: 10 }}>
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="stroke-blue-400 dark:stroke-blue-300"
        >
          {icons.map(({ position }, index) => (
            <motion.line
              key={index}
              x1="50%"
              y1="50%"
              x2={`${50 + (position.x / 8)}%`}
              y2={`${50 + (position.y / 6)}%`}
              strokeWidth="2"
              strokeDasharray="5,5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: index * 0.2 }}
            />
          ))}
        </motion.g>
      </svg>

      {/* Sparkles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          variants={sparkleVariants}
          animate="animate"
          transition={{ delay: i * 0.2 }}
        >
          <Sparkles className="w-4 h-4 text-yellow-400 dark:text-yellow-300" />
        </motion.div>
      ))}
    </div>
  );
}; 