// FightsDB Database Schema Types

export interface Fighter {
  id: string
  name: string
  nickname?: string
  weight_class: WeightClass
  wins: number
  losses: number
  draws: number
  reach?: number
  height?: string
  stance?: 'Orthodox' | 'Southpaw' | 'Switch'
  birth_date?: string
  birth_location?: string
  record_json?: FighterStats
  created_at: string
  updated_at: string
}

export interface FighterStats {
  strikes_landed?: number
  strikes_attempted?: number
  takedowns_landed?: number
  takedowns_attempted?: number
  submissions_attempted?: number
  knockdowns?: number
}

export interface Event {
  id: string
  name: string
  date: string
  venue_id: string
  location: string
  card_type: 'main' | 'prelims' | 'early-prelims'
  event_type: 'UFC' | 'UFC Fight Night' | 'The Ultimate Fighter' | 'Dana White\'s Contender Series'
  poster_url?: string
  created_at: string
  updated_at: string
}

export interface Venue {
  id: string
  name: string
  city: string
  state?: string
  country: string
  capacity?: number
  altitude?: number
  timezone: string
  fight_history_stats?: VenueStats
  created_at: string
  updated_at: string
}

export interface VenueStats {
  total_events?: number
  finish_rate?: number
  avg_fight_time?: number
  crowd_energy_rating?: number
}

export interface Fight {
  id: string
  event_id: string
  fighter1_id: string
  fighter2_id: string
  weight_class: WeightClass
  title_fight: boolean
  main_event: boolean
  result?: FightResult
  method?: FinishMethod
  method_detail?: string
  round?: number
  time?: string
  referee?: string
  bonuses?: ('FOTN' | 'POTN' | 'SOTN')[]
  fight_stats?: FightStats
  created_at: string
  updated_at: string
}

export interface FightStats {
  total_strikes_f1?: number
  total_strikes_f2?: number
  significant_strikes_f1?: number
  significant_strikes_f2?: number
  takedowns_f1?: number
  takedowns_f2?: number
  control_time_f1?: string
  control_time_f2?: string
  knockdowns_f1?: number
  knockdowns_f2?: number
}

export interface FightRating {
  id: string
  user_id: string
  fight_id: string
  rating: number // 1-5 stars
  review?: string
  spoiler_free_review?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface RedditSentiment {
  id: string
  fight_id: string
  subreddit: string
  post_count: number
  avg_sentiment: number // -1 to 1
  sentiment_breakdown: {
    positive: number
    neutral: number
    negative: number
  }
  top_comments?: string[]
  last_scraped_at: string
}

export type WeightClass = 
  | 'Strawweight'
  | 'Flyweight' 
  | 'Bantamweight'
  | 'Featherweight'
  | 'Lightweight'
  | 'Welterweight'
  | 'Middleweight'
  | 'Light Heavyweight'
  | 'Heavyweight'
  | 'Women\'s Strawweight'
  | 'Women\'s Flyweight'
  | 'Women\'s Bantamweight'
  | 'Women\'s Featherweight'
  | 'Catch Weight'

export type FightResult = 'Win' | 'Loss' | 'Draw' | 'No Contest' | 'DQ'

export type FinishMethod = 
  | 'KO/TKO'
  | 'Submission'
  | 'Decision'
  | 'DQ'
  | 'No Contest'

// API Response Types for scrapers
export interface UFCStatsResponse {
  events: UFCEventData[]
  fighters: UFCFighterData[]  
  fights: UFCFightData[]
}

export interface UFCEventData {
  event_id: string
  event_name: string
  event_date: string
  location: string
}

export interface UFCFighterData {
  fighter_id: string
  first_name: string
  last_name: string
  nickname: string
  height: string
  weight: string
  reach: string
  stance: string
  wins: string
  losses: string
  draws: string
  dob: string
}

export interface UFCFightData {
  fight_id: string
  event_id: string
  fighter_1: string
  fighter_2: string
  result: string
  method: string
  round: string
  time: string
  weight_class: string
  title_fight: boolean
}