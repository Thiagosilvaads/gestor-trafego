# ONBOARDING DE CLIENTE NOVO

## Comando
```
novo cliente [nome] nicho [nicho]
```

## Fluxo Automatizado (EXECUTAR TODOS OS PASSOS)

---

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
│   ├── INSIGHTS.md
│   └── SCRIPT-GOOGLE-ADS.js
├── scripts-monitoramento/        ← NOVO
│   ├── budget-alert.js
│   ├── anomaly-detector.js
│   ├── quality-score-tracker.js
│   ├── link-checker.js
│   └── day-parting.js
├── analises/
├── copies/
├── ngrams/
└── reunioes/
```

---

### 2. LER TEMPLATE DO NICHO

**OBRIGATÓRIO:** Ler arquivo `_github/templates/nichos/[nicho].md`

Extrair:
- Regex de CATEGORIAS (copiar exatamente)
- Lista de negativos iniciais
- Padrões do nicho para APRENDIZADOS.md

---

### 3. GERAR SCRIPT DE TERMOS DE PESQUISA

**Ler:** `_github/templates/scripts/google-ads-termos.js`

**Customizar e salvar** em `/clientes/[slug]/termos-pesquisa/SCRIPT-GOOGLE-ADS.js`:

Substituições:
- `SHEET_ID`: `'SUBSTITUIR_PELO_ID_DA_PLANILHA'`
- `BIBLIOTECA_NEGATIVOS`: `'Negativos Automáticos - [Nome Cliente]'`
- `CATEGORIAS`: copiar regex do template do nicho
- `DEBUG`: `true`

---

### 4. GERAR SCRIPTS DE MONITORAMENTO (OBRIGATÓRIO)

Criar 5 scripts na pasta `/clientes/[slug]/scripts-monitoramento/`:

#### 4.1 budget-alert.js
**Ler:** `_github/templates/scripts/budget-alert.js`
**Customizar:**
- `EMAIL_DESTINATARIO`: email do gestor (thiagodelima.silva@gmail.com)
- `NOME_CLIENTE`: nome do cliente
- `DEBUG`: false

#### 4.2 anomaly-detector.js
**Ler:** `_github/templates/scripts/anomaly-detector.js`
**Customizar:**
- `EMAIL_DESTINATARIO`: email do gestor
- `PERIODO_COMPARACAO`: 14 (padrão)
- `DEBUG`: false

#### 4.3 quality-score-tracker.js
**Ler:** `_github/templates/scripts/quality-score-tracker.js`
**Customizar:**
- `EMAIL_DESTINATARIO`: email do gestor
- `SHEET_ID`: `'CRIAR_PLANILHA_QS_TRACKER'`
- `DEBUG`: false

#### 4.4 link-checker.js
**Ler:** `_github/templates/scripts/link-checker.js`
**Customizar:**
- `EMAIL_DESTINATARIO`: email do gestor
- `DEBUG`: false

#### 4.5 day-parting.js (CONDICIONAL)
**Ler:** `_github/templates/scripts/day-parting.js`
**Customizar:**
- `EMAIL_DESTINATARIO`: email do gestor
- `APLICAR_AJUSTES`: false (sempre começar só com relatório)
- `DEBUG`: false

**NOTA:** Day-parting só funciona com Manual CPC ou Maximize Clicks.
Se cliente usar Smart Bidding (Target CPA/ROAS), informar que este script não terá efeito.

---

### 5. CRIAR WORKFLOW N8N (OBRIGATÓRIO)

**Via MCP n8n**, criar workflow com:

```json
{
  "name": "Termos Pesquisa - [Nome Cliente]",
  "nodes": [
    {
      "type": "Schedule Trigger",
      "config": "Segunda 9h"
    },
    {
      "type": "Google Sheets",
      "config": "Ler aba 'Termos Semanais'"
    },
    {
      "type": "Google Drive", 
      "config": "Salvar CSV em /Gestor-Trafego/[slug]/termos-pesquisas/{{data}}.csv"
    }
  ],
  "active": false
}
```

Se MCP n8n não disponível, informar usuário que precisa criar manualmente.

---

### 6. OUTPUT OBRIGATÓRIO

Responder com EXATAMENTE este formato:

```markdown
# ✅ Cliente [Nome] criado!

## Estrutura local
✅ Criada em /clientes/[slug]/

## Script de Termos de Pesquisa
📄 Salvo em: /clientes/[slug]/termos-pesquisa/SCRIPT-GOOGLE-ADS.js

## Scripts de Monitoramento
📄 Salvos em: /clientes/[slug]/scripts-monitoramento/
- budget-alert.js (frequência: horária)
- anomaly-detector.js (frequência: horária)
- quality-score-tracker.js (frequência: diária 6h)
- link-checker.js (frequência: diária 7h)
- day-parting.js (frequência: diária 8h) [só se Manual CPC]

### Instalação dos Scripts no Google Ads:
1. Google Ads → Ferramentas → Scripts → Novo
2. Colar cada script
3. Autorizar
4. Testar com Preview
5. Agendar conforme frequência indicada

### Planilhas a criar:
1. **Termos de Pesquisa - [Cliente]** → copiar ID para SCRIPT-GOOGLE-ADS.js
2. **QS Tracker - [Cliente]** → copiar ID para quality-score-tracker.js

### Biblioteca de Negativos:
- Criar "Negativos Automáticos - [Cliente]" no Google Ads
- Aplicar em todas as campanhas de Search

## Workflow n8n
[✅ Criado / ❌ Não criado - criar manualmente]
Nome: "Termos Pesquisa - [Cliente]"
Trigger: Segunda 9h
Status: Desativado (ativar após configurar planilha)

## Pasta Google Drive
📁 Criar pasta: /Gestor-Trafego/[slug]/termos-pesquisas/

## Estratégia de Lance Recomendada
- Se cliente NOVO (< 30 conv/mês): Maximize Clicks → coletar dados
- Se cliente tem 30+ conv/mês: Smart Bidding (Target CPA)
- Day-parting só funciona com Manual CPC/Maximize Clicks

## Próximo passo
Coletar briefing do cliente para preencher PERFIL.md e OBJETIVO.md
```

---

## CHECKLIST DE VALIDAÇÃO

Antes de finalizar, confirmar que TODOS estes itens foram criados:

- [ ] Pasta `/clientes/[slug]/` com todos os arquivos
- [ ] APRENDIZADOS.md preenchido com padrões do nicho
- [ ] SCRIPT-GOOGLE-ADS.js (termos) gerado e salvo
- [ ] 5 scripts de monitoramento gerados e salvos
- [ ] Workflow n8n criado (ou instruções se MCP indisponível)
- [ ] Output no formato correto com todas as instruções

---

## RESUMO DOS SCRIPTS POR FREQUÊNCIA

| Script | Frequência | Função |
|--------|------------|--------|
| Budget Alert | Horária | Alerta gasto > % budget |
| Anomaly Detector | Horária | Detecta variações anormais |
| QS Tracker | Diária 6h | Monitora Quality Score |
| Link Checker | Diária 7h | Detecta links quebrados |
| Day-parting | Diária 8h | Analisa performance por hora |
| Termos Pesquisa | Semanal seg 8h | Categoriza e negativa termos |

---

## ESTRATÉGIA POR TIPO DE CLIENTE

### Cliente NOVO (< 30 conv/mês)
- Estratégia: Maximize Clicks (coletar dados)
- Scripts: TODOS (incluindo Day-parting)
- Meta: Chegar em 30 conv/mês para migrar pra Smart Bidding

### Cliente com 30+ conv/mês
- Estratégia: Smart Bidding (Target CPA ou Maximize Conversions)
- Scripts: TODOS exceto Day-parting (Smart Bidding ignora ajustes manuais)
- Day-parting: Apenas para relatório, sem aplicar ajustes
