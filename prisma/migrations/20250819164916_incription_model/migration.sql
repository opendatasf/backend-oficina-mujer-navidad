-- CreateTable
CREATE TABLE "public"."Inscription" (
    "id" SERIAL NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "nacionalidad" TEXT NOT NULL,
    "curso" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "escolaridad" TEXT NOT NULL,
    "estadoCivil" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "enfermedadPreexistente" TEXT,
    "discapacidad" TEXT,
    "derivacion" TEXT,
    "asistioOtroTaller" BOOLEAN NOT NULL DEFAULT false,
    "especificacionesAnterior" TEXT,
    "infoRelevante" TEXT,
    "duracionMeses" INTEGER,
    "certificacion" TEXT,
    "tipoTaller" TEXT NOT NULL,
    "estado" TEXT NOT NULL,

    CONSTRAINT "Inscription_pkey" PRIMARY KEY ("id")
);
