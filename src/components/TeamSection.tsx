import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Mail } from 'lucide-react';
// Import images
import shalemImage from '../image/md.png';
import atharvImage from '../image/atharv.png';
import prachiImage from '../image/prachi.png';
import shirajImage from '../image/shriraj.png';
import harshadImage from '../image/harshad.png';

const teamMembers = [
	{
		name: 'Md Abu Shalem Alam',
		role: 'Team Leader',
		department: 'Cyber Security',
		image: shalemImage,
		social: {
			github: 'https://github.com/MD-HACKER07',
			linkedin: 'https://www.linkedin.com/in/md-abu-shalem-alam-726a93292',
			email: 'mailto:mdabushalem615@gmail.com'
		}
	},
	{
		name: 'Atharav Deshmukh',
		role: 'Team Member',
		department: 'CSE',
		image: atharvImage,
		social: {
			github: 'https://github.com/Atharva1811',
			linkedin: 'https://www.linkedin.com/in/atharva-milind-deshmukh-9234a7322/',
			email: 'mailto:milind.atharva24@sanjivani.edu.in'
		}
	},
	{
		name: 'Prachi Shelke',
		role: 'Team Member',
		department: 'CSE',
		image: prachiImage,
		social: {
			github: 'https://github.com/prachishelke24',
			linkedin: 'https://www.linkedin.com/in/prachi-shelke-82753931b/',
			email: 'mailto:suhas.prachi24@sanjivani.edu.in'
		}
	},
	{
		name: 'Shiraj Girase',
		role: 'Team Member',
		department: 'Cyber Security',
		image: shirajImage,
		social: {
			github: 'https://github.com/yourusername',
			linkedin: 'https://www.linkedin.com/in/shriraj-girme-343971331/',
			email: 'mailto:your.email@example.com'
		}
	},
	{
		name: 'Harshad Pund',
		role: 'Team Member',
		department: 'CSE',
		image: harshadImage,
		social: {
			github: 'https://github.com/yourusername',
			linkedin: 'https://www.linkedin.com/in/harshad-pund-967554265/',
			email: 'mailto:your.email@example.com'
		}
	}
];

const cardVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.6 }
	}
};

export const TeamSection = () => {
	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			{/* Add horizontal scrolling container */}
			<div className="relative">
				{/* Gradient fade effect on edges */}
				<div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-gray-800 to-transparent z-10" />
				<div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-800 to-transparent z-10" />
				
				{/* Scrollable container */}
				<div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
					{teamMembers.map((member, index) => (
						<motion.div
							key={member.name}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: index * 0.1 }}
							className="relative group flex-shrink-0 w-[280px]"
						>
							<div className="relative p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
								{/* Background Accent */}
								<div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-xl group-hover:bg-blue-600/20 dark:group-hover:bg-blue-500/20 transition-colors" />

								{/* Profile Image */}
								<div className="relative mb-4">
									<div className="w-28 h-28 mx-auto rounded-full overflow-hidden ring-4 ring-blue-500/20 dark:ring-blue-400/20">
										<img
											src={member.image}
											alt={member.name}
											className="w-full h-full object-cover"
											onError={(e) => {
												e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0D8ABC&color=fff`;
											}}
										/>
									</div>
								</div>

								{/* Member Info */}
								<div className="text-center">
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
										{member.name}
									</h3>
									<p className="text-blue-600 dark:text-blue-400 font-medium mb-1">
										{member.role}
									</p>
									<p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
										{member.department}
									</p>

									{/* Social Links */}
									<div className="flex justify-center space-x-4">
										<motion.a
											href={member.social.github}
											target="_blank"
											rel="noopener noreferrer"
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.9 }}
											className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
										>
											<Github className="w-5 h-5" />
										</motion.a>
										<motion.a
											href={member.social.linkedin}
											target="_blank"
											rel="noopener noreferrer"
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.9 }}
											className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
										>
											<Linkedin className="w-5 h-5" />
										</motion.a>
										<motion.a
											href={member.social.email}
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.9 }}
											className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
										>
											<Mail className="w-5 h-5" />
										</motion.a>
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