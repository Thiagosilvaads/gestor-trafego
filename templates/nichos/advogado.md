# TEMPLATE: ADVOGADO

## Regex de Categorização

```javascript
var CATEGORIAS = {
  CORE: /advogad[oa]|escrit[oó]rio|advocacia/i,
  ESPECIALIDADE: /trabalhista|previdenci[aá]rio|civil|criminal|tribut[aá]rio|empresarial|fam[ií]lia|im[oó]vel|consum/i,
  PROBLEMA: /demiss[aã]o|rescis[aã]o|fgts|inss|aposentadoria|pens[aã]o|invent[aá]rio|divor[cç]|golpe|fraude|indeniza/i,
  INFORMATIVO: /como funciona|o que [eé]|quanto custa|prazo|valor|modelo|exemplo/i,
  LIXO: /curso|oab|concurso|faculdade|est[aá]gio|trainee|modelo de|peti[çc][aã]o|gr[aá]tis|gratuito|defensoria/i,
  CONCORRENTES: /jusbrasil|legalzoom|acordo fechado|49 educa[çc][aã]o|advbox/i,
  PRESENCIAL: /moema|pinheiros|jardins|itaim|vila mariana|santana|lapa|perdizes|osasco|guarulhos|abc/i
};
```

## Negativos Iniciais

```
curso
oab
concurso
faculdade
estágio
trainee
modelo de petição
petição pronta
grátis
gratuito
defensoria
jusbrasil
legalzoom
acordo fechado
49 educação
advbox
como fazer petição
minuta
jurisprudência
artigo
lei
código
```

## Padrões do Nicho

### Termos que convertem bem
- "advogado trabalhista"
- "advogado para [problema específico]"
- "processar empresa"
- "calcular rescisão"

### Termos informativos (baixa conversão)
- "como funciona processo"
- "quanto tempo demora"
- "modelo de petição"

### Especialidades comuns
- Trabalhista
- Previdenciário
- Família
- Consumidor
- Criminal

## Métricas de Referência

| Métrica | Benchmark |
|---------|-----------|
| CPA médio | R$30-80 |
| Taxa conversão LP | 3-10% |
| CTR anúncios | 2-5% |
| Ticket médio | R$3.000-15.000 |
