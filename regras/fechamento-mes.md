# FECHAMENTO DE MÊS

## Comando
```
fecha mês [cliente]
```

## Quando usar
- Dia 1-5 do mês seguinte
- Quando cliente pedir relatório mensal

## Fluxo

### 1. COLETAR DADOS

Solicitar ao usuário:
- Screenshot/export do Google Ads (mês completo)
- Total de leads do período
- Leads qualificados
- Vendas fechadas
- Faturamento (se disponível)

### 2. CALCULAR MÉTRICAS

```
Métricas de mídia:
- Investimento total
- Impressões
- Cliques
- CTR
- CPC médio
- Conversões (leads)
- CPA

Métricas de negócio:
- Total leads
- Leads qualificados
- Taxa qualificação (qual/total)
- Vendas fechadas
- Taxa conversão (vendas/leads)
- CAC real (investimento/vendas)
- Faturamento
- ROAS (faturamento/investimento)
```

### 3. COMPARAR COM METAS

Comparar com OBJETIVO.md:
- Meta leads: atingiu X%
- Meta CPA: atingiu X%
- Meta vendas: atingiu X%

### 4. COMPARAR COM MÊS ANTERIOR

Se existir `/metricas/[mes-anterior].md`:
- Variação de leads
- Variação de CPA
- Variação de conversão

### 5. GERAR RELATÓRIO

```markdown
# 📊 Fechamento [Mês/Ano] - [Cliente]

## Resumo Executivo
[1-2 frases: resultado vs meta]

## Números do Mês

| Métrica | Realizado | Meta | % |
|---------|-----------|------|---|
| Investimento | R$X | R$Y | Z% |
| Leads | X | Y | Z% |
| CPA | R$X | R$Y | Z% |
| Vendas | X | Y | Z% |
| CAC real | R$X | - | - |
| Faturamento | R$X | - | - |
| ROAS | X | - | - |

## Comparativo

| Métrica | Este mês | Mês anterior | Var |
|---------|----------|--------------|-----|
| Leads | X | Y | +Z% |
| CPA | R$X | R$Y | -Z% |
| Conversão | X% | Y% | +Z% |

## Destaques
### ✅ O que funcionou
- [item]

### ⚠️ O que precisa melhorar
- [item]

## Ações para próximo mês
1. [ação priorizada]
2. [ação]
3. [ação]

## Projeção próximo mês
Com base nos dados atuais, estimativa:
- Leads: X-Y
- CPA: R$X-Y
```

### 6. SALVAR

- `/metricas/[YYYY-MM].md` → relatório completo
- Atualizar `/metricas/RESUMO-EVOLUCAO.md` → linha nova
- Atualizar `PROXIMAS-ACOES.md` → ações do próximo mês
