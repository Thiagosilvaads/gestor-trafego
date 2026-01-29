# TEMPLATE: MÉDICO / CLÍNICA

## Regex de Categorização

```javascript
var CATEGORIAS = {
  CORE: /m[eé]dico|m[eé]dica|cl[ií]nica|consult[oó]rio/i,
  ESPECIALIDADE: /dermatolog|cardiolog|ginecolog|pediatr|ortoped|neurolog|psiquiatr|endocrin|urologis|oftalmol|otorrino/i,
  SINTOMA: /dor|febre|mancha|alergia|exame|check-?up|tontura|insonia/i,
  PROCEDIMENTO: /cirurgia|bot[oó]x|preenchi|laser|tratamento|biopsia/i,
  LIXO: /curso|faculdade|resid[eê]ncia|concurso|sus|ubs|gratuito|popular|sal[aá]rio|vaga/i,
  CONCORRENTES: /doctoralia|boaConsulta|conexasa[uú]de|dr consulta/i,
  PRESENCIAL: /moema|pinheiros|jardins|itaim|vila mariana|santana|lapa|perdizes|osasco|guarulhos|abc/i
};
```

## Negativos Iniciais

```
curso
faculdade
residência
concurso
sus
ubs
gratuito
popular
salário
vaga
emprego
doctoralia
boa consulta
conexa saúde
dr consulta
como ser médico
quanto ganha
plantão
coren
crm
```

## Padrões do Nicho

### Termos que convertem bem
- "[especialidade] [cidade]"
- "consulta [especialidade]"
- "médico particular"
- "[procedimento] [cidade]"

### Termos informativos (baixa conversão)
- "sintomas de [doença]"
- "o que é [doença]"
- "tratamento para [doença]"

### Especialidades comuns
- Dermatologia
- Cardiologia
- Ginecologia
- Pediatria
- Ortopedia
- Psiquiatria

## Métricas de Referência

| Métrica | Benchmark |
|---------|-----------|
| CPA médio | R$30-100 |
| Taxa conversão LP | 3-10% |
| CTR anúncios | 2-5% |
| Ticket médio | R$200-500/consulta |
