/**
 * Levantamiento de Necesidades de Reconocimientos
 * Servicio Local de Educación Pública Colchagua
 *
 * Backend único en Google Apps Script, desplegado como Web App.
 * Toda la lógica de negocio vive aquí; Google Sheets es la fuente de verdad.
 */

var SHEET_ID = '1OoYjIQERJZErUI6U9udPIPA0b2J3MW808qxf4z6WR5o';

var EMAIL_COLUMN_NAME = 'CORREO ELECTRONICO';

var SOLICITUDES_SHEET_NAME = 'Solicitudes';
var SOLICITUDES_HEADERS = [
  'id_solicitud',
  'fecha_envio',
  'correo_electronico',
  'rbd',
  'nombre_establecimiento',
  'comuna',
  'total_reconocimientos',
  'estado_revision',
  'observaciones_generales',
];

var DETALLE_SHEET_NAME = 'DetalleSolicitudes';
var DETALLE_HEADERS = [
  'id_detalle',
  'id_solicitud',
  'correo_electronico',
  'rbd',
  'nombre_establecimiento',
  'tipo_reconocimiento',
  'tipo_reconocimiento_otro',
  'cantidad',
  'dimension',
  'subdimension',
  'subdimension_otro',
  'nombre_accion',
  'descripcion',
  'fecha_estimada_uso',
  'observaciones',
];

var ESTADO_INICIAL = 'Recibido';

var RECOGNITION_TYPE_KEYS = [
  'Medallas',
  'Galvanos',
  'Diplomas',
  'Trofeos',
  'Certificados',
  'Reconocimientos especiales',
];

/* ============================================================
 * ENTRY POINTS
 * ============================================================ */

function doPost(e) {
  try {
    var data = parseRequest(e);
    var action = data && data.action;

    switch (action) {
      case 'validateDirectorEmail':
        return jsonResponse(validateDirectorEmail(data.email));
      case 'createRequest':
        return jsonResponse(createRequest(data));
      case 'getRequests':
        return jsonResponse(getRequests());
      case 'getRequestDetails':
        return jsonResponse(getRequestDetails(data.requestId));
      case 'updateRequestStatus':
        return jsonResponse(updateRequestStatus(data.requestId, data.status));
      case 'getDashboardStats':
        return jsonResponse(getDashboardStats());
      default:
        return jsonResponse({
          success: false,
          message: 'Acción no reconocida: ' + action,
        });
    }
  } catch (error) {
    return jsonResponse({
      success: false,
      message: 'Error inesperado del servidor: ' + (error && error.message ? error.message : error),
    });
  }
}

function doGet() {
  return jsonResponse({
    success: true,
    message: 'API de Levantamiento de Necesidades de Reconocimientos · SLEP Colchagua. Use POST con un payload JSON y un campo "action".',
  });
}

function parseRequest(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('No se recibió contenido en la solicitud.');
  }
  return JSON.parse(e.postData.contents);
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
 * AUTENTICACIÓN DEL DIRECTOR
 * ============================================================ */

function validateDirectorEmail(email) {
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return { success: false, message: 'Debes ingresar un correo electrónico.' };
  }

  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  var rows = getSheetDataAsObjects(sheet);
  var normalizedEmail = normalizeEmail(email);

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var rowEmail = extractEstablishmentField(row, [EMAIL_COLUMN_NAME, 'CORREO ELECTRÓNICO']);

    if (rowEmail && normalizeEmail(rowEmail) === normalizedEmail) {
      return {
        success: true,
        message: 'Director validado correctamente.',
        establishment: row,
      };
    }
  }

  return {
    success: false,
    message:
      'El correo ingresado no se encuentra registrado en la base de datos de establecimientos. Por favor, contacte al equipo administrador.',
  };
}

/* ============================================================
 * CREACIÓN DE SOLICITUDES
 * ============================================================ */

function createRequest(data) {
  var establishment = data && data.establishment;
  var generalObservations = (data && data.generalObservations) || '';
  var items = (data && data.items) || [];

  if (!establishment || typeof establishment !== 'object') {
    return { success: false, message: 'No fue posible registrar la solicitud. Intente nuevamente o contacte al administrador.' };
  }

  var correo = extractEstablishmentField(establishment, [EMAIL_COLUMN_NAME, 'CORREO ELECTRÓNICO']);
  if (!correo) {
    return { success: false, message: 'No fue posible registrar la solicitud. Intente nuevamente o contacte al administrador.' };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { success: false, message: 'No fue posible registrar la solicitud. Intente nuevamente o contacte al administrador.' };
  }

  for (var i = 0; i < items.length; i++) {
    var cantidad = Number(items[i] && items[i].cantidad);
    if (!cantidad || cantidad <= 0) {
      return { success: false, message: 'No fue posible registrar la solicitud. Intente nuevamente o contacte al administrador.' };
    }
  }

  try {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      var solicitudesSheet = getOrCreateSheet(spreadsheet, SOLICITUDES_SHEET_NAME, SOLICITUDES_HEADERS);
      var detalleSheet = getOrCreateSheet(spreadsheet, DETALLE_SHEET_NAME, DETALLE_HEADERS);

      var now = new Date();
      var fechaEnvio = Utilities.formatDate(now, Session.getScriptTimeZone() || 'America/Santiago', "yyyy-MM-dd'T'HH:mm:ss");
      var requestId = generateRequestId();

      var rbd = extractEstablishmentField(establishment, ['RBD']);
      var nombreEstablecimiento = extractEstablishmentField(establishment, ['NOMBRE ESTABLECIMIENTO', 'NOMBRE DEL ESTABLECIMIENTO']);
      var comuna = extractEstablishmentField(establishment, ['COMUNA']);

      solicitudesSheet.appendRow([
        requestId,
        fechaEnvio,
        normalizeEmail(correo),
        rbd,
        nombreEstablecimiento,
        comuna,
        items.length,
        ESTADO_INICIAL,
        generalObservations,
      ]);

      for (var j = 0; j < items.length; j++) {
        var item = items[j] || {};
        var detailId = generateDetailId(j);

        detalleSheet.appendRow([
          detailId,
          requestId,
          normalizeEmail(correo),
          rbd,
          nombreEstablecimiento,
          item.tipo_reconocimiento || '',
          item.tipo_reconocimiento_otro || '',
          Number(item.cantidad) || 0,
          item.dimension || '',
          item.subdimension || '',
          item.subdimension_otro || '',
          item.nombre_accion || '',
          item.descripcion || '',
          item.fecha_estimada_uso || '',
          item.observaciones || '',
        ]);
      }

      return {
        success: true,
        message: 'La solicitud ha sido registrada correctamente.',
        requestId: requestId,
      };
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return {
      success: false,
      message: 'No fue posible registrar la solicitud. Intente nuevamente o contacte al administrador.',
    };
  }
}

/* ============================================================
 * PANEL ADMINISTRATIVO
 * ============================================================ */

function getRequests() {
  try {
    var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    var sheet = getOrCreateSheet(spreadsheet, SOLICITUDES_SHEET_NAME, SOLICITUDES_HEADERS);
    var rows = getSheetDataAsObjects(sheet);

    var requests = rows.map(function (row) {
      return {
        id_solicitud: String(row['id_solicitud'] || ''),
        fecha_envio: formatSheetDate(row['fecha_envio']),
        correo_electronico: String(row['correo_electronico'] || ''),
        rbd: String(row['rbd'] || ''),
        nombre_establecimiento: String(row['nombre_establecimiento'] || ''),
        comuna: String(row['comuna'] || ''),
        total_reconocimientos: Number(row['total_reconocimientos']) || 0,
        estado_revision: String(row['estado_revision'] || ESTADO_INICIAL),
        observaciones_generales: String(row['observaciones_generales'] || ''),
      };
    }).filter(function (request) {
      return request.id_solicitud !== '';
    });

    requests.sort(function (a, b) {
      return b.fecha_envio.localeCompare(a.fecha_envio);
    });

    return { success: true, requests: requests };
  } catch (error) {
    return { success: false, message: 'No fue posible obtener las solicitudes registradas.' };
  }
}

function getRequestDetails(requestId) {
  if (!requestId) {
    return { success: false, message: 'Debes indicar el identificador de la solicitud.' };
  }

  try {
    var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    var sheet = getOrCreateSheet(spreadsheet, DETALLE_SHEET_NAME, DETALLE_HEADERS);
    var rows = getSheetDataAsObjects(sheet);

    var details = rows
      .filter(function (row) {
        return String(row['id_solicitud'] || '') === String(requestId);
      })
      .map(function (row) {
        return {
          id_detalle: String(row['id_detalle'] || ''),
          id_solicitud: String(row['id_solicitud'] || ''),
          correo_electronico: String(row['correo_electronico'] || ''),
          rbd: String(row['rbd'] || ''),
          nombre_establecimiento: String(row['nombre_establecimiento'] || ''),
          tipo_reconocimiento: String(row['tipo_reconocimiento'] || ''),
          tipo_reconocimiento_otro: String(row['tipo_reconocimiento_otro'] || ''),
          cantidad: Number(row['cantidad']) || 0,
          dimension: String(row['dimension'] || ''),
          subdimension: String(row['subdimension'] || ''),
          subdimension_otro: String(row['subdimension_otro'] || ''),
          nombre_accion: String(row['nombre_accion'] || ''),
          descripcion: String(row['descripcion'] || ''),
          fecha_estimada_uso: String(row['fecha_estimada_uso'] || ''),
          observaciones: String(row['observaciones'] || ''),
        };
      });

    return { success: true, details: details };
  } catch (error) {
    return { success: false, message: 'No fue posible obtener el detalle de la solicitud.' };
  }
}

function updateRequestStatus(requestId, status) {
  if (!requestId || !status) {
    return { success: false, message: 'Debes indicar la solicitud y el nuevo estado de revisión.' };
  }

  try {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      var sheet = getOrCreateSheet(spreadsheet, SOLICITUDES_SHEET_NAME, SOLICITUDES_HEADERS);
      var values = sheet.getDataRange().getValues();
      var headers = values[0].map(normalizeHeader);
      var idColumnIndex = findColumnIndex(headers, 'id_solicitud');
      var statusColumnIndex = findColumnIndex(headers, 'estado_revision');

      if (idColumnIndex === -1 || statusColumnIndex === -1) {
        return { success: false, message: 'No fue posible actualizar el estado: estructura de hoja inválida.' };
      }

      for (var i = 1; i < values.length; i++) {
        if (String(values[i][idColumnIndex]) === String(requestId)) {
          sheet.getRange(i + 1, statusColumnIndex + 1).setValue(status);
          return { success: true, message: 'El estado de la solicitud fue actualizado correctamente.' };
        }
      }

      return { success: false, message: 'No se encontró la solicitud indicada.' };
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return { success: false, message: 'No fue posible actualizar el estado de la solicitud.' };
  }
}

function getDashboardStats() {
  try {
    var spreadsheet = SpreadsheetApp.openById(SHEET_ID);

    var establishmentSheet = spreadsheet.getSheets()[0];
    var establishmentRows = getSheetDataAsObjects(establishmentSheet);
    var totalEstablecimientos = establishmentRows.filter(function (row) {
      return extractEstablishmentField(row, [EMAIL_COLUMN_NAME, 'CORREO ELECTRÓNICO']) !== '';
    }).length;

    var solicitudesSheet = getOrCreateSheet(spreadsheet, SOLICITUDES_SHEET_NAME, SOLICITUDES_HEADERS);
    var solicitudes = getSheetDataAsObjects(solicitudesSheet).filter(function (row) {
      return String(row['id_solicitud'] || '') !== '';
    });

    var detalleSheet = getOrCreateSheet(spreadsheet, DETALLE_SHEET_NAME, DETALLE_HEADERS);
    var detalles = getSheetDataAsObjects(detalleSheet).filter(function (row) {
      return String(row['id_detalle'] || '') !== '';
    });

    var respondedEmails = {};
    var totalPorComuna = {};
    var totalPorEstado = {};

    solicitudes.forEach(function (solicitud) {
      var correo = normalizeEmail(String(solicitud['correo_electronico'] || ''));
      if (correo) respondedEmails[correo] = true;

      var comuna = String(solicitud['comuna'] || 'Sin comuna');
      totalPorComuna[comuna] = (totalPorComuna[comuna] || 0) + 1;

      var estado = String(solicitud['estado_revision'] || ESTADO_INICIAL);
      totalPorEstado[estado] = (totalPorEstado[estado] || 0) + 1;
    });

    var establecimientosQueRespondieron = Object.keys(respondedEmails).length;
    var establecimientosPendientes = Math.max(totalEstablecimientos - establecimientosQueRespondieron, 0);
    var porcentajeAvance = totalEstablecimientos > 0
      ? Math.round((establecimientosQueRespondieron / totalEstablecimientos) * 1000) / 10
      : 0;

    var totalReconocimientos = 0;
    var totalPorTipo = {};
    var totalPorDimension = {};

    RECOGNITION_TYPE_KEYS.forEach(function (tipo) {
      totalPorTipo[tipo] = 0;
    });

    detalles.forEach(function (detalle) {
      var cantidad = Number(detalle['cantidad']) || 0;
      totalReconocimientos += cantidad;

      var tipo = String(detalle['tipo_reconocimiento'] || 'Otro');
      var tipoKey = RECOGNITION_TYPE_KEYS.indexOf(tipo) !== -1 ? tipo : (tipo || 'Otro');
      totalPorTipo[tipoKey] = (totalPorTipo[tipoKey] || 0) + cantidad;

      var dimension = String(detalle['dimension'] || 'Otro');
      totalPorDimension[dimension] = (totalPorDimension[dimension] || 0) + cantidad;
    });

    return {
      success: true,
      stats: {
        totalEstablecimientos: totalEstablecimientos,
        establecimientosQueRespondieron: establecimientosQueRespondieron,
        establecimientosPendientes: establecimientosPendientes,
        porcentajeAvance: porcentajeAvance,
        totalReconocimientos: totalReconocimientos,
        totalPorTipo: totalPorTipo,
        totalPorDimension: totalPorDimension,
        totalPorComuna: totalPorComuna,
        totalPorEstado: totalPorEstado,
      },
    };
  } catch (error) {
    return { success: false, message: 'No fue posible calcular los indicadores del panel administrativo.' };
  }
}

/* ============================================================
 * HELPERS DE HOJAS DE CÁLCULO
 * ============================================================ */

function getOrCreateSheet(spreadsheet, sheetName, headers) {
  var sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    return sheet;
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function getSheetDataAsObjects(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length === 0) return [];

  var rawHeaders = values[0];
  var objects = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var isEmptyRow = row.every(function (cell) {
      return cell === '' || cell === null || cell === undefined;
    });
    if (isEmptyRow) continue;

    var obj = {};
    for (var c = 0; c < rawHeaders.length; c++) {
      var header = String(rawHeaders[c]).trim();
      if (header === '') continue;
      obj[header] = row[c];
    }
    objects.push(obj);
  }

  return objects;
}

function findColumnIndex(headers, columnName) {
  var normalizedTarget = normalizeHeader(columnName);
  for (var i = 0; i < headers.length; i++) {
    if (normalizeHeader(headers[i]) === normalizedTarget) return i;
  }
  return -1;
}

/**
 * Normaliza encabezados: recorta espacios, colapsa espacios internos,
 * pasa a mayúsculas y elimina tildes/diacríticos para evitar errores
 * por variaciones de formato entre la base cargada y el código.
 */
function normalizeHeader(header) {
  if (header === null || header === undefined) return '';
  return String(header)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function normalizeEmail(email) {
  if (email === null || email === undefined) return '';
  return String(email).trim().toLowerCase();
}

/**
 * Busca el valor de un campo del establecimiento probando varios nombres
 * posibles de columna, normalizando encabezados para evitar depender de
 * la posición o de la grafía exacta usada en BaseDeDatos.csv.
 */
function extractEstablishmentField(establishment, possibleFieldNames) {
  if (!establishment) return '';

  var normalizedTargets = possibleFieldNames.map(normalizeHeader);
  var keys = Object.keys(establishment);

  for (var i = 0; i < keys.length; i++) {
    if (normalizedTargets.indexOf(normalizeHeader(keys[i])) !== -1) {
      var value = establishment[keys[i]];
      return value === null || value === undefined ? '' : String(value);
    }
  }
  return '';
}

function formatSheetDate(value) {
  if (value === null || value === undefined || value === '') return '';
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone() || 'America/Santiago', "yyyy-MM-dd'T'HH:mm:ss");
  }
  return String(value);
}

/* ============================================================
 * GENERADORES DE IDENTIFICADORES
 * ============================================================ */

function generateRequestId() {
  var now = new Date();
  var stamp = Utilities.formatDate(now, Session.getScriptTimeZone() || 'America/Santiago', 'yyyyMMdd-HHmmss');
  return 'SOL-' + stamp;
}

function generateDetailId(index) {
  var now = new Date();
  var stamp = Utilities.formatDate(now, Session.getScriptTimeZone() || 'America/Santiago', 'yyyyMMddHHmmssSSS');
  return 'DET-' + stamp + '-' + index + '-' + Math.floor(Math.random() * 900 + 100);
}
