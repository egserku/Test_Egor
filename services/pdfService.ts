
// Fix: Explicitly import Buffer to resolve 'Cannot find name Buffer' TypeScript error.
import { Buffer } from 'buffer';
import PDFDocument from 'pdfkit';
import { Order, OrderSubtype } from '../types';

export async function generateOrderPDF(order: Order): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    // Header
    doc.fontSize(20).text('ЗАКАЗ - ' + order.orderNumber, { align: 'center' });
    doc.moveDown();

    // Status
    doc.fontSize(12).text(`Статус: ${order.status}`, { align: 'right' });
    doc.moveDown();

    // Customer Info
    doc.fontSize(14).text('Контактные данные клиента:', { underline: true });
    doc.fontSize(12).text(`Имя: ${order.customer.name}`);
    doc.text(`Телефон: ${order.customer.phone}`);
    doc.text(`Email: ${order.customer.email}`);
    if (order.customer.address) doc.text(`Адрес: ${order.customer.address}`);
    if (order.customer.comments) doc.text(`Комментарий: ${order.customer.comments}`);
    doc.moveDown();

    // Order Items
    doc.fontSize(14).text('Позиции заказа:', { underline: true });
    doc.moveDown(0.5);

    order.items.forEach((item, index) => {
      const displayType = item.type === 'TANK_TOP' ? 'Майка' : 
                          item.type === 'TSHIRT' ? 'Футболка' : 
                          item.type === 'HOODIE' ? 'Худи' : 'Шапка';

      doc.fontSize(12).text(`${index + 1}. ${displayType} [${item.subtype}]`);
      doc.fontSize(10);
      doc.text(`Цвет: ${item.color}`);
      if (item.fabric) doc.text(`Ткань: ${item.fabric}`);
      doc.text(`Размер: ${item.size}`);
      doc.text(`Количество: ${item.quantity}`);
      
      if (item.school) doc.text(`Школа: ${item.school}`);
      if (item.gender && item.subtype !== OrderSubtype.TEAM) doc.text(`Пол: ${item.gender}`);
      if (item.sleeve && item.subtype !== OrderSubtype.TEAM) doc.text(`Рукав: ${item.sleeve}`);
      if (item.hoodieType) doc.text(`Тип худи: ${item.hoodieType}`);
      if (item.capType) doc.text(`Тип шапки: ${item.capType}`);
      
      if (item.printPlaces && item.printPlaces.length > 0) {
        doc.text(`Места печати: ${item.printPlaces.join(', ')}`);
      }

      // Wishes inclusion
      if (item.wishes) {
        doc.moveDown(0.2);
        doc.fontSize(10).text('Пожелания:', { underline: true });
        doc.fontSize(10).text(item.wishes);
        doc.moveDown(0.2);
      }

      if (item.subtype === OrderSubtype.TEAM && item.players && item.players.length > 0) {
        doc.moveDown(0.2);
        doc.fontSize(11).text('СПИСОК ИГРОКОВ КОМАНДЫ:');
        doc.fontSize(10);
        item.players.forEach((p, pIdx) => {
          doc.text(`  ${pIdx + 1}. ${p.name} — №${p.number} — Разм: ${p.size} — ${p.gender} — Рукав: ${p.sleeve}`);
        });
      }
      
      doc.moveDown();
    });

    doc.fontSize(10).text(`Дата создания: ${new Date(order.createdAt).toLocaleString()}`, { align: 'right' });

    doc.end();
  });
}
