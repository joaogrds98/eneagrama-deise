# Análise de fontes e arquitetura

Revisão em 16/10/2026. Este registro distingue código, conteúdo do questionário e permissão para publicação. A existência de uma página pública ou licença do software não autoriza automaticamente a redistribuição das perguntas.

## Referências investigadas

| Fonte | Achado | Decisão |
| --- | --- | --- |
| [Guia AgentTune](https://agent-tune.com/guides/open-source-enneagram-test) e [repositório](https://github.com/bernardjhuang/agenttune) | Código e exemplo sintético de 36 controles em nove grupos sob MIT. Os controles não medem personalidade. A licença MIT do código não cobre itens de terceiros. | Não usar o exemplo sintético como teste real. |
| [Registro de direitos da AgentTune](https://agent-tune.com/resources/content/instrument-rights.json) | Para OEPS, registra `exact_license_unresolved` e pede licença ou permissão que cubra adaptação e distribuição. | Não copiar a adaptação de 36 itens. |
| [Página da adaptação AgentTune](https://agent-tune.com/tests/enneagram) | Exibe 36 itens, escala 1–5, quatro por tipo, soma simples e sem reversão. A página contém informação conflitante sobre empates: um trecho diz preservar todos; outro indica escolher o menor número. | Não adotada. O motor de pontuação preserva empates, sem desempate arbitrário. |
| [OEPS original e desenvolvimento](https://openpsychometrics.org/tests/OEPS/development/) | O ODT v1 contém 36 itens intercalados, quatro por tipo, escala 1–5 e soma direta. O ODT v2 contém 54 itens, incluindo pares bipolares, itens com chave para mais de um tipo e pontuação reversa `6 - resposta`. A [página atual do teste](https://openpsychometrics.org/tests/OEPS/) também cita 54 itens, enquanto a página de desenvolvimento diz 57: é preciso fixar o documento exato. A [lista de desenvolvimento](https://openpsychometrics.org/development/) menciona Creative Commons, mas não identifica a modalidade exata do OEPS. | Não usar as perguntas sem licença específica e revisão da versão. |
| [Emotional Coaching](https://emotionalcoaching.com.br/testepersonalidade/) | Inspeção de 16/10/2026: 135 afirmações identificadas pelos grupos `QuestionType001` a `QuestionType135`, 15 por tipo. A ordem visual varia a cada carregamento. O script público soma as respostas de cada tipo e calcula sua participação sobre a soma geral. Não foi identificada regra explícita de desempate. O rodapé atribui a ferramenta a Luciana Viana. | Em 16/10/2026 o responsável pelo projeto informou autorização de reprodução e adaptação confirmada por Deise via professora. O documento não foi anexado. Os enunciados e a chave foram integrados; a plataforma usa âncoras próprias e preserva todos os empates. |
| [rheti-python](https://github.com/nthmost/rheti-python) | Repositório MIT que transcreve o RHETI, instrumento de terceiros. A licença do repositório não demonstra autorização sobre as perguntas. | Rejeitado. |
| [Persona Synthesis](https://github.com/maulpatias/persona-synthesis) | O [README](https://github.com/maulpatias/persona-synthesis/blob/main/README.md) anuncia 54/108 questões e diz que seriam adaptadas de fontes Apache 2.0, mas não identifica autores, projetos de origem, versões, avisos de copyright, textos nem chave. A [árvore do ramo main](https://github.com/maulpatias/persona-synthesis/tree/main) contém somente README, LICENSE, index.html e workflow; o [index.html](https://github.com/maulpatias/persona-synthesis/blob/main/index.html) é uma página de apresentação, sem itens ou algoritmo. | Impossível confirmar a licença das perguntas, verificar autoria, reproduzir a pontuação ou traduzir um instrumento inexistente nessa árvore. Não integrar. |

O questionário educativo original de 36 itens foi substituído em 16/10/2026 pelo instrumento de 135 itens da fonte acima. O procedimento de extração verificou duas respostas da página com ordem visual distinta e igualdade dos 135 pares ID/texto/tipo. A escala visual da plataforma é personalizada, com valores numéricos 1–5 preservados. A autorização foi informada pelo responsável do projeto; não há cópia de documento no repositório.

## Comparação solicitada: OEPS e AgentTune

| Critério | OEPS original | Adaptação AgentTune |
| --- | --- | --- |
| Pontuação documentada | O v1 descreve no próprio ODT a escala de 1–5 e as quatro somas por tipo. O v2 descreve somas com respostas diretas e reversas (`6 - resposta`), com alguns itens contribuindo para mais de um tipo. A página de desenvolvimento explica a seleção dos itens; há inconsistência de 57 versus 54 itens no v2. | A [especificação pública](https://agent-tune.com/tests/enneagram) explicita itens, tipos, quatro itens por tipo e somas de 4 a 20. Porém, contradiz-se sobre empates: texto inicial preserva líderes empatados e passo numerado escolhe o tipo de menor número. A [versão de demonstração atual](https://agent-tune.com/guides/open-source-enneagram-test) é sintética. |
| Direito de reutilização | A [lista do projeto](https://openpsychometrics.org/development/) menciona Creative Commons, sem modalidade/versão exata para o OEPS. Os ODTs inspecionados não identificam licença. Isso não basta para confirmar tradução e publicação na plataforma. | O código original é MIT. O [próprio registro de direitos](https://agent-tune.com/resources/content/instrument-rights.json) classifica a licença OEPS como não resolvida; a adaptação não concede licença própria sobre o texto de terceiros. |
| Confiabilidade e validade | Há estudo independente do **v1 de 36 itens**: [Kastelein (2021)](https://www.jstor.org/stable/community.37867795), com 249 participantes no reteste e 1.039 nas demais análises. Média de reteste `r = 0,68`, alfa médio `0,46` e ajuste fatorial fraco (`CFI = 0,56`; `TLI = 0,50`). A conclusão é que não houve evidência forte de confiabilidade ou validade. O [autor do OEPS](https://openpsychometrics.org/tests/OEPS/development/) reconhece a limitação. O v2 tem amostra de desenvolvimento maior, mas não foi encontrada validação independente da versão atual. | Não foi encontrada validação específica da adaptação AgentTune. Os resultados do estudo do OEPS v1 não validam automaticamente itens alterados, reordenados ou o v2. |
| Adequação ao produto | O v1 é rastreável e simples de operar, mas tem evidência psicométrica fraca. O v2 é mais elaborado e pode ser melhor candidato para avaliação profissional, porém exige chave e apresentação distintas, confirmação da versão e dos direitos; não há comprovação de superioridade psicométrica. | A adaptação é curta e implementável, mas agrega incerteza de proveniência, direitos e inconsistência de desempate. O exemplo sintético só serve para testes de software. |

**Conclusão histórica dessa comparação:** OEPS original é mais rastreável do que a adaptação AgentTune, mas nenhum dos dois foi integrado. A metodologia ativa desde 16/10/2026 é a de 135 itens do Emotional Coaching, descrita em [METODOLOGIA.md](METODOLOGIA.md).

## Identidade visual

`referenca-visual.png` é a logomarca original fornecida. O arquivo em `public/branding/logo-original.png` tem o mesmo hash SHA-256 da referência e permanece sem qualquer alteração. A interface identifica Deise A. Zardeto e a especialidade Psicologia Clínica e Neuropsicologia; usa azul-marinho, dourado e fundo claro observados na imagem. A Hero apresenta cards para 135 afirmações e cerca de 25 minutos, os nove tipos e o relatório em PDF. Sua entrada e flutuação são sutis e respeitam `prefers-reduced-motion`. Playfair Display e DM Sans são fontes locais ao build, sem chamada a serviço de fontes em tempo de execução.

## Decisões técnicas

- Aplicação estática React, TypeScript, Vite e Tailwind. O build usa caminhos relativos (`base: './'`) para hospedagem estática.
- Respostas em memória React, sem cookies, armazenamento web, analytics ou transmissão a serviços.
- Questionário e pontuação entram como um `Assessment`: instrumento versionado e função pura de pontuação. A UI e o PDF consomem o mesmo contrato de resultado. Itens podem ter âncoras e instruções próprias. O pontuador de soma direta permanece como implementação de referência; um instrumento com reversões ou chave múltipla pode fornecer outra função sem reconstruir as telas.
- O `activeAssessment` aponta para o questionário de 135 itens. A UI embaralha os itens em cada novo teste e preserva as respostas por ID durante a sessão.
- PDF gerado no navegador com pdf-lib e logomarca local. Nenhum dado do participante sai da aplicação.

## Registro de autorização

Em 19/10/2026, o responsável pelo projeto confirmou expressamente que a autorização inclui a distribuição pública dos 135 enunciados e da chave no GitHub, no repositório `joaogrds98/eneagrama-deise`. A confirmação é uma declaração do responsável, sem documento anexado; não concede licença aberta de reutilização a terceiros.

A confirmação de autorização chegou como informação do responsável pelo projeto em 16/10/2026; nenhum documento foi anexado. Os perfis interpretativos continuam textos editoriais. O projeto não declara validação psicométrica não demonstrada nem equivalência a OEPS ou AgentTune.
