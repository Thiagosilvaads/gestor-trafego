# TEMPLATE: PSICÓLOGO / TERAPEUTA

## Regex de Categorização

```javascript
var CATEGORIAS = {
  CORE: /psicanal|junguiano|analista|psican[aá]lise/i,
  TERAPIA: /terapia|terapeuta|psicoterapia/i,
  PROFISSIONAL: /psic[oó]log/i,
  SINTOMAS: /ansiedade|depress[aã]o|burnout|estresse|luto|medo|angustia|panico|trauma|tdah|toc|bipolar|borderline|fobia/i,
  LIXO: /curso|faculdade|universidade|gradua[çc][aã]o|filme|s[ée]rie|gratuito|gr[aá]tis|vagas?|emprego|sal[aá]rio|quanto ganha|cid |atestado|apostila|pdf|livro|ebook|netflix|188|cvv|usp/i,
  CONCORRENTES: /zenklub|vittude|doctoralia|conversinha|psicologia viva|telavita|conexa|moodar|querosaude|orienteme|7 cups/i,
  PRESENCIAL: /moema|pinheiros|jardins|itaim|vila mariana|santana|lapa|perdizes|osasco|guarulhos|abc|santo andr[eé]|morumbi|cuiaba|goiania/i
};
```

## Negativos Iniciais

```
curso
faculdade
universidade
graduação
filme
série
netflix
desabafar
gratuito
grátis
vagas
emprego
salário
quanto ganha
cid
atestado
apostila
pdf
livro
ebook
188
cvv
usp
zenklub
vittude
doctoralia
conversinha
psicologia viva
telavita
conexa
moodar
querosaude
orienteme
7 cups
```

## Padrões do Nicho

### Termos que convertem bem
- "psicólogo online"
- "terapia online"
- "preciso de psicólogo"
- "psicanalista"
- "atendimento psicológico"

### Termos informativos (baixa conversão)
- "o que é ansiedade"
- "sintomas de depressão"
- "como funciona terapia"

### Termos de crise (não negativar)
- "cansado de viver"
- "pensamentos de morte"
- "não aguento mais"

## Métricas de Referência

| Métrica | Benchmark |
|---------|-----------|
| CPA médio | R$15-40 |
| Taxa conversão LP | 5-15% |
| CTR anúncios | 3-8% |
| Ticket médio | R$150-300/sessão |
