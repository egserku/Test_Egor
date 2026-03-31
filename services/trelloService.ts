
import axios from 'axios';
import { Order, OrderSubtype } from '../types';

const TRELLO_KEY = process.env.TRELLO_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_LIST_ID = process.env.TRELLO_LIST_ID || 'Egor2_List_ID';

export async function createTrelloCard(order: Order) {
  // Заглушка для локального запуска: ничего наружу не отправляем.
  // Если в будущем нужно включить Trello обратно — уберите ранний return ниже.
  console.log(`[TRELLO STUB] Would create card for ${order.orderNumber} (${order.customer.name})`);
  return;

  if (!TRELLO_KEY || !TRELLO_TOKEN) {
    console.warn('Trello API keys missing, skipping card creation');
    return;
  }

  const itemsDetails = order.items.map(item => {
    let detail = `- ${item.quantity}x ${item.type} (${item.subtype}), Цвет: ${item.color}, Размер: ${item.size}`;
    
    if (item.fabric) detail += `, Ткань: ${item.fabric}`;

    if (item.subtype === OrderSubtype.TEAM && item.players && item.players.length > 0) {
      detail += `\n  **СПИСОК КОМАНДЫ (${item.players.length} чел.):**`;
      item.players.forEach(p => {
        detail += `\n  • ${p.name} | №${p.number} | ${p.size} | ${p.gender} | Рукав: ${p.sleeve}`;
      });
    } else if (item.subtype === OrderSubtype.SCHOOL && item.school) {
      detail += `\n  Школа: ${item.school}`;
    }
    
    if (item.printPlaces && item.printPlaces.length > 0) {
      detail += `\n  Места печати: ${item.printPlaces.join(', ')}`;
    }

    if (item.wishes) {
      detail += `\n  **ПОЖЕЛАНИЯ:** ${item.wishes}`;
    }
    
    return detail;
  }).join('\n\n');

  const description = `
**КЛИЕНТ:** ${order.customer.name}
**ТЕЛЕФОН:** ${order.customer.phone}
**EMAIL:** ${order.customer.email}
**АДРЕС:** ${order.customer.address || 'Не указан'}

---
**СОСТАВ ЗАКАЗА:**
${itemsDetails}

---
**КОММЕНТАРИЙ:** ${order.customer.comments || 'Нет'}
**ДАТА:** ${new Date(order.createdAt).toLocaleString()}
  `;

  try {
    await axios.post(`https://api.trello.com/1/cards`, null, {
      params: {
        idList: TRELLO_LIST_ID,
        key: TRELLO_KEY,
        token: TRELLO_TOKEN,
        name: `ЗАКАЗ ${order.orderNumber} - ${order.customer.name}`,
        desc: description,
        pos: 'top'
      }
    });
    console.log('Trello card created successfully');
  } catch (error) {
    console.error('Failed to create Trello card:', error);
  }
}
