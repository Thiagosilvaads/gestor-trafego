# TEMPLATE: BARBEARIA / SALÃO

## Regex de Categorização

```javascript
var CATEGORIAS = {
  CORE: /barbearia|barbeiro|barber|sal[aã]o/i,
  SERVICO: /corte|barba|degrad[eê]|fade|pigmenta|sobrancelha|colora[çc][aã]o|escova|hidrata|manicure|pedicure/i,
  ESTILO: /americano|militar|social|moderno|undercut|pompadour|moicano/i,
  LIXO: /curso|vaga|emprego|trabalhe|franquia|gratuito|como cortar|tutorial/i,
  CONCORRENTES: /salaovip|belezanaweb|trinks|salon line/i,
  PRESENCIAL: /moema|pinheiros|jardins|itaim|vila mariana|santana|lapa|perdizes|osasco|guarulhos|abc/i
};
```

## Negativos Iniciais

```
curso
vaga
emprego
trabalhe conosco
franquia
gratuito
como cortar
tutorial
diy
em casa
sozinho
máquina de cortar
tesoura
salaovip
beleza na web
trinks
salon line
curso de barbeiro
```

## Padrões do Nicho

### Termos que convertem bem
- "barbearia [bairro]"
- "barbeiro perto de mim"
- "corte degradê"
- "barba [bairro]"

### Termos informativos (baixa conversão)
- "como fazer degradê"
- "corte masculino 2024"
- "tendências corte"

### Serviços comuns
- Corte
- Barba
- Degradê/Fade
- Pigmentação
- Sobrancelha

## Métricas de Referência

| Métrica | Benchmark |
|---------|-----------|
| CPA médio | R$5-20 |
| Taxa conversão LP | 8-20% |
| CTR anúncios | 4-10% |
| Ticket médio | R$40-80 |
