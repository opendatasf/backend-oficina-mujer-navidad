import prisma from "./prismaClient.js";

export async function insertInscription(data) {
    try {
        // 🔹 Mapeo de los campos que llegan desde el formulario a tu modelo Prisma
        const mappedData = {
            nombres: data.text_nombres,
            apellidos: data.text_apellidos,
            rut: data.text_cedula,
            nacionalidad: data.text_nacionalidad,
            curso: data.text_nombre_taller,           // o data.text_semestre según tu lógica
            anio: data.text_20sknx || new Date().getFullYear(),
            fechaNacimiento: new Date(data.text_fecha_nacimiento),
            escolaridad: data.text_escolaridad,
            estadoCivil: data.text_estado_civil,
            direccion: data.text_domicilio,
            telefono: data.text_telefono,
            enfermedadPreexistente: data.text_enfermedades || null,
            discapacidad: data.text_discapacidad || null,
            derivacion: data.text_derivacion || null,
            asistioOtroTaller: data.checkbox_19bqbu ?? false,
            especificacionesAnterior: data.text_otros_talleres || null,
            infoRelevante: null, // 🔹 puedes mapear a otro text si aplica
            duracionMeses: null, // 🔹 idem, depende de tu formulario
            certificacion: null, // 🔹 idem
            tipoTaller: data.text_nombre_taller,
            estado: "Activo", // 🔹 podrías derivarlo de un checkbox o valor default
        };

        const newInscription = await prisma.inscription.create({
            data: mappedData,
        });

        console.log("✅ Inscripción insertada:", newInscription);
        return newInscription;
    } catch (error) {
        console.error("❌ Error al insertar inscripción:", error);
    } finally {
        await prisma.$disconnect();
    }
}
