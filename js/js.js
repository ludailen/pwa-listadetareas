'use strict';

/***************************SERVICE WORKER***************************/
//Verifico si el navegador soporta el ServiceWorker. Si sí, lo registro y obtengo el resultado
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(() => {
            console.log('SW registrado');
        }).catch(() => {
            console.log('Falló el registro del SW');
        }
        );
} else {
    console.log('Navegador no compatible con Service Worker');
}

/***************************INDEXEDDB***************************/
let bd = null;
const BD_NOMBRE = 'bd_tareas';
const solicitudApertura = indexedDB.open(BD_NOMBRE, 1);
const TAREA_ALMACEN = 'tareas';
const INDEX_ESTADO = 'estado';
const tarea = {
    tarea: '',
    estado: 'pendiente'
}

solicitudApertura.addEventListener('error', () => { // escuchamos el resultado error de la solicitud de apertura
    notificar('Hubo un error al obtener la información');
});
solicitudApertura.addEventListener('upgradeneeded', (evento) => { // resultado upgradeneeded de la solicitud de apertura
    console.log('La base de datos está siendo creada');
    const bd_enCurso = evento.target.result; //obtengo la referencia de la bd que se está creando o actualizando
    const almacenTareas = bd_enCurso.createObjectStore(TAREA_ALMACEN, { // se crea el almacén 'tareas' con clave única 'id' cuyo valor incrementa de forma automática
        keyPath: 'id_tarea',
        autoIncrement: true
    });

    almacenTareas.createIndex(INDEX_ESTADO, 'estado', { unique: false });

});
solicitudApertura.addEventListener('success', (evento) => { //resultado success de la solicitud de apertura
    bd = evento.target.result;
    console.log('La base de datos se creó correctamente', bd);
    mostrarTarea();
});

/***************************MANEJO DE TAREAS***************************/
document.querySelector("#agregar-tarea").addEventListener("click", ingresarTarea);

function ingresarTarea() {
    const $modal = crearEtiqueta("dialog");
    const $divContenido = crearEtiqueta("div", "", { class: "contenidoModal" });
    const $divBtn = crearEtiqueta("div", "", { class: "btnModal" });
    const $cerrarModal = crearEtiqueta("button", "Cancelar", { type: "button", class: 'botonGris' });
    const $form = crearEtiqueta("form");
    const $label = crearEtiqueta("label", "Ingrese una tarea", { for: "tarea" });
    const $input = crearEtiqueta("input", "", { type: "text", id: "tarea", maxlength: "150", autocomplete: "off" });
    const $spanError = crearEtiqueta('span', '', { class: 'error' });
    const $btnConfirmar = crearEtiqueta("input", "", { type: 'submit', value: 'Confirmar', id: 'btnConfirmar', class: 'botonVerde' });

    document.body.prepend($modal);
    $modal.append($form);
    $modal.showModal();
    $form.append($divContenido, $divBtn);
    $divContenido.append($label, $input, $spanError);
    $divBtn.append($cerrarModal, $btnConfirmar);

    $input.focus();

    //escucho el evento 'submit' del formulario y valido la entrada del input
    $form.addEventListener("submit", (evento) => {
        evento.preventDefault();
        //si validarInput es false, 'finaliza' ahí. sino, se agrega la tarea al almacén
        if (!validarInput($input, $spanError)) return;
        agregarTarea($input.value);
        $input.value = "";
        $input.focus();
        mostrarTarea();
        $modal.close();
        $modal.remove();
    });

    $cerrarModal.addEventListener('click', () => {
        $modal.close();
        $modal.remove();
    });

}

function validarInput($input, $spanError) {
    //si el input está vacío, muestro un mensaje de error y retorno false
    if ($input.value.trim() === '') {
        $spanError.textContent = 'Debes ingresar una tarea';
        $input.value = '';
        $input.focus();
        return false;
    }
    //caso contrario, retorno true
    $spanError.textContent = '';
    return true;
}

function mostrarTarea() {
    const $pendientes = document.querySelector(".pendientes");
    const $completadas = document.querySelector(".completadas");

    $pendientes.innerHTML = "";
    $completadas.innerHTML = "";

    const transaccion = bd.transaction(TAREA_ALMACEN, 'readonly');
    const almacen = transaccion.objectStore(TAREA_ALMACEN);
    const tareas_almacen = almacen.getAll();

    tareas_almacen.addEventListener('success', (e) => {
        //acceso al valor buscado:
        const tareasEncontradas = e.target.result;

        //por cada tarea, genero elementos y los agrego al HTML para poder mostrar la información
        for (const tarea of tareasEncontradas) {
            const $li = crearEtiqueta("li", "", { "data-id": `${tarea.id_tarea}`, class: 'listaFlex' });
            const $checkbox = crearEtiqueta("input", "", { type: "checkbox", id: `tarea-${tarea.id_tarea}`, class: 'form-check-input' });
            const $label = crearEtiqueta("label", tarea.tarea, { for: `tarea-${tarea.id_tarea}` });
            const $btnEliminar = crearEtiqueta('button', '', { id: 'boton-eliminar', 'aria-label': `Eliminar tarea '${tarea.tarea}'`, "data-id": `${tarea.id_tarea}` });
            const $iconoEliminar = crearEtiqueta('img', '', { src: 'assets/icon/eliminar.png', alt: 'Icono de Eliminar' });
            const $contenedorLabel = crearEtiqueta('div', '', { class: 'divLabel' });
            const $contenedorOpciones = crearEtiqueta('div', '', { class: 'divOpciones' });

            $pendientes.append($li);
            $btnEliminar.append($iconoEliminar);
            $li.append($contenedorLabel, $contenedorOpciones);
            $contenedorLabel.append($label);
            $contenedorOpciones.append($checkbox, $btnEliminar);

            function actualizarEstado() {
                if (tarea.estado === "completada") {
                    $checkbox.checked = true;
                    $label.setAttribute("class", "tareaCompleta");
                    $completadas.append($li);
                } else {
                    $label.removeAttribute("class");
                    $pendientes.append($li);
                }
            }

            actualizarEstado();

            // a partir del evento click del checkbox validamos el estado de la tarea para definir en qué contenedor tiene que mostrarse
            $checkbox.addEventListener('click', () => {
                tarea.estado = $checkbox.checked ? "completada" : "pendiente";
                actualizarEstado();
                actualizarTarea(tarea);
                validarExistencia();
            });
            $btnEliminar.addEventListener('click', eliminarTarea);
        }

        //valido existencia de las tareas para definir qué título corresponde mostrar
        validarExistencia();
    });

    tareas_almacen.addEventListener('error', () => {
        console.error('El ID buscado no existe en el almacén');
    })
}

function actualizarTarea(tarea) {
    const transaccion = bd.transaction(TAREA_ALMACEN, 'readwrite');
    const almacen = transaccion.objectStore(TAREA_ALMACEN);
    const actualizar_tarea = almacen.put(tarea);

    actualizar_tarea.addEventListener('success', () => {
        console.log(`Estado de la tarea "${tarea.tarea}" actualizado a ${tarea.estado}`);
    });

    actualizar_tarea.addEventListener('error', (e) => {
        console.error('Error al actualizar la tarea:', e.target.error);
    });
}

function validarExistencia() {
    const $contCompletas = document.querySelector(".contenedor-completas");
    const $contPendientes = document.querySelector(".contenedor-pendientes");

    const $h2 = crearEtiqueta('h2', 'Tareas Pendientes', { id: 'h2-pendientes' });
    const $h3 = crearEtiqueta('h3', 'Tareas Completas', { id: 'h3-completas' });

    const $existeh2 = document.querySelector('#h2-pendientes');
    const $existeh3 = document.querySelector('#h3-completas');

    const transaccion = bd.transaction(TAREA_ALMACEN, 'readonly');
    const almacen = transaccion.objectStore(TAREA_ALMACEN);
    const indexEstado = almacen.index('estado');
    const busquedaPendientes = indexEstado.getAll('pendiente');
    const busquedaCompletas = indexEstado.getAll('completada');

    busquedaPendientes.addEventListener('success', (evento) => {
        const pendienteEncontrado = evento.target.result;

        if (pendienteEncontrado.length > 0) {
            if (!$existeh2) {
                $contPendientes.prepend($h2);
            }
        } else if ($existeh2) {
            $existeh2.remove();
        }
    });
    busquedaPendientes.addEventListener('error', () => {
        console.log('No se encontraron tareas pendientes');
    });

    busquedaCompletas.addEventListener('success', (evento) => {
        const completaEncontrado = evento.target.result;
        if (completaEncontrado.length > 0) {
            if (!$existeh3) {
                $contCompletas.prepend($h3);
            }
        } else if ($existeh3) {
            $existeh3.remove();
        }
    });
    busquedaCompletas.addEventListener('error', () => {
        console.log('No se encontraron tareas completas');
    });

}

function agregarTarea($input) {
    if (bd === null) return;

    tarea.tarea = $input;

    const transaccion = bd.transaction(TAREA_ALMACEN, 'readwrite');
    const almacen = transaccion.objectStore(TAREA_ALMACEN);
    const agregar_almacen = almacen.add(tarea);
    agregar_almacen.addEventListener('success', () => {
        console.log('La tarea se creó correctamente');
    })
    agregar_almacen.addEventListener('error', () => {
        console.error('La tarea no se pudo crear');
    })
}

function eliminarTarea(evento) {
    //obtengo el id de la tarea clickeada
    const $itemId = +evento.currentTarget.dataset.id;

    const $modalEliminar = crearEtiqueta('dialog');
    const $contenido = crearEtiqueta('div', '', { class: 'contenidoModal' });
    const $mensaje = crearEtiqueta('p', `¿Seguro que querés eliminar la tarea "${tarea.tarea}"?`, { class: 'txtCentrado' });
    const $divBotones = crearEtiqueta('div', '', { class: 'btnModal' });
    const $btnCancelar = crearEtiqueta('button', 'Cancelar', { type: 'button', class: 'botonVerde' });
    const $btnConfirmar = crearEtiqueta('button', 'Eliminar', { type: 'button', class: 'botonGris' });

    $divBotones.append($btnCancelar, $btnConfirmar);
    $contenido.append($mensaje);
    $modalEliminar.append($contenido, $divBotones);
    document.body.prepend($modalEliminar);

    $modalEliminar.showModal();

    $btnCancelar.addEventListener('click', () => {
        $modalEliminar.close();
        $modalEliminar.remove();
    })

    $btnConfirmar.addEventListener('click', () => {
        const transaccion = bd.transaction(TAREA_ALMACEN, 'readwrite');
        const almacen = transaccion.objectStore(TAREA_ALMACEN);
        const solicitudEliminar = almacen.delete($itemId);

        solicitudEliminar.addEventListener('success', (e) => {
            console.log('se eliminó correctamente la tarea: ', $itemId);
            mostrarTarea();
            $modalEliminar.close();
            $modalEliminar.remove();
        });

        solicitudEliminar.addEventListener('error', () => {
            console.error('El ID buscado no existe en el almacén');
        })
    });
}

function crearEtiqueta(elemento, contenido = '', atributos = {}) {
    const etiqueta = document.createElement(elemento);

    if (contenido) {
        etiqueta.textContent = contenido;
    };

    for (const [atributo, valor] of Object.entries(atributos)) {
        // convertimos el objeto atributos en un array para poder recorrerlo, acceder a cada clave-valor y asignarselo al elemento creado
        etiqueta.setAttribute(atributo, valor);
    }
    return etiqueta;
}

/***************************MANEJO DE INSTALACIÓN***************************/
const $contenedor = document.querySelector('.contenedor-iconos');
const $btnInstalar = crearEtiqueta('button', '', { 'aria-label': 'Descargar Aplicación', class: 'btnCompartir', hidden: '' })
const $imgInstalar = crearEtiqueta('img', '', { src: 'assets/icon/descargas.png', alt: 'Ícono para descargar aplicación' })

$contenedor.append($btnInstalar);
$btnInstalar.append($imgInstalar);

//mostramos el botón de instalación solo si el navegador es compatible
window.addEventListener('beforeinstallprompt', (eventoInstalacion) => {
    eventoInstalacion.preventDefault();

    $btnInstalar.removeAttribute('hidden');

    $btnInstalar.addEventListener('click', () => {
        eventoInstalacion.prompt()
            .then((resultado) => {
                if (resultado.outcome === 'accepted') {
                    notificar('La aplicación se instaló correctamente', true);
                } else {
                    notificar('No se logró instalar la aplicación');
                }
                $btnInstalar.remove();
            })

    });

})

/***************************FUNCIÓN NOTIFICAR***************************/
const $spanAviso = document.querySelector('#aviso-conexion');
const $p = crearEtiqueta('p', '', { class: 'p-aviso' });

function notificar(texto = '', exito = false) {
    if (texto) {
        $p.textContent = texto;
        if (exito) {
            $spanAviso.setAttribute('class', 'botonVerde');
        } else {
            $spanAviso.setAttribute('class', 'botonGris');
        }
        $spanAviso.prepend($p);
        setTimeout(() => $p.remove(), 4000);
    }
}

/***************************VALIDAR CONEXIÓN***************************/
if (!navigator.onLine) {
    notificar('Perdiste la conexión');
}

//escuchamos los eventos online y offline del navegador para saber cuándo cambia el estado de la conexión
window.addEventListener('online', () => { notificar('Recuperaste la conexión', true) });
window.addEventListener('offline', () => { notificar('Perdiste la conexión') });


/***************************COMPARTIR***************************/
if (navigator.share) {
    const $contenedor = document.querySelector('.contenedor-iconos');
    const $button = crearEtiqueta('button', '', { 'aria-label': 'Compartir lista de tareas', class: 'btnCompartir' })
    const $img = crearEtiqueta('img', '', { src: 'assets/icon/compartir.png', alt: 'Ícono para compartir lista de tareas' })

    $contenedor.append($button);
    $button.append($img);

    $button.addEventListener('click', () => {
        const transaccion = bd.transaction(TAREA_ALMACEN, 'readonly');
        const almacen = transaccion.objectStore(TAREA_ALMACEN);
        const solicitud = almacen.getAll();

        solicitud.addEventListener('success', (evento) => {
            const tareas_almacen = evento.target.result;

            const arrayTareas = tareas_almacen.map((tarea) => {
                return `- Tarea: ${tarea.tarea}, estado: ${tarea.estado}`;
            }).join('\n');

            if (arrayTareas.length > 0) {
                const objetoShare = {
                    title: '¡Mirá mi lista de tareas!',
                    text: arrayTareas,
                }

                navigator.share(objetoShare)
                    .then(() => {
                        console.log('compartido correctamente');
                        notificar('Se compartió correctamente', true);
                    })
                    .catch(() => {
                        console.log('f, no se pudo compartir');
                        notificar('Hubo un error al compartir');
                    });
            } else {
                notificar('No hay tareas para compartir');
            }
        });
        solicitud.addEventListener('error', () => {
            notificar('Hubo un error al intentar compartir');
        });
    })
} else {
    console.log('El navegador no es compatible con la API Share');
}

/***************************VALIDAR NOTIFICACIONES***************************/
// validar si el navegador soporta notificaciones
if ('Notification' in window && 'serviceWorker' in navigator) {
    console.log('Notificaciones soportadas');

    const $contenedor = document.querySelector('.contenedor-iconos');
    const $button = crearEtiqueta('button', '', { 'aria-label': 'Activar notificaciones', class: 'btnCompartir' });
    const $img = crearEtiqueta('img', '', { src: 'assets/icon/notificacion.png', alt: 'Ícono para activar notificaciones' });

    if (Notification.permission === 'granted') {
        console.log('Ya existe acceso a las notificaciones');
    } else if (Notification.permission === 'denied') {
        console.log('El acceso a las notificaciones ha sido denegado');
    } else {
        $contenedor.append($button);
        $button.append($img);
        $button.addEventListener('click', () => {
            Notification.requestPermission()
                .then((permiso) => {
                    if (permiso === 'granted') {
                        notificar('¡Gracias! Empezarás a recibir notificaciones', true)
                        $button.remove();
                    } else if (permiso === 'denied') {
                        notificar('No recibirás notificaciones')
                        $button.remove();
                    } else {
                        console.log('El usuario no tomó ninguna decisión');
                    }
                });
        });
    }
} else {
    console.log('Notificaciones no soportadas');
}




