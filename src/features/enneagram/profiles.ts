import type { EnneagramType } from './types'

export interface TypeProfile {
  type: EnneagramType
  name: string
  summary: string
  traits: readonly string[]
  strengths: string
  challenges: string
  reflection: string
}

// Editorial descriptions for reflection; type names follow Emotional Coaching.
export const profiles: readonly TypeProfile[] = [
  { type: 1, name: 'Perfeccionista', summary: 'Costuma valorizar coerência, responsabilidade e melhoria.', traits: ['Critério', 'Organização', 'Senso de responsabilidade'], strengths: 'Atenção à qualidade e compromisso com o que considera correto.', challenges: 'A autocrítica pode dificultar o descanso e a flexibilidade.', reflection: 'Em quais momentos você pode aceitar o suficiente, sem exigir perfeição?' },
  { type: 2, name: 'Ajudante', summary: 'Pode encontrar sentido em cuidar e estar disponível para outras pessoas.', traits: ['Acolhimento', 'Generosidade', 'Atenção ao outro'], strengths: 'Sensibilidade para necessidades e vínculos.', challenges: 'Pode deixar suas próprias necessidades em segundo plano.', reflection: 'Como você reconhece e comunica o que também precisa?' },
  { type: 3, name: 'Realizador', summary: 'Frequentemente se orienta por objetivos, ação e realização.', traits: ['Iniciativa', 'Foco', 'Adaptabilidade'], strengths: 'Capacidade de mobilizar energia para concretizar planos.', challenges: 'O valor pessoal pode ficar excessivamente ligado ao desempenho.', reflection: 'O que continua valioso em você mesmo quando não há uma meta a cumprir?' },
  { type: 4, name: 'Idealista', summary: 'Pode dar especial importância à autenticidade e à expressão pessoal.', traits: ['Sensibilidade', 'Criatividade', 'Profundidade'], strengths: 'Abertura para nuances emocionais e perspectivas próprias.', challenges: 'Comparações podem acentuar a sensação de falta.', reflection: 'O que no presente merece sua atenção sem precisar ser diferente?' },
  { type: 5, name: 'Analítico', summary: 'Tende a buscar compreensão, autonomia e espaço para observar.', traits: ['Curiosidade', 'Análise', 'Reserva'], strengths: 'Profundidade de estudo e clareza conceitual.', challenges: 'A preparação prolongada pode adiar a participação.', reflection: 'Quando você já sabe o bastante para experimentar na prática?' },
  { type: 6, name: 'Precavido', summary: 'Pode valorizar segurança, confiança e preparação diante de incertezas.', traits: ['Lealdade', 'Prudência', 'Atenção a riscos'], strengths: 'Cuidado com compromissos e antecipação de problemas.', challenges: 'Dúvidas recorrentes podem dificultar decisões.', reflection: 'Quais recursos internos ajudam você a decidir mesmo sem certeza total?' },
  { type: 7, name: 'Otimista', summary: 'Costuma se interessar por possibilidades, liberdade e novas experiências.', traits: ['Otimismo', 'Versatilidade', 'Entusiasmo'], strengths: 'Energia para explorar caminhos e reunir ideias.', challenges: 'Muitas opções podem tornar difícil permanecer com o desconforto.', reflection: 'O que acontece quando você permanece um pouco mais com uma experiência difícil?' },
  { type: 8, name: 'Desafiador', summary: 'Pode se orientar por autonomia, franqueza e capacidade de agir.', traits: ['Determinação', 'Diretividade', 'Proteção'], strengths: 'Disposição para assumir responsabilidades e enfrentar obstáculos.', challenges: 'A intensidade pode reduzir o espaço para vulnerabilidade e escuta.', reflection: 'Em que situação mostrar incerteza poderia fortalecer uma relação?' },
  { type: 9, name: 'Pacífico', summary: 'Costuma buscar harmonia e considerar diferentes pontos de vista.', traits: ['Escuta', 'Calma', 'Mediação'], strengths: 'Facilidade para acolher diferenças e reduzir tensões.', challenges: 'Evitar conflitos pode afastar você das próprias prioridades.', reflection: 'Qual pequena preferência sua merece ser expressa hoje?' },
]

export function getProfile(type: EnneagramType): TypeProfile {
  return profiles[type - 1]
}
