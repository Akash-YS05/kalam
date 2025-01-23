'use client'
import { motion } from 'framer-motion'
import { Paintbrush, Users, Zap } from 'lucide-react'

const features = [
  {
    icon: <Paintbrush className="h-8 w-8 text-primary" />,
    title: 'Intuitive Drawing Tools',
    description: 'Create beautiful diagrams and sketches with our easy-to-use drawing tools.',
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Real-time Collaboration',
    description: 'Work together with your team in real-time, no matter where you are.',
  },
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: 'Lightning Fast',
    description: 'Experience smooth and responsive drawing with our optimized performance.',
  },
]

export default function Features() {
  return (
    <section id="features" className="py-20 bg-gray-800">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-700 rounded-lg p-6 shadow-lg"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}