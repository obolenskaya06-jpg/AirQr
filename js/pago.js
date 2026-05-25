const emailRegexValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar datos del localStorage y configurar UI
    const data = JSON.parse(localStorage.getItem('datosFactura')) || {};
    actualizarInterfaz(data);
    setupModalCorreo(data);

    // 2. Elementos del DOM
    const botonPagar = document.querySelector('.btn-pay');
    const modalQr = document.getElementById('modalQrPse');
    const btnCerrarQr = document.getElementById('btnCerrarQr');
    const btnDescargarQr = document.getElementById('btnDescargarQr');
    const btnConfirmarFinal = document.getElementById('btnConfirmarFinal');

    // 3. Lógica para abrir el QR
    if (botonPagar) {
        botonPagar.addEventListener('click', (e) => {
            e.preventDefault();
            if (validarFormulario()) {
                modalQr.style.display = 'flex';
            }
        });
    }

    // 4. Lógica para descargar la imagen del QR
    if (btnDescargarQr) {
        btnDescargarQr.addEventListener('click', () => {
            const rutaImagen = document.getElementById('qrImagenPago').src;
            const link = document.createElement('a');
            link.href = rutaImagen;
            link.download = 'QR_Pago_FacturePay.png'; 
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            alert("Imagen guardada. Ahora búscala en tu galería desde la app de tu banco al escanear QR.");
        });
    }

    // 5. Botones de cerrar y completar pago
    if (btnCerrarQr) {
        btnCerrarQr.addEventListener('click', () => {
            modalQr.style.display = 'none';
        });
    }
    
    if (btnConfirmarFinal) {
        btnConfirmarFinal.addEventListener('click', () => {
            alert("Gracias por su pago. En breve recibirá la confirmación en su correo.");
            window.location.href = "index.html"; 
        });
    }

    // Cerrar el modal al dar clic fuera de la caja
    window.addEventListener('click', (e) => {
        if (e.target === modalQr) {
            modalQr.style.display = 'none';
        }
    });
});

// Funciones Auxiliares
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
    
    const idsPrecios = ['lblValorNeto', 'lblValorTotal', 'lblTotalFinal'];
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