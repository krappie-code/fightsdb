'use client'

import React, { useState, useEffect } from 'react'
import { QuizQuestion, QuizAnswer, QuizAttempt, QuizResult } from '@/types/quiz'
import { questionGenerator } from '@/lib/quiz/questionGenerator'
import { QuizLeaderboardAPI, LeaderboardEntry, LeaderboardResponse, UserScore } from '@/lib/quiz/leaderboard'

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
  const [questionCountdown, setQuestionCountdown] = useState<number | null>(null)
  const [questionTimer, setQuestionTimer] = useState<number>(5)
  const [isQuestionActive, setIsQuestionActive] = useState(false)
  const [timeoutOccurred, setTimeoutOccurred] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [hasCompletedToday, setHasCompletedToday] = useState(false)
  const [showUsernameEntry, setShowUsernameEntry] = useState(false)
  const [username, setUsername] = useState('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)
  const [currentUserScore, setCurrentUserScore] = useState<UserScore | null>(null)
  const [leaderboardPage, setLeaderboardPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [userRank, setUserRank] = useState<number | undefined>(undefined)

  // Check if user has completed today's quiz and load questions
  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        // Check if quiz already completed today
        if (QuizLeaderboardAPI.hasCompletedToday()) {
          setHasCompletedToday(true)
          setIsLoading(false)
          return
        }

        // Load today's quiz questions
        const todaysQuestions = questionGenerator.getTodaysQuiz()
        setQuestions(todaysQuestions)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to initialize quiz:', error)
        setIsLoading(false)
      }
    }
    
    initializeQuiz()
  }, [])

  const startQuiz = () => {
    setShowIntro(false)
    setStartTime(Date.now())
    startQuestionCountdown()
  }

  const saveToLeaderboard = async (finalUsername: string) => {
    if (!result) return
    
    const today = new Date().toISOString().split('T')[0]
    
    const entry = {
      username: finalUsername || 'Anonymous',
      score: result.attempt.score,
      maxScore: result.attempt.max_score,
      percentage: result.attempt.percentage,
      totalTime: result.attempt.time_taken,
      quizDate: today
    }
    
    console.log('💾 Saving score to leaderboard:', entry)
    
    try {
      const success = await QuizLeaderboardAPI.saveScore(entry)
      QuizLeaderboardAPI.markCompleted(today)
      console.log(success ? '✅ Score saved to database!' : '📱 Score saved locally (database fallback)')
      setShowUsernameEntry(false)
    } catch (error) {
      console.error('❌ Error saving to leaderboard:', error)
      setShowUsernameEntry(false)
    }
  }

  const loadLeaderboard = async (page: number = 1, findUser: boolean = false) => {
    setLoadingLeaderboard(true)
    try {
      let response: LeaderboardResponse
      
      if (findUser && currentUserScore) {
        response = await QuizLeaderboardAPI.findUserInLeaderboard(currentUserScore)
      } else {
        response = await QuizLeaderboardAPI.getLeaderboard(undefined, page)
      }
      
      setLeaderboard(response.leaderboard)
      setLeaderboardPage(response.currentPage)
      setTotalCount(response.totalCount)
      setHasMore(response.hasMore)
      setUserRank(response.userRank)
      
      console.log(`📊 Loaded ${response.leaderboard.length} entries, page ${response.currentPage}/${Math.ceil(response.totalCount / 50)}`)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
      setLeaderboard([])
    } finally {
      setLoadingLeaderboard(false)
    }
  }

  // Question countdown timer (3-2-1)
  useEffect(() => {
    if (questionCountdown !== null && questionCountdown > 0) {
      const timer = setTimeout(() => {
        setQuestionCountdown(questionCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (questionCountdown === 0) {
      // Countdown finished, start question
      setQuestionCountdown(null)
      setIsQuestionActive(true)
      setQuestionTimer(5)
      setQuestionStartTime(Date.now())
    }
  }, [questionCountdown])

  // 5-second question timer
  useEffect(() => {
    if (isQuestionActive && questionTimer > 0 && !selectedAnswer && !showFeedback) {
      const timer = setTimeout(() => {
        setQuestionTimer(questionTimer - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (isQuestionActive && questionTimer === 0 && !selectedAnswer && !showFeedback) {
      // Time's up! Auto-fail
      handleTimeout()
    }
  }, [isQuestionActive, questionTimer, selectedAnswer, showFeedback])

  const startQuestionCountdown = () => {
    setQuestionCountdown(3)
    setIsQuestionActive(false)
    setSelectedAnswer('')
    setShowFeedback(false)
    setTimeoutOccurred(false)
  }

  const handleTimeout = () => {
    if (!currentQuestion) return
    
    setTimeoutOccurred(true)
    setIsQuestionActive(false)
    
    // Record as incorrect answer
    const timeTaken = 5 // Full 5 seconds
    const answer: QuizAnswer = {
      question_id: currentQuestion.id,
      selected_answer: 'TIMEOUT',
      is_correct: false,
      time_taken: timeTaken
    }

    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)
    setIsCorrect(false)
    setShowFeedback(true)
  }

  const currentQuestion = questions[currentQuestionIndex] || null
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const handleAnswerSelect = (answer: string) => {
    if (!isQuestionActive || showFeedback || !currentQuestion) return
    
    setSelectedAnswer(answer)
    setIsQuestionActive(false) // Stop timer when answer is selected
    
    // Immediately submit the answer
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000)
    const answerObj: QuizAnswer = {
      question_id: currentQuestion.id,
      selected_answer: answer,
      is_correct: answer === currentQuestion.correct_answer,
      time_taken: timeTaken
    }

    const newAnswers = [...answers, answerObj]
    setAnswers(newAnswers)

    // Show feedback
    setIsCorrect(answerObj.is_correct)
    setShowFeedback(true)
  }

  const handleNextQuestion = () => {
    if (!showFeedback) return

    // Advance to next question or complete
    if (isLastQuestion) {
      // Quiz complete!
      completeQuiz(answers)
    } else {
      // Next question - start countdown
      setCurrentQuestionIndex(prev => prev + 1)
      startQuestionCountdown()
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
    setShowUsernameEntry(true)
    
    // Store user's score for leaderboard highlighting
    setCurrentUserScore({
      score: quizResult.attempt.score,
      totalTime: quizResult.attempt.time_taken
    })
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
        <p className="text-gray-300">Loading today's UFC quiz...</p>
      </div>
    )
  }

  // Intro/Briefing screen
  if (showIntro) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">{quizTitle}</h1>
          <div className="text-lg text-gray-300 mb-8">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        <div className="bg-slate-800 border border-gray-700 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">How It Works</h2>
          
          <div className="space-y-4 text-gray-300">
            <div className="flex items-start">
              <span className="text-red-500 mr-3 text-lg">⏱️</span>
              <div>
                <strong className="text-white">5 seconds per question</strong>
                <p className="text-sm text-gray-400">You have exactly 5 seconds to choose an answer. Choose quickly!</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <span className="text-blue-500 mr-3 text-lg">🎯</span>
              <div>
                <strong className="text-white">{questions.length} questions total</strong>
                <p className="text-sm text-gray-400">Mix of easy, medium, and hard UFC trivia questions.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <span className="text-green-500 mr-3 text-lg">🏆</span>
              <div>
                <strong className="text-white">Points and timing matter</strong>
                <p className="text-sm text-gray-400">Score points for correct answers. Total time is used for tie-breaking.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <span className="text-yellow-500 mr-3 text-lg">⚡</span>
              <div>
                <strong className="text-white">Click to answer</strong>
                <p className="text-sm text-gray-400">Clicking an option immediately submits it - no take-backs!</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={startQuiz}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-lg px-12 py-4 rounded-lg transition-colors"
          >
            Start Quiz 🚀
          </button>
        </div>
        
        <p className="text-center text-gray-400 text-sm mt-4">
          Ready to test your UFC knowledge? Good luck! 🥊
        </p>
      </div>
    )
  }

  // Already completed today's quiz
  if (hasCompletedToday) {
    return (
      <AlreadyCompletedScreen 
        leaderboard={leaderboard}
        loadingLeaderboard={loadingLeaderboard}
        currentPage={leaderboardPage}
        totalCount={totalCount}
        hasMore={hasMore}
        userRank={userRank}
        currentUserScore={currentUserScore || undefined}
        onLoadLeaderboard={loadLeaderboard}
        onPageChange={(page) => loadLeaderboard(page)}
        onFindMe={() => loadLeaderboard(1, true)}
      />
    )
  }

  // Question countdown screen (3-2-1)
  if (questionCountdown !== null) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold text-white mb-8">{quizTitle}</h1>
        <div className="text-gray-300 mb-4">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
        <div className="text-8xl font-bold text-red-500 mb-4 animate-pulse">
          {questionCountdown}
        </div>
        <p className="text-gray-400">Get ready...</p>
      </div>
    )
  }

  if (isComplete && result) {
    if (showUsernameEntry) {
      return (
        <UsernameEntryScreen 
          result={result}
          username={username}
          setUsername={setUsername}
          onSave={saveToLeaderboard}
          onSkip={() => saveToLeaderboard('')}
        />
      )
    }
    
    return (
      <QuizResultsScreen 
        result={result} 
        questions={questions}
        onShare={shareResult}
        leaderboard={leaderboard}
        loadingLeaderboard={loadingLeaderboard}
        currentPage={leaderboardPage}
        totalCount={totalCount}
        hasMore={hasMore}
        userRank={userRank}
        currentUserScore={currentUserScore || undefined}
        onLoadLeaderboard={loadLeaderboard}
        onPageChange={(page) => loadLeaderboard(page)}
        onFindMe={() => loadLeaderboard(1, true)}
      />
    )
  }

  // Safety check - if no questions or current question is missing
  if (!questions.length || !currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading quiz questions...</p>
      </div>
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

        {/* Timer */}
        {isQuestionActive && !showFeedback && (
          <div className="mt-4 flex items-center justify-center">
            <div className={`text-2xl font-bold px-4 py-2 rounded-lg ${
              questionTimer <= 2 ? 'text-red-400 bg-red-900/30 animate-pulse' : 'text-yellow-400 bg-yellow-900/30'
            }`}>
              ⏱️ {questionTimer}s
            </div>
          </div>
        )}
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
              } else if ((selectedAnswer === option && !isCorrect) || (timeoutOccurred && option !== currentQuestion.correct_answer)) {
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
                onClick={() => handleAnswerSelect(option)}
                disabled={showFeedback || timeoutOccurred || !isQuestionActive}
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
                      {((selectedAnswer === option && !isCorrect) || (timeoutOccurred && selectedAnswer !== option)) && option !== currentQuestion.correct_answer && (
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
                {timeoutOccurred ? 'Time\'s Up!' : (isCorrect ? 'Correct!' : 'Incorrect')}
              </span>
            </div>
            <p className="text-gray-300 text-sm">
              {currentQuestion?.explanation}
            </p>
            {timeoutOccurred && (
              <p className="text-yellow-300 text-xs mt-2">
                ⏰ You ran out of time! The correct answer was: <strong>{currentQuestion?.correct_answer}</strong>
              </p>
            )}
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
        
        {showFeedback && (
          <button
            onClick={handleNextQuestion}
            className="bg-red-600 text-white hover:bg-red-700 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {isLastQuestion ? 'Complete Quiz' : 'Next Question →'}
          </button>
        )}
      </div>
    </div>
  )
}

interface AlreadyCompletedScreenProps {
  leaderboard: LeaderboardEntry[]
  loadingLeaderboard: boolean
  currentPage: number
  totalCount: number
  hasMore: boolean
  userRank?: number
  currentUserScore?: UserScore
  onLoadLeaderboard: (page?: number, findUser?: boolean) => void
  onPageChange: (page: number) => void
  onFindMe: () => void
}

function AlreadyCompletedScreen({ 
  leaderboard, 
  loadingLeaderboard, 
  currentPage, 
  totalCount, 
  hasMore, 
  userRank,
  currentUserScore,
  onLoadLeaderboard, 
  onPageChange, 
  onFindMe 
}: AlreadyCompletedScreenProps) {
  // Load leaderboard on mount
  React.useEffect(() => {
    if (leaderboard.length === 0 && !loadingLeaderboard) {
      onLoadLeaderboard()
    }
  }, [leaderboard.length, loadingLeaderboard, onLoadLeaderboard])

  const isCurrentUser = (entry: LeaderboardEntry) => {
    if (!currentUserScore) return false
    return entry.score === currentUserScore.score && entry.totalTime === currentUserScore.totalTime
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-white mb-4">Quiz Already Completed</h1>
        <p className="text-gray-300 text-lg">
          You've already taken today's UFC quiz! Come back tomorrow for new questions.
        </p>
        <div className="mt-4 text-sm text-gray-400">
          New quiz available at UTC midnight ({new Date(new Date().setUTCHours(24,0,0,0)).toLocaleString()})
        </div>
        {userRank && (
          <div className="mt-2 text-lg text-yellow-400 font-semibold">
            🏆 Your Rank: #{userRank} out of {totalCount}
          </div>
        )}
      </div>

      <div className="bg-slate-800 border border-gray-700 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">📊 Today's Leaderboard</h2>
          <div className="flex gap-2">
            {currentUserScore && (
              <button
                onClick={onFindMe}
                className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors"
                disabled={loadingLeaderboard}
              >
                👤 Find Me
              </button>
            )}
          </div>
        </div>
        
        {loadingLeaderboard ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading leaderboard...</p>
          </div>
        ) : leaderboard.length > 0 ? (
          <>
            <div className="space-y-2">
              {leaderboard.map((entry: LeaderboardEntry, index: number) => {
                const globalRank = (currentPage - 1) * 50 + index + 1
                const isUser = isCurrentUser(entry)
                
                return (
                  <div 
                    key={entry.id || index} 
                    className={`flex justify-between items-center py-3 px-4 rounded-lg ${
                      isUser 
                        ? 'bg-yellow-900/50 border border-yellow-600 shadow-lg' 
                        : 'bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className={`w-8 text-center font-medium ${
                        isUser ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        #{globalRank}
                      </span>
                      <span className={`font-medium ml-3 ${
                        isUser ? 'text-yellow-300' : 'text-white'
                      }`}>
                        {entry.username}
                        {isUser && ' 👑'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-400 font-medium">{entry.score}/{entry.maxScore}</span>
                      <span className="text-gray-400 font-mono">
                        {entry.totalTime && !isNaN(entry.totalTime) 
                          ? `${Math.floor(entry.totalTime / 60)}:${(entry.totalTime % 60).toString().padStart(2, '0')}`
                          : '--:--'
                        }
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Pagination */}
            {totalCount > 50 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Showing {(currentPage - 1) * 50 + 1}-{Math.min(currentPage * 50, totalCount)} of {totalCount} entries
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loadingLeaderboard}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm rounded-lg transition-colors"
                  >
                    ← Prev
                  </button>
                  <span className="px-3 py-2 bg-slate-700 text-white text-sm rounded-lg">
                    Page {currentPage}
                  </span>
                  <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!hasMore || loadingLeaderboard}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No scores yet today. Be the first to take the quiz!
          </div>
        )}
      </div>
    </div>
  )
}

interface UsernameEntryScreenProps {
  result: QuizResult
  username: string
  setUsername: (username: string) => void
  onSave: (username: string) => void
  onSkip: () => void
}

function UsernameEntryScreen({ result, username, setUsername, onSave, onSkip }: UsernameEntryScreenProps) {
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
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">{performanceEmoji}</div>
        <h1 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h1>
        <div className={`text-xl font-semibold ${performanceColor}`}>
          {performance_rating}
        </div>
      </div>

      <div className="bg-slate-800 border border-gray-700 rounded-lg p-6 mb-6">
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-red-500 mb-2">
            {attempt.score}/{attempt.max_score}
          </div>
          <div className="text-xl text-gray-300">
            {attempt.percentage}% Correct
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Total Time: {attempt.time_taken && !isNaN(attempt.time_taken) 
              ? `${Math.floor(attempt.time_taken / 60)}:${(attempt.time_taken % 60).toString().padStart(2, '0')}`
              : '--:--'
            }
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 text-center">Save to Leaderboard</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Enter your name (optional):</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name or nickname"
              className="w-full p-3 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
              maxLength={20}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onSave(username)}
              className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Save Score 🏆
            </button>
            <button
              onClick={onSkip}
              className="flex-1 bg-gray-700 text-gray-300 py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Skip (Anonymous)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface QuizResultsScreenProps {
  result: QuizResult
  questions: QuizQuestion[]
  onShare: () => void
  leaderboard: LeaderboardEntry[]
  loadingLeaderboard: boolean
  currentPage: number
  totalCount: number
  hasMore: boolean
  userRank?: number
  currentUserScore?: UserScore
  onLoadLeaderboard: (page?: number, findUser?: boolean) => void
  onPageChange: (page: number) => void
  onFindMe: () => void
}

function QuizResultsScreen({ 
  result, 
  questions, 
  onShare, 
  leaderboard, 
  loadingLeaderboard,
  currentPage,
  totalCount,
  hasMore,
  userRank,
  currentUserScore,
  onLoadLeaderboard, 
  onPageChange,
  onFindMe
}: QuizResultsScreenProps) {
  // Load leaderboard on mount
  React.useEffect(() => {
    if (leaderboard.length === 0 && !loadingLeaderboard) {
      onLoadLeaderboard()
    }
  }, [leaderboard.length, loadingLeaderboard, onLoadLeaderboard])
  
  const isCurrentUser = (entry: LeaderboardEntry) => {
    if (!currentUserScore) return false
    return entry.score === currentUserScore.score && entry.totalTime === currentUserScore.totalTime
  }
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
            Total Time: {attempt.time_taken && !isNaN(attempt.time_taken) 
              ? `${Math.floor(attempt.time_taken / 60)}:${(attempt.time_taken % 60).toString().padStart(2, '0')}`
              : '--:--'
            }
          </div>
          <div className="text-xs text-gray-500 mt-1">
            💡 Time is used for tie-breaking on leaderboards
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
      <div className="space-y-6">
        <button
          onClick={onShare}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          📱 Share Your Score
        </button>
        
        <div className="text-center">
          <div className="text-gray-300 font-medium mb-2">✅ Score saved to today's leaderboard!</div>
          <div className="text-sm text-gray-400">
            Come back tomorrow for a new quiz at UTC midnight
          </div>
          <div className="text-xs text-gray-500 mt-1">
            ({new Date(new Date().setUTCHours(24,0,0,0)).toLocaleString()})
          </div>
        </div>

        <div className="bg-slate-700/50 border border-gray-600 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-white">📊 Today's Leaderboard</h3>
            {currentUserScore && totalCount > 50 && (
              <button
                onClick={onFindMe}
                className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors"
                disabled={loadingLeaderboard}
              >
                👤 Find Me
              </button>
            )}
          </div>
          
          {userRank && (
            <div className="text-center mb-4 p-2 bg-yellow-900/30 rounded-lg border border-yellow-600/50">
              <div className="text-yellow-400 font-semibold">
                🏆 Your Rank: #{userRank} out of {totalCount}
              </div>
            </div>
          )}
          
          {loadingLeaderboard ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto mb-2"></div>
              <p className="text-gray-400 text-sm">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length > 0 ? (
            <>
              <div className="space-y-2">
                {leaderboard.slice(0, 10).map((entry: LeaderboardEntry, index: number) => {
                  const globalRank = (currentPage - 1) * 50 + index + 1
                  const isUser = isCurrentUser(entry)
                  
                  return (
                    <div 
                      key={entry.id || index} 
                      className={`flex justify-between items-center py-2 px-3 rounded ${
                        isUser 
                          ? 'bg-yellow-900/50 border border-yellow-600' 
                          : 'bg-slate-600/50'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className={`w-6 text-center font-medium ${
                          isUser ? 'text-yellow-400' : 'text-gray-400'
                        }`}>
                          #{globalRank}
                        </span>
                        <span className={`font-medium ml-2 ${
                          isUser ? 'text-yellow-300' : 'text-white'
                        }`}>
                          {entry.username}
                          {isUser && ' 👑'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-400 font-medium">{entry.score}/{entry.maxScore}</span>
                        <span className="text-gray-400 font-mono">
                          {entry.totalTime && !isNaN(entry.totalTime) 
                            ? `${Math.floor(entry.totalTime / 60)}:${(entry.totalTime % 60).toString().padStart(2, '0')}`
                            : '--:--'
                          }
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {totalCount > 50 && (
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-600 text-xs">
                  <div className="text-gray-400">
                    Showing {(currentPage - 1) * 50 + 1}-{Math.min(currentPage * 50, totalCount)} of {totalCount}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onPageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loadingLeaderboard}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-xs rounded transition-colors"
                    >
                      ←
                    </button>
                    <span className="px-2 py-1 bg-slate-600 text-white text-xs rounded">
                      {currentPage}
                    </span>
                    <button
                      onClick={() => onPageChange(currentPage + 1)}
                      disabled={!hasMore || loadingLeaderboard}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-xs rounded transition-colors"
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-gray-400 text-sm">
              No scores yet today. You're the first!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}