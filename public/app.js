const $ = (selector) => document.querySelector(selector);
const form = $('#product-form');
const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
const count = new Intl.NumberFormat('es-PE');
let productos = [];
let editingId = null;
let pendingDelete = null;
let busy = false;
let loading = false;
let loadFailed = false;

function notify(message, error = false) {
  $('#notice').textContent = message;
  $('#notice').classList.toggle('error', error);
  $('#notice').hidden = false;
}

async function api(url = '', options = {}) {
  let response;
  try {
    response = await fetch(`/api/productos${url}`, {
      ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Comprueba que la aplicación esté en ejecución.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'No se pudo completar la operación. Inténtalo de nuevo.');
  if (data === null) throw new Error('El servidor envió una respuesta inesperada.');
  return data;
}

function render() {
  const term = $('#search').value.trim().toLocaleLowerCase('es');
  const visible = productos.filter((p) => `${p.nombre} ${p.descripcion || ''}`.toLocaleLowerCase('es').includes(term));
  $('#product-list').replaceChildren();
  for (const producto of visible) {
    const row = $('#product-row').content.cloneNode(true);
    row.querySelector('.product-name').textContent = producto.nombre;
    const description = row.querySelector('.product-description');
    description.textContent = producto.descripcion || `Producto #${producto.id}`;
    description.title = producto.descripcion || '';
    row.querySelector('.product-price').textContent = money.format(Number(producto.precio));
    const stock = row.querySelector('.stock-badge');
    stock.textContent = producto.stock === 0 ? 'Sin stock' : `${count.format(producto.stock)} uds.`;
    stock.classList.toggle('no-stock', producto.stock === 0);
    const edit = row.querySelector('.edit-product');
    edit.setAttribute('aria-label', `Editar ${producto.nombre}`);
    edit.title = 'Editar producto';
    edit.disabled = busy;
    edit.addEventListener('click', () => editProduct(producto));
    const remove = row.querySelector('.delete-product');
    remove.setAttribute('aria-label', `Eliminar ${producto.nombre}`);
    remove.title = 'Eliminar producto';
    remove.disabled = busy;
    remove.addEventListener('click', () => {
      pendingDelete = producto;
      $('#delete-description').textContent = `Vas a eliminar «${producto.nombre}».`;
      $('#delete-dialog').showModal();
    });
    $('#product-list').append(row);
  }
  $('#empty').hidden = visible.length > 0;
  $('#empty-title').textContent = loadFailed ? 'No pudimos cargar el inventario' : term ? 'Sin coincidencias' : 'Tu inventario empieza aquí';
  $('#empty-text').textContent = loadFailed ? 'Comprueba MySQL en XAMPP y pulsa actualizar para volver a intentarlo.' : term ? 'Prueba con otro nombre o descripción.' : 'Registra tu primer producto con el formulario. Aparecerá aquí al guardarlo.';
  $('#product-count').textContent = count.format(productos.length);
  $('#total-products').textContent = loadFailed ? '—' : count.format(productos.length);
  $('#total-stock').textContent = loadFailed ? '—' : count.format(productos.reduce((sum, p) => sum + p.stock, 0));
  $('#total-value').textContent = loadFailed ? '—' : money.format(productos.reduce((sum, p) => sum + Number(p.precio) * p.stock, 0));
  $('#list-caption').textContent = loadFailed ? 'Inventario no disponible' : `${count.format(visible.length)} de ${count.format(productos.length)} productos`;
}

async function loadProducts() {
  if (loading) return;
  loading = true;
  $('#reload').disabled = true;
  try {
    productos = await api();
    loadFailed = false;
    $('#connection').className = 'connection online';
    $('#connection').replaceChildren(document.createElement('i'), document.createTextNode('Conectado'));
    return true;
  } catch (error) {
    productos = [];
    loadFailed = true;
    $('#connection').className = 'connection offline';
    $('#connection').replaceChildren(document.createElement('i'), document.createTextNode('Sin conexión'));
    notify(error.message, true);
    return false;
  } finally {
    loading = false;
    $('#reload').disabled = false;
    render();
  }
}

function resetForm(focus = false) {
  editingId = null;
  form.reset();
  $('#form-title').textContent = 'Nuevo producto';
  $('#form-eyebrow').textContent = 'AÑADIR AL CATÁLOGO';
  $('#form-description').textContent = 'Completa los datos para registrarlo.';
  $('#save-label').textContent = 'Guardar producto';
  $('#cancel-edit').hidden = true;
  if (focus) $('#nombre').focus();
}

function editProduct(producto) {
  if (busy) return;
  editingId = producto.id;
  $('#nombre').value = producto.nombre;
  $('#descripcion').value = producto.descripcion || '';
  $('#precio').value = producto.precio;
  $('#stock').value = producto.stock;
  $('#form-title').textContent = 'Editar producto';
  $('#form-eyebrow').textContent = `PRODUCTO #${producto.id}`;
  $('#form-description').textContent = 'Actualiza los datos de este producto.';
  $('#save-label').textContent = 'Guardar cambios';
  $('#cancel-edit').hidden = false;
  $('#notice').hidden = true;
  $('#nombre').focus();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy || !form.reportValidity()) return;
  const nombre = $('#nombre').value.trim();
  if (!nombre) { notify('Escribe un nombre para el producto.', true); $('#nombre').focus(); return; }
  const descripcion = $('#descripcion').value.trim();
  if (new TextEncoder().encode(descripcion).length > 65535) { notify('La descripción es demasiado larga.', true); return; }
  const data = { nombre, descripcion: descripcion || null, precio: Number($('#precio').value), stock: Number($('#stock').value) };
  const updating = editingId !== null;
  busy = true;
  $('#product-fields').disabled = true;
  $('#new-product').disabled = true;
  $('#save-label').textContent = 'Guardando…';
  render();
  try {
    await api(updating ? `/${editingId}` : '', { method: updating ? 'PUT' : 'POST', body: JSON.stringify(data) });
    resetForm();
    notify(updating ? 'Los cambios se guardaron correctamente.' : `«${nombre}» se registró correctamente.`);
    await loadProducts();
  } catch (error) {
    notify(error.message, true);
  } finally {
    busy = false;
    $('#product-fields').disabled = false;
    $('#new-product').disabled = false;
    $('#save-label').textContent = editingId === null ? 'Guardar producto' : 'Guardar cambios';
    render();
  }
});

$('#confirm-delete').addEventListener('click', async () => {
  if (!pendingDelete || busy) return;
  const producto = pendingDelete;
  busy = true;
  $('#confirm-delete').disabled = true;
  $('#cancel-delete').disabled = true;
  $('#confirm-delete').textContent = 'Eliminando…';
  try {
    await api(`/${producto.id}`, { method: 'DELETE' });
    if (editingId === producto.id) resetForm();
    $('#delete-dialog').close();
    notify(`«${producto.nombre}» se eliminó del inventario.`);
    await loadProducts();
  } catch (error) {
    $('#delete-dialog').close();
    notify(error.message, true);
  } finally {
    pendingDelete = null;
    busy = false;
    $('#confirm-delete').disabled = false;
    $('#cancel-delete').disabled = false;
    $('#confirm-delete').textContent = 'Eliminar producto';
    render();
  }
});
$('#delete-dialog').addEventListener('cancel', (event) => { if (busy) event.preventDefault(); });
$('#cancel-delete').addEventListener('click', () => { pendingDelete = null; $('#delete-dialog').close(); });
$('#new-product').addEventListener('click', () => { if (!busy) { resetForm(true); $('#notice').hidden = true; } });
$('#cancel-edit').addEventListener('click', () => resetForm(true));
$('#search').addEventListener('input', render);
$('#reload').addEventListener('click', async () => { $('#notice').hidden = true; await loadProducts(); });
loadProducts();
