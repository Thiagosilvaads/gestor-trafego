# ANÁLISE DE TERMOS DE PESQUISA

## Comando
```
analisa termos [cliente]
```

## Fluxo

### 1. BUSCAR CSV

Caminho padrão:
```
/Users/thiagolima/Library/CloudStorage/GoogleDrive-thiagodelima.silva@gmail.com/Meu Drive/Gestor-Trafego/[slug]/termos-pesquisas/
```

Pegar CSV mais recente (YYYY-MM-DD.csv).

Se não existir ou > 14 dias → alertar.

### 2. CARREGAR REGRAS

Ler `/clientes/[slug]/termos-pesquisa/REGRAS.md`

Se não existir, buscar template do nicho no GitHub.

### 3. PROCESSAR

Para cada termo:
1. Aplicar regex de categorização
2. Calcular métricas (CPA, taxa conversão)
3. Identificar ação (negativar, observar, escalar)

### 4. CATEGORIZAR AÇÕES

**Negativar automático:**
- Categoria LIXO
- Categoria CONCORRENTES
- Categoria PRESENCIAL (se cliente online)

**Revisar (flag):**
- SINTOMAS/CORE com 5+ cliques, R$20+ custo, 0 conversões

**Observar:**
- Termos novos sem dados suficientes

**Escalar:**
- Termos com conversão e CPA < meta

### 5. OUTPUT

```markdown
# 📊 Análise de Termos - [Cliente] | [Data]

## TL;DR
X termos, Y conversões, R$Z gasto. [insight principal]

## Resumo por Categoria
| Categoria | Termos | Cliques | Custo | Conv | CPA |
|-----------|--------|---------|-------|------|-----|
| ...       | ...    | ...     | ...   | ...  | ... |

## 🏆 Top Conversores
[tabela]

## 💸 Waste Identificado
[termos com custo sem conversão]

## 📋 Negativos para Adicionar
[lista pronta pra copiar]

## ⚠️ Alertas
[termos de crise, padrões preocupantes]

## ✅ Próximas Ações
[priorizado]
```

### 6. ATUALIZAR ARQUIVOS

- `/clientes/[slug]/termos-pesquisa/BIBLIOTECA-NEGATIVOS.md` → adicionar novos
- `/clientes/[slug]/termos-pesquisa/INSIGHTS.md` → padrões descobertos
- `/clientes/[slug]/APRENDIZADOS.md` → se descobrir algo relevante

## Regras de Negativação

| Condição | Ação |
|----------|------|
| LIXO | Negativar imediato |
| CONCORRENTES | Negativar imediato |
| PRESENCIAL (cliente online) | Negativar imediato |
| 5+ cliques, R$20+, 0 conv | Flag revisar |
| Termo crise (suicídio, etc) | NÃO negativar, monitorar |
| Espanhol (cliente BR) | Negativar |

## Termos de Crise (NUNCA NEGATIVAR)

Termos que indicam crise emocional não devem ser negativados por questões éticas:
- "cansado de viver"
- "vontade de morrer"
- "pensamentos de morte"
- "não aguento mais"

Monitorar custo, mas manter ativo.
