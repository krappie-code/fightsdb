'use client'

import React, { useState, useEffect } from 'react'
import { QuizQuestion, QuizAnswer, QuizAttempt, QuizResult } from '@/types/quiz'
import { questionGenerator } from '@/lib/quiz/questionGenerator'

interface QuizInterfaceProps {
  quizTitle?: string
  onComplete?: (result: QuizResult) => void
}

export function QuizInterface({ quizTitle = "Daily UFC Quiz", onComplete }: QuizInterfaceProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [isComplete, setIsComplete] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)

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

    if (isLastQuestion) {
      // Quiz complete!
      completeQuiz(newAnswers)
    } else {
      // Next question
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer('')
      setQuestionStartTime(Date.now())
    }
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
    onComplete?.(quizResult)
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{quizTitle}</h1>
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString()}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div 
            className="bg-red-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex-1">
            {currentQuestion?.question}
          </h2>
          <div className="flex gap-2 ml-4">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              currentQuestion?.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              currentQuestion?.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {currentQuestion?.difficulty}
            </span>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
              {currentQuestion?.points} pts
            </span>
          </div>
        </div>
        
        {/* Answer Options */}
        <div className="space-y-3">
          {currentQuestion?.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              className={`w-full text-left p-4 border rounded-lg transition-all ${
                selectedAnswer === option
                  ? 'border-red-500 bg-red-50 text-red-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <span className="text-sm font-medium mr-3">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span>{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <div className="text-sm text-gray-500">
          {answers.length > 0 && (
            <span>
              Score: {answers.filter(a => a.is_correct).length}/{answers.length}
            </span>
          )}
        </div>
        
        <button
          onClick={handleNextQuestion}
          disabled={!selectedAnswer}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            selectedAnswer
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLastQuestion ? 'Complete Quiz' : 'Next Question'}
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
    performance_rating === 'Encyclopedia' ? 'text-purple-600' :
    performance_rating === 'Expert' ? 'text-green-600' :
    performance_rating === 'Fan' ? 'text-blue-600' : 'text-gray-600'

  const performanceEmoji = 
    performance_rating === 'Encyclopedia' ? '🏆' :
    performance_rating === 'Expert' ? '⭐' :
    performance_rating === 'Fan' ? '👍' : '📚'

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">{performanceEmoji}</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
        <div className={`text-xl font-semibold ${performanceColor}`}>
          {performance_rating}
        </div>
      </div>

      {/* Score Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-red-600 mb-2">
            {attempt.score}/{attempt.max_score}
          </div>
          <div className="text-xl text-gray-600">
            {attempt.percentage}% Correct
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Completed in {Math.floor(attempt.time_taken / 60)}:{(attempt.time_taken % 60).toString().padStart(2, '0')}
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
          <div className="text-center">
            <div className="text-sm text-green-600 font-medium">Easy</div>
            <div className="text-lg font-bold">{breakdown.easy_correct}/7</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-yellow-600 font-medium">Medium</div>
            <div className="text-lg font-bold">{breakdown.medium_correct}/2</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-red-600 font-medium">Hard</div>
            <div className="text-lg font-bold">{breakdown.hard_correct}/1</div>
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
          className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          🔄 Take Tomorrow's Quiz
        </button>
        
        <div className="text-center text-sm text-gray-500">
          Come back tomorrow for a new quiz!
        </div>
      </div>
    </div>
  )
}