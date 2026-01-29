# Gestor de Tráfego - Vitha Marketing Digital

Sistema de gestão de tráfego pago com IA para a Vitha Marketing Digital.

## Estrutura

```
├── PROMPT-CLAUDE-DESKTOP.md    ← Prompt curto para colar no Claude Desktop
├── regras/                      ← Instruções detalhadas por comando
│   ├── onboarding.md
│   ├── analise.md
│   ├── termos-pesquisa.md
│   ├── briefing-copy.md
│   ├── fechamento-mes.md
│   └── valida-lp.md
├── templates/
│   ├── nichos/                  ← Regex e negativos por nicho
│   │   ├── psicologo.md
│   │   ├── advogado.md
│   │   ├── dentista.md
│   │   ├── medico.md
│   │   └── barbearia.md
│   └── scripts/
│       └── google-ads-termos.js ← Script de negativação automática
└── workflows/
    └── (templates n8n)
```

## Como usar

### 1. Configurar Claude Desktop

1. Copiar conteúdo de `PROMPT-CLAUDE-DESKTOP.md`
2. Colar no system prompt do projeto no Claude Desktop
3. Garantir que MCP filesystem está ativo

### 2. Comandos disponíveis

| Comando | O que faz |
|---------|-----------|
| `novo cliente [nome] nicho [nicho]` | Cria estrutura completa do cliente |
| `analisa [cliente]` | Diagnóstico completo |
| `analisa termos [cliente]` | Processa CSV de search terms |
| `briefing copy [cliente]` | Gera prompt pro Copywriter |
| `fecha mês [cliente]` | Relatório mensal |
| `valida LP [url]` | Análise de landing page |

### 3. Adicionar novo nicho

Criar arquivo em `templates/nichos/[nicho].md` com:
- Regex de categorização
- Lista de negativos iniciais
- Padrões do nicho
- Métricas de referência

## Arquitetura

```
Claude Desktop
    ↓ (lê prompt curto)
PROMPT-CLAUDE-DESKTOP.md
    ↓ (busca instruções quando precisa)
GitHub raw files
    ↓ (web_fetch)
regras/*.md + templates/*.md
```

## Versionamento

- Editar arquivos no GitHub
- Claude Desktop sempre busca versão mais recente
- Sem necessidade de atualizar prompt local

## Autor

Vitha Marketing Digital
