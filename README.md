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
- **Link LN de blocos:** selecione um nó e clique em “Criar link (ln)” no inspetor. Isso cria uma cópia referenciada (qualquer alteração em um dos clones afeta todos), mantém os nós arrastáveis de forma independente e desenha uma linha amarela pontilhada entre os links para facilitar a identificação visual. Use “Remover link” para apagar o atalho selecionado (ou, no nó original, remover seus atalhos).
- **Remover ligações entre nós:** clique numa conexão no canvas e use “Remover ligação” no topo, ou use “Remover ligações do nó” no inspetor para cortar todas as conexões de entrada/saída do nó selecionado.
- Agora também é possível linkar o próprio nó `Início`: isso cria um atalho perto do `Repetir` para conectar o laço sem precisar arrastar todos os cabos do topo do canvas.
