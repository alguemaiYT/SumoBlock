# SumoBlocks

Editor visual de estratégias para robôs de sumô.

## Desenvolvimento local

```sh
npm install
npm run dev
```

Para habilitar a geração por Gemini:

```sh
export VITE_GEMINI_API_KEY="sua_chave"
npm run dev
```

Alternativa recomendada (principalmente no WSL):

Crie `.env.local` na raiz do repo com:

```sh
VITE_GEMINI_API_KEY=sua_chave
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
- Aba `IA` na paleta: envie um prompt para gerar uma estratégia (com prévia, aplicar/descartar e fallback quando a chave não estiver configurada).

## Exportação `.ino` (perfil ESP32 V2)

- O editor agora permite **Exportar `.ino`** direto no cabeçalho, ao lado de **Exportar JSON**.
- O exportador foi alinhado ao firmware em `Prog AUTO\Sumo_Auto_ESP32_V2.ino\Estrategias.ino`.
- O arquivo gerado inclui uma função pronta para colar no sketch e instrução de integração no `switch (estrategia)`.

### Mapeamento atual

- Ações:
  - `Frente` -> `frente(velocidade)` + `delay(tempo)`
  - `Trás` -> `re(velocidade)` + `delay(tempo)`
  - `Girar Esquerda/Direita` -> `esquerda/direita(velocgiro)` + `delay(tempo)`
  - `Parar` -> `parado()`
  - `Esperar` -> `delay(tempo)`
- Sensores:
  - `sensor_front` -> `sen_centro_esq` / `sen_centro_dir`
  - `sensor_side` -> `sen_esq` / `sen_dir`
  - `sensor_line` -> `sensorLE` / `sensorLD` (limiar `<= 200`)
- Fluxo:
  - Handles `yes/no` para ramificações de sensor/gate
  - Handles `loop/done` para `logic_repeat`

### Limitações conhecidas

- `logic_if` sem estrutura de condição explícita no grafo é tratado como passagem linear.
- Modo por distância dos sensores frontais/laterais não tem equivalência direta no firmware alvo (exportador avisa).

## Melhorias para facilitar criação de estratégias

### Experiência do usuário (ideal)

- Oferecer dois modos: `Guiado` (para iniciantes) e `Avançado` (fluxo livre).
- Começar por objetivo (ex.: buscar e atacar) e aplicar templates prontos com blocos já conectados.
- Exibir validação contínua do grafo com sugestão de correção (não só erro bloqueante).
- Incluir presets de parâmetros (agressivo, equilibrado, defensivo) para reduzir tentativa e erro.

### Resumo dinâmico ideal para export `.ino`

- Seleção de perfil/versionamento de firmware (ex.: `Prog AUTO ESP32 V2`).
- Compilação do fluxo via AST do grafo, evitando geração por concatenação frágil de strings.
- Mapeamento configurável `bloco -> função C++` por perfil.
- Guard rails automáticos no código gerado: `Le_Sensores()`, `le_stop()`, limites de velocidade/tempo.
- Diagnóstico de exportação com incompatibilidades e sugestões práticas.
- Opção de geração não-bloqueante para reduzir dependência de `delay` longo.
