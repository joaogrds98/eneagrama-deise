# Metodologia do questionário ativo

Atualizado em 19/10/2026. O instrumento ativo está em `src/features/enneagram/instrument.ts`.

## Procedência

Em 19/10/2026, o responsável pelo projeto confirmou expressamente que a autorização também cobre a distribuição pública das 135 afirmações e de sua chave no repositório GitHub `joaogrds98/eneagrama-deise`. O registro permanece baseado nessa declaração, sem documento de autorização anexado e sem concessão de licença aberta a terceiros.

O texto das 135 afirmações e sua associação aos nove tipos foram extraídos de [Questionário Eneagrama · Emotional Coaching](https://emotionalcoaching.com.br/testepersonalidade/), ferramenta creditada na página a Luciana Viana. O responsável pelo projeto informou em 16/10/2026 que a profissional responsável, Deise A. Zardeto Bello, confirmou autorização de reprodução e adaptação por intermédio de sua professora. Esta informação é registrada como declaração do projeto; não foi fornecido documento de autorização para arquivar no repositório. A escala de respostas visível na plataforma foi personalizada conforme a instrução do projeto. Os perfis interpretativos são textos editoriais, não transcrições da fonte.

Os IDs `ec-001` a `ec-135` preservam os números `QuestionType001` a `QuestionType135` da página. Em duas extrações independentes, cada ID manteve o mesmo enunciado e a mesma chave, apesar de a ordem visual da página variar. São 15 itens para cada tipo. O arquivo guarda a ordem por ID para auditoria; a apresentação é embaralhada por Fisher–Yates no início de cada teste, sem alterar chave ou respostas. Voltar uma questão não reembaralha o teste.

## Escala e pontuação

A plataforma apresenta cinco alternativas com valores inteiros: 1 “Não combina comigo”; 2 “Combina pouco comigo”; 3 “Combina mais ou menos comigo”; 4 “Combina comigo”; 5 “Combina totalmente comigo”. Todos os 135 itens precisam de resposta válida. Não há reversão, pesos diferentes ou chaves múltiplas na metodologia observada.

Para cada tipo, somam-se as 15 respostas associadas. O total bruto varia de 15 a 75. A participação relativa é `percentualTipo = 100 × somaTipo / somaDosNoveTipos`. Resultados e PDF exibem a mesma pontuação bruta e o mesmo percentual arredondado a uma casa decimal. O tipo de maior soma aparece como líder. Se dois ou mais tipos dividirem a maior soma, todos são apresentados; não há desempate arbitrário. A soma dos percentuais arredondados pode diferir de 100% por efeito de arredondamento.

As barras usam `(somaTipo - 15) / 60` para mostrar a posição no intervalo possível de pontuação. O percentual representa apenas a participação da soma no total das nove somas. Nenhum deles é probabilidade, percentil, precisão ou norma populacional.

## Limites de interpretação

O produto é uma experiência de autoconhecimento. Este projeto não recebeu documentação de estudos de confiabilidade, validade, normas ou pontos de corte específicos da versão de 135 itens; não faz alegações psicométricas não documentadas. O resultado não substitui avaliação profissional. A duração de cerca de 25 minutos é uma estimativa de uso, não dado de pesquisa.

## Contrato técnico e privacidade

`Assessment` combina `Instrument` versionado com função pura `score`. `scoring.ts` valida itens, respostas e o resultado, calcula as nove somas e suas participações. A interface e o PDF recebem o mesmo `ScoreResult`. As respostas permanecem em memória React durante a sessão; nenhum backend, banco de dados ou armazenamento do navegador é usado. O PDF é criado localmente.
