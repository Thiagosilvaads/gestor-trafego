# TEMPLATE: DENTISTA

## Regex de Categorização

```javascript
var CATEGORIAS = {
  CORE: /dentista|odonto|cl[ií]nica odonto/i,
  PROCEDIMENTO: /implante|canal|clareamento|aparelho|ortodont|lente|faceta|pr[oó]tese|extra[çc][aã]o|restaura|obtura/i,
  EMERGENCIA: /dor de dente|dente quebrado|urg[eê]ncia|emerg[eê]ncia|dente inflamado/i,
  ESTETICO: /lente de contato|faceta|clareamento|sorriso|branqueamento/i,
  LIXO: /curso|faculdade|gratuito|popular|sus|cro|vaga|emprego|sal[aá]rio/i,
  CONCORRENTES: /odontoclinic|sorridents|oralsin|oral sin|odontop[oó]lis/i,
  PRESENCIAL: /moema|pinheiros|jardins|itaim|vila mariana|santana|lapa|perdizes|osasco|guarulhos|abc/i
};
```

## Negativos Iniciais

```
curso
faculdade
gratuito
popular
sus
cro
vaga
emprego
salário
odontoclinic
sorridents
oralsin
oral sin
odontopolis
franquia
como ser dentista
quanto ganha
concurso
residência
```

## Padrões do Nicho

### Termos que convertem bem
- "implante dentário"
- "lente de contato dental"
- "clareamento dental"
- "dentista [bairro]"
- "dor de dente urgência"

### Termos informativos (baixa conversão)
- "quanto custa implante"
- "lente de contato dental valor"
- "como é feito canal"

### Procedimentos de alto ticket
- Implantes
- Lentes de contato
- Ortodontia (aparelho)
- Prótese total

## Métricas de Referência

| Métrica | Benchmark |
|---------|-----------|
| CPA médio | R$20-60 |
| Taxa conversão LP | 5-12% |
| CTR anúncios | 3-7% |
| Ticket médio | R$500-15.000 |
