# ONBOARDING DE CLIENTE NOVO

## Comando
```
novo cliente [nome] nicho [nicho]
```

## Fluxo Automatizado

### 1. CRIAR ESTRUTURA LOCAL

Criar em `/clientes/[slug]/`:

```
[slug]/
├── PERFIL.md
├── OBJETIVO.md
├── CONFIGURACOES.md
├── TRACKING.md
├── APRENDIZADOS.md
├── PROXIMAS-ACOES.md
├── historico-mudancas.md
├── metricas/
│   └── RESUMO-EVOLUCAO.md
├── leads/
│   ├── SHEETS-LINK.md
│   └── CONVERSAO.md
├── termos-pesquisa/
│   ├── REGRAS.md
│   ├── BIBLIOTECA-NEGATIVOS.md
│   └── INSIGHTS.md
├── analises/
├── copies/
├── ngrams/
└── reunioes/
```

### 2. BUSCAR TEMPLATE DO NICHO

```
web_fetch: templates/nichos/[nicho].md
```

### 3. GERAR SCRIPT GOOGLE ADS

Buscar: `templates/scripts/google-ads-termos.js`

Customizar:
- SHEET_ID: `'SUBSTITUIR_PELO_ID_DA_PLANILHA'`
- BIBLIOTECA_NEGATIVOS: `'Negativos Automáticos - [Cliente]'`
- CATEGORIAS: copiar do template do nicho
- DEBUG: true

Salvar em: `/clientes/[slug]/termos-pesquisa/SCRIPT-GOOGLE-ADS.js`

### 4. CRIAR WORKFLOW N8N

Via MCP n8n:
- **Nome:** `Termos Pesquisa - [Cliente]`
- **Trigger:** Schedule, segunda 9h
- **Destino:** `/Gestor-Trafego/[slug]/termos-pesquisas/YYYY-MM-DD.csv`
- **Ativo:** false

### 5. OUTPUT

```markdown
# ✅ Cliente [Nome] criado!

## Estrutura local
✅ Criada em /clientes/[slug]/

## Script Google Ads
📄 Salvo em: /clientes/[slug]/termos-pesquisa/SCRIPT-GOOGLE-ADS.js

### Passos manuais:
1. Criar planilha "Termos de Pesquisa - [Cliente]"
2. Copiar ID e substituir no script
3. Google Ads → Scripts → Novo → Colar → Autorizar → Preview → Agendar segunda 8h
4. Criar biblioteca "Negativos Automáticos - [Cliente]"

## Workflow n8n
✅ Criado (desativado)
Ativar após configurar planilha

## Próximo passo
Preencher PERFIL.md e OBJETIVO.md
```
