'use client'

import React, { useState, useEffect } from 'react'
import { QuizQuestion, QuizAnswer, QuizAttempt, QuizResult } from '@/types/quiz'
import { questionGenerator } from '@/lib/quiz/questionGenerator'

interface QuizInterfaceProps {
  quizTitle?: string
}

export function QuizInterface({ quizTitle = "Daily UFC Quiz" }: QuizInterfaceProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [isComplete, setIsComplete] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean>(false)

  // Load today's quiz on mount
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const todaysQuestions = questionGenerator.getTodaysQuiz()
        setQuestions(todaysQuestions)
        setStartTime(Date.now())
        setQuestionStartTime(Date.now())
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load quiz:', error)
        setIsLoading(false)
      }
    }
    
    loadQuiz()
  }, [])

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer)
  }

  const handleNextQuestion = () => {
    if (!selectedAnswer) return

    // Record answer
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000)
    const answer: QuizAnswer = {
      question_id: currentQuestion.id,
      selected_answer: selectedAnswer,
      is_correct: selectedAnswer === currentQuestion.correct_answer,
      time_taken: timeTaken
    }

    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)

    // Show feedback
    setIsCorrect(answer.is_correct)
    setShowFeedback(true)

    // Wait 1.5 seconds to show feedback, then advance
    setTimeout(() => {
      setShowFeedback(false)
      
      if (isLastQuestion) {
        // Quiz complete!
        completeQuiz(newAnswers)
      } else {
        // Next question
        setCurrentQuestionIndex(prev => prev + 1)
        setSelectedAnswer('')
        setQuestionStartTime(Date.now())
        setShowFeedback(false)
        setIsCorrect(false)
      }
    }, 1500)
  }

  const completeQuiz = (finalAnswers: QuizAnswer[]) => {
    const totalTime = Math.round((Date.now() - startTime) / 1000)
    const score = finalAnswers.filter(a => a.is_correct).length
    const maxScore = questions.length
    const percentage = Math.round((score / maxScore) * 100)

    const attempt: QuizAttempt = {
      quiz_id: `daily-${new Date().toISOString().split('T')[0]}`,
      score,
      max_score: maxScore,
      percentage,
      time_taken: totalTime,
      answers: finalAnswers,
      completed_at: new Date().toISOString()
    }

    // Calculate breakdown
    const breakdown = {
      correct: score,
      incorrect: maxScore - score,
      easy_correct: finalAnswers.filter(a => {
        const q = questions.find(q => q.id === a.question_id)
        return q?.difficulty === 'easy' && a.is_correct
      }).length,
      medium_correct: finalAnswers.filter(a => {
        const q = questions.find(q => q.id === a.question_id)
        return q?.difficulty === 'medium' && a.is_correct
      }).length,
      hard_correct: finalAnswers.filter(a => {
        const q = questions.find(q => q.id === a.question_id)
        return q?.difficulty === 'hard' && a.is_correct
      }).length
    }

    const performance_rating = 
      percentage >= 90 ? 'Encyclopedia' :
      percentage >= 75 ? 'Expert' :
      percentage >= 60 ? 'Fan' : 'Novice'

    const quizResult: QuizResult = {
      attempt,
      breakdown,
      performance_rating
    }

    setResult(quizResult)
    setIsComplete(true)
    
    // Handle completion internally
    console.log('Quiz completed:', quizResult)
    
    // Track completion in localStorage for streak tracking (future feature)
    if (typeof window !== 'undefined') {
      const today = new Date().toISOString().split('T')[0]
      const completedQuizzes = JSON.parse(localStorage.getItem('completed_quizzes') || '[]')
      if (!completedQuizzes.includes(today)) {
        completedQuizzes.push(today)
        localStorage.setItem('completed_quizzes', JSON.stringify(completedQuizzes))
      }
    }
  }

  const shareResult = () => {
    if (!result) return

    const emoji = 
      result.performance_rating === 'Encyclopedia' ? '🏆' :
      result.performance_rating === 'Expert' ? '⭐' :
      result.performance_rating === 'Fan' ? '👍' : '📚'

    const shareText = `I scored ${result.attempt.score}/${result.attempt.max_score} on today's UFC Quiz! ${emoji}\n\nCan you beat my score? 🥊`

    if (navigator.share) {
      navigator.share({
        title: 'UFC Quiz Result',
        text: shareText,
        url: window.location.origin + '/quiz/daily'
      })
    } else {
      navigator.clipboard.writeText(shareText + ` ${window.location.origin}/quiz/daily`)
      alert('Result copied to clipboard!')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading today's UFC quiz...</p>
      </div>
    )
  }

  if (isComplete && result) {
    return (
      <QuizResultsScreen 
        result={result} 
        questions={questions}
        onShare={shareResult}
        onRetake={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{quizTitle}</h1>
        <div className="flex justify-between items-center">
          <p className="text-gray-300">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
          <div className="text-sm text-gray-400">
            {new Date().toLocaleDateString()}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
          <div 
            className="bg-red-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-slate-800 border border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-white flex-1">
            {currentQuestion?.question}
          </h2>
          <div className="flex gap-2 ml-4">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              currentQuestion?.difficulty === 'easy' ? 'bg-green-900 text-green-300' :
              currentQuestion?.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-300' :
              'bg-red-900 text-red-300'
            }`}>
              {currentQuestion?.difficulty}
            </span>
            <span className="text-xs px-2 py-1 bg-blue-900 text-blue-300 rounded-full font-medium">
              {currentQuestion?.points} pts
            </span>
          </div>
        </div>
        
        {/* Answer Options */}
        <div className="space-y-3">
          {currentQuestion?.options.map((option, index) => {
            let buttonClass = 'w-full text-left p-4 border rounded-lg transition-all '
            
            if (showFeedback) {
              // Show feedback colors
              if (option === currentQuestion.correct_answer) {
                buttonClass += 'border-green-500 bg-green-900/30 text-green-200'
              } else if (selectedAnswer === option && !isCorrect) {
                buttonClass += 'border-red-500 bg-red-900/30 text-red-200'
              } else {
                buttonClass += 'border-gray-600 bg-slate-700/50 text-gray-400'
              }
            } else {
              // Normal state
              if (selectedAnswer === option) {
                buttonClass += 'border-blue-500 bg-blue-900/30 text-blue-200'
              } else {
                buttonClass += 'border-gray-600 hover:border-gray-500 hover:bg-slate-700 text-gray-200'
              }
            }

            return (
              <button
                key={`${currentQuestion.id}-${index}`}
                onClick={() => !showFeedback && handleAnswerSelect(option)}
                disabled={showFeedback}
                className={buttonClass}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-3 text-gray-400">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span>{option}</span>
                  </div>
                  {showFeedback && (
                    <div className="flex items-center">
                      {option === currentQuestion.correct_answer && (
                        <span className="text-green-400 text-lg">✓</span>
                      )}
                      {selectedAnswer === option && !isCorrect && option !== currentQuestion.correct_answer && (
                        <span className="text-red-400 text-lg">✗</span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
        
        {/* Feedback Message */}
        {showFeedback && (
          <div className={`mt-4 p-4 rounded-lg ${isCorrect ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
            <div className="flex items-center mb-2">
              <span className={`text-lg mr-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? '✓' : '✗'}
              </span>
              <span className={`font-semibold ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
            <p className="text-gray-300 text-sm">
              {currentQuestion?.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <div className="text-sm text-gray-400">
          {answers.length > 0 && (
            <span>
              Score: {answers.filter(a => a.is_correct).length}/{answers.length}
            </span>
          )}
        </div>
        
        <button
          onClick={handleNextQuestion}
          disabled={!selectedAnswer || showFeedback}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            selectedAnswer && !showFeedback
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {showFeedback 
            ? (isLastQuestion ? 'Finishing...' : 'Next Question...') 
            : (isLastQuestion ? 'Complete Quiz' : 'Next Question')
          }
        </button>
      </div>
    </div>
  )
}

interface QuizResultsScreenProps {
  result: QuizResult
  questions: QuizQuestion[]
  onShare: () => void
  onRetake: () => void
}

function QuizResultsScreen({ result, questions, onShare, onRetake }: QuizResultsScreenProps) {
  const { attempt, breakdown, performance_rating } = result

  const performanceColor = 
    performance_rating === 'Encyclopedia' ? 'text-purple-400' :
    performance_rating === 'Expert' ? 'text-green-400' :
    performance_rating === 'Fan' ? 'text-blue-400' : 'text-gray-400'

  const performanceEmoji = 
    performance_rating === 'Encyclopedia' ? '🏆' :
    performance_rating === 'Expert' ? '⭐' :
    performance_rating === 'Fan' ? '👍' : '📚'

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">{performanceEmoji}</div>
        <h1 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h1>
        <div className={`text-xl font-semibold ${performanceColor}`}>
          {performance_rating}
        </div>
      </div>

      {/* Score Card */}
      <div className="bg-slate-800 border border-gray-700 rounded-lg p-6 mb-6">
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-red-500 mb-2">
            {attempt.score}/{attempt.max_score}
          </div>
          <div className="text-xl text-gray-300">
            {attempt.percentage}% Correct
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Completed in {Math.floor(attempt.time_taken / 60)}:{(attempt.time_taken % 60).toString().padStart(2, '0')}
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-600">
          <div className="text-center">
            <div className="text-sm text-green-400 font-medium">Easy</div>
            <div className="text-lg font-bold text-white">{breakdown.easy_correct}/7</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-yellow-400 font-medium">Medium</div>
            <div className="text-lg font-bold text-white">{breakdown.medium_correct}/2</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-red-400 font-medium">Hard</div>
            <div className="text-lg font-bold text-white">{breakdown.hard_correct}/1</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <button
          onClick={onShare}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          📱 Share Your Score
        </button>
        
        <button
          onClick={onRetake}
          className="w-full bg-gray-700 text-gray-300 py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition-colors"
        >
          🔄 Take Tomorrow's Quiz
        </button>
        
        <div className="text-center text-sm text-gray-400">
          Come back tomorrow for a new quiz!
        </div>
      </div>
    </div>
  )
}