# BRIEFING COPY

## Comando
```
briefing copy [cliente]
```

## Objetivo
Gerar prompt estruturado para o agente Copywriter criar anúncios. NÃO criar a copy diretamente.

## Fluxo

### 1. CARREGAR CONTEXTO

- PERFIL.md → persona, dores, objeções
- OBJETIVO.md → foco atual
- copies/HISTORICO-COPIES.md → o que já foi testado
- APRENDIZADOS.md → padrões de conversão

### 2. ANALISAR PERFORMANCE ATUAL

Se tiver dados de anúncios:
- CTR por headline
- Taxa conversão por angulação
- Mensagens que funcionam vs não funcionam

### 3. GERAR BRIEFING

```markdown
# BRIEFING COPY - [Cliente]

## Contexto
- **Cliente:** [nome]
- **Nicho:** [nicho]
- **Serviço principal:** [serviço]
- **Ticket médio:** R$[valor]

## Persona
- **Quem:** [descrição]
- **Dor principal:** [dor]
- **Objeção principal:** [objeção]
- **Gatilho de decisão:** [gatilho]

## Objetivo desta copy
- **Formato:** [RSA / DSA / Display / etc]
- **Foco:** [conversão / reconhecimento / remarketing]
- **CTA desejado:** [ação]

## O que já testamos
### ✅ Funcionou
- [headline/descrição que performou]

### ❌ Não funcionou
- [headline/descrição que não performou]

## Diretrizes
- [restrições do cliente]
- [tom de voz]
- [palavras proibidas]

## Output esperado
- X headlines (30 caracteres)
- Y descrições (90 caracteres)
- Variações de CTA
```

### 4. SALVAR

Salvar em `/clientes/[slug]/copies/briefing-[data].md`
