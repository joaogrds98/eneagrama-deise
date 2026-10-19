# Eneagrama

Aplicação web estática de autoconhecimento para Déise A. Zardeto. Inclui as 135 afirmações do questionário Emotional Coaching, navegação em ordem embaralhada, cálculo das pontuações dos nove tipos, percentuais de participação, resultados e PDF gerado no navegador. As respostas ficam somente na memória da sessão. Não há backend, banco de dados, conta, analytics ou envio de respostas.

A autorização de reprodução e adaptação foi informada pelo responsável do projeto em 16/10/2026. Em 19/10/2026, ele confirmou que ela também cobre a distribuição pública dos 135 enunciados e da chave neste repositório GitHub. Essa declaração não concede uma licença aberta de reutilização a terceiros. Consulte [metodologia](docs/METODOLOGIA.md), [análise de fontes](docs/ANALISE.md), [status](docs/STATUS.md) e [avisos de terceiros](THIRD_PARTY_NOTICES.md).

## Tecnologia

React, TypeScript, Vite, Tailwind CSS, Lucide React e pdf-lib. Fontes incluídas no build com Fontsource.

## Desenvolvimento

Requer Node.js 22 ou mais recente e pnpm.

```sh
pnpm install
pnpm dev
```

## Verificação e build

```sh
pnpm test
pnpm build
pnpm preview
```

Os arquivos estáticos ficam em `dist/` e podem ser hospedados por um serviço estático. Não há variáveis de ambiente nem rotas de servidor.

## Instrumento

`src/features/enneagram/instrument.ts` contém os itens versionados, a escala de respostas e sua chave. O objeto `activeAssessment` injeta a função pura de pontuação na interface. Cada tipo recebe 15 respostas de 1 a 5, totalizando 15–75. O percentual é a soma daquele tipo dividida pelo total das nove somas. Empates permanecem explícitos. A interface e o PDF consomem o mesmo resultado.
