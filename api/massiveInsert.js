import prisma from "./prismaClient.js";
import XLSX from "xlsx";

/**
 * Crea un objeto Date seguro si está dentro de rango.
 */
function safeDateFromParts(y, m, d, hh = 0, mm = 0, ss = 0) {
    y = Number(y);
    m = Number(m);
    d = Number(d);

    if (!Number.isInteger(y) || y < 1900 || y > 2100) return null;
    if (m < 1 || m > 12) return null;
    if (d < 1 || d > 31) return null;

    const date = new Date(Date.UTC(y, m - 1, d, hh, mm, ss));
    return isNaN(date) ? null : date;
}

/**
 * Parsea fechas desde Excel (varios formatos).
 */
function parseExcelDate(value) {
    if (value == null || value === "Sin información") return null;
    if (value instanceof Date && !isNaN(value)) return value;

    const s = String(value).trim();
    let m;

    // YYYY-MM-DD HH:mm:ss
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/);
    if (m) return safeDateFromParts(m[1], m[2], m[3], m[4] || 0, m[5] || 0, m[6] || 0);

    // YYYY-MM-DD
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return safeDateFromParts(m[1], m[2], m[3]);

    // DD/MM/YYYY
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return safeDateFromParts(m[3], m[2], m[1]);

    // DD-MM-YYYY
    m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (m) return safeDateFromParts(m[3], m[2], m[1]);

    // Excel serial
    if (/^\d+(\.\d+)?$/.test(s)) {
        const excelEpoch = Date.UTC(1899, 11, 30);
        const ms = Math.round(parseFloat(s) * 86400000);
        return new Date(excelEpoch + ms);
    }

    // Fallback
    const fallback = new Date(s);
    if (fallback instanceof Date && !isNaN(fallback)) return fallback;

    return null;
}

/**
 * Convierte fila Excel en objeto válido para Prisma.
 */
function mapRowToInscription(row, index) {
    try {
        if (!row["CURSO"] || !row["RUT"]) {
            throw new Error(`Fila ${index + 2}: Faltan campos obligatorios (CURSO, RUT)`);
        }

        let fechaNacimiento = null;
        try {
            fechaNacimiento = parseExcelDate(row["FECHANACIMIENTO"]);
            if (
                fechaNacimiento &&
                (fechaNacimiento.getUTCFullYear() < 1900 ||
                    fechaNacimiento.getUTCFullYear() > 2100)
            ) {
                console.warn(
                    `⚠️ Fila ${index + 2}: Fecha descartada por año fuera de rango -> ${row["FECHANACIMIENTO"]}`
                );
                fechaNacimiento = null;
            }
        } catch {
            console.warn(`⚠️ Fila ${index + 2}: Fecha inválida -> ${row["FECHANACIMIENTO"]}`);
            fechaNacimiento = null;
        }

        // 💡 aseguramos que nunca pase un Invalid Date
        if (!(fechaNacimiento instanceof Date) || isNaN(fechaNacimiento)) {
            fechaNacimiento = null;
        }

        return {
            nombres: String(row["NOMBRES"]) || "Sin nombre",
            apellidos: row["APELLIDOS"],
            rut: String(row["RUT"]),
            nacionalidad: row["NACIONALIDAD"] || null,
            curso: String(row["CURSO"]) || null,
            anio: parseInt(row["ANNO"], 10) || 0,
            fechaNacimiento,
            escolaridad: row["ESCOLARIDAD"] || null,
            estadoCivil: row["ESTADOCIVIL"] || null,
            direccion: String(row["DIRECCION"]) || "Sin Información",
            telefono: row["TELEFONO"] ? String(row["TELEFONO"]) : null,
            enfermedadPreexistente: row["ENFERMEDADPREEXISTENTE"] || null,
            discapacidad: row["DISCAPACIDAD"] || null,
            derivacion: row["DERIVACION"] || null,
            asistioOtroTaller:
                row["ASISTIOAOTROTALLER"] === 1 ||
                row["ASISTIOAOTROTALLER"] === "1" ||
                (typeof row["ASISTIOAOTROTALLER"] === "string" &&
                    row["ASISTIOAOTROTALLER"].toUpperCase() === "SI"),
            especificacionesAnterior: row["ESPECIFICACIONESPUNTOANTERIOR"] || null,
            infoRelevante: String(row["INFORELEVANTE"]) || null,
            duracionMeses: row["DURACIONENMESES"]
                ? parseInt(row["DURACIONENMESES"])
                : null,
            certificacion: row["CERTIFICACION"] || null,
            tipoTaller: row["TIPOTALLER"] || null,
            estado: row["ESTADO"] || "Activo",
        };
    } catch (err) {
        console.warn(`⚠️ Registro descartado: ${err.message}`);
        return null;
    }
}

/**
 * Inserción masiva desde Excel.
 */
async function massiveInsertFromXlsx(filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
        console.log(`📄 ${rows.length} filas leídas desde ${filePath}`);

        const mappedData = rows.map((row, i) => mapRowToInscription(row, i)).filter(Boolean);
        console.log(`✅ ${mappedData.length} filas válidas serán insertadas`);

        if (mappedData.length > 0) {
            const result = await prisma.inscription.createMany({
                data: mappedData,
                skipDuplicates: true,
            });
            console.log(`🎉 ${result.count} inscripciones insertadas correctamente`);
        } else {
            console.warn("⚠️ No hay filas válidas para insertar.");
        }
    } catch (error) {
        console.error("❌ Error en massiveInsertFromXlsx:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar
if (process.argv.length > 2) {
    const filePath = process.argv[2];
    massiveInsertFromXlsx(filePath);
} else {
    console.error("⚠️ Debes indicar la ruta del archivo XLSX.");
}
