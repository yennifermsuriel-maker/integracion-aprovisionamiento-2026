
const const API_URL = "";
   
const formConsulta = document.getElementById("formConsulta");
const inputTarjeta = document.getElementById("tarjeta");
const btnConsultar = document.getElementById("btnConsultar");
const btnRegistrar = document.getElementById("btnRegistrar");
const btnNuevaConsulta = document.getElementById("btnNuevaConsulta");

const consulta = document.getElementById("consulta");
const resultado = document.getElementById("resultado");
const mensaje = document.getElementById("mensaje");

const nombreParticipante =
    document.getElementById("nombreParticipante");

const departamentoParticipante =
    document.getElementById("departamentoParticipante");

const tarjetaEquipo =
    document.getElementById("tarjetaEquipo");

const tituloEquipo =
    document.getElementById("tituloEquipo");

const numeroEquipo =
    document.getElementById("numeroEquipo");

const colorEquipo =
    document.getElementById("colorEquipo");

const estadoAsistencia =
    document.getElementById("estadoAsistencia");

let tarjetaActual = "";
let procesando = false;

const coloresEquipos = {
    "1": "#2563EB",
    "2": "#171717",
    "3": "#800020",
    "4": "#FFFFFF",
    "5": "#808080",
    "6": "#F97316",
    "7": "#DC2626",
    "8": "#EC4899",
    "9": "#FACC15",
    "10": "#16A34A"
};

/* CONEXIÓN CON APPS SCRIPT */

async function solicitarDatos(tarjeta, accion) {

    const respuesta = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=UTF-8"
        },
        body: JSON.stringify({
            tarjeta: tarjeta,
            accion: accion
        }),
        redirect: "follow"
    });

    if (!respuesta.ok) {
        throw new Error("Error de conexión");
    }

    return await respuesta.json();
}

/* CONSULTAR PARTICIPANTE */

formConsulta.addEventListener("submit", async function(evento) {

    evento.preventDefault();

    if (procesando) return;

    const tarjeta = inputTarjeta.value.trim();

    limpiarMensaje();

    if (!/^\d+$/.test(tarjeta)) {
        mostrarMensaje(
            "Introduce un número de tarjeta válido.",
            "error"
        );
        return;
    }

    procesando = true;

    btnConsultar.disabled = true;
    inputTarjeta.disabled = true;
    btnConsultar.textContent = "CONSULTANDO...";

    try {

        const datos = await solicitarDatos(
            tarjeta,
            "consultar"
        );

        if (!datos.ok || !datos.encontrado) {

            mostrarMensaje(
                datos.mensaje || "Tarjeta no encontrada.",
                "error"
            );

            return;
        }

        tarjetaActual = tarjeta;

        mostrarParticipante(datos);

    } catch (error) {

        mostrarMensaje(
            "No fue posible conectar con el sistema. Intenta nuevamente.",
            "error"
        );

        console.error(error);

    } finally {

        procesando = false;
        btnConsultar.disabled = false;
        inputTarjeta.disabled = false;
        btnConsultar.textContent = "CONSULTAR";

    }

});

/* MOSTRAR PARTICIPANTE */

function mostrarParticipante(datos) {

    nombreParticipante.textContent = datos.nombre || "";

    departamentoParticipante.textContent =
        datos.departamento || "";

    const equipo = String(datos.equipo || "");

    if (datos.coordinador) {

        tituloEquipo.textContent = "STAFF COORDINADOR";

        numeroEquipo.textContent = equipo;

        numeroEquipo.style.fontSize = "30px";

        colorEquipo.textContent = datos.color || "";

    } else {

        tituloEquipo.textContent = "TU EQUIPO ES";

        numeroEquipo.textContent = equipo.padStart(2, "0");

        numeroEquipo.style.fontSize = "";

        colorEquipo.textContent = datos.color || "";

    }

    let color = String(datos.codigoColor || "").trim();

    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {

        color = coloresEquipos[equipo] || "#374151";

    }

    tarjetaEquipo.style.backgroundColor = color;

    tarjetaEquipo.style.color = obtenerContraste(color);

    actualizarAsistencia(datos);

    consulta.hidden = true;

    resultado.hidden = false;

}

/* CONTRASTE DEL TEXTO */

function obtenerContraste(hex) {

    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);

    const rgb = [r, g, b].map(function(valor) {

        valor = valor / 255;

        return valor <= 0.04045
            ? valor / 12.92
            : Math.pow((valor + 0.055) / 1.055, 2.4);

    });

    const luminosidad =
        0.2126 * rgb[0] +
        0.7152 * rgb[1] +
        0.0722 * rgb[2];

    return luminosidad > 0.179
        ? "#171717"
        : "#FFFFFF";

}

/* ESTADO DE ASISTENCIA */

function actualizarAsistencia(datos) {

    if (datos.asistencia) {

        estadoAsistencia.className = "registrado";

        estadoAsistencia.textContent =
            "✓ Asistencia registrada" +
            (datos.hora ? " — " + datos.hora : "");

        btnRegistrar.hidden = true;

    } else {

        estadoAsistencia.className = "pendiente";

        estadoAsistencia.textContent =
            "Asistencia pendiente de confirmar";

        btnRegistrar.hidden = false;

    }

}

/* REGISTRAR ASISTENCIA */

btnRegistrar.addEventListener("click", async function() {

    if (!tarjetaActual || procesando) return;

    procesando = true;

    btnRegistrar.disabled = true;
    btnNuevaConsulta.disabled = true;

    btnRegistrar.textContent = "REGISTRANDO...";

    try {

        const datos = await solicitarDatos(
            tarjetaActual,
            "registrar"
        );

        if (!datos.ok) {

            estadoAsistencia.className = "error";

            estadoAsistencia.textContent =
                datos.mensaje || "No se pudo registrar.";

            return;

        }

        actualizarAsistencia(datos);

        if (datos.duplicado) {

            estadoAsistencia.textContent =
                "✓ Tu asistencia ya estaba registrada" +
                (datos.hora ? " — " + datos.hora : "");

        }

    } catch (error) {

        estadoAsistencia.className = "error";

        estadoAsistencia.textContent =
            "Error de conexión. Intenta nuevamente.";

        console.error(error);

    } finally {

        procesando = false;

        btnRegistrar.disabled = false;
        btnNuevaConsulta.disabled = false;

        btnRegistrar.textContent = "CONFIRMAR ASISTENCIA";

    }

});

/* NUEVA CONSULTA */

btnNuevaConsulta.addEventListener("click", function() {

    if (procesando) return;

    tarjetaActual = "";

    inputTarjeta.value = "";

    nombreParticipante.textContent = "";
    departamentoParticipante.textContent = "";
    numeroEquipo.textContent = "";
    colorEquipo.textContent = "";
    estadoAsistencia.textContent = "";

    resultado.hidden = true;

    consulta.hidden = false;

    btnRegistrar.hidden = false;

    limpiarMensaje();

    inputTarjeta.focus();

});

/* MENSAJES DEL SISTEMA */

function mostrarMensaje(texto, tipo) {

    mensaje.textContent = texto;

    mensaje.className = tipo;

}

function limpiarMensaje() {

    mensaje.textContent = "";

    mensaje.className = "";

}
