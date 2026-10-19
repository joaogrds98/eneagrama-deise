# Landing experimental — Atlas interior

## Comparação

Com o servidor local em execução:

- `/` mostra o novo design experimental.
- `/?design=anterior` mostra a landing anterior, com navbar flutuante e Cover Flow.

As duas apresentações usam o mesmo questionário, nome em memória, cálculo e relatório. O parâmetro muda somente a landing; não há armazenamento de preferência.

## Decisão criativa

A análise do design anterior identificou cards parcialmente ocultos, dependência de uma coluna ilustrativa e pouca variação de ritmo entre seções.

Foram consideradas três direções:

1. **Revista essencial:** protagonismo de tipografia e composição editorial, com pouca interação gráfica.
2. **Atlas interior (implementado):** os nove tipos apresentados em um mapa circular selecionável, com detalhes no centro e uma organização editorial abaixo.
3. **Jornada de reflexão:** conteúdo apresentado em etapas, com mais progressão e revelação por interação.

O atlas oferece uma exploração imediata dos nove tipos sem esconder itens. A tipografia serifada marca os momentos de reflexão; DM Sans conduz navegação, formulário e informações práticas. Marinho, dourado e papel claro partem da logomarca original.

## Interações

- Números do mapa selecionáveis por clique ou toque.
- Rotação circular contínua por arraste, sem limite de voltas. Um swipe iniciado no centro também gira o mapa.
- Ao soltar, o tipo mais próximo encaixa no alto à direita; clicar em um número leva esse tipo à mesma posição pelo caminho mais curto.
- Teclas direcionais mantêm a navegação acessível; Home/End levam ao primeiro/último tipo.
- Os números permanecem na orientação de leitura durante o giro. Nome e descrição do tipo ficam no centro.
- Textos auxiliares visíveis e botões de navegação ao redor do mapa foram removidos.
- O diretório de tipos seleciona um tipo e retorna ao mapa.
- Rotação automática do mapa a cada dois segundos, com transição de 800 ms. A ordem cíclica mantém a continuidade física, inclusive do tipo 9 ao tipo 1.
- Clique ou arraste manual pausa a rotação e reinicia a espera de dez segundos sem interação. O hover não mantém a pausa ativa. O ciclo também pausa quando a página está oculta, quando o mapa sai da viewport ou quando `prefers-reduced-motion` está ativo.
- Nomes e descrições centrais são atualizados com cada tipo; mudanças automáticas ficam fora da região anunciada pelo leitor de tela para evitar fala repetitiva.
- `prefers-reduced-motion` desativa animações e transições.

As descrições exploratórias do mapa não constituem uma avaliação e não afetam respostas ou pontuação.

## Arquivos e preservação

- `src/features/landing/ExperimentalLanding.tsx`: nova apresentação e mapa.
- `src/features/landing/landing.css`: estilos restritos a `.landing-experimental`.
- `src/App.tsx`: escolha da apresentação, mantendo o fluxo funcional existente.
- `checkpoints/landing-2026-10-19/antes-do-redesign.zip`: cópia local de `src`, `public` e configuração antes da alteração; não versionada no Git.
- `checkpoints/landing-2026-10-19/functional-hashes.json`: hashes locais dos arquivos de instrumento, pontuação, resultados descritivos e relatório antes da alteração; não versionados no Git.

Para retornar visualmente à versão anterior, use `?design=anterior`. Para restauração dos arquivos, extraia o ZIP em uma pasta separada, revise e copie os arquivos necessários para o projeto. Preserve eventuais alterações posteriores antes de substituir arquivos.

## Validação

Layout conferido em 1920 × 1080, 1366 × 768, 1280 × 720 e 375 × 667. Nas três resoluções desktop, cabeçalho e Hero ocupam uma viewport com CTA visível. No celular, o CTA antecede o mapa e a página segue com rolagem natural. Nenhuma das quatro apresentou rolagem horizontal.

Também foram conferidos os nove estados de seleção do mapa, teclado com retorno circular, arraste, navegação por âncoras, nome com acentos, início do questionário, resposta obrigatória, avanço e limpeza do nome ao reiniciar. O conteúdo das seções permanece visível mesmo sem a execução da animação de entrada.

A rotação automática anterior foi validada no navegador em tempo real: os nove tipos avançaram em intervalos de aproximadamente seis segundos, com transições de 800 ms, e o ciclo de nove para um percorreu os 40 graus mais próximos sem inversão. O arraste também foi conferido no layout mobile. A implementação atual reduz o intervalo para dois segundos e retoma dez segundos após a última interação manual, mesmo que o cursor permaneça sobre o diagrama.

Capturas e medidas da revisão estão em `tmp/landing-redesign-qa/`.

O refinamento da rotação tem capturas e uma página de validação responsiva em `tmp/atlas-rotation-qa/`. Essa página usa um iframe com dimensões reais de viewport, sem alterar o código ou os estilos da aplicação carregada.

Build de produção e os 35 testes passaram, incluindo cinco testes de rotação para passagem entre ângulos, múltiplas voltas, encaixe e seleção pelo caminho mais curto. No navegador, foi conferida a rotação acumulada além de 360°, o retorno de um gesto curto, o sentido inverso e a seleção dos nove números. A comparação de hashes confirmou que os nove arquivos existentes de `src/features/enneagram/` permanecem idênticos ao checkpoint.
