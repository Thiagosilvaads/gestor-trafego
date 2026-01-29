# VALIDAÇÃO DE LANDING PAGE

## Comando
```
valida LP [url]
```

## Objetivo
Análise focada em Quality Score + Conversão. Não é auditoria completa de site.

## Fluxo

### 1. BUSCAR PÁGINA

```
web_fetch: [url]
```

### 2. VERIFICAR INFRAESTRUTURA

**Performance:**
- Tempo de carregamento (ideal < 3s)
- Mobile-friendly
- Core Web Vitals (se possível)

**Tracking:**
- GTM instalado?
- GA4 configurado?
- Pixel Meta?
- Eventos de conversão?

**Segurança:**
- HTTPS?
- Certificado válido?

### 3. ANALISAR QUALITY SCORE

**Relevância do anúncio:**
- Keyword principal aparece no H1?
- Keyword aparece no primeiro parágrafo?
- Meta title contém keyword?

**Experiência da página:**
- Conteúdo acima da dobra claro?
- CTA visível sem scroll?
- Formulário simples (poucos campos)?
- Sem popups intrusivos?

**CTR esperado:**
- Headline atrativa?
- Proposta de valor clara?
- Diferencial evidente?

### 4. ANALISAR CONVERSÃO

**Estrutura:**
- Headline clara
- Subheadline com benefício
- Prova social (depoimentos, logos)
- Benefícios > características
- CTA acima da dobra
- CTA repetido ao longo da página
- Urgência/escassez (se aplicável)

**Formulário:**
- Campos mínimos necessários
- Labels claros
- Botão com texto de ação
- Feedback de sucesso

**Objeções tratadas:**
- FAQ?
- Garantias?
- Credenciais?

### 5. OUTPUT

```markdown
# 🔍 Análise LP - [URL]

## Score Geral: X/100

## Infraestrutura
| Item | Status | Impacto |
|------|--------|---------|
| HTTPS | ✅/❌ | Alto |
| Mobile | ✅/❌ | Alto |
| Velocidade | Xs | Médio |
| GTM | ✅/❌ | Médio |
| GA4 | ✅/❌ | Médio |

## Quality Score (estimado)
| Fator | Score | Observação |
|-------|-------|------------|
| Relevância | X/10 | [obs] |
| Experiência | X/10 | [obs] |
| CTR esperado | X/10 | [obs] |

## Conversão
| Elemento | Status | Prioridade |
|----------|--------|------------|
| Headline | ✅/❌ | Alta |
| CTA visível | ✅/❌ | Alta |
| Prova social | ✅/❌ | Média |
| Formulário | ✅/❌ | Alta |

## 🔴 Crítico (fazer agora)
- [item]

## 🟡 Importante (essa semana)
- [item]

## 🟢 Melhorias (backlog)
- [item]
```

## Checklist Rápido

```
[ ] HTTPS ativo
[ ] Mobile responsive
[ ] Carrega < 3s
[ ] GTM instalado
[ ] Eventos de conversão
[ ] H1 contém keyword
[ ] CTA acima da dobra
[ ] Formulário < 5 campos
[ ] Prova social presente
[ ] Sem popups intrusivos
```
