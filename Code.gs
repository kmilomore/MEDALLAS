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
  'codigo_pme',
];

/**
 * Hoja "Admin": planilla manual con los usuarios que tienen acceso al panel
 * administrativo. Si el correo autenticado con Google no figura en la base
 * de establecimientos, se busca aquí. Se crea automáticamente con estos
 * encabezados si aún no existe en la planilla.
 */
var ADMIN_SHEET_NAME = 'Admin';
var ADMIN_HEADERS = ['CORREO ELECTRONICO', 'NOMBRE', 'CARGO', 'ACTIVO'];
var ADMIN_EMAIL_ALIASES = ['CORREO ELECTRONICO', 'CORREO ELECTRÓNICO', 'CORREO', 'EMAIL', 'CORREO ADMINISTRADOR'];
var ADMIN_ACTIVE_ALIASES = ['ACTIVO', 'HABILITADO', 'ESTADO'];
var ADMIN_INACTIVE_VALUES = ['NO', 'FALSE', 'INACTIVO', 'DESHABILITADO', '0'];

/**
 * Hoja "PME": tabla de referencia oficial del Plan de Mejoramiento Educativo
 * con las dimensiones y subdimensiones válidas y su código único
 * (ej. "PME-GP-01"). El formulario de ingreso usa estos datos para presentar
 * la selección encadenada Dimensión → Subdimensión. Se siembra automáticamente
 * la primera vez que se crea (o si está vacía) mediante inicializarHojas().
 */
var PME_SHEET_NAME = 'PME';
var PME_HEADERS = ['CODIGO', 'DIMENSION', 'SUB_DIMESION'];
var PME_SEED_DATA = [
  ['PME-GP-01', 'Gestión Pedagógica', 'Gestión curricular'],
  ['PME-GP-02', 'Gestión Pedagógica', 'Enseñanza y aprendizaje en el aula'],
  ['PME-GP-03', 'Gestión Pedagógica', 'Apoyo al desarrollo de los estudiantes'],
  ['PME-LID-01', 'Liderazgo', 'Liderazgo del sostenedor'],
  ['PME-LID-02', 'Liderazgo', 'Liderazgo del director'],
  ['PME-LID-03', 'Liderazgo', 'Planificación y gestión de resultados'],
  ['PME-CE-01', 'Convivencia Escolar', 'Formación'],
  ['PME-CE-02', 'Convivencia Escolar', 'Convivencia escolar'],
  ['PME-CE-03', 'Convivencia Escolar', 'Participación y vida democrática'],
  ['PME-GR-01', 'Gestión de Recursos', 'Gestión del personal'],
  ['PME-GR-02', 'Gestión de Recursos', 'Gestión de recursos financieros'],
  ['PME-GR-03', 'Gestión de Recursos', 'Gestión de recursos educativos'],
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
      case 'inicializarHojas':
        return jsonResponse(inicializarHojas());
      case 'validateDirectorEmail':
        return jsonResponse(validateDirectorEmail(data.email));
      case 'validateUserAccess':
        return jsonResponse(validateUserAccess(data.email));
      case 'getAdmins':
        return jsonResponse(getAdmins());
      case 'createAdmin':
        return jsonResponse(createAdmin(data.admin));
      case 'updateAdmin':
        return jsonResponse(updateAdmin(data.email, data.changes));
      case 'deleteAdmin':
        return jsonResponse(deleteAdmin(data.email));
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
      case 'getPmeOptions':
        return jsonResponse(getPmeOptions());
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
 * INICIALIZACIÓN DE LA PLANILLA
 *
 * Crea (si no existen) todas las hojas que necesita el sistema:
 * "Solicitudes", "DetalleSolicitudes" y "Admin", cada una con sus
 * encabezados correctos. Es seguro ejecutarla varias veces: las
 * hojas que ya existan no se modifican ni se duplican.
 *
 * Se puede ejecutar de dos formas:
 *   1) Manualmente desde el editor de Apps Script: selecciona la
 *      función "inicializarHojas" en el menú desplegable y presiona
 *      "Ejecutar".
 *   2) Desde el frontend/Postman enviando { "action": "inicializarHojas" }.
 * ============================================================ */

function inicializarHojas() {
  var spreadsheet = SpreadsheetApp.openById(SHEET_ID);

  var definiciones = [
    { nombre: SOLICITUDES_SHEET_NAME, headers: SOLICITUDES_HEADERS },
    { nombre: DETALLE_SHEET_NAME, headers: DETALLE_HEADERS },
    { nombre: ADMIN_SHEET_NAME, headers: ADMIN_HEADERS },
    { nombre: PME_SHEET_NAME, headers: PME_HEADERS },
  ];

  var hojas = definiciones.map(function (definicion) {
    var existiaAntes = !!spreadsheet.getSheetByName(definicion.nombre);
    var sheet = getOrCreateSheet(spreadsheet, definicion.nombre, definicion.headers);

    if (definicion.nombre === PME_SHEET_NAME && sheet.getLastRow() === 1) {
      sheet.getRange(2, 1, PME_SEED_DATA.length, PME_HEADERS.length).setValues(PME_SEED_DATA);
    }

    return { hoja: definicion.nombre, estado: existiaAntes ? 'ya existía' : 'creada' };
  });

  return {
    success: true,
    message: 'Las hojas necesarias fueron verificadas; las que faltaban se crearon con sus encabezados.',
    hojas: hojas,
  };
}

/**
 * Lee la hoja "PME" y devuelve las combinaciones oficiales de
 * Dimensión/Subdimensión junto con su código único, para que el formulario de
 * ingreso presente la selección encadenada Dimensión → Subdimensión.
 */
function getPmeOptions() {
  try {
    var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    var sheet = getOrCreateSheet(spreadsheet, PME_SHEET_NAME, PME_HEADERS);
    var rows = getSheetDataAsObjects(sheet);

    var opciones = rows
      .filter(function (row) {
        return String(row['CODIGO'] || '').trim() !== '';
      })
      .map(function (row) {
        return {
          codigo: String(row['CODIGO'] || '').trim(),
          dimension: String(row['DIMENSION'] || '').trim(),
          subdimension: String(row['SUB_DIMESION'] || '').trim(),
        };
      });

    return { success: true, opciones: opciones };
  } catch (error) {
    return { success: false, message: 'No fue posible obtener las dimensiones y subdimensiones del PME.' };
  }
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
 * AUTENTICACIÓN UNIFICADA (GOOGLE AUTH)
 *
 * El frontend valida la identidad con Google Identity Services y envía el
 * correo autenticado. Aquí se determina el perfil de acceso buscando, en
 * orden, en la base de establecimientos (perfil "director") y luego en la
 * hoja "Admin" (perfil "admin"). Esto reemplaza el ingreso manual de correo
 * por un inicio de sesión con la cuenta de Google institucional.
 * ============================================================ */

function validateUserAccess(email) {
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return { success: false, message: 'No fue posible obtener el correo electrónico de tu cuenta de Google.' };
  }

  var normalizedEmail = normalizeEmail(email);
  var spreadsheet = SpreadsheetApp.openById(SHEET_ID);

  // 1) ¿El correo corresponde a un director o directora de establecimiento?
  var establishmentSheet = spreadsheet.getSheets()[0];
  var establishmentRows = getSheetDataAsObjects(establishmentSheet);

  for (var i = 0; i < establishmentRows.length; i++) {
    var row = establishmentRows[i];
    var rowEmail = extractEstablishmentField(row, [EMAIL_COLUMN_NAME, 'CORREO ELECTRÓNICO']);

    if (rowEmail && normalizeEmail(rowEmail) === normalizedEmail) {
      return {
        success: true,
        role: 'director',
        message: 'Sesión iniciada como director o directora de establecimiento.',
        establishment: row,
      };
    }
  }

  // 2) Si no está en la base de establecimientos, ¿es un usuario administrador?
  var adminSheet = findSheetByNormalizedName(spreadsheet, 'ADMIN');
  if (adminSheet) {
    var adminRows = getSheetDataAsObjects(adminSheet);

    for (var j = 0; j < adminRows.length; j++) {
      var adminRow = adminRows[j];
      var adminEmail = extractEstablishmentField(adminRow, ADMIN_EMAIL_ALIASES);
      if (!adminEmail || normalizeEmail(adminEmail) !== normalizedEmail) continue;

      if (!isAdminRowActive(adminRow)) {
        return {
          success: false,
          message: 'Tu cuenta de administrador se encuentra inactiva. Contacta al equipo a cargo del sistema para reactivarla.',
        };
      }

      return {
        success: true,
        role: 'admin',
        message: 'Sesión iniciada con perfil administrador.',
        admin: adminRow,
      };
    }
  }

  return {
    success: false,
    message:
      'El correo ingresado no se encuentra registrado en la base de datos de establecimientos ni como usuario administrador. Por favor, contacte al equipo a cargo del sistema.',
  };
}

function isAdminRowActive(adminRow) {
  var rawValue = extractEstablishmentField(adminRow, ADMIN_ACTIVE_ALIASES);
  if (!rawValue) return true; // Sin columna de estado: se asume habilitado.
  return ADMIN_INACTIVE_VALUES.indexOf(normalizeHeader(rawValue)) === -1;
}

function findSheetByNormalizedName(spreadsheet, normalizedName) {
  var sheets = spreadsheet.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (normalizeHeader(sheets[i].getName()) === normalizedName) return sheets[i];
  }
  return null;
}

/* ============================================================
 * ADMINISTRACIÓN DE LA HOJA "ADMIN"
 *
 * CRUD básico sobre la planilla de usuarios administradores, para que el
 * equipo a cargo pueda gestionar quién tiene acceso al panel sin editar la
 * hoja de cálculo manualmente.
 * ============================================================ */

function getAdmins() {
  var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  var sheet = getOrCreateSheet(spreadsheet, ADMIN_SHEET_NAME, ADMIN_HEADERS);
  var rows = getSheetDataAsObjects(sheet);
  return { success: true, admins: rows };
}

function createAdmin(admin) {
  if (!admin || typeof admin !== 'object') {
    return { success: false, message: 'Debes indicar los datos del usuario administrador.' };
  }

  var email = extractEstablishmentField(admin, ADMIN_EMAIL_ALIASES);
  if (!email || !isValidEmailFormat(email)) {
    return { success: false, message: 'Debes indicar un correo electrónico con formato válido.' };
  }

  var normalizedEmail = normalizeEmail(email);

  try {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      var sheet = getOrCreateSheet(spreadsheet, ADMIN_SHEET_NAME, ADMIN_HEADERS);
      var rows = getSheetDataAsObjects(sheet);

      for (var i = 0; i < rows.length; i++) {
        var existingEmail = extractEstablishmentField(rows[i], ADMIN_EMAIL_ALIASES);
        if (existingEmail && normalizeEmail(existingEmail) === normalizedEmail) {
          return { success: false, message: 'Ya existe un usuario administrador registrado con ese correo electrónico.' };
        }
      }

      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var newRow = headers.map(function (header) {
        var key = String(header).trim();
        if (normalizeHeader(key) === normalizeHeader('CORREO ELECTRONICO')) return normalizedEmail;
        return admin[key] !== undefined && admin[key] !== null ? admin[key] : '';
      });

      sheet.appendRow(newRow);

      return { success: true, message: 'Usuario administrador agregado correctamente.' };
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return {
      success: false,
      message: 'No fue posible agregar al usuario administrador: ' + (error && error.message ? error.message : error),
    };
  }
}

function updateAdmin(email, changes) {
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return { success: false, message: 'Debes indicar el correo electrónico del usuario administrador a modificar.' };
  }
  if (!changes || typeof changes !== 'object') {
    return { success: false, message: 'Debes indicar los cambios a aplicar.' };
  }

  var normalizedEmail = normalizeEmail(email);

  try {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      var sheet = getOrCreateSheet(spreadsheet, ADMIN_SHEET_NAME, ADMIN_HEADERS);
      var values = sheet.getDataRange().getValues();
      if (values.length < 2) {
        return { success: false, message: 'No existen usuarios administradores registrados.' };
      }

      var headers = values[0];
      var emailColumnIndex = findEmailColumnIndex(headers);
      if (emailColumnIndex === -1) {
        return { success: false, message: 'La hoja "Admin" no tiene una columna de correo electrónico configurada.' };
      }

      for (var r = 1; r < values.length; r++) {
        var rowEmail = values[r][emailColumnIndex];
        if (!rowEmail || normalizeEmail(rowEmail) !== normalizedEmail) continue;

        for (var c = 0; c < headers.length; c++) {
          var headerKey = String(headers[c]).trim();
          if (Object.prototype.hasOwnProperty.call(changes, headerKey)) {
            var newValue = changes[headerKey];
            sheet.getRange(r + 1, c + 1).setValue(newValue === null || newValue === undefined ? '' : newValue);
          }
        }

        return { success: true, message: 'Usuario administrador actualizado correctamente.' };
      }

      return { success: false, message: 'No se encontró un usuario administrador con ese correo electrónico.' };
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return {
      success: false,
      message: 'No fue posible actualizar al usuario administrador: ' + (error && error.message ? error.message : error),
    };
  }
}

function deleteAdmin(email) {
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return { success: false, message: 'Debes indicar el correo electrónico del usuario administrador a eliminar.' };
  }

  var normalizedEmail = normalizeEmail(email);

  try {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      var sheet = getOrCreateSheet(spreadsheet, ADMIN_SHEET_NAME, ADMIN_HEADERS);
      var values = sheet.getDataRange().getValues();
      if (values.length < 2) {
        return { success: false, message: 'No existen usuarios administradores registrados.' };
      }

      var headers = values[0];
      var emailColumnIndex = findEmailColumnIndex(headers);
      if (emailColumnIndex === -1) {
        return { success: false, message: 'La hoja "Admin" no tiene una columna de correo electrónico configurada.' };
      }

      for (var r = 1; r < values.length; r++) {
        var rowEmail = values[r][emailColumnIndex];
        if (!rowEmail || normalizeEmail(rowEmail) !== normalizedEmail) continue;

        sheet.deleteRow(r + 1);
        return { success: true, message: 'Usuario administrador eliminado correctamente.' };
      }

      return { success: false, message: 'No se encontró un usuario administrador con ese correo electrónico.' };
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return {
      success: false,
      message: 'No fue posible eliminar al usuario administrador: ' + (error && error.message ? error.message : error),
    };
  }
}

function findEmailColumnIndex(headers) {
  for (var i = 0; i < ADMIN_EMAIL_ALIASES.length; i++) {
    var index = findColumnIndex(headers, ADMIN_EMAIL_ALIASES[i]);
    if (index !== -1) return index;
  }
  return -1;
}

function isValidEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
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
          item.codigo_pme || '',
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
          codigo_pme: String(row['codigo_pme'] || ''),
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
