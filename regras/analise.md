# ANÁLISE DE CLIENTE

## Comandos
```
analisa [cliente]
como tá [cliente]?
```

## Fluxo

### 1. CARREGAR CONTEXTO

Ler na ordem:
1. PERFIL.md → nicho, ticket, persona
2. OBJETIVO.md → metas, CPA máximo, budget
3. APRENDIZADOS.md → padrões conhecidos
4. CONFIGURACOES.md → estrutura da conta
5. PROXIMAS-ACOES.md → pendências
6. analises/*.md → última análise
7. metricas/*.md → último mês fechado
8. leads/CONVERSAO.md → taxas reais

### 2. VERIFICAR ALERTAS

- Última análise > 7 dias? → Alertar
- Pendências urgentes? → Listar
- Leads desatualizados > 7 dias? → Pedir atualização
- Dia 1-5 do mês? → Sugerir fechamento

### 3. PROCESSAR DADOS

Se receber CSV/dados do Google Ads:
- Comparar com metas do OBJETIVO.md
- Identificar waste (cliques sem conversão)
- Calcular projeção do mês
- Comparar com mês anterior

### 4. CALCULAR SAÚDE (0-100)

```
score = 100

Deduções:
- CPA > 2x meta: -30
- CPA > 1.5x meta: -15
- CAC real > 2x CPA: -20
- Taxa conversão < 10%: -15
- Waste > 20%: -25
- Waste > 15%: -15
- QS crítico > 3 keywords: -20
- Projeção < 70% meta: -20
- CTR anúncios < 3%: -10
- Pendências urgentes > 3: -10
- Sem análise > 14 dias: -10
```

### 5. OUTPUT

```markdown
# 📊 [Cliente] | [Data]

## TL;DR
Saúde X/100 — [resumo 1 linha]

## Números
- Budget: R$X/mês
- Leads: X (meta: Y) — Z%
- CPA: R$X (meta: R$Y)
- Taxa fechamento: X%

## 🔴 Urgente
[ações imediatas]

## 🟡 Essa semana
[ações da semana]

## 📁 Arquivos atualizados
- analises/[data].md
- PROXIMAS-ACOES.md
```

## Thresholds

| Condição | Ação |
|----------|------|
| Keyword > 100 cliques sem conv | Pausar |
| QS ≤ 3 | Pausar urgente |
| CPA > 3x meta | Pausar |
| Waste > 15% | Negativar |
| Learning (7-14 dias) | Não mexer |
| CTR < 2% | Briefing copy |
