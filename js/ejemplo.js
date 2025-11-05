'use strict';

let db = null; // Base de datos, inicialmente vacía

// Abrimos la base de datos
const solicitud = indexedDB.open('librosDB', 1);

// Creamos la estructura de la base de datos
solicitud.onupgradeneeded = function (evento) {
  const db = evento.target.result;
  const almacenLibros = db.createObjectStore('libros', { keyPath: 'id', autoIncrement: true });
  almacenLibros.createIndex('precio_indice', 'precio', { unique: false });
};

// Guardamos la referencia a la base de datos creada
solicitud.onsuccess = function (evento) {
  db = evento.target.result;

  // Agregamos los libros (Indico el ID para que no se agreguen cada vez que recargo la página)
  agregarLibro({
    id: 1,
    titulo: 'Building Front-End Web Apps with Plain JavaScript',
    precio: 19.95,
  });
  agregarLibro({
    id: 2,
    titulo: 'Learning JavaScript Design Patterns: A JavaScript and Jquery Developer\'s Guide',
    precio: 39.19,
  });
  agregarLibro({
    id: 3,
    titulo: 'You Don\'t Know JS',
    precio: 26.22,
  });
  agregarLibro({
    id: 4,
    titulo: 'Eloquent JavaScript, 3rd Edition: A Modern Introduction to Programming',
    precio: 26.22,
  });
};

// Agregamos eventos
document.querySelector('#agregar').addEventListener('click', () => {
  // Creamos el libro con los datos que nos ingrese el usuario
  const libroNuevo = {
    titulo: prompt('Ingrese el título del libro'),
    precio: +prompt('Ingrese el precio'),
  };

  // Lo guardamos en la base de datos
  agregarLibro(libroNuevo);
});

document.querySelector('#obtener').addEventListener('click', obtenerLibros);
document
  .querySelector('#obtenerPrecio')
  .addEventListener('click', () => obtenerLibrosPorPrecio(+prompt('Ingrese el precio de los libros a buscar')));
document
  .querySelector('#eliminar')
  .addEventListener('click', () => eliminarLibro(+prompt('Ingrese el ID del libro a eliminar:')));

// Funciones
function agregarLibro (libro) {
  if (db === null) return; // Salimos si no tenemos una base de datos

  const transaccion = db.transaction('libros', 'readwrite');
  const libros = transaccion.objectStore('libros');
  const solicitudAgregar = libros.add(libro);
  solicitudAgregar.onsuccess = function () {
    console.log(`Se agregó con éxito el libro: ${libro.titulo}`);
  };
}

function obtenerLibros () {
  if (db === null) return; // Salimos si no tenemos una base de datos

  const transaccion = db.transaction('libros', 'readonly');
  const libros = transaccion.objectStore('libros');
  libros.getAll().onsuccess = function (evento) {
    console.log('Los libros son:', evento.target.result);
  };
}

function obtenerLibrosPorPrecio (precio) {
  if (db === null) return; // Salimos si no tenemos una base de datos

  const transaccion = db.transaction('libros', 'readonly');
  const libros = transaccion.objectStore('libros');
  const precioIndice = libros.index('precio_indice');

  precioIndice.getAll(precio).onsuccess = function (evento) {
    console.log(`Los libros con un precio igual a ${precio} son:`, evento.target.result);
  };
}

function eliminarLibro (id) {
  if (db === null) return; // Salimos si no tenemos una base de datos

  const transaccion = db.transaction('libros', 'readwrite');
  const libros = transaccion.objectStore('libros');

  libros.delete(id).onsuccess = function () {
    console.log(`Libro con el ID ${id} eliminado con éxito`);
  };
}