'use client';

import { motion } from 'framer-motion';

interface LoadingAnimationProps {
  phase: string;
}

export default function LoadingAnimation({ phase }: LoadingAnimationProps) {
  const dots = [0, 1, 2];

  return (
    <motion.div 
      className="text-center py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* アニメーション要素 */}
      <div className="relative w-24 h-24 mx-auto mb-6">
        {/* 回転する外枠 */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-blue-200"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        
        {/* パルスする中心 */}
        <motion.div
          className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* 中心のアイコン */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* フェーズ表示 */}
      <motion.h2 
        className="text-xl font-semibold text-gray-800 mb-2"
        key={phase}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {phase}
      </motion.h2>

      {/* アニメーションする点々 */}
      <div className="flex justify-center space-x-1 mb-4">
        {dots.map((dot) => (
          <motion.div
            key={dot}
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ 
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: dot * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <p className="text-gray-600 text-sm">
        しばらくお待ちください
      </p>
    </motion.div>
  );
}