'use client'

import React, {useState} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {getFlashcards} from '@/lib/flashcards'

import './flashcard.css'
import {Button} from '@/components/ui/button'
import {Loader} from 'react-feather'

export default function Flashcard({courseId}) {
  const [cards, setFlashcards] = useState([])
  const [index, setIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleNext = () => {
    setShowAnswer(false)
    setIndex((prev) => (prev + 1) % cards.length)
  }

  const handlePrev = () => {
    setShowAnswer(false)
    setIndex((prev) => (prev - 1 + cards.length) % cards.length)
  }

  const toggleAnswer = () => setShowAnswer((prev) => !prev)

  const generateFlashcards = async () => {
    setLoading(true)
    try {
      const flashcardsRaw = await getFlashcards(courseId)
      const flashcards = flashcardsRaw.data || []
      if (flashcards.length > 0) {
        setFlashcards(flashcards)
      }
      setLoading(false)
    } catch (err) {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className='mb-9'>
        <Button onClick={() => generateFlashcards()} disabled={loading}>
          {loading ? <Loader /> : null}
          {loading ? 'Generating flashcards' : 'Generate Flashcards'}
        </Button>
      </div>
      {cards.length > 0 ? (
        <div className='flex flex-col items-center gap-4'>
          <div className='w-[70%] h-40 relative perspective-1000'>
            <AnimatePresence>
              <motion.div
                key={index}
                initial={{x: 300, opacity: 0}}
                animate={{x: 0, opacity: 1}}
                exit={{x: -300, opacity: 0}}
                transition={{duration: 0.3}}
                drag='x'
                dragConstraints={{left: 0, right: 0}}
                onDragEnd={(e, info) => {
                  if (info.offset.x < -50) handleNext()
                  if (info.offset.x > 50) handlePrev()
                }}
                className='absolute w-full h-full cursor-grab'
              >
                {/* Flip container */}
                <motion.div
                  animate={{rotateY: showAnswer ? 180 : 0}}
                  transition={{duration: 0.6}}
                  className='w-full h-full relative'
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Front side */}
                  <div
                    className='flashcard-q absolute w-full h-full text-lg bg-red-400 text-white rounded-md flex items-center justify-center p-4 text-center font-bold'
                    style={{backfaceVisibility: 'hidden'}}
                  >
                    {cards[index].question}
                  </div>

                  {/* Back side */}
                  <div
                    className='flashcard-a absolute w-full h-full text-lg bg-blue-500 text-white rounded-md flex items-center justify-center p-4 text-center font-bold'
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    {cards[index].answer}
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/*Pagination*/}
          <div className='flex mt-4'>
            <p>
              {index + 1} of {cards.length}
            </p>
          </div>

          <div className='flex gap-2 mt-5'>
            <Button onClick={handlePrev} variant='secondary'>
              Previous
            </Button>
            <Button onClick={toggleAnswer}>
              {showAnswer ? 'Hide Answer' : 'Reveal Answer'}
            </Button>
            <Button onClick={handleNext} variant='secondary'>
              Next
            </Button>
          </div>
        </div>
      ) : (
        <div>
          No flashcards available yet. You can click on generate to create.
        </div>
      )}
    </div>
  )
}
