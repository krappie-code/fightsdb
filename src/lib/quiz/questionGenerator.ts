// Quiz Question Generator - Build Fix
// Simplified version to resolve build issues

import { QuizQuestion, DailyQuizConfig, DEFAULT_DAILY_CONFIG } from '@/types/quiz'

// Simplified mock fight data for MVP
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
    id: '4',
    event: { name: 'UFC 194', date: '2015-12-12', location: 'Las Vegas, NV' },
    fighter1: { name: 'Conor McGregor', nickname: 'Notorious' },
    fighter2: { name: 'Jose Aldo', nickname: 'Scarface' },
    result: 'Win',
    method: 'KO/TKO',
    round: 1,
    time: '0:13',
    weight_class: 'Featherweight',
    title_fight: true
  },
  {
    id: '5',
    event: { name: 'UFC Fight Night 139', date: '2018-11-10', location: 'Beijing, China' },
    fighter1: { name: 'Chan Sung Jung', nickname: 'Korean Zombie' },
    fighter2: { name: 'Leonard Garcia', nickname: 'Bad Boy' },
    result: 'Win',
    method: 'KO/TKO',
    round: 1,
    time: '4:59',
    weight_class: 'Featherweight',
    title_fight: false
  }
]

export class QuizQuestionGenerator {
  
  generateDailyQuiz(date: string, config: DailyQuizConfig = DEFAULT_DAILY_CONFIG): QuizQuestion[] {
    console.log(`🎯 Generating daily quiz for ${date}`)
    
    const seed = this.dateToSeed(date)
    const rng = this.seededRandom(seed)
    
    const questions: QuizQuestion[] = []
    
    // Generate easy questions (7)
    for (let i = 0; i < 7; i++) {
      const fight = MOCK_FIGHTS[Math.floor(rng() * MOCK_FIGHTS.length)]
      questions.push({
        id: `easy-${i}`,
        fight_id: fight.id,
        type: 'winner',
        difficulty: 'easy',
        question: `Who won ${fight.fighter1.name} vs ${fight.fighter2.name} at ${fight.event.name}?`,
        options: [fight.fighter1.name, fight.fighter2.name, 'Draw', 'No Contest'],
        correct_answer: fight.fighter1.name,
        explanation: `${fight.fighter1.name} won by ${fight.method} in round ${fight.round}.`,
        points: 10
      })
    }
    
    // Generate medium questions (2)
    for (let i = 0; i < 2; i++) {
      const fight = MOCK_FIGHTS[Math.floor(rng() * MOCK_FIGHTS.length)]
      questions.push({
        id: `medium-${i}`,
        fight_id: fight.id,
        type: 'method',
        difficulty: 'medium',
        question: `How did ${fight.fighter1.name} win against ${fight.fighter2.name}?`,
        options: ['Decision', 'KO/TKO', 'Submission', 'DQ'],
        correct_answer: fight.method,
        explanation: `${fight.fighter1.name} won by ${fight.method}.`,
        points: 20
      })
    }
    
    // Generate hard question (1)
    const fight = MOCK_FIGHTS[0]
    questions.push({
      id: 'hard-1',
      fight_id: fight.id,
      type: 'year',
      difficulty: 'hard',
      question: `In what year did ${fight.fighter1.name} vs ${fight.fighter2.name} take place?`,
      options: ['2022', '2023', '2024', '2025'],
      correct_answer: '2023',
      explanation: `This fight happened in 2023.`,
      points: 30
    })
    
    return this.shuffleArray(questions, rng)
  }
  
  private dateToSeed(date: string): number {
    let hash = 0
    for (let i = 0; i < date.length; i++) {
      const char = date.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }
  
  private seededRandom(seed: number): () => number {
    const m = Math.pow(2, 35) - 31
    const a = 185852
    let s = seed % m
    return function () {
      return (s = s * a % m) / m
    }
  }
  
  private shuffleArray<T>(array: T[], rng: () => number): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      const temp = shuffled[i]
      shuffled[i] = shuffled[j]
      shuffled[j] = temp
    }
    return shuffled
  }
  
  getTodaysQuiz(): QuizQuestion[] {
    const today = new Date().toISOString().split('T')[0]
    return this.generateDailyQuiz(today)
  }
}

export const questionGenerator = new QuizQuestionGenerator()