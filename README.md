# SumoBlocks

Editor visual de estratégias para robôs de sumô.

## Desenvolvimento local

```sh
npm install
npm run dev
```

## Scripts

- `npm run dev` — ambiente de desenvolvimento
- `npm run build` — build de produção
- `npm run test` — testes com Vitest
- `npm run lint` — validação com ESLint

## Stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Uso do fluxo avançado

- **Repetir indefinidamente:** os blocos `Repetir` agora têm um toggle `Indefinido`; marque para iterar para sempre e o campo `vezes` some, mantendo o histórico/exportações intactos.
- **Sensores apenas detectam:** habilite a opção `Detectado` ao selecionar um sensor para remover o campo de distância e deixar apenas o estado booleano (o visor mostra “Detectado”). Sem o toggle você continua ajustando o lado e a distância normalmente.
- **Link LN de blocos:** selecione um nó e clique em “Criar link (ln)” no inspetor. Isso cria uma cópia referenciada (qualquer alteração em um dos clones afeta todos) e deixa uma barra amarela forte indicando qual grupo você está editando. Use essa ferramenta para reorganizar sua estratégia sem duplicar lógica manualmente.
