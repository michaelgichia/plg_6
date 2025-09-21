"use client";

import React, {useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {getFlashcard} from "@/lib/flashcards";

import './flashcard.css';
import {Button} from "@/components/ui/button";


export default function Flashcard({courseId,}) {
  const [cards, setFlashcards] = useState([])
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    setShowAnswer(false);
    setIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setShowAnswer(false);
    setIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const toggleAnswer = () => setShowAnswer((prev) => !prev);


  const generateFlashcards = async () => {
    setLoading(true)
    try {
      const flashcards = await getFlashcard(courseId) || []
      if (flashcards.length > 0) {
        setFlashcards(flashcards)
      }
      setLoading(false)
    } catch (err) {
      setLoading(false)
    }
  }


  return (
    <>
      <div className="mb-9">
        <Button
          onClick={() => generateFlashcards()}
          disabled={loading}
          className={`bg-blue-600 hover:bg-blue-700 text-white ${loading && 'loading'}`}
        >
          Generate Flashcards
        </Button>
      </div>
      {cards.length > 0 ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-[70%] h-40 relative perspective-1000">
            <AnimatePresence>
              <motion.div
                key={index}
                initial={{x: 300, opacity: 0}}
                animate={{x: 0, opacity: 1}}
                exit={{x: -300, opacity: 0}}
                transition={{duration: 0.3}}
                drag="x"
                dragConstraints={{left: 0, right: 0}}
                onDragEnd={(e, info) => {
                  if (info.offset.x < -50) handleNext();
                  if (info.offset.x > 50) handlePrev();
                }}
                className="absolute w-full h-full cursor-grab"
              >
                {/* Flip container */}
                <motion.div
                  animate={{rotateY: showAnswer ? 180 : 0}}
                  transition={{duration: 0.6}}
                  className="w-full h-full relative"
                  style={{
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Front side */}
                  <div
                    className="flashcard-q absolute w-full h-full text-lg bg-red-400 text-white rounded-md flex items-center justify-center p-4 text-center font-bold"
                    style={{backfaceVisibility: "hidden"}}
                  >
                    {cards[index].question}
                  </div>

                  {/* Back side */}
                  <div
                    className="flashcard-a absolute w-full h-full text-lg bg-blue-500 text-white rounded-md flex items-center justify-center p-4 text-center font-bold"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    {cards[index].answer}
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex gap-2 mt-9">
            <button
              onClick={handlePrev}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Previous
            </button>
            <button
              onClick={toggleAnswer}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              {showAnswer ? "Hide Answer" : "Reveal Answer"}
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <div>
          No flashcards available yet. You can click on generate to create.
        </div>
      )}
    </>

  );
}
