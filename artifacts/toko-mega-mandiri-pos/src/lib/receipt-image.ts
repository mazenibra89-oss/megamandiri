import type { Transaction } from './db';
import { formatIDR } from './utils';

const drawCentered = (
  context: CanvasRenderingContext2D,
  text: string,
  y: number,
  font: string,
) => {
  context.font = font;
  context.textAlign = 'center';
  context.fillText(text, 360, y);
};

const drawDashedLine = (context: CanvasRenderingContext2D, y: number) => {
  context.save();
  context.setLineDash([10, 8]);
  context.strokeStyle = '#94a3b8';
  context.beginPath();
  context.moveTo(48, y);
  context.lineTo(672, y);
  context.stroke();
  context.restore();
};

export async function createReceiptImage(transaction: Transaction) {
  const itemHeight = transaction.items.length * 64;
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 710 + itemHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas tidak tersedia');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#0f172a';

  drawCentered(context, 'TOKO MEGA MANDIRI', 70, '700 30px Arial');
  drawCentered(context, 'Struk Pembayaran', 108, '400 19px Arial');
  drawCentered(context, 'Terima kasih sudah berbelanja', 140, '400 17px Arial');
  drawDashedLine(context, 176);

  context.textAlign = 'left';
  context.font = '400 18px Arial';
  context.fillText(`Invoice: ${transaction.receiptNo}`, 48, 218);
  context.fillText(
    `Tanggal: ${new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(transaction.date))}`,
    48,
    250,
  );
  context.fillText(`Pelanggan: ${transaction.customerName || 'Umum'}`, 48, 282);
  if (transaction.customerPhone) {
    context.fillText(`WhatsApp: +${transaction.customerPhone}`, 48, 314);
  }
  drawDashedLine(context, 348);

  let y = 396;
  transaction.items.forEach((item) => {
    context.font = '600 19px Arial';
    context.textAlign = 'left';
    context.fillText(item.name.slice(0, 38), 48, y);
    context.font = '400 17px Arial';
    context.fillStyle = '#475569';
    context.fillText(`${item.qty} x ${formatIDR(item.price)}`, 48, y + 29);
    context.textAlign = 'right';
    context.fillStyle = '#0f172a';
    context.font = '600 18px Arial';
    context.fillText(formatIDR(item.qty * item.price), 672, y + 29);
    y += 64;
  });

  drawDashedLine(context, y + 4);
  y += 54;
  context.textAlign = 'left';
  context.font = '600 20px Arial';
  context.fillText('TOTAL', 48, y);
  context.textAlign = 'right';
  context.font = '700 27px Arial';
  context.fillText(formatIDR(transaction.total), 672, y);
  y += 42;
  context.font = '400 18px Arial';
  context.fillStyle = '#475569';
  context.fillText(`Pembayaran: ${transaction.paymentMethod}`, 672, y);

  y += 58;
  drawDashedLine(context, y);
  drawCentered(context, 'Barang yang sudah dibeli tidak dapat ditukar.', y + 48, '400 16px Arial');
  drawCentered(context, '@tokomegamandiri', y + 80, '600 17px Arial');

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('Gagal membuat gambar struk'));
    }, 'image/png');
  });

  return new File([blob], `struk-${transaction.receiptNo.replaceAll('/', '-')}.png`, {
    type: 'image/png',
  });
}

export async function shareReceiptImage(transaction: Transaction) {
  const file = await createReceiptImage(transaction);
  const shareData = {
    files: [file],
    title: `Struk ${transaction.receiptNo}`,
    text: `Struk pembayaran Toko Mega Mandiri untuk ${transaction.customerName || 'Pelanggan'}`,
  };

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share(shareData);
    return 'shared' as const;
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
  return 'downloaded' as const;
}

export async function receiptPreviewUrl(transaction: Transaction) {
  const file = await createReceiptImage(transaction);
  return URL.createObjectURL(file);
}