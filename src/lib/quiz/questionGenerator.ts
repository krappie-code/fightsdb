// Quiz Question Generator - Updated with Recent Events
import { QuizQuestion, DailyQuizConfig, DEFAULT_DAILY_CONFIG } from '@/types/quiz'

// Updated mock fight data with recent events
const MOCK_FIGHTS = [
  // Recent - March 28, 2026
  {
    id: '6',
    event: { name: 'UFC Fight Night: Adesanya vs. Pyfer', date: '2026-03-28', location: 'Seattle, WA' },
    fighter1: { name: 'Israel Adesanya', nickname: 'The Last Stylebender' },
    fighter2: { name: 'Joe Pyfer', nickname: 'Bodybagz' },
    result: 'Win',
    method: 'Decision',
    round: 3,
    time: '5:00',
    weight_class: 'Middleweight',
    title_fight: false
  },
  // Classic fights
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
  },
  // March 7, 2026 event
  {
    id: '7',
    event: { name: 'UFC 326: Holloway vs. Oliveira 2', date: '2026-03-07', location: 'Las Vegas, NV' },
    fighter1: { name: 'Max Holloway', nickname: 'Blessed' },
    fighter2: { name: 'Charles Oliveira', nickname: 'Do Bronx' },
    result: 'Win',
    method: 'Decision',
    round: 5,
    time: '5:00',
    weight_class: 'Featherweight',
    title_fight: true
  },
  // March 21, 2026 event
  {
    id: '8',
    event: { name: 'UFC Fight Night: Evloev vs. Murphy', date: '2026-03-21', location: 'London, England' },
    fighter1: { name: 'Movsar Evloev', nickname: '' },
    fighter2: { name: 'Lerone Murphy', nickname: 'The Miracle' },
    result: 'Win',
    method: 'Decision',
    round: 3,
    time: '5:00',
    weight_class: 'Featherweight',
    title_fight: false
  },
  // April 5, 2026 event
  {
    id: '9',
    event: { name: 'UFC Fight Night: Moicano vs. Duncan', date: '2026-04-05', location: 'Las Vegas, NV' },
    fighter1: { name: 'Renato Moicano', nickname: 'Money' },
    fighter2: { name: 'Duncan', nickname: '' },
    result: 'Win',
    method: 'Submission',
    round: 2,
    time: '3:15',
    weight_class: 'Lightweight',
    title_fight: false
  }
]

export class QuizQuestionGenerator {
  
  generateDailyQuiz(date: string, config: DailyQuizConfig = DEFAULT_DAILY_CONFIG): QuizQuestion[] {
    const seed = this.dateToSeed(date)
    const rng = this.seededRandom(seed)
    
    // Shuffle fights to ensure uniqueness
    const shuffledFights = this.shuffleArray([...MOCK_FIGHTS], rng)
    const usedFights = new Set<string>()
    const questions: QuizQuestion[] = []
    
    // Question templates for variety
    const questionTemplates = {
      easy: [
        (fight: any) => ({
          type: 'winner' as const,
          question: `Who won ${fight.fighter1.name} vs ${fight.fighter2.name} at ${fight.event.name}?`,
          options: this.shuffleArray([fight.fighter1.name, fight.fighter2.name], this.seededRandom(fight.id.charCodeAt(0))),
          correct_answer: fight.fighter1.name,
          explanation: `${fight.fighter1.name} won by ${fight.method} in round ${fight.round}.`
        }),
        (fight: any) => ({
          type: 'method' as const,
          question: `How did ${fight.fighter1.name} defeat ${fight.fighter2.name}?`,
          options: ['Decision', 'KO/TKO', 'Submission', 'DQ'],
          correct_answer: fight.method,
          explanation: `${fight.fighter1.name} won by ${fight.method} in round ${fight.round}.`
        })
      ],
      medium: [
        (fight: any) => ({
          type: 'event' as const,
          question: `At which event did ${fight.fighter1.name} face ${fight.fighter2.name}?`,
          options: this.generateEventOptions(fight.event.name, rng),
          correct_answer: fight.event.name,
          explanation: `This fight took place at ${fight.event.name} on ${fight.event.date}.`
        }),
        (fight: any) => ({
          type: 'round' as const,
          question: `In which round did ${fight.fighter1.name} vs ${fight.fighter2.name} end?`,
          options: ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5'],
          correct_answer: `Round ${fight.round}`,
          explanation: `The fight ended in round ${fight.round} at ${fight.time}.`
        })
      ],
      hard: [
        (fight: any) => ({
          type: 'year' as const,
          question: `In what year did ${fight.fighter1.name} vs ${fight.fighter2.name} take place?`,
          options: this.generateYearOptions(fight.event.date, rng),
          correct_answer: new Date(fight.event.date).getFullYear().toString(),
          explanation: `This fight happened on ${fight.event.date} at ${fight.event.name}.`
        }),
        (fight: any) => ({
          type: 'event' as const,
          question: `At which city did ${fight.fighter1.name} vs ${fight.fighter2.name} take place?`,
          options: this.generateLocationOptions(fight.event.location, rng),
          correct_answer: fight.event.location.split(',')[0], // Get city part
          explanation: `This fight took place in ${fight.event.location}.`
        })
      ]
    }
    
    // Generate easy questions (7) - ensure unique fights
    for (let i = 0; i < 7 && shuffledFights.length > usedFights.size; i++) {
      const fight = this.getUnusedFight(shuffledFights, usedFights)
      if (!fight) break
      
      const template = questionTemplates.easy[Math.floor(rng() * questionTemplates.easy.length)]
      const questionData = template(fight)
      
      questions.push({
        id: `easy-${i}`,
        fight_id: fight.id,
        difficulty: 'easy',
        points: 10,
        ...questionData
      })
      
      usedFights.add(fight.id)
    }
    
    // Generate medium questions (2) - ensure unique fights
    for (let i = 0; i < 2 && shuffledFights.length > usedFights.size; i++) {
      const fight = this.getUnusedFight(shuffledFights, usedFights)
      if (!fight) break
      
      const template = questionTemplates.medium[Math.floor(rng() * questionTemplates.medium.length)]
      const questionData = template(fight)
      
      questions.push({
        id: `medium-${i}`,
        fight_id: fight.id,
        difficulty: 'medium',
        points: 20,
        ...questionData
      })
      
      usedFights.add(fight.id)
    }
    
    // Generate hard question (1) - ensure unique fight
    if (shuffledFights.length > usedFights.size) {
      const fight = this.getUnusedFight(shuffledFights, usedFights)
      if (fight) {
        const template = questionTemplates.hard[Math.floor(rng() * questionTemplates.hard.length)]
        const questionData = template(fight)
        
        questions.push({
          id: 'hard-1',
          fight_id: fight.id,
          difficulty: 'hard',
          points: 30,
          ...questionData
        })
      }
    }
    
    return this.shuffleArray(questions, rng)
  }
  
  private getUnusedFight(fights: any[], usedIds: Set<string>): any | null {
    return fights.find(fight => !usedIds.has(fight.id)) || null
  }
  
  private generateEventOptions(correctEvent: string, rng: () => number): string[] {
    const fakeEvents = [
      'UFC 284', 'UFC Fight Night 200', 'UFC 286', 'The Ultimate Fighter Finale',
      'UFC 287', 'UFC Fight Night 201', 'UFC 288', 'UFC Fight Night 202'
    ].filter(e => e !== correctEvent)
    
    const shuffled = this.shuffleArray(fakeEvents, rng)
    return this.shuffleArray([correctEvent, ...shuffled.slice(0, 3)], rng)
  }
  
  private generateYearOptions(correctDate: string, rng: () => number): string[] {
    const year = new Date(correctDate).getFullYear()
    const fakeYears = [year - 1, year + 1, year - 2, year + 2]
      .map(y => y.toString())
      .filter(y => y !== year.toString())
    
    const shuffled = this.shuffleArray(fakeYears, rng)
    return this.shuffleArray([year.toString(), ...shuffled.slice(0, 3)], rng)
  }
  
  private generateLocationOptions(correctLocation: string, rng: () => number): string[] {
    const city = correctLocation.split(',')[0]
    const fakeCities = [
      'Las Vegas', 'New York', 'Miami', 'Los Angeles', 'Chicago', 'Boston',
      'London', 'Paris', 'Tokyo', 'Sydney', 'Toronto', 'Dublin'
    ].filter(c => c !== city)
    
    const shuffled = this.shuffleArray(fakeCities, rng)
    return this.shuffleArray([city, ...shuffled.slice(0, 3)], rng)
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