export type EnneagramType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export interface Item {
  id: string
  text: string
  instruction?: string
  /** Direct-sum instruments use this key. Custom scorers may key one item to many types. */
  type?: EnneagramType
  /** Allows distinct anchors for sections such as bipolar items. */
  anchors?: readonly [string, string, string, string, string]
}

export interface Instrument {
  id: string
  version: string
  title: string
  source: string
  license: string
  estimatedMinutes: number
  anchors: readonly [string, string, string, string, string]
  items: readonly Item[]
}

export type Answers = Readonly<Record<string, number | undefined>>

export interface TypeScore {
  type: EnneagramType
  raw: number
  /** Share of the sum of all nine raw scores; not a membership probability. */
  percentage: number
  minimum: number
  maximum: number
  itemCount: number
}

export interface ScoreResult {
  instrumentId: string
  instrumentVersion: string
  scores: readonly TypeScore[]
  topScore: number
  leaders: readonly EnneagramType[]
  dominantType: EnneagramType | null
}

/** A new licensed questionnaire can provide its own pure scorer without changing the UI or PDF. */
export interface Assessment {
  instrument: Instrument
  score: (answers: Answers) => ScoreResult
}
