/**
 * SCRIPT: Termos de Pesquisa - Categorização e Negativação Automática
 * 
 * INSTRUÇÕES:
 * 1. Substituir SHEET_ID pelo ID da planilha do cliente
 * 2. Ajustar CATEGORIAS conforme nicho (buscar template no GitHub)
 * 3. Criar biblioteca "Negativos Automáticos - [Cliente]" no Google Ads
 * 4. Testar com DEBUG: true antes de ativar
 * 5. Agendar: segunda 8h
 */

// ============ CONFIGURAÇÕES ============
var CONFIG = {
  SHEET_ID: 'SUBSTITUIR_PELO_ID_DA_PLANILHA',
  BIBLIOTECA_NEGATIVOS: 'Negativos Automáticos - CLIENTE',
  DIAS_ANALISE: 7,
  CLIQUES_MINIMOS: 5,
  CUSTO_MINIMO: 20,
  CLIENTE_ONLINE: true,  // se true, negativa termos presenciais
  DEBUG: true  // mudar para false após testar
};

// ============ CATEGORIAS (AJUSTAR POR NICHO) ============
// Buscar template em: templates/nichos/[nicho].md
var CATEGORIAS = {
  CORE: /SUBSTITUIR/i,
  TERAPIA: /SUBSTITUIR/i,
  PROFISSIONAL: /SUBSTITUIR/i,
  SINTOMAS: /SUBSTITUIR/i,
  LIXO: /curso|faculdade|gratuito|gr[aá]tis|vagas?|emprego|sal[aá]rio/i,
  CONCORRENTES: /SUBSTITUIR/i,
  PRESENCIAL: /moema|pinheiros|jardins|itaim|vila mariana|santana|lapa|perdizes|osasco|guarulhos/i
};

// ============ FUNÇÕES PRINCIPAIS ============

function main() {
  var termos = buscarTermos();
  var categorizados = categorizarTermos(termos);
  var paraNegativar = filtrarParaNegativar(categorizados);
  var paraRevisar = filtrarParaRevisar(categorizados);
  
  if (!CONFIG.DEBUG) {
    negativarTermos(paraNegativar);
  }
  
  exportarParaSheet(categorizados, paraNegativar, paraRevisar);
  
  Logger.log('=== RESUMO ===');
  Logger.log('Total termos: ' + termos.length);
  Logger.log('Para negativar: ' + paraNegativar.length);
  Logger.log('Para revisar: ' + paraRevisar.length);
  Logger.log('DEBUG mode: ' + CONFIG.DEBUG);
}

function buscarTermos() {
  var query = 'SELECT Query, Impressions, Clicks, Cost, Conversions, CampaignName ' +
              'FROM SEARCH_QUERY_PERFORMANCE_REPORT ' +
              'WHERE Impressions > 0 ' +
              'DURING LAST_' + CONFIG.DIAS_ANALISE + '_DAYS';
  
  var report = AdsApp.report(query);
  var rows = report.rows();
  var termos = [];
  
  while (rows.hasNext()) {
    var row = rows.next();
    termos.push({
      termo: row['Query'],
      impressoes: parseInt(row['Impressions']),
      cliques: parseInt(row['Clicks']),
      custo: parseFloat(row['Cost'].replace(/,/g, '')),
      conversoes: parseFloat(row['Conversions']),
      campanha: row['CampaignName']
    });
  }
  
  return termos;
}

function categorizarTermos(termos) {
  return termos.map(function(t) {
    t.categoria = identificarCategoria(t.termo);
    t.cpa = t.conversoes > 0 ? t.custo / t.conversoes : null;
    return t;
  });
}

function identificarCategoria(termo) {
  for (var cat in CATEGORIAS) {
    if (CATEGORIAS[cat].test(termo)) {
      return cat;
    }
  }
  return 'NAO_CATEGORIZADO';
}

function filtrarParaNegativar(termos) {
  return termos.filter(function(t) {
    if (t.categoria === 'LIXO') return true;
    if (t.categoria === 'CONCORRENTES') return true;
    if (t.categoria === 'PRESENCIAL' && CONFIG.CLIENTE_ONLINE) return true;
    return false;
  });
}

function filtrarParaRevisar(termos) {
  return termos.filter(function(t) {
    if (t.categoria === 'LIXO' || t.categoria === 'CONCORRENTES') return false;
    if (t.categoria === 'PRESENCIAL' && CONFIG.CLIENTE_ONLINE) return false;
    
    var temCliques = t.cliques >= CONFIG.CLIQUES_MINIMOS;
    var temCusto = t.custo >= CONFIG.CUSTO_MINIMO;
    var semConversao = t.conversoes === 0;
    
    return temCliques && temCusto && semConversao;
  });
}

function negativarTermos(termos) {
  var biblioteca = buscarBiblioteca();
  if (!biblioteca) {
    Logger.log('ERRO: Biblioteca não encontrada: ' + CONFIG.BIBLIOTECA_NEGATIVOS);
    return;
  }
  
  termos.forEach(function(t) {
    try {
      biblioteca.addNegativeKeyword(t.termo);
      Logger.log('Negativado: ' + t.termo);
    } catch (e) {
      Logger.log('Erro ao negativar ' + t.termo + ': ' + e);
    }
  });
}

function buscarBiblioteca() {
  var iterator = AdsApp.negativeKeywordLists()
    .withCondition("Name = '" + CONFIG.BIBLIOTECA_NEGATIVOS + "'")
    .get();
  
  if (iterator.hasNext()) {
    return iterator.next();
  }
  return null;
}

function exportarParaSheet(todos, negativados, revisar) {
  var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  
  // Aba: Termos Semanais
  var abaTermos = ss.getSheetByName('Termos Semanais') || ss.insertSheet('Termos Semanais');
  abaTermos.clear();
  
  var dadosTermos = [['Termo', 'Impressões', 'Cliques', 'Custo', 'Conversões', 'CPA', 'Categoria', 'Campanha']];
  todos.sort(function(a, b) { return b.custo - a.custo; });
  
  todos.forEach(function(t) {
    dadosTermos.push([
      t.termo,
      t.impressoes,
      t.cliques,
      t.custo,
      t.conversoes,
      t.cpa || '-',
      t.categoria,
      t.campanha
    ]);
  });
  
  abaTermos.getRange(1, 1, dadosTermos.length, dadosTermos[0].length).setValues(dadosTermos);
  colorirCategorias(abaTermos, dadosTermos.length);
  
  // Aba: Revisar
  var abaRevisar = ss.getSheetByName('Revisar') || ss.insertSheet('Revisar');
  var ultimaLinha = abaRevisar.getLastRow();
  
  if (ultimaLinha === 0) {
    abaRevisar.getRange(1, 1, 1, 9).setValues([['Data', 'Termo', 'Cliques', 'Custo', 'Categoria', 'Campanha', 'DECISÃO', 'Motivo', 'Processado']]);
    ultimaLinha = 1;
  }
  
  var hoje = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd');
  revisar.forEach(function(t) {
    abaRevisar.appendRow([hoje, t.termo, t.cliques, t.custo, t.categoria, t.campanha, '', '', '']);
  });
  
  // Aba: Negativados
  var abaNeg = ss.getSheetByName('Negativados') || ss.insertSheet('Negativados');
  ultimaLinha = abaNeg.getLastRow();
  
  if (ultimaLinha === 0) {
    abaNeg.getRange(1, 1, 1, 5).setValues([['Data', 'Termo', 'Categoria', 'Custo Acumulado', 'Motivo']]);
    ultimaLinha = 1;
  }
  
  negativados.forEach(function(t) {
    abaNeg.appendRow([hoje, t.termo, t.categoria, t.custo, 'Automático']);
  });
  
  // Aba: Config
  var abaConfig = ss.getSheetByName('Config') || ss.insertSheet('Config');
  abaConfig.clear();
  abaConfig.getRange(1, 1, 8, 2).setValues([
    ['Última execução', new Date()],
    ['Dias analisados', CONFIG.DIAS_ANALISE],
    ['Total termos', todos.length],
    ['Negativados', negativados.length],
    ['Para revisar', revisar.length],
    ['Biblioteca', CONFIG.BIBLIOTECA_NEGATIVOS],
    ['Cliente online', CONFIG.CLIENTE_ONLINE],
    ['DEBUG', CONFIG.DEBUG]
  ]);
  
  Logger.log('Sheet atualizada: ' + CONFIG.SHEET_ID);
}

function colorirCategorias(sheet, totalLinhas) {
  var cores = {
    'CORE': '#d4edda',
    'TERAPIA': '#cce5ff',
    'PROFISSIONAL': '#e2e3e5',
    'SINTOMAS': '#fff3cd',
    'LIXO': '#f8d7da',
    'CONCORRENTES': '#f5c6cb',
    'PRESENCIAL': '#ffeeba',
    'NAO_CATEGORIZADO': '#ffffff'
  };
  
  for (var i = 2; i <= totalLinhas; i++) {
    var categoria = sheet.getRange(i, 7).getValue();
    var cor = cores[categoria] || '#ffffff';
    sheet.getRange(i, 1, 1, 8).setBackground(cor);
  }
}

// Função auxiliar: processar decisões manuais da aba Revisar
function processarRevisaoManual() {
  var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var abaRevisar = ss.getSheetByName('Revisar');
  var dados = abaRevisar.getDataRange().getValues();
  var biblioteca = buscarBiblioteca();
  
  for (var i = 1; i < dados.length; i++) {
    var decisao = dados[i][6];  // Coluna DECISÃO
    var processado = dados[i][8];  // Coluna Processado
    
    if (decisao === 'NEGATIVAR' && processado !== 'SIM') {
      var termo = dados[i][1];
      biblioteca.addNegativeKeyword(termo);
      abaRevisar.getRange(i + 1, 9).setValue('SIM');
      Logger.log('Negativado manual: ' + termo);
    }
  }
}
