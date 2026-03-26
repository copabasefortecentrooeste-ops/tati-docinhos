import type { Order } from '@/types';
import { formatPrice } from '@/lib/format';

const paymentLabel: Record<string, string> = {
  pix:       'PIX',
  dinheiro:  'Dinheiro',
  cartao:    'Cartão',
  fiado:     'Fiado',
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));
}

export function printOrder(order: Order, storeName: string) {
  const items = order.items
    .map((i) => {
      const opts = Object.values(i.selectedOptions).filter(Boolean).join(', ');
      const line = `${i.quantity}× ${i.product.name}${opts ? ` (${opts})` : ''}`;
      return line;
    });

  const itemRows = order.items
    .map((i) => {
      const opts = Object.values(i.selectedOptions).filter(Boolean).join(', ');
      return `<tr>
        <td style="padding:3px 6px;border-bottom:1px solid #eee">${i.quantity}×</td>
        <td style="padding:3px 6px;border-bottom:1px solid #eee">${i.product.name}${opts ? `<br><small style="color:#666">${opts}</small>` : ''}${i.notes ? `<br><small style="color:#888">Obs: ${i.notes}</small>` : ''}</td>
        <td style="padding:3px 6px;border-bottom:1px solid #eee;text-align:right">${formatPrice(i.unitPrice * i.quantity)}</td>
      </tr>`;
    }).join('');

  const deliveryAddr = order.isPickup
    ? '<b>RETIRADA NO LOCAL</b>'
    : [
        order.customer.address,
        order.customer.neighborhood,
        order.customer.reference ? `Ref: ${order.customer.reference}` : '',
        order.city ? `${order.city} - ${order.state}` : '',
        order.cep ? `CEP: ${order.cep}` : '',
      ].filter(Boolean).join('<br>');

  const scheduling = (order.scheduledDate && order.scheduledTime)
    ? `<p><b>Agendado:</b> ${order.scheduledDate} às ${order.scheduledTime}</p>`
    : '';

  const change = order.paymentMethod === 'dinheiro' && order.changeFor
    ? `<p><b>Troco para:</b> ${formatPrice(order.changeFor)}</p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Pedido ${order.code}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', monospace; font-size: 12px; color: #111; }
  .slip { width: 72mm; padding: 8mm; page-break-after: always; }
  .slip:last-child { page-break-after: auto; }
  h2 { font-size: 14px; margin-bottom: 4px; }
  h3 { font-size: 11px; font-weight: normal; color: #555; margin-bottom: 8px; }
  .divider { border: none; border-top: 1px dashed #aaa; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; }
  .total-row { font-weight: bold; }
  @media print {
    @page { size: 72mm auto; margin: 0; }
    body { margin: 0; }
  }
</style>
</head>
<body>

<!-- ═══════ BALCÃO ═══════ -->
<div class="slip">
  <h2>${storeName}</h2>
  <h3>VIA DO BALCÃO</h3>
  <hr class="divider">
  <p><b>Pedido:</b> #${order.code}</p>
  <p><b>Data:</b> ${formatDate(order.createdAt)}</p>
  <p><b>Cliente:</b> ${order.customer.name}</p>
  <p><b>Tel:</b> ${order.customer.phone}</p>
  ${scheduling}
  <hr class="divider">
  <table>
    ${itemRows}
    <tr><td colspan="2" style="padding:4px 6px;padding-top:8px">Subtotal</td><td style="text-align:right;padding:4px 6px;padding-top:8px">${formatPrice(order.subtotal)}</td></tr>
    ${order.discount > 0 ? `<tr><td colspan="2" style="padding:2px 6px">Desconto${order.couponCode ? ` (${order.couponCode})` : ''}</td><td style="text-align:right;padding:2px 6px;color:#c00">-${formatPrice(order.discount)}</td></tr>` : ''}
    ${order.deliveryFee > 0 ? `<tr><td colspan="2" style="padding:2px 6px">Entrega</td><td style="text-align:right;padding:2px 6px">${formatPrice(order.deliveryFee)}</td></tr>` : ''}
    <tr class="total-row"><td colspan="2" style="padding:4px 6px;border-top:1px solid #111">TOTAL</td><td style="text-align:right;padding:4px 6px;border-top:1px solid #111">${formatPrice(order.total)}</td></tr>
  </table>
  <hr class="divider">
  <p><b>Pagamento:</b> ${paymentLabel[order.paymentMethod] ?? order.paymentMethod}</p>
  ${change}
  <hr class="divider">
  <p><b>Entrega:</b></p>
  <p>${deliveryAddr}</p>
</div>

<!-- ═══════ COZINHA ═══════ -->
<div class="slip">
  <h2>COZINHA</h2>
  <h3>VIA DA PRODUÇÃO</h3>
  <hr class="divider">
  <p><b>#${order.code}</b> — ${order.isPickup ? 'RETIRADA' : 'ENTREGA'}</p>
  ${scheduling}
  <hr class="divider">
  <ul style="list-style:none;padding:0">
    ${items.map((l) => `<li style="padding:3px 0;border-bottom:1px dotted #ccc;font-size:13px">${l}</li>`).join('')}
  </ul>
  ${order.items.some(i => i.notes) ? `<hr class="divider"><p><b>Observações:</b></p>${order.items.filter(i => i.notes).map(i => `<p>• ${i.product.name}: ${i.notes}</p>`).join('')}` : ''}
</div>

<!-- ═══════ ENTREGADOR ═══════ -->
${!order.isPickup ? `
<div class="slip">
  <h2>ENTREGADOR</h2>
  <h3>VIA DA ENTREGA</h3>
  <hr class="divider">
  <p><b>#${order.code}</b></p>
  <p><b>Cliente:</b> ${order.customer.name}</p>
  <p><b>Tel:</b> ${order.customer.phone}</p>
  ${scheduling}
  <hr class="divider">
  <p><b>Endereço:</b></p>
  <p>${deliveryAddr}</p>
  <hr class="divider">
  <p><b>Itens:</b> ${order.items.map(i => `${i.quantity}× ${i.product.name}`).join(', ')}</p>
  <hr class="divider">
  <p><b>Total a cobrar:</b> ${formatPrice(order.total)}</p>
  <p><b>Pagamento:</b> ${paymentLabel[order.paymentMethod] ?? order.paymentMethod}</p>
  ${change}
</div>
` : ''}

</body>
</html>`;

  const win = window.open('', '_blank', 'width=400,height=700,scrollbars=yes');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  // Small delay to let images/fonts load before print dialog
  setTimeout(() => {
    win.print();
    win.close();
  }, 300);
}
