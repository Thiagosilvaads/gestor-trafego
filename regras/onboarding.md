# ONBOARDING DE CLIENTE NOVO

## Comando
```
novo cliente [nome] nicho [nicho]
```

## Fluxo Automatizado (EXECUTAR TODOS OS PASSOS)

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
│   └── SCRIPT-GOOGLE-ADS.js  ← GERAR ESTE ARQUIVO
├── analises/
├── copies/
├── ngrams/
└── reunioes/
```

### 2. LER TEMPLATE DO NICHO

**OBRIGATÓRIO:** Ler arquivo `_github/templates/nichos/[nicho].md`

Extrair:
- Regex de CATEGORIAS (copiar exatamente)
- Lista de negativos iniciais
- Padrões do nicho para APRENDIZADOS.md

### 3. GERAR SCRIPT GOOGLE ADS (OBRIGATÓRIO)

**Ler:** `_github/templates/scripts/google-ads-termos.js`

**Customizar e salvar** em `/clientes/[slug]/termos-pesquisa/SCRIPT-GOOGLE-ADS.js`:

Substituições:
- `SHEET_ID`: `'SUBSTITUIR_PELO_ID_DA_PLANILHA'`
- `BIBLIOTECA_NEGATIVOS`: `'Negativos Automáticos - [Nome Cliente]'`
- `CATEGORIAS`: copiar regex do template do nicho (passo 2)
- `DEBUG`: `true`

### 4. CRIAR WORKFLOW N8N (OBRIGATÓRIO)

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

### 5. OUTPUT OBRIGATÓRIO

Responder com EXATAMENTE este formato:

```markdown
# ✅ Cliente [Nome] criado!

## Estrutura local
✅ Criada em /clientes/[slug]/

## Script Google Ads
📄 Salvo em: /clientes/[slug]/termos-pesquisa/SCRIPT-GOOGLE-ADS.js

### Passos manuais:
1. Criar planilha "Termos de Pesquisa - [Cliente]" no Google Sheets
2. Copiar ID da planilha e substituir no script (linha com SHEET_ID)
3. No Google Ads:
   - Ferramentas → Scripts → Novo
   - Colar o script
   - Autorizar
   - Testar com Preview
   - Agendar: segunda 8h
4. Criar biblioteca "Negativos Automáticos - [Cliente]" e aplicar nas campanhas

## Workflow n8n
[✅ Criado / ❌ Não criado - criar manualmente]
Nome: "Termos Pesquisa - [Cliente]"
Trigger: Segunda 9h
Status: Desativado (ativar após configurar planilha)

## Pasta Google Drive
📁 Será criada automaticamente quando workflow rodar
Caminho: /Gestor-Trafego/[slug]/termos-pesquisas/

## Próximo passo
Coletar briefing do cliente para preencher PERFIL.md e OBJETIVO.md
```

---

## CHECKLIST DE VALIDAÇÃO

Antes de finalizar, confirmar que TODOS estes itens foram criados:

- [ ] Pasta `/clientes/[slug]/` com todos os arquivos
- [ ] APRENDIZADOS.md preenchido com padrões do nicho
- [ ] SCRIPT-GOOGLE-ADS.js gerado e salvo
- [ ] Workflow n8n criado (ou instruções se MCP indisponível)
- [ ] Output no formato correto
