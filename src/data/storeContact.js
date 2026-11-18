/**
 * Datos de contacto y ubicación de la tienda.
 *
 * Se centralizan aquí para que el footer, el formulario de contacto y el modal
 * de la tienda física muestren siempre la misma información. El enlace de
 * WhatsApp ya incluye el saludo navideño codificado.
 */
export const STORE_CONTACT = {
  phoneDisplay: '+51 953 409 257',
  phoneDigits: '51953409257',
  whatsappUrl:
    'https://wa.me/51953409257?text=Hola%20Mi%20Jugueter%C3%ADa,%20quisiera%20consultar%20sobre%20un%20regalo%20de%20Navidad',
  email: 'hola@mijugueteria.pe',
  address: 'Av. Navidad 1225, Lima, Perú',
  mapsEmbedUrl:
    'https://www.google.com/maps?q=Av.%20Navidad%201225%2C%20Lima%2C%20Per%C3%BA&z=15&output=embed',
  mapsLink:
    'https://www.google.com/maps/search/?api=1&query=Av.%20Navidad%201225%2C%20Lima%2C%20Per%C3%BA',
  references: [
    'A 5 minutos caminando de la estación Los Héroes (Línea 1 del Metro de Lima).',
    'A dos cuadras del óvalo principal, junto a la plaza de juegos.',
    'Estacionamiento gratuito para clientes por 2 horas.',
  ],
  hours: [
    { day: 'Lunes a viernes', time: '9:00 a 20:00' },
    { day: 'Sábados', time: '9:00 a 18:00' },
    { day: 'Domingos', time: '9:00 a 13:00' },
    { day: '24 de diciembre', time: '9:00 a 14:00' },
    { day: '25 de diciembre', time: 'Cerrado' },
  ],
}
