// Quiz Question Generator
// Generates questions from fight database

import { QuizQuestion, QuestionTemplate, DailyQuizConfig, DEFAULT_DAILY_CONFIG } from '@/types/quiz'
import { Fight, Fighter, Event } from '@/types/database'

// Mock fight data for MVP - replace with actual database calls
const MOCK_FIGHTS = [
  {
    id: '1',
    event: { name: 'UFC 285', date: '2023-03-04', location: 'Las Vegas, NV' },
    fighter1: { name: 'Jon Jones', nickname: 'Bones' },
    fighter2: { name: 'Ciryl Gane', nickname: 'Bon Gamin' },
    result: 'Win',
    method: 'Submission',
    round: 1,
    time: '2:04',
    weight_class: 'Heavyweight',
    title_fight: true
  },
  {
    id: '2',
    event: { name: 'UFC 260', date: '2021-03-27', location: 'Las Vegas, NV' },
    fighter1: { name: 'Francis Ngannou', nickname: 'The Predator' },
    fighter2: { name: 'Stipe Miocic', nickname: '' },
    result: 'Win',
    method: 'KO/TKO',
    round: 2,
    time: '0:52',
    weight_class: 'Heavyweight',
    title_fight: true
  },
  {
    id: '3',
    event: { name: 'UFC Fight Night 139', date: '2018-11-10', location: 'Beijing, China' },
    fighter1: { name: 'Chan Sung Jung', nickname: 'Korean Zombie' },
    fighter2: { name: 'Leonard Garcia', nickname: 'Bad Boy' },
    result: 'Win',
    method: 'KO/TKO',
    round: 1,
    time: '4:59',
    weight_class: 'Featherweight',
    title_fight: false
  },
  {
    id: '4',
    event: { name: 'UFC 229', date: '2018-10-06', location: 'Las Vegas, NV' },
    fighter1: { name: 'Khabib Nurmagomedov', nickname: 'The Eagle' },
    fighter2: { name: 'Conor McGregor', nickname: 'Notorious' },
    result: 'Win',
    method: 'Submission',
    round: 4,
    time: '3:03',
    weight_class: 'Lightweight',
    title_fight: true
  },
  {
    id: '5',
    event: { name: 'UFC 194', date: '2015-12-12', location: 'Las Vegas, NV' },
    fighter1: { name: 'Conor McGregor', nickname: 'Notorious' },
    fighter2: { name: 'Jose Aldo', nickname: 'Scarface' },
    result: 'Win',
    method: 'KO/TKO',
    round: 1,
    time: '0:13',
    weight_class: 'Featherweight',
    title_fight: true
  }
]

// Question templates
const QUESTION_TEMPLATES: QuestionTemplate[] = [
  // EASY - Winner questions
  {
    type: 'winner',
    difficulty: 'easy',
    template: 'Who won {fighter1} vs {fighter2} at {event}?',
    generator: (fight) => ({
      type: 'winner',
      difficulty: 'easy',
      question: `Who won ${fight.fighter1.name} vs ${fight.fighter2.name} at ${fight.event.name}?`,
      options: [fight.fighter1.name, fight.fighter2.name, 'Draw', 'No Contest'],
      correct_answer: fight.result === 'Win' ? fight.fighter1.name : fight.fighter2.name,
      explanation: `${fight.fighter1.name} won by ${fight.method} in round ${fight.round}.`,
      points: 10
    })
  },
  
  // EASY - Method questions for title fights
  {
    type: 'method',
    difficulty: 'easy',
    template: 'How did {winner} finish {loser}?',
    generator: (fight) => ({
      type: 'method',
      difficulty: 'easy', 
      question: `How did ${fight.fighter1.name} win against ${fight.fighter2.name} at ${fight.event.name}?`,
      options: ['Decision', 'KO/TKO', 'Submission', 'DQ'],
      correct_answer: fight.method,
      explanation: `${fight.fighter1.name} won by ${fight.method} in round ${fight.round} at ${fight.time}.`,
      points: 10
    })
  },

  // MEDIUM - Round/Time questions
  {
    type: 'round',
    difficulty: 'medium',
    template: 'In which round did {fight} end?',
    generator: (fight) => ({
      type: 'round',
      difficulty: 'medium',
      question: `In which round did ${fight.fighter1.name} vs ${fight.fighter2.name} end?`,
      options: ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5'],
      correct_answer: `Round ${fight.round}`,
      explanation: `The fight ended in round ${fight.round} at ${fight.time}.`,
      points: 20
    })
  },

  // MEDIUM - Event questions
  {
    type: 'event',
    difficulty: 'medium',
    template: 'At which event did {fight} take place?',
    generator: (fight) => {
      // Generate fake event options
      const fakeEvents = [
        'UFC 284', 'UFC Fight Night 200', 'UFC 286', 'The Ultimate Fighter Finale'
      ].filter(e => e !== fight.event.name)
      
      const shuffledOptions = [fight.event.name, ...fakeEvents.slice(0, 3)]
        .sort(() => Math.random() - 0.5)
      
      return {
        type: 'event',
        difficulty: 'medium',
        question: `At which event did ${fight.fighter1.name} face ${fight.fighter2.name}?`,
        options: shuffledOptions,
        correct_answer: fight.event.name,
        explanation: `This fight took place at ${fight.event.name} on ${fight.event.date}.`,
        points: 20
      }
    }
  },

  // HARD - Year questions
  {
    type: 'year',
    difficulty: 'hard',
    template: 'In what year did {fight} happen?',
    generator: (fight) => {
      const fightYear = new Date(fight.event.date).getFullYear().toString()
      const fakeYears = [
        (parseInt(fightYear) - 1).toString(),
        (parseInt(fightYear) + 1).toString(), 
        (parseInt(fightYear) - 2).toString()
      ]
      
      const shuffledOptions = [fightYear, ...fakeYears]
        .sort(() => Math.random() - 0.5)
        
      return {
        type: 'year',
        difficulty: 'hard',
        question: `In what year did ${fight.fighter1.name} vs ${fight.fighter2.name} take place?`,
        options: shuffledOptions,
        correct_answer: fightYear,
        explanation: `This fight happened on ${fight.event.date} at ${fight.event.name}.`,
        points: 30
      }
    }
  }
]

export class QuizQuestionGenerator {
  
  // Generate daily quiz with seeded randomization
  generateDailyQuiz(date: string, config: DailyQuizConfig = DEFAULT_DAILY_CONFIG): QuizQuestion[] {
    console.log(`🎯 Generating daily quiz for ${date}`)
    
    // Seed random number generator with date for consistent results
    const seed = this.dateToSeed(date)
    const rng = this.seededRandom(seed)
    
    const questions: QuizQuestion[] = []
    
    // Generate questions by difficulty
    questions.push(...this.generateQuestionsByDifficulty('easy', config.difficulty_distribution.easy, rng))
    questions.push(...this.generateQuestionsByDifficulty('medium', config.difficulty_distribution.medium, rng))
    questions.push(...this.generateQuestionsByDifficulty('hard', config.difficulty_distribution.hard, rng))
    
    // Shuffle questions with seeded random
    return this.shuffleArray(questions, rng)
  }
  
  private generateQuestionsByDifficulty(
    difficulty: 'easy' | 'medium' | 'hard', 
    count: number,
    rng: () => number
  ): QuizQuestion[] {
    const questions: QuizQuestion[] = []
    const availableTemplates = QUESTION_TEMPLATES.filter(t => t.difficulty === difficulty)
    const availableFights = MOCK_FIGHTS.filter(f => {
      // Easy: Title fights and big names
      if (difficulty === 'easy') return f.title_fight || f.fighter1.name.includes('McGregor') || f.fighter1.name.includes('Jones')
      // Medium: Notable fights
      if (difficulty === 'medium') return true
      // Hard: Any fight
      return true
    })
    
    for (let i = 0; i < count; i++) {
      const template = availableTemplates[Math.floor(rng() * availableTemplates.length)]
      const fight = availableFights[Math.floor(rng() * availableFights.length)]
      
      const question = template.generator(fight)
      questions.push({
        id: `q-${difficulty}-${i}-${Date.now()}`,
        fight_id: fight.id,
        ...question
      })
    }
    
    return questions
  }
  
  // Convert date string to number seed
  private dateToSeed(date: string): number {
    let hash = 0
    for (let i = 0; i < date.length; i++) {
      const char = date.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
  
  // Seeded random number generator
  private seededRandom(seed: number): () => number {
    let m = 2**35 - 31
    let a = 185852
    let s = seed % m
    return function () {
      return (s = s * a % m) / m
    }
  }
  
  // Shuffle array with seeded randomness
  private shuffleArray<T>(array: T[], rng: () => number): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
  
  // Get today's quiz
  getTodaysQuiz(): QuizQuestion[] {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    return this.generateDailyQuiz(today)
  }
  
  // Preview quiz for testing
  previewQuiz(date: string): QuizQuestion[] {
    return this.generateDailyQuiz(date)
  }
}

// Export singleton
export const questionGenerator = new QuizQuestionGenerator()