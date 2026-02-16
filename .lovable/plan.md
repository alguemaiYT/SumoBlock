

# 🤖 SumoBlock - Editor Visual de Estratégias de Sumô Robótico

## Visão Geral
Um editor de blocos minimalista estilo Scratch, com tema dark e visual clean, para criação de estratégias de combate de sumô autônomo. Os blocos são arrastáveis (drag & drop) e representam condições de sensores, ações de movimento e estruturas lógicas. A lógica interna dos blocos é facilmente customizável no código-fonte.

---

## 1. Layout Principal
- **Header** com logo substituível (componente isolado) e nome do projeto
- **Paleta de blocos** à esquerda — categorias: Sensores, Ações, Lógica
- **Área de trabalho** central — onde o usuário monta a estratégia arrastando blocos
- **Painel de descrição** à direita — campo de texto para o usuário descrever a estratégia e as condições de uso contra oponentes
- Visual **dark mode minimalista** com cores sutis por categoria de bloco

## 2. Sistema de Blocos (Drag & Drop)
- Blocos arrastáveis da paleta para a área de trabalho
- Encaixe vertical dos blocos formando sequência lógica
- Blocos aninhados para estruturas condicionais (Se/Senão dentro de outros blocos)
- **Categorias iniciais:**
  - 🔵 **Sensores**: Sensor Frontal, Sensor Lateral, Sensor de Linha, Sensor de Distância
  - 🟢 **Ações**: Frente(tempo), Trás(tempo), Girar Esquerda, Girar Direita, Parar
  - 🟡 **Lógica**: Se (condição), Senão, Repetir
- Cada bloco tem parâmetros editáveis (ex: tempo, direção) exibidos no bloco
- A função real de cada bloco é definida no código React, preparada para futura customização

## 3. Descrição da Estratégia
- Campo para nome da estratégia
- Campo para descrição textual de uso: quando usar esta estratégia, contra qual tipo de oponente, condições da arena
- Exemplo: "Usar quando oponente é agressivo frontal. Se sensor frontal detectar, avançar 2s, senão girar e buscar"

## 4. Exportação
- **Botão "Exportar JSON"** — salva a estrutura completa da estratégia (blocos + descrição) como arquivo .json para download
- **Botão "Exportar Código"** — gera código C/C++ Arduino básico representando a lógica dos blocos, pronto para download
- **Botão "Importar"** — carrega um .json salvo anteriormente para continuar editando

## 5. Funcionalidades Extras
- Botão de limpar área de trabalho
- Desfazer/Refazer (undo/redo) básico
- Preview do código gerado em um painel colapsável na parte inferior
- Múltiplas estratégias em abas (criar, renomear, deletar abas)

