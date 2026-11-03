/* =========================================================
   Sales catalogue app: Fakhri Tools, Bait Al Maqdis, Mabrook and Modern Electric in one.
   The salesman picks his branch once (Settings can change it). The look, logo, products,
   cart, orders and order form all follow the branch; each branch sees only its own products
   and keeps its own cart and orders.
   Bait Al Maqdis: bam/data.js, Modern Electric: me/data.js (with prices, packed in the app).
   Fakhri Tools and Mabrook: the website's own js/data.js (no prices, refreshed from the website).
   One page; every screen is a "view" stacked inside its tab, like a native app.
   ========================================================= */
/* Older phones (built-in browser before 2020) ignore "gap" between items in a row.
   There, the same space is added as margins instead. Newer phones skip this. */
(() => {
  const t = document.createElement('div');
  t.style.cssText = 'display:flex;flex-direction:column;row-gap:1px;position:absolute;visibility:hidden';
  t.appendChild(document.createElement('div')); t.appendChild(document.createElement('div'));
  document.documentElement.appendChild(t); const ok = t.scrollHeight === 1; t.remove();
  if (ok) return;
  const px = v => parseFloat(v) || 0;
  let queued = false;
  const fix = () => {
    queued = false;
    const all = document.body.getElementsByTagName('*');
    for (let i = 0; i < all.length; i++) {
      const el = all[i]; if (el.__gapDone) continue;
      const cs = getComputedStyle(el); el.__gapDone = true;
      if (cs.display !== 'flex' && cs.display !== 'inline-flex') continue;
      const cg = px(cs.columnGap), rg = px(cs.rowGap); if (!cg && !rg) continue;
      const col = cs.flexDirection.indexOf('column') === 0, wrap = cs.flexWrap !== 'nowrap', rtl = cs.direction === 'rtl';
      el.__gapFix = () => {
        const kids = [].filter.call(el.children, k => getComputedStyle(k).position !== 'absolute' && getComputedStyle(k).display !== 'none');
        kids.forEach((k, j) => {
          const last = j === kids.length - 1;
          if (col) { if (!last && rg) k.style.marginBottom = rg + 'px'; }
          else { if ((!last || wrap) && cg) k.style[rtl ? 'marginLeft' : 'marginRight'] = cg + 'px'; if (wrap && rg) k.style.marginBottom = rg + 'px'; }
        });
        if (!col && wrap && rg) el.style.marginBottom = (px(cs.marginBottom) - rg) + 'px';
      };
      el.__gapFix();
    }
  };
  const later = () => { if (!queued) { queued = true; requestAnimationFrame(fix); } };
  const go = () => { new MutationObserver(ms => { ms.forEach(m => { if (m.target.__gapFix) m.target.__gapFix(); }); later(); }).observe(document.body, { childList: true, subtree: true }); later(); };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();

(() => {
  'use strict';
  const N = window.FTNative || null;                 // the phone (null when opened in a browser)
  const WEB = window.FT_WEB || null;                 // web builds: where photos live, and a branch fixed by the build
  const CFG = window.FT_CONFIG || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  // Arabic keyboards type ٠-٩ (or ۰-۹): read them as 0-9
  const digits = s => String(s == null ? '' : s).replace(/[\u0660-\u0669]/g, c => c.charCodeAt(0) - 0x660).replace(/[\u06F0-\u06F9]/g, c => c.charCodeAt(0) - 0x6F0);
  const qtyIn = v => { const d = digits(v).replace(/[\s,'\u066C]/g, '').match(/\d+/); return d ? +d[0] : null; };
  const h = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  const buzz = () => { try { N && N.vibrate && N.vibrate(); } catch (e) {} };
  const nfmt = n => Number(n).toLocaleString('en-US');
  const money = v => 'AED ' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const round2 = v => Math.round(v * 100) / 100;

  /* ================= light (the default) or dark, picked in Settings ================= */
  let theme = store.get('app-theme', 'light') === 'dark' ? 'dark' : 'light';
  const fkLogo = () => theme === 'dark' ? 'img/logo-lockup-dark.png' : 'img/logo-lockup.png';   // its grey line made light
  function paintTheme() {
    root.setAttribute('data-theme', theme);
    const m = $('meta[name=theme-color]'); if (m) m.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim() || '#ffffff');
    try { if (N && N.setTheme) N.setTheme(theme); } catch (e) {}   // the phone's top and bottom bars
  }
  function setTheme(th) {
    theme = th === 'dark' ? 'dark' : 'light';
    store.set('app-theme', theme);
    paintTheme();
    $$('img.hero__logo--fk').forEach(i => { i.src = fkLogo(); });
  }
  paintTheme();

  /* ================= branch ================= */
  const LOCK = WEB && WEB.brand ? WEB.brand : (window.FT_SHOP || '');   // the iPhone web app is Fakhri Tools only; the Mabrook app is Mabrook only
  // Each shop sees only its own products. Two kinds of list:
  //   'fk'    the Fakhri Tools website's list (sizes, specs and material picked on the product, no prices): Fakhri Tools and Mabrook
  //   'rows'  a packed list where every product has lines [part no., size, price]: Bait Al Maqdis (bam/) and Modern Electric (me/)
  // order: pre + date (ymd or dmy) + a number of `pad` digits, e.g. BAM-20261028-001, AQ-281026-01
  const BRANDS = {
    fakhri: {
      id: 'fakhri', kind: 'fk', name: 'Fakhri Tools', full: 'Fakhri Tools & Workshop Materials Trading LLC', where: 'Al Quoz, Dubai',
      logo: 'img/logo-lockup.png', pdfLogo: 'img/logo-lockup.png', pdfAccent: [185, 26, 32], pdfDark: [17, 24, 39],
      address: 'Warehouse 8, 8th Street, Al Quoz Industrial Area 3, Dubai', city: 'Al Quoz, Dubai',
      phone: CFG.phoneDisplay || '+971 4 285 0135', email: CFG.email || 'dxbsales@ftools.com',
      wa: CFG.whatsappDigits || '971522767034', waShow: CFG.whatsappDisplay || '+971 52 276 7034',
      wm: 'img/logo-stacked.png', pickup: 'Al Quoz shop', deliveryNote: true, order: { pre: 'AQ-', date: 'dmy', pad: 2 },
      prices: false, keys: { list: 'ft-list', orders: 'ft-orders', cust: 'ft-cust', saved: 'ft-saved', searches: 'ft-searches', seq: 'ft-seq' }
    },
    bam: {
      id: 'bam', kind: 'rows', dir: 'bam', data: 'BAM_DATA', ar: 'BAM_AR', cid: 'b-', clients: 'BAM_CLIENTS',
      name: 'Bait Al Maqdis', full: 'Bait Al Maqdis Building Materials Trading LLC', where: 'Jurf, Ajman',
      logo: 'bam/logo.png', pdfLogo: 'bam/logo-pdf.jpg', pdfAccent: [245, 130, 31], pdfDark: [20, 20, 22],
      address: 'Exhibition Showroom No.06, Jurf Industrial Zone 1, Emirate-Ajman', city: 'Jurf, Ajman',
      phone: '+971 6 529 4533', email: 'baitalmaqdisuae@gmail.com', wa: '', waShow: '', order: { pre: 'BAM-', date: 'ymd', pad: 3 },
      first: ['sgs', 'kapusi'], pdfs: 'BAM_PDFS', tag: 'TOOLS & MORE', head: '#17181c',
      prices: true, keys: { list: 'bam-list', orders: 'bam-orders', cust: 'bam-cust', saved: 'bam-saved', searches: 'bam-searches', seq: 'bam-seq' }
    },
    mabrook: {
      id: 'mabrook', kind: 'fk', name: 'Mabrook', full: 'Mabrook Hardware Trading LLC', where: 'Ajman',
      logo: 'shops/mabrook-logo.png', pdfLogo: 'shops/mabrook-pdf.jpg', pdfAccent: [132, 0, 0], pdfDark: [93, 93, 93],
      address: 'Ajman, UAE', city: 'Ajman', phone: '', email: '', wa: '', waShow: '',
      pickup: 'shop', order: { pre: 'MB-', date: 'dmy', pad: 2 },
      prices: false, keys: { list: 'mb-list', orders: 'mb-orders', cust: 'mb-cust', saved: 'mb-saved', searches: 'mb-searches', seq: 'mb-seq' }
    },
    me: {
      id: 'me', kind: 'rows', dir: 'me', data: 'ME_DATA', ar: 'ME_AR', cid: 'm-', codeLabel: 'Tally item',
      name: 'Modern Electric', full: 'Modern Electric House Trading L.L.C.', where: 'Jurf, Ajman',
      logo: 'shops/me-logo.png', pdfLogo: 'shops/me-pdf.jpg', pdfAccent: [10, 63, 166], pdfDark: [243, 144, 25],
      address: 'Jurf Industrial Area, Zone 2, Ajman, UAE', city: 'Jurf, Ajman',
      phone: '+971 6 747 0540', mobile: '+971 55 882 6217', email: 'vduelec@gmail.com', wa: '', waShow: '', order: { pre: 'ME-', date: 'ymd', pad: 3 }, head: '#ffffff',
      prices: true, keys: { list: 'me-list', orders: 'me-orders', cust: 'me-cust', saved: 'me-saved', searches: 'me-searches', seq: 'me-seq' }
    }
  };
  Object.keys(BRANDS).forEach(id => { const b = BRANDS[id]; if (b.kind === 'rows' ? !window[b.data] : !window.FT_CATS) delete BRANDS[id]; });   // a build without that list
  if (LOCK) Object.keys(BRANDS).forEach(id => { if (id !== LOCK) delete BRANDS[id]; });
  let brandId = LOCK || (N && N.brand ? N.brand() : '') || store.get('app-brand', '');
  if (!BRANDS[brandId]) brandId = Object.keys(BRANDS).length === 1 ? Object.keys(BRANDS)[0] : '';
  // an update from the Fakhri Tools-only app (v1.5 and earlier) with its cart or orders on the phone: that salesman is Fakhri Tools
  if (!brandId && BRANDS.fakhri && ['list', 'orders', 'cust'].some(k => store.get(BRANDS.fakhri.keys[k], null) != null)) {
    brandId = 'fakhri'; store.set('app-brand', brandId);
    try { if (N && N.setBrand) N.setBrand(brandId); } catch (e) {}
  }
  const BR = BRANDS[brandId] || BRANDS.fakhri || BRANDS[Object.keys(BRANDS)[0]];
  const BAM = brandId === 'bam';
  const ROWS = BR.kind === 'rows';   // a priced list with part numbers (Bait Al Maqdis, Modern Electric)
  root.setAttribute('data-brand', brandId && BRANDS[brandId] ? brandId : 'none');
  document.title = BR.name + ' Catalogue';

  /* ================= language: English, or Arabic for the screens ================= */
  let lang = store.get('app-lang', 'en') === 'ar' ? 'ar' : 'en';
  root.lang = lang; root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  const AR = {
    'Home': 'الرئيسية', 'Orders': 'الطلبات', 'PDFs': 'ملفات PDF', 'Cart': 'السلة', 'Settings': 'الإعدادات',
    'Product': 'فئات', 'Categories': 'المنتجات', 'TOOLS & MORE': 'أدوات وأكثر',
    'Search {n} products': 'ابحث في {n} منتج', 'Search products, sizes or part numbers': 'ابحث عن منتج أو مقاس أو رقم قطعة',
    'Search products or sizes': 'ابحث عن منتج أو مقاس',
    'Branch': 'الفرع', 'Language': 'اللغة', 'Look': 'المظهر', 'Light': 'فاتح', 'Dark': 'داكن', 'Which branch are you from?': 'من أي فرع أنت؟',
    'You can change it later in Settings.': 'يمكنك تغييره لاحقًا من الإعدادات.',
    'Switch to {b}?': 'التبديل إلى {b}؟', 'Switch': 'تبديل', 'Cancel': 'إلغاء', 'Current branch': 'الفرع الحالي',
    'The app icon, name, colours and order form change to {b}. Each branch keeps its own cart and orders.': 'تتغير أيقونة التطبيق واسمه وألوانه ونموذج الطلب إلى {b}. يحتفظ كل فرع بسلته وطلباته.',
    '{n} sizes': '{n} مقاسات', '1 size': 'مقاس واحد', '{n} products': '{n} منتج', '1 product': 'منتج واحد',
    '{n} items': '{n} أصناف', '1 item': 'صنف واحد', '{n} pcs': '{n} قطعة', '{n} orders': '{n} طلبات', '1 order': 'طلب واحد',
    'from': 'من', 'Price on request': 'السعر عند الطلب', 'On request': 'عند الطلب', 'Add': 'إضافة', 'Spec sheet': 'جدول المواصفات',
    'All': 'الكل', 'Tap a card to see the prices': 'اضغط على البطاقة لرؤية الأسعار', 'Prices': 'الأسعار', 'in cart': 'في السلة',
    'Added to the cart': 'تمت الإضافة إلى السلة', 'Open cart': 'فتح السلة', 'Removed': 'تمت الإزالة', 'Undo': 'تراجع',
    'Your cart is empty': 'سلة التسوق فارغة', 'Browse products': 'تصفح المنتجات', 'Add products, then place the order from here.': 'أضف المنتجات ثم أكمل الطلب من هنا.',
    'Items': 'عدد الأصناف', 'Pieces': 'القطع', 'Priced subtotal': 'المجموع الفرعي', 'Awaiting price': 'بانتظار السعر', 'Total': 'الإجمالي',
    'Proceed to checkout': 'إتمام الطلب', 'Empty cart': 'إفراغ السلة', 'Empty the cart?': 'إفراغ السلة؟', 'Remove': 'إزالة', 'Change': 'تعديل',
    'All {n} will be removed.': 'ستتم إزالة كل {n}.',
    'Checkout': 'إتمام الطلب', 'Back to cart': 'العودة إلى السلة', 'Saved customers': 'العملاء المحفوظون', 'Saved on this phone': 'محفوظ على هذا الهاتف',
    'Find a customer': 'ابحث عن عميل', 'Customer name': 'اسم العميل', 'Phone number (optional)': 'رقم الهاتف (اختياري)', 'Note (optional)': 'ملاحظة (اختياري)',
    'Delivery address, site name, anything else': 'عنوان التوصيل أو اسم الموقع أو أي شيء آخر', 'Place order': 'تأكيد الطلب', 'Save these details': 'حفظ هذه البيانات',
    'Saved': 'تم الحفظ', 'Type the customer name': 'اكتب اسم العميل', 'Type a phone number the shop can call': 'اكتب رقم هاتف يمكن للمحل الاتصال به',
    'Customer (company or workshop)': 'العميل (شركة أو ورشة)', 'Phone / WhatsApp': 'الهاتف / واتساب', 'Location or site (optional)': 'الموقع (اختياري)',
    'Delivery': 'التوصيل', 'Collect from shop': 'استلام من المحل', 'Deliver': 'توصيل', 'Payment (optional)': 'الدفع (اختياري)',
    'Cash': 'نقدًا', 'Card': 'بطاقة', 'Bank transfer': 'تحويل بنكي', 'Cheque': 'شيك', 'Credit account': 'حساب آجل',
    'Delivery anywhere in the UAE is for orders from AED 5,000. The shop confirms it with the price.': 'التوصيل داخل الإمارات للطلبات من 5,000 درهم. يؤكده المحل مع السعر.',
    'Anything the shop should know': 'أي شيء يجب أن يعرفه المحل',
    'Order placed': 'تم استلام الطلب', 'Order number': 'رقم الطلب', 'Order form (PDF)': 'نموذج الطلب (PDF)', 'Send on WhatsApp': 'إرسال عبر واتساب',
    'Send to the shop on WhatsApp': 'إرسال إلى المحل عبر واتساب', 'View my orders': 'عرض طلباتي', 'Continue shopping': 'متابعة التسوق',
    'Copy order as text': 'نسخ الطلب كنص', 'Repeat order': 'تكرار الطلب', 'Delete order': 'حذف الطلب', 'Delete order {no}?': 'حذف الطلب {no}؟',
    'It is only removed from this phone.': 'يُحذف من هذا الهاتف فقط.', 'Delete': 'حذف', 'Order deleted': 'تم حذف الطلب',
    'All orders': 'كل الطلبات', 'No orders yet': 'لا توجد طلبات بعد', 'Orders you place will be listed here.': 'ستظهر الطلبات التي تقوم بها هنا.',
    'Find an order': 'ابحث عن طلب', 'Placed on': 'تاريخ الطلب', 'Name': 'الاسم', 'Phone': 'الهاتف', 'Note': 'ملاحظة', 'Location': 'الموقع', 'Payment': 'الدفع',
    'Open': 'فتح', 'Share': 'مشاركة', 'Making the order form…': 'جارٍ إعداد نموذج الطلب…', 'Order form ready': 'نموذج الطلب جاهز',
    'Could not make the order form. Try again.': 'تعذر إعداد نموذج الطلب. حاول مرة أخرى.', 'Copied': 'تم النسخ',
    'Replace the cart?': 'استبدال السلة؟', 'The cart already has {n}. They will be replaced by this order.': 'السلة تحتوي على {n}. سيتم استبدالها بهذا الطلب.',
    'Replace': 'استبدال', 'Order copied into the cart': 'تم نسخ الطلب إلى السلة',
    'Nothing found for "{q}"': 'لا توجد نتائج لـ "{q}"', 'Try a shorter word or a part number.': 'جرّب كلمة أقصر أو رقم قطعة.', '{n} found': 'تم العثور على {n}',
    '{n} with a similar spelling': '{n} بتهجئة مشابهة', 'Recent': 'عمليات البحث الأخيرة', 'Clear': 'مسح', 'Jump to a category': 'انتقل إلى فئة',
    'App version': 'إصدار التطبيق', 'Products': 'المنتجات', 'Product list': 'قائمة المنتجات', 'Last check': 'آخر تحقق', 'Not yet': 'ليس بعد',
    'Check for new products': 'البحث عن منتجات جديدة', 'Checking…': 'جارٍ التحقق…', 'As packed in the app': 'كما في التطبيق',
    'Always the newest from the website': 'دائمًا الأحدث من الموقع', 'Updated from the website {w}': 'تم التحديث من الموقع {w}',
    'Prices are packed in the app. New prices come with an app update.': 'الأسعار مضمّنة في التطبيق. تصل الأسعار الجديدة مع تحديث التطبيق.',
    'Prices are not shown. The shop confirms prices on WhatsApp.': 'لا تظهر الأسعار. يؤكد المحل الأسعار عبر واتساب.',
    'Prices are not shown. The shop confirms them.': 'لا تظهر الأسعار. يؤكدها المحل.',
    'New products from the shop are ready': 'منتجات جديدة من المحل جاهزة', 'Refresh': 'تحديث', 'You already have the newest list': 'لديك أحدث قائمة',
    'No internet. The saved catalogue still works.': 'لا يوجد إنترنت. الكتالوج المحفوظ يعمل.', 'Could not reach the website. Try again later.': 'تعذر الوصول إلى الموقع. حاول لاحقًا.',
    'Size': 'المقاس', 'Specs & ratings': 'المواصفات', 'Material': 'المادة', 'choose one': 'اختر واحدًا', 'Not sure': 'غير متأكد',
    'tap the ones you need': 'اختر ما تحتاجه', 'Add to cart': 'أضف إلى السلة', 'More in this category': 'المزيد من هذه الفئة', 'See full details': 'عرض التفاصيل',
    'Choose a size, or tap Not sure': 'اختر مقاسًا أو اضغط غير متأكد', 'Choose the specs & ratings, or tap Not sure': 'اختر المواصفات أو اضغط غير متأكد',
    'Choose a material, or tap Not sure': 'اختر المادة أو اضغط غير متأكد', 'Save changes': 'حفظ التغييرات', 'Changed': 'تم التعديل',
    'Catalogues to open or send': 'كتالوجات للفتح أو الإرسال', 'Customer': 'العميل', 'Order form': 'نموذج الطلب',
    'just now': 'الآن', 'English': 'English', 'Search': 'بحث', 'Back': 'رجوع', 'Close': 'إغلاق', 'No longer in the catalogue': 'لم يعد في الكتالوج',
    'Pinch or double-tap to zoom': 'كبّر بإصبعين أو اضغط مرتين', 'Order copied': 'تم نسخ الطلب', 'quoted separately': 'تُسعّر بشكل منفصل',
    '{n} on request, quoted separately': '{n} عند الطلب، تُسعّر بشكل منفصل', 'Continue': 'متابعة', 'Full name': 'الاسم الكامل',
    'The order could not be saved: the phone is full. Delete some old orders, then try again.': 'تعذّر حفظ الطلب: ذاكرة الهاتف ممتلئة. احذف بعض الطلبات القديمة ثم حاول مرة أخرى.',
    'Prices on request. The shop quotes them separately.': 'الأسعار عند الطلب. يُسعّرها المحل بشكل منفصل.',
    'Top range': 'فئة مميزة', 'Top ranges': 'الفئات المميزة', 'More ranges': 'فئات أخرى', 'All categories': 'كل الفئات', 'Ranges': 'الفئات',
    'Part numbers': 'أرقام القطع', '{n} sections': '{n} أقسام', '1 section': 'قسم واحد', 'PDF catalogues': 'كتالوجات PDF',
    '{n} catalogues to open or send on WhatsApp': '{n} كتالوج للفتح أو الإرسال عبر واتساب', 'Select': 'تحديد', 'Catalogue': 'الكتالوج',
    'Choose': 'اختيار', 'Chosen': 'تم الاختيار', 'Catalogues': 'الكتالوجات', '{n} PDF catalogues. Tap a cover to open it.': '{n} كتالوج PDF. اضغط على الغلاف لفتحه.',
    'Other apps': 'تطبيقات أخرى', 'PDF catalogue': 'كتالوج PDF', 'Chosen products': 'المنتجات المختارة', 'Send': 'إرسال', '{n} chosen': 'تم اختيار {n}',
    'Choose products': 'اختر المنتجات', 'Tap Send for a picture, PDF or text': 'اضغط إرسال لصورة أو PDF أو نص', 'Tap the products to send': 'اضغط على المنتجات لإرسالها',
    'Part no.': 'رقم القطعة', 'Price': 'السعر', 'Product details': 'تفاصيل المنتجات', '{n} pages': '{n} صفحات', 'Send this product': 'إرسال هذا المنتج',
    'Send {n}': 'إرسال {n}', 'Picture': 'صورة', 'Text': 'نص', 'A picture holds up to {n} products. Send more as a PDF.': 'الصورة تتسع حتى {n} منتجات. أرسل أكثر كملف PDF.',
    'Show prices': 'إظهار الأسعار', 'The price of each size is shown': 'يظهر سعر كل مقاس', 'Sizes and part numbers only, no prices': 'المقاسات وأرقام القطع فقط، بدون أسعار', 'Clear the chosen products': 'إلغاء اختيار المنتجات',
    'Could not make it. Try again.': 'تعذر الإعداد. حاول مرة أخرى.'
  };
  const RAR = ROWS && window[BR.ar] || {};   // the shop's own Arabic word list (Bait Al Maqdis, Modern Electric)
  const BAR_ = RAR.dict || {}, SPECW = RAR.spec || {};
  const BLOW = {}; Object.keys(BAR_).forEach(k => { BLOW[k.toLowerCase()] = BAR_[k]; });
  // screen words: t('Search {n} products', { n: 597 })
  const t = (s, v) => { let x = lang === 'ar' ? (AR[s] || BAR_[s] || s) : s; if (v) Object.keys(v).forEach(k => { x = x.split('{' + k + '}').join(v[k]); }); return x; };
  // Bait Al Maqdis names and sizes in Arabic from their own word list (only used on their products; Fakhri Tools names stay as written)
  const tn = s => lang === 'ar' && s ? (BAR_[s] || BLOW[String(s).toLowerCase().replace(/\s+/g, ' ').trim()] || s) : s;
  const ts = s => lang === 'ar' && s ? String(s).replace(/[A-Za-z]+/g, w => SPECW[w.toUpperCase()] || w) : (s || '');
  const RTL_CH = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
  const bd = s => { s = s == null ? '' : String(s); return lang === 'ar' && s && !RTL_CH.test(s) ? '<bdi dir="ltr">' + esc(s) + '</bdi>' : esc(s); };
  const cnt = (n, w) => n === 1 ? t('1 ' + w) : t('{n} ' + w + 's', { n: nfmt(n) });
  const pcs = n => t('{n} pcs', { n: nfmt(n) });

  /* ================= icons ================= */
  const I = {
    pdf: '<svg viewBox="0 0 24 24" class="ico"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>',
    back: '<svg viewBox="0 0 24 24" class="ico flipx-rtl"><path d="M15 5l-7 7 7 7"/></svg>',
    chev: '<svg viewBox="0 0 24 24" class="ico flipx-rtl"><path d="M9 5l7 7-7 7"/></svg>',
    down: '<svg viewBox="0 0 24 24" class="ico"><path d="M6 9l6 6 6-6"/></svg>',
    sun: '<svg viewBox="0 0 24 24" class="ico"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" class="ico"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" class="ico"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" class="ico"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    x: '<svg viewBox="0 0 24 24" class="ico"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    search: '<svg viewBox="0 0 24 24" class="ico"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>',
    share: '<svg viewBox="0 0 24 24" class="ico"><path d="M12 15V3M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v8h14v-8"/></svg>',
    flip: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 9a8 8 0 0 1 14-3l2 2M20 4v4h-4M20 15a8 8 0 0 1-14 3l-2-2M4 20v-4h4"/></svg>',
    zoom: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    wa: '<svg viewBox="0 0 24 24" class="ico-f"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.2-.9.9-.9 2.2s.9 2.6 1.1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.7-.3z"/></svg>',
    user: '<svg viewBox="0 0 24 24" class="ico"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    copy: '<svg viewBox="0 0 24 24" class="ico"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
    trash: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    sync: '<svg viewBox="0 0 24 24" class="ico"><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4"/></svg>',
    gear: '<svg viewBox="0 0 24 24" class="ico"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    box: '<svg viewBox="0 0 24 24" class="ico"><path d="M3 7.5 12 3l9 7.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg>',
    cartBig: '<svg viewBox="0 0 24 24" class="ico"><path d="M3 4h2.5l2.2 11h10.6L20.5 7H7"/><circle cx="9.5" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/></svg>',
    doc: '<svg viewBox="0 0 24 24" class="ico"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/></svg>',
    select: '<svg viewBox="0 0 24 24" class="ico"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M8 12.2l2.8 2.8L16.2 9.5"/></svg>',
    image: '<svg viewBox="0 0 24 24" class="ico"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>',
    text: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 6h16M4 11h16M4 16h10"/></svg>',
    dots: '<svg viewBox="0 0 24 24" class="dots"><circle cx="4" cy="4" r="2"/><circle cx="12" cy="4" r="2"/><circle cx="20" cy="4" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="20" cy="12" r="2"/><circle cx="4" cy="20" r="2"/><circle cx="12" cy="20" r="2"/><circle cx="20" cy="20" r="2"/></svg>'
  };

  /* ================= toast ================= */
  let toastT;
  function toast(msg, act, fn, ms) {
    const tt = $('#toast');
    tt.innerHTML = '<span>' + esc(msg) + '</span>' + (act ? '<button>' + esc(act) + '</button>' : '');
    if (act) $('button', tt).onclick = () => { tt.classList.remove('is-on'); fn(); };
    tt.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(() => tt.classList.remove('is-on'), ms || (act ? 6000 : 2600));
  }

  /* ================= first start: which branch? ================= */
  function branchCard(id, on) {
    const b = BRANDS[id];
    return '<button class="bcard bcard--' + id + (on ? ' is-on' : '') + '" data-brand="' + id + '"><span class="bcard__logo"><img src="' + esc(b.logo) + '" alt=""></span>' +
      '<span class="bcard__t"><b>' + esc(b.name) + '</b><span>' + esc(b.where) + '</span></span>' + (on ? '<i class="bcard__on">' + I.check + '</i>' : '<i class="bcard__go">' + I.chev + '</i>') + '</button>';
  }
  function setBrand(id) {
    store.set('app-brand', id);
    try { if (N && N.setBrand) N.setBrand(id); } catch (e) {}
    try { sessionStorage.removeItem('ft-routes'); } catch (e) {}
    $('#stage').style.opacity = 0;
    setTimeout(() => location.reload(), N ? 250 : 60);
  }
  if (!brandId) {
    const f = h('<div id="first"><div class="first__in"><h1>' + esc(t('Which branch are you from?')) + '</h1><p>' + esc(t('You can change it later in Settings.')) + '</p>' +
      '<div class="first__list">' + Object.keys(BRANDS).map(id => branchCard(id, false)).join('') + '</div>' +
      '<button class="langpill langpill--first" data-lang>' + (lang === 'ar' ? 'English' : 'عربي') + '</button></div></div>');
    document.body.appendChild(f);
    f.addEventListener('click', e => {
      const b = e.target.closest('[data-brand]'); if (b) { b.classList.add('is-on'); buzz(); setBrand(b.dataset.brand); return; }
      if (e.target.closest('[data-lang]')) { store.set('app-lang', lang === 'ar' ? 'en' : 'ar'); location.reload(); }
    });
    const s = $('#splash'); if (s) s.remove();
    document.body.classList.remove('is-booting');
    window.FT = { back: () => false };
    return;
  }

  /* ================= products: only the branch's own list ================= */
  const K = BR.keys;
  // { id, src, name, tile, items: [product] }; src 'bam' is a product with priced lines (Bait Al Maqdis or Modern Electric), 'fk' a website product
  const BCATS = [], FCATS = [];
  const P = [], byId = new Map();   // every product

  /* ---- Bait Al Maqdis and Modern Electric: every product has rows [part no., size, price or null] ---- */
  const DIR = ROWS ? BR.dir + '/' : '';
  if (ROWS) {
    window[BR.data].cats.forEach(c0 => {
      const c = { id: BR.cid + c0.id, src: 'bam', name: c0.name, tile: c0.cover ? DIR + c0.cover : '', secs: [], items: [] };
      const seen = {};   // two products may share a name (different photo or sizes): x tells them apart in the cart
      c0.secs.forEach(s => {
        c.secs.push(s.n);
        s.items.forEach(it => {
          const x = seen[it.n] = (seen[it.n] || 0) + 1;
          const o = { id: c.id + '/' + c.items.length, src: 'bam', c, sec: s.n, n: it.n, x: x - 1, img: it.img ? DIR + it.img : '', r: it.r, spec: (it.spec || []).map(x => DIR + x) };
          c.items.push(o); byId.set(o.id, o);
        });
      });
      if (!c.tile) c.tile = (c.items.find(o => o.img) || {}).img || '';
      c.lede = c0.lede || '';
      BCATS.push(c);
    });
    // the ranges a shop wants on top of its home screen (Bait Al Maqdis: SGS, then Kapusi), the rest as listed
    const FIRST = (BR.first || []).map(x => BR.cid + x), rank = c => { const i = FIRST.indexOf(c.id); return i < 0 ? FIRST.length + BCATS.indexOf(c) : i; };
    const at = new Map(BCATS.map(c => [c, rank(c)]));
    BCATS.sort((a, b) => at.get(a) - at.get(b));
  }

  /* ---- Fakhri Tools and Mabrook: the website's list; sizes, specs and material are chosen on the product ---- */
  const IMG = WEB && WEB.img ? WEB.img : 'p/';
  const MATS = [['Bronze', /bronze/i], ['Brass', /brass/i], ['Stainless', /\bS\.S\b|\bSS(?:3\d\d\w*)?\b|[Ss]tainless/], ['Carbon steel', /\bC\.S\b|\bCS\b|[Ff]orged [Ss]teel/], ['Cast iron', /\bC\.I\b|\bCI\b|[Cc]ast [Ii]ron/], ['Ductile iron', /\bD\.I\b|\bDI\b|[Dd]uctile/], ['Galvanised', /\bG\.I\b|\bGI\b|[Gg]alvani[sz]ed/], ['Mild steel', /\bM\.S\b|\bMS\b|[Mm]ild [Ss]teel/], ['Aluminium', /alumin/i], ['Rubber', /rubber|neoprene|EPDM|NBR/i], ['PVC', /\bPVC\b/], ['Acrylic', /acrylic/i]];
  function materialOf(name) {
    let best = null, at = 1e9;
    MATS.forEach(([m, r]) => { const k = String(name).search(r); if (k > -1 && k < at) { at = k; best = m; } });
    return best;
  }
  const raw = ROWS ? [] : (window.FT_CATS || []).filter(c => c && Array.isArray(c.items));
  // a broken download of the Fakhri Tools list never strands the app: go back to the packed one (once)
  if (!ROWS && !raw.length && N && N.resetData) { let tried = false; try { tried = !!sessionStorage.getItem('ft-reset'); sessionStorage.setItem('ft-reset', '1'); } catch (e) {} if (!tried) { N.resetData(); return; } }
  raw.forEach(c0 => {
    const c = { id: c0.slug, src: 'fk', slug: c0.slug, fam: c0.fam, name: c0.name, items: [] };
    c0.items.forEach((it, i) => {
      const o = { id: c0.slug + '/' + i, src: 'fk', c, n: it[0], specs: it[1] || [], size: it[2] || '', img: it[3] ? IMG + it[3] : '', matSet: it[4] || '' };
      o.mat = o.matSet && o.matSet !== 'Other' ? o.matSet : (materialOf(o.n) || '');
      o.group = materialOf(o.mat) || materialOf(o.n) || (o.mat ? o.mat.split(/[(,&]/)[0].trim() : '');
      c.items.push(o); byId.set(o.id, o);
    });
    c.tile = c0.cover ? IMG + c0.cover : (c.items.find(o => o.img) || {}).img || '';
    FCATS.push(c);
  });
  const CATS = ROWS ? BCATS : FCATS;
  CATS.forEach(c => c.items.forEach(o => P.push(o)));
  const isB = o => !!o && o.src === 'bam';
  const lb = l => l.src === 'bam';   // a cart line of a priced product (older Fakhri Tools lines have no src)
  const catBy = id => CATS.find(c => c.id === id);
  const shortCat = s => String(s).replace(/\s*\(.*\)\s*$/, '').trim();

  /* ---- Fakhri Tools sizes (same rules as the website's size picker) ---- */
  const LADDER = ['⅛"', '¼"', '⅜"', '½"', '¾"', '1"', '1¼"', '1½"', '2"', '2½"', '3"', '3½"', '4"', '5"', '6"', '8"', '10"', '12"', '14"', '16"', '18"', '20"', '22"', '24"', '26"', '28"', '30"', '32"', '34"', '36"', '40"', '42"', '48"'];
  const rung = x => LADDER.indexOf(x);
  const IN = '(\\d*[⅛¼⅜½¾]?"|\\d+\\/\\d+")';
  const RX_RANGE = new RegExp('^' + IN + ' – ' + IN + '$'), RX_PAIR = new RegExp('^' + IN + ' × ' + IN + ' – ' + IN + ' × ' + IN + '$'), RX_RANGEX = new RegExp('^' + IN + ' – ' + IN + ' × ' + IN + '$');
  function ladder(a, b, fam) {
    const i = rung(a), j = b === 'any' ? LADDER.length - 1 : rung(b);
    if (i < 0 || j < i) return null;
    return LADDER.slice(i, j + 1).filter(x => x !== '3½"' || fam === 'fittings' || x === a || x === b);
  }
  const SPEC = new Map();
  function sizeSpec(o) {
    if (SPEC.has(o.id)) return SPEC.get(o.id);
    let s = o.size || '', len = '', note = '', sp = null, m;
    const dot = s.split(' · ');
    if (dot.length > 1) { s = dot[0]; if (/–/.test(dot[1])) len = dot[1]; else note = dot[1]; }
    if (!s) sp = { t: 'text', hint: '' };
    else if (/ – any size$/.test(s)) { const l = ladder(s.split(' – ')[0], 'any', o.c.fam); if (l) sp = { t: 'sel', opts: l }; }
    else if ((m = s.match(RX_PAIR)) && m[1] === m[2] && m[3] === m[4]) { const l = ladder(m[1], m[3], o.c.fam); if (l) sp = { t: 'sel', opts: l }; }
    else if (m) {
      const L = ladder(m[1], m[3], o.c.fam), S = ladder(m[2], m[4], o.c.fam);
      if (L && S) sp = { t: 'pair', L, S, lt: rung(m[1]) > rung(m[2]) && rung(m[3]) > rung(m[4]) };
    }
    else if ((m = s.match(RX_RANGEX))) {
      const l = ladder(m[1], m[2], o.c.fam);
      if (l && rung(m[3]) > -1 && rung(m[3]) < rung(m[2])) sp = { t: 'sel', opts: l.concat(m[2] + ' × ' + m[3]) };
      else if (l) { sp = { t: 'sel', opts: l }; len = 'up to ' + m[3]; }
    }
    else if ((m = s.match(RX_RANGE))) { const l = ladder(m[1], m[2], o.c.fam); if (l) sp = { t: 'sel', opts: l }; }
    else if (/, | \/ /.test(s)) sp = { t: 'sel', opts: s.replace(/ bottom connection$/, '').split(/, | \/ /) };
    else if (!/–|TO/.test(s)) sp = { t: 'one', v: s };
    if (!sp) sp = { t: 'text', hint: s };
    sp.len = len; sp.note = note;
    SPEC.set(o.id, sp);
    return sp;
  }
  const CH = window.FT_CHOICES || { specOpts: c => [...new Set(c || [])], matOpts: x => ({ opts: x ? [x] : [], note: '', full: x || '' }) };
  const SPECS = new Map();
  const specOpts = o => { if (!SPECS.has(o.id)) SPECS.set(o.id, CH.specOpts(o.specs)); return SPECS.get(o.id); };
  const matOpts = o => CH.matOpts(o.mat);
  const hasChoices = o => { const sp = sizeSpec(o); return sp.t === 'sel' || sp.t === 'pair' || (sp.t === 'text' && !!o.size) || !!sp.len || specOpts(o).length > 1 || matOpts(o).opts.length > 1; };

  /* ================= the cart (one per branch; may hold products of both) =================
     Bait Al Maqdis product: { src: 'bam', k: category, n: product, x: which product of that name (left out for the first), c: part no., s: size, p: price when added, q }
     Fakhri Tools product:   { src: 'fk', k: category, n: product, m: material set, z: the product's size range, s: size, sp: [specs], mt: material, q } */
  let lines = store.get(K.list, []).filter(l => l && l.n && l.q > 0);
  let cust = store.get(K.cust, {});
  const saveLines = () => { store.set(K.list, lines); updateBadge(); };
  const lineKey = l => lb(l) ? ['b', l.k, l.n, l.x || 0, l.c || '', l.s || ''].join('|') : ['f', l.k, l.n, l.m, l.z || '', l.s, (l.sp || []).join('¦'), l.mt || ''].join('|');
  // the product a line points at, or null when it left the catalogue
  function lineProduct(l) {
    const c = catBy(l.k);
    if (lb(l)) {
      if (!c) return null;
      const has = o => o.n === l.n && o.r.some(r => r[0] === (l.c || null) && r[1] === (l.s || null));
      return c.items.find(o => has(o) && o.x === (l.x || 0)) || c.items.find(has) || null;
    }
    const pool = c && c.src === 'fk' ? c.items : FCATS.reduce((a, x) => a.concat(x.items), []);
    const same = o => o.n === l.n && o.matSet === l.m && (l.z == null || o.size === l.z);   // older lines have no z
    return pool.find(same) || pool.find(o => o.n === l.n && o.matSet === l.m) || P.find(o => o.src === 'fk' && o.n === l.n && o.matSet === l.m) || P.find(o => o.src === 'fk' && o.n === l.n) || null;
  }
  const lineRow = (l, o) => o ? o.r.find(r => r[0] === (l.c || null) && r[1] === (l.s || null)) : null;
  // Bait Al Maqdis: today's price from the catalogue (orders keep the price they were placed with); Fakhri Tools: no price
  function linePrice(l, o) { if (!lb(l)) return null; const r = lineRow(l, o === undefined ? lineProduct(l) : o); return r ? r[2] : (l.p == null ? null : l.p); }
  // items, pieces, total of the priced ones, how many wait for a price, how many have a price
  function totals(ls, snap) {
    let items = ls.length, q = 0, sum = 0, ask = 0, priced = 0, b = 0;
    ls.forEach(l => { q += l.q; if (lb(l)) b++; const p = snap ? (lb(l) ? l.p : null) : linePrice(l); if (p == null) ask++; else { priced++; sum += p * l.q; } });
    return { items, q, sum: round2(sum), ask, priced, b };
  }
  // Bait Al Maqdis: how many of one size are in the cart
  const rowLine = (o, j) => { const r = o.r[j]; return lines.find(l => lb(l) && l.k === o.c.id && l.n === o.n && (l.x || 0) === o.x && (l.c || null) === r[0] && (l.s || null) === r[1]); };
  const qtyOf = (o, j) => { const l = rowLine(o, j); return l ? l.q : 0; };
  const qtyAll = o => isB(o) ? o.r.reduce((s, r, j) => s + qtyOf(o, j), 0) : lines.filter(l => !lb(l) && l.k === o.c.id && l.n === o.n && l.m === o.matSet && (l.z == null || l.z === o.size)).reduce((s, l) => s + l.q, 0);
  function setRowQty(o, j, q) {
    const r = o.r[j], l = rowLine(o, j);
    q = Math.max(0, Math.min(99999, q | 0));
    if (l && !q) lines.splice(lines.indexOf(l), 1);
    else if (l) l.q = q;
    else if (q) { const nl = { src: 'bam', k: o.c.id, n: o.n, c: r[0], s: r[1], p: r[2], q }; if (o.x) nl.x = o.x; lines.push(nl); }
    saveLines(); paintItem(o); markDirty();
  }
  function addFk(o, pick, q) {
    const l = { src: 'fk', k: o.c.id, n: o.n, m: o.matSet, z: o.size, s: pick.s, sp: pick.sp, mt: pick.mt, q };
    const ex = lines.find(x => lineKey(x) === lineKey(l));
    if (ex) ex.q = Math.min(99999, ex.q + q); else lines.push(l);
    saveLines(); paintItem(o); markDirty();
  }
  // the cart, checkout and order screens are drawn again when next shown; the one on screen now (under a sheet) straight away
  function markDirty() {
    ['cart', 'orders'].forEach(tb => (stacks[tb] || []).forEach(v => { v.dirty = true; }));
    const v = (tab === 'cart' || tab === 'orders') && top();
    if (v && v.refresh) { const y = v.el.scrollTop; v.refresh(); v.el.scrollTop = y; }
  }

  /* ---- Fakhri Tools: a line written out the website's way; anything not chosen reads "to confirm" ---- */
  function describe(l, o) {
    const sp = o ? sizeSpec(o) : { t: 'text' }, m = o ? matOpts(o) : { opts: l.m ? [l.m] : [], note: '', full: l.m || '' }, specs = o ? specOpts(o) : [];
    let size = '';
    if ((o && o.size) || (l.s && l.s !== '?')) {
      const [base, len] = String(l.s || '?').split(' · ');
      size = !base || base === '?' ? 'to confirm' + (o && o.size && sp.t !== 'one' ? ' (we offer ' + o.size.split(' · ')[0] + ')' : '') : base.replace(/\?/g, 'to confirm');
      if (len) size += ', length ' + len;
    }
    const sps = (l.sp || []).filter(x => x !== '?');   // "?" = Not sure: reads "to confirm (options)", like the size
    const spec = sps.length ? sps.join(', ') : specs.length === 1 ? specs[0] : specs.length ? 'to confirm' + (specs.length <= 6 ? ' (' + specs.join(' / ') + ')' : '') : '';
    const mat = !m.opts.length ? '' : m.opts.length === 1 ? (l.mt === '?' ? 'to confirm (' + m.full + ')' : m.full) : l.mt && m.opts.includes(l.mt) ? l.mt + (m.note ? ' (' + m.note + ')' : '') : 'to confirm (' + m.opts.join(' / ') + ')';
    return { size, spec, mat };
  }
  const groupOfLine = (l, o) => o ? o.c.name : ((catBy(l.k) || {}).name || '');
  // one line as a short description under its name, for the cart, orders and messages
  function lineSub(l, o, html) {
    if (lb(l)) { const x = [l.c, ts(l.s)].filter(Boolean).join(' · '); return html ? bd(x) : x; }
    const d = describe(l, o);
    if (!html) return [d.size && 'Size: ' + d.size, d.spec && 'Specs: ' + d.spec, d.mat && 'Material: ' + d.mat].filter(Boolean).join(' · ');
    const part = (k, v) => v ? '<span class="lp"><i>' + esc(t(k)) + '</i> ' + (/^to confirm/.test(v) ? '<u>' + esc(v) + '</u>' : esc(v)) + '</span>' : '';
    return part('Size', d.size) + part('Specs & ratings', d.spec) + part('Material', d.mat);
  }
  const lineImg = (l, o) => o ? o.img : '';
  const lineName = l => lb(l) ? tn(l.n) : l.n;

  /* ================= orders ================= */
  const getOrders = () => store.get(K.orders, []);
  const putOrders = list => store.set(K.orders, list.slice(0, 300));
  function nextOrderNo() {
    const d = new Date(Date.now() + 4 * 3600e3), p2 = n => String(n).padStart(2, '0');
    const OR = BR.order;
    const stamp = OR.date === 'ymd' ? d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()) : p2(d.getUTCDate()) + p2(d.getUTCMonth() + 1) + String(d.getUTCFullYear()).slice(2);
    const pre = OR.pre + stamp + '-';
    const used = getOrders().filter(o => o.no.indexOf(pre) === 0).map(o => +o.no.slice(pre.length) || 0), last = store.get(K.seq, {});
    const n = Math.max(used.length ? Math.max.apply(null, used) : 0, last.pre === pre ? +last.n || 0 : 0) + 1;   // a deleted order's number is not used again
    store.set(K.seq, { pre, n });
    return pre + String(n).padStart(OR.pad, '0');
  }
  const when2 = ms => new Date(ms).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  // the order as text: for WhatsApp and "Copy order as text" (always English, the shop reads it)
  function orderText(x) {
    const c = x.cust || {}, out = [BR.name + ' - Order ' + x.no, 'Date: ' + when2(x.at)];
    if (c.name) out.push('Customer: ' + c.name);
    if (c.phone) out.push('Phone: ' + c.phone);
    if (c.site) out.push('Location: ' + c.site);
    if (c.delivery) out.push('Delivery: ' + (c.delivery === 'deliver' ? 'Deliver to the customer' : 'Customer collects from the ' + (BR.pickup || 'shop')));
    if (c.pay) out.push('Payment: ' + c.pay);
    if (c.by) out.push('Needed by: ' + c.by);
    if (c.person) out.push('Contact: ' + c.person);
    const items = x.lines.map((l, i) => {
      const o = lineProduct(l), num = (x.lines.length > 1 ? (i + 1) + '. ' : '');
      if (lb(l)) return num + l.n + '\n   ' + [l.c && BR.codeLabel ? BR.codeLabel + ': ' + l.c : l.c, l.s].filter(Boolean).concat(['Qty ' + nfmt(l.q) + (l.p != null ? ' x ' + money(l.p) + ' = ' + money(round2(l.p * l.q)) : ' - price on request')]).join(' · ');
      const d = describe(l, o);
      return [num + l.n, 'Group: ' + groupOfLine(l, o), d.size && 'Size: ' + d.size, d.spec && 'Specs & ratings: ' + d.spec, d.mat && 'Material: ' + d.mat, 'Quantity: ' + nfmt(l.q)].filter(Boolean).join('\n');
    });
    let tail = '';
    const tt = totals(x.lines, true);
    if (tt.priced) tail = '\n\nTotal: ' + money(tt.sum) + (tt.ask ? '\n' + tt.ask + (tt.ask === 1 ? ' item' : ' items') + ' on request, quoted separately.' : '');
    else tail = '\n\nPlease confirm price and stock.';
    return out.join('\n') + '\n\nItems (' + x.lines.length + '):\n\n' + items.join('\n\n') + tail + (c.note ? '\n\nNote: ' + c.note : '');
  }
  function pdfData(x) {
    const c = x.cust || {};
    return {
      no: x.no, at: x.at, cust: c, priced: x.lines.some(l => lb(l) && l.p != null), brand: BR.id, accent: BR.pdfAccent, dark: BR.pdfDark,
      rows: x.lines.map(l => {
        const o = lineProduct(l);
        if (lb(l)) return { src: 'bam', n: l.n, group: o ? o.c.name : ((catBy(l.k) || {}).name || ''), img: lineImg(l, o), code: l.c || '', size: l.s || '', q: l.q, p: l.p };
        const d = describe(l, o);
        return { src: 'fk', n: l.n, group: groupOfLine(l, o), img: lineImg(l, o), size: d.size, spec: d.spec, mat: d.mat, q: l.q, p: null };
      }),
      shop: { name: BR.full, short: BR.name, address: BR.address, city: BR.city, phone: BR.phone, mobile: BR.mobile || '', wa: BR.waShow, email: BR.email, logo: BR.pdfLogo, pickup: BR.pickup || 'shop', codeLabel: BR.codeLabel || '' }
    };
  }
  let pdfBusy = false;
  // how: 'view' (open it), 'wa' (WhatsApp: the shop's chat for Fakhri Tools, choose a chat for Bait Al Maqdis) or 'share'
  async function orderPdf(x, how) {
    if (pdfBusy) return; pdfBusy = true;
    toast(t('Making the order form…'));
    try {
      const b64 = await window.FT_ORDER_PDF(pdfData(x));
      const name = 'Order-form-' + x.no + '.pdf', cap = BR.name + ' order ' + x.no + (x.cust && x.cust.name ? ' · ' + x.cust.name : '');
      window.__lastPdf = b64;
      if (N && how === 'view' && N.viewFile) N.viewFile(b64, name, 'application/pdf');
      else if (N && N.shareFile) N.shareFile(b64, name, 'application/pdf', how === 'wa' ? orderText(x) : cap, how === 'wa' ? (BR.wa || 'wa') : '');
      else webPdf(b64, name, cap, how === 'view');
      toast(t('Order form ready'));
    } catch (e) { toast(t('Could not make the order form. Try again.')); }
    pdfBusy = false;
  }
  // browser / iPhone: show the PDF, or hand it to the share menu (Safari needs a fresh tap if making it took long)
  function webPdf(b64, name, cap, view) {
    const bin = atob(b64), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    if (window.FT_PDF_VIEW) return window.FT_PDF_VIEW(u8, name);   // a page that shows PDFs itself (the browser preview)
    const blob = new Blob([u8], { type: 'application/pdf' }), url = URL.createObjectURL(blob);
    let file = null; try { file = new File([u8], name, { type: 'application/pdf' }); } catch (e) {}
    const viaShare = () => navigator.share({ files: [file], title: cap }).catch(e => { if (e && e.name === 'NotAllowedError') toast(t('Order form ready'), t('Share'), viaShare, 12000); });
    if (!view && file && navigator.canShare && navigator.canShare({ files: [file] })) return viaShare();
    if (view && window.open(url, '_blank')) return;
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  const waLink = (digits, text) => 'https://wa.me/' + (digits || '') + '?text=' + encodeURIComponent(text);
  function phoneDigits(p) {
    let d = digits(p).replace(/\D/g, '');
    if (d.startsWith('00')) d = d.slice(2);
    if (d.startsWith('0')) d = '971' + d.slice(1);
    else if (/^5\d{8}$/.test(d)) d = '971' + d;
    return d.length >= 9 ? d : '';
  }
  function open(url) { if (N && N.open) N.open(url); else if (/^(tel|mailto|sms):/.test(url)) location.href = url; else window.open(url, '_blank'); }
  function copy(text, msg) {
    const done = () => toast(msg || t('Copied'));
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => oldCopy(text, done));
    else oldCopy(text, done);
  }
  function oldCopy(text, done) { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); done(); }

  /* ================= pieces of UI ================= */
  // a photo on white, fading in once loaded
  function photo(src, alt, extra) {
    return '<div class="ph' + (src ? ' is-loading' : ' ph--none') + (extra ? ' ' + extra : '') + '">' + (src ? '<img src="' + esc(src) + '" alt="' + esc(alt || '') + '" decoding="async" loading="lazy">' : '') + '</div>';
  }
  function wirePhotos(r) {
    $$('.ph img', r).forEach(img => {
      if (img.__wired) return; img.__wired = true;
      const done = () => { img.classList.add('is-in'); img.parentNode.classList.remove('is-loading'); };
      const fail = () => { const p = img.parentNode; if (!p) return; p.classList.remove('is-loading'); p.classList.add('ph--none'); img.remove(); };
      const again = () => { const src = img.getAttribute('src'); if (!src || img.__again) return fail(); img.__again = true; img.addEventListener('error', fail, { once: true }); setTimeout(() => { img.src = src + (src.indexOf('?') < 0 ? '?' : '&') + 'again=1'; }, 1200); };
      if (img.complete && img.naturalWidth) done();
      else {
        img.addEventListener('load', done, { once: true });
        if (img.complete && img.getAttribute('src')) again();
        else img.addEventListener('error', again, { once: true });
      }
    });
  }
  const bar = (title, right) => '<header class="bar"><button class="ib" data-back aria-label="' + esc(t('Back')) + '">' + I.back + '</button><div class="bar__t">' + esc(title) + '</div>' + (right || '') + '</header>';
  const pageHead = (title, right, backLabel) => '<header class="phead">' + (backLabel ? '<button class="phead__back" data-back>' + I.back + esc(backLabel) + '</button>' : '') + '<div class="phead__row"><h1>' + esc(title) + '</h1>' + (right || '') + '</div></header>';
  // minOne: the quantity cannot go below 1 here (Remove takes it away), so − is greyed out at 1
  function stepper(q, attrs, minOne) {
    return '<div class="st"' + (attrs || '') + '><button data-st="-1" aria-label="Less"' + (minOne && q <= 1 ? ' disabled' : '') + '>−</button><input inputmode="numeric" aria-label="Quantity" value="' + q + '"><button data-st="1" aria-label="More">+</button></div>';
  }
  function qtyBox(start, onChange) {
    let n = start;
    const el = h(stepper(n, '', true));
    const inp = $('input', el), less = $('[data-st="-1"]', el);
    const set = v => { n = Math.max(1, Math.min(99999, v)); inp.value = n; less.disabled = n <= 1; onChange && onChange(n); };
    el.addEventListener('click', e => { const b = e.target.closest('[data-st]'); if (b) { set(n + +b.dataset.st); buzz(); } });
    inp.addEventListener('change', () => { const d = qtyIn(inp.value); set(d != null ? d : n); });
    inp.addEventListener('focus', () => inp.select());
    return { el, get: () => n, set };
  }
  function updateBadge(pop) {
    const b = $('#badge'); if (!b) return;
    const n = lines.length;
    b.hidden = !n; b.textContent = n > 99 ? '99+' : n;
    if (pop) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
  }
  function flyToCart(src) {
    updateBadge(true); buzz();
    const tb = $('#tabs [data-tab="cart"]');
    if (!src || !tb || reduce || !src.getAttribute) return;
    const a = src.getBoundingClientRect(), tr = tb.getBoundingClientRect();
    if (!a.width) return;
    const s = Math.min(a.width, a.height, 140);
    const f = h('<div class="fly"><img src="' + esc(src.getAttribute('src') || '') + '" alt=""></div>');
    Object.assign(f.style, { left: (a.left + a.width / 2 - s / 2) + 'px', top: (a.top + a.height / 2 - s / 2) + 'px', width: s + 'px', height: s + 'px' });
    document.body.appendChild(f);
    const dx = tr.left + tr.width / 2 - (a.left + a.width / 2), dy = tr.top + 14 - (a.top + a.height / 2);
    f.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: 'translate(' + dx * .35 + 'px,' + (dy * .2 - 70) + 'px) scale(.7)', opacity: 1, offset: .4 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.12)', opacity: .5 }
    ], { duration: 720, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => { f.remove(); updateBadge(true); };
  }

  /* ---- Bait Al Maqdis: price line on a card, and one size row with its price and Add ---- */
  function priceLine(o) {
    const ps = o.r.map(r => r[2]).filter(p => p != null);
    if (!ps.length) return '<span class="pl pl--ask">' + esc(t('Price on request')) + '</span>';
    const lo = Math.min.apply(null, ps), same = ps.length === o.r.length && ps.every(p => p === lo);
    return '<span class="pl">' + (same ? '' : '<i>' + esc(t('from')) + '</i> ') + money(lo) + '</span>';
  }
  const sizesLine = o => o.r.length > 1 ? cnt(o.r.length, 'size') : (ts(o.r[0][1]) || o.r[0][0] || '');
  function rowHTML(o, j) {
    const r = o.r[j], q = qtyOf(o, j);
    return '<div class="row' + (q ? ' is-in' : '') + '" data-row="' + o.id + '|' + j + '"><div class="row__l"><b>' + bd(ts(r[1]) || r[0]) + '</b>' + (r[1] && r[0] ? '<small>' + bd(r[0]) + '</small>' : '') + '</div>' +
      '<div class="row__r"><span class="row__p">' + (r[2] != null ? money(r[2]) : '<em>' + esc(t('On request')) + '</em>') + '</span>' +
      (q ? stepper(q) : '<button class="radd" data-radd>+ ' + esc(t('Add')) + '</button>') + '</div></div>';
  }
  const qtyTag = o => { const q = qtyAll(o); return '<span class="qtag"' + (q ? '' : ' hidden') + '>' + (q ? esc(nfmt(q) + ' ' + t('in cart')) : '') + '</span>'; };
  // the card in a category: the front shows the product, a tap flips it over to every size with its price
  function flipCard(o, d) {
    const name = esc(tn(o.n));
    return '<div class="flip tile" style="animation-delay:' + d + 'ms" data-item="' + o.id + '">' +
      '<div class="flip__in">' +
        '<div class="face face--front" data-flip role="button" tabindex="0">' + photo(o.img, o.n) + qtyTag(o) + '<i class="selbox" aria-hidden="true">' + I.check + '</i>' +
          '<div class="face__t"><b>' + name + '</b><span class="face__s">' + bd(sizesLine(o)) + '</span>' + priceLine(o) + '</div>' +
          '<i class="flipi" aria-hidden="true">' + I.flip + '</i></div>' +
        '<div class="face face--back"><div class="back__h" data-flip><b>' + name + '</b><button class="flipi flipi--share" data-share1="' + o.id + '" aria-label="' + esc(t('Share')) + '">' + I.share + '</button><i class="flipi flipi--back">' + I.flip + '</i></div>' +
          '<div class="rows">' + o.r.map((r, j) => rowHTML(o, j)).join('') + '</div>' +
          (o.spec.length ? '<button class="specbtn" data-spec="' + o.id + '">' + I.zoom + esc(t('Spec sheet')) + '</button>' : '') +
        '</div>' +
      '</div></div>';
  }
  // the same sizes and prices in a sheet (from search and the cart)
  function itemSheet(o) {
    const body = h('<div data-item="' + o.id + '" class="isheet"><div class="shead">' + photo(o.img, o.n, 'ph--zoom') + '<div><small>' + esc(tn(o.c.name)) + ' · ' + esc(tn(o.sec)) + '</small><b>' + esc(tn(o.n)) + '</b>' + qtyTag(o) + '</div></div>' +
      '<div class="rows rows--sheet">' + o.r.map((r, j) => rowHTML(o, j)).join('') + '</div>' +
      (o.spec.length ? '<button class="specbtn" data-spec="' + o.id + '">' + I.zoom + esc(t('Spec sheet')) + '</button>' : '') +
      '<div class="prow2 sacts"><button class="btn btn--ghost" data-selone="' + o.id + '">' + I.select + '<span>' + esc(t(SEL.has(o.id) ? 'Chosen' : 'Choose')) + '</span></button>' +
        '<button class="btn btn--main" data-share1="' + o.id + '">' + I.share + esc(t('Share')) + '</button></div>' +
      '<button class="btn btn--ghost btn--full" data-go="c/' + o.c.id + '">' + esc(tn(o.c.name)) + ' ' + I.chev + '</button></div>');
    if (SEL.has(o.id)) $('[data-selone]', body).classList.add('is-on');
    const ph = $('.ph', body); ph.addEventListener('click', () => o.img && zoom(o.img));
    openSheet(body);
  }
  // after the cart changes, every place that shows this product shows the new quantities
  function paintItem(o) {
    $$('[data-item="' + o.id + '"]').forEach(box => {
      if (isB(o)) $$('.row', box).forEach(r => {
        const j = +r.dataset.row.split('|')[1];
        const ae = document.activeElement;
        if (ae && ae.tagName === 'INPUT' && r.contains(ae)) return;   // a quantity being typed
        const fresh = h(rowHTML(o, j)); r.replaceWith(fresh);
      });
      const tag = $('.qtag', box); if (tag) { const q = qtyAll(o); tag.hidden = !q; tag.textContent = q ? nfmt(q) + ' ' + t('in cart') : ''; }
      const add = $('.qadd', box); if (add) { const on = qtyAll(o) > 0; add.classList.toggle('is-in', on); add.innerHTML = on ? I.check : I.plus; }
    });
  }
  // size rows: + Add, the − / + stepper, or a typed quantity (anywhere on screen)
  document.addEventListener('click', e => {
    const row = e.target.closest('[data-row]'); if (!row) return;
    const [id, j] = row.dataset.row.split('|'), o = byId.get(id); if (!o) return;
    if (e.target.closest('[data-radd]')) { e.stopPropagation(); setRowQty(o, +j, 1); flyToCart($('.ph img.is-in', row.closest('[data-item]') || document.body)); toast(t('Added to the cart'), t('Open cart'), () => switchTab('cart')); return; }
    const st = e.target.closest('[data-st]'); if (st) { e.stopPropagation(); buzz(); setRowQty(o, +j, qtyOf(o, +j) + +st.dataset.st); }
  });
  document.addEventListener('change', e => {
    const row = e.target.closest('[data-row]'); if (!row || e.target.tagName !== 'INPUT') return;
    const [id, j] = row.dataset.row.split('|'), o = byId.get(id), d = qtyIn(e.target.value);
    e.target.blur();
    if (o) setRowQty(o, +j, d != null ? d : qtyOf(o, +j));
  });
  document.addEventListener('focusin', e => { if (e.target.closest('.st') && e.target.tagName === 'INPUT') e.target.select(); });

  function flipTo(card, on) {
    if (on === card.classList.contains('is-flipped')) return;
    clearTimeout(card.__flat);
    if (on) { card.classList.add('is-3d'); void card.offsetWidth; card.classList.add('is-flipped'); }
    else { card.classList.remove('is-flipped'); card.__flat = setTimeout(() => { if (!card.classList.contains('is-flipped')) card.classList.remove('is-3d'); }, 650); }
  }

  /* ---- Fakhri Tools: a product card (tap = product page, + = add) ---- */
  const fkCard = (o, d) => '<div class="pcard tile" style="animation-delay:' + d + 'ms" data-item="' + o.id + '" data-go="p/' + o.id + '" role="button" tabindex="0">' +
    '<button class="qadd' + (qtyAll(o) ? ' is-in' : '') + '" data-add="' + o.id + '" aria-label="' + esc(t('Add to cart')) + '">' + (qtyAll(o) ? I.check : I.plus) + '</button>' +
    photo(o.img, o.n) + '<div class="pcard__t"><b>' + esc(o.n) + '</b>' + (o.size ? '<span>' + esc(o.size.split(' · ')[0]) + '</span>' : '') + '</div></div>';
  // one row in search results and lists
  const openAttr = o => isB(o) ? 'data-sheet="' + o.id + '"' : 'data-go="p/' + o.id + '"';
  const pName = o => isB(o) ? tn(o.n) : o.n;
  const cName = c => c.src === 'bam' ? tn(c.name) : c.name;
  const catLabel = c => c.src === 'bam' ? tn(c.name) : shortCat(c.name);   // short name, for tiles and lists
  const prodRow = (o, mark) => '<button class="prow" ' + openAttr(o) + '>' + photo(o.img, o.n) +
    '<div class="prow__t"><small>' + esc(catLabel(o.c)) + '</small><b>' + (mark ? mark(pName(o)) : esc(pName(o))) + '</b>' +
    (isB(o) ? '<span>' + bd(sizesLine(o)) + ' · ' + priceLine(o) + '</span>' : (o.size ? '<span>' + esc(o.size.split(' · ')[0]) + '</span>' : '')) + '</div>' + I.chev + '</button>';

  /* ================= views and tabs ================= */
  const stage = $('#stage');
  // the PDF catalogues packed in the app (Bait Al Maqdis): one per group (app/tools/bam_pdfs.cjs), or the list's own printed ones
  const PDFS = (ROWS && ((BR.pdfs && window[BR.pdfs]) || window[BR.data].pdfs) || []).map(p => ({
    id: p.id || '', file: p.file, cover: p.cover ? DIR + p.cover : '', title: p.title, n: p.n || 0, pages: p.pages || 0, mb: p.mb, sub: p.sub || ''
  }));
  const pdfOf = c => PDFS.find(p => p.id && BR.cid + p.id === c.id);
  const TABS = PDFS.length ? ['home', 'orders', 'pdfs', 'cart'] : ['home', 'orders', 'cart'];
  const TAB_ICON = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    orders: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18H6z"/><path d="M9 3v2h6V3M9 10h6M9 14h6"/></svg>',
    pdfs: '<svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/><text x="7.4" y="17.6" font-size="5.2" font-weight="700" stroke="none" fill="currentColor" font-family="sans-serif">PDF</text></svg>',
    cart: '<svg viewBox="0 0 24 24"><path d="M3 4h2.5l2.2 11h10.6L20.5 7H7"/><circle cx="9.5" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/></svg>'
  };
  const TAB_NAME = { home: 'Home', orders: 'Orders', pdfs: 'PDFs', cart: 'Cart' };
  $('#tabs').innerHTML = '<div class="tabs__in" style="grid-template-columns:repeat(' + TABS.length + ',1fr)">' + TABS.map(tb => '<button data-tab="' + tb + '"' + (tb === 'home' ? ' class="is-on"' : '') + '>' + TAB_ICON[tb] + '<span>' + esc(t(TAB_NAME[tb])) + '</span>' + (tb === 'cart' ? '<b id="badge" hidden>0</b>' : '') + '</button>').join('') +
    '<i id="tabInk" style="width:' + (100 / TABS.length) + '%"></i></div>';
  const stacks = {}; TABS.forEach(tb => { stacks[tb] = []; });
  let tab = 'home', busy = false;
  const top = () => { const st = stacks[tab]; return st ? st[st.length - 1] : null; };

  function build(route) {
    const [kind, a, b] = route.split('/');
    let v = null;
    if (kind === 'home') v = viewHome();
    else if (kind === 'c') v = viewCat(a);
    else if (kind === 'p') v = viewProduct(a + '/' + b);
    else if (kind === 'search') v = viewSearch();
    else if (kind === 'settings') v = viewSettings();
    else if (kind === 'cart') v = viewCart();
    else if (kind === 'checkout') v = viewCheckout();
    else if (kind === 'placed') v = viewPlaced(a);
    else if (kind === 'orders') v = viewOrders();
    else if (kind === 'order') v = viewOrder(a);
    else if (kind === 'pdfs' && TABS.indexOf('pdfs') >= 0) v = viewPdfs();
    if (!v) v = kind === 'cart' || kind === 'orders' || kind === 'pdfs' ? viewCart() : viewHome();
    v.el.classList.add('view');
    v.route = route;
    wirePhotos(v.el);
    return v;
  }
  function show(v, on) { v.el.style.visibility = on ? '' : 'hidden'; v.el.classList.toggle('is-under', !on); if (on && v.onShow) v.onShow(); if (!on && v.onHide) v.onHide(); }
  const rtl = () => root.dir === 'rtl';

  let fromImg = null;   // the photo that was tapped, for the zoom-into-place animation
  function go(route, opts = {}) {
    if (busy) return;
    const st = stacks[tab], prev = top();
    const v = build(route);
    stage.appendChild(v.el);
    st.push(v);
    saveRoutes();
    if (opts.instant || reduce) { if (prev) show(prev, false); show(v, true); fromImg = null; return; }
    busy = true;
    const hero = fromImg && $('[data-hero]', v.el);
    const ease = 'cubic-bezier(.16,1,.3,1)', dir = rtl() ? -1 : 1;
    let anim, prevAnim;
    if (hero && fromImg.isConnected) {
      anim = v.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, easing: 'ease-out' });
      flyHero(fromImg, hero);
      if (prev) prevAnim = prev.el.animate([{ opacity: 1, transform: 'none' }, { opacity: .2, transform: 'scale(.96)' }], { duration: 400, easing: ease, fill: 'forwards' });
    } else {
      anim = v.el.animate([{ transform: 'translateX(' + (100 * dir) + '%)' }, { transform: 'none' }], { duration: 440, easing: ease });
      if (prev) prevAnim = prev.el.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(' + (-26 * dir) + '%)', opacity: .35 }], { duration: 440, easing: ease, fill: 'forwards' });
    }
    show(v, true);
    fromImg = null;
    anim.onfinish = () => { busy = false; if (prev) { if (prevAnim) prevAnim.cancel(); show(prev, false); } };
  }
  function flyHero(src, dst) {
    const a = src.getBoundingClientRect(), img = $('img', dst);
    if (!img || !a.width) return;
    const g = h('<div class="ghost"><img src="' + esc(src.getAttribute('src')) + '" alt=""></div>');
    const r0 = getComputedStyle(src.closest('.ph') || src).borderRadius;
    Object.assign(g.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px', borderRadius: r0 });
    $('img', g).style.padding = getComputedStyle(src).padding;
    document.body.appendChild(g);
    dst.style.visibility = 'hidden';
    requestAnimationFrame(() => {
      const b = dst.getBoundingClientRect(), ip = getComputedStyle(img).padding;
      const an = g.animate([
        { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px', borderRadius: r0 },
        { left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px', borderRadius: getComputedStyle(dst).borderRadius }
      ], { duration: 500, easing: 'cubic-bezier(.2,.9,.2,1)', fill: 'forwards' });
      $('img', g).animate([{ padding: getComputedStyle(src).padding }, { padding: ip }], { duration: 500, easing: 'cubic-bezier(.2,.9,.2,1)', fill: 'forwards' });
      an.onfinish = () => { dst.style.visibility = ''; const di = $('img', dst); if (di) { di.classList.add('is-in'); dst.classList.remove('is-loading'); } g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160 }).onfinish = () => g.remove(); };
    });
  }
  function pop(instant) {
    const st = stacks[tab];
    if (st.length < 2 || busy) return false;
    const v = st.pop(), prev = top();
    saveRoutes();
    show(prev, true);
    if (prev.dirty && prev.refresh) prev.refresh();
    if (instant || reduce) { v.el.remove(); if (v.onHide) v.onHide(); return true; }
    busy = true;
    const ease = 'cubic-bezier(.16,1,.3,1)', dir = rtl() ? -1 : 1;
    prev.el.animate([{ transform: 'translateX(' + (-26 * dir) + '%)', opacity: .35 }, { transform: 'none', opacity: 1 }], { duration: 400, easing: ease });
    if (v.onHide) v.onHide();
    v.el.animate([{ transform: 'none' }, { transform: 'translateX(' + (100 * dir) + '%)' }], { duration: 400, easing: ease }).onfinish = () => { v.el.remove(); busy = false; };
    return true;
  }
  // drop every screen above the first in a tab, with no animation
  function resetTab(tb) { const st = stacks[tb]; while (st.length > 1) { const v = st.pop(); v.el.remove(); } }
  function switchTab(tb, route) {
    if (busy || !stacks[tb]) return;
    $$('#tabs [data-tab]').forEach(b => b.classList.toggle('is-on', b.dataset.tab === tb));
    $('#tabInk').style.transform = 'translateX(' + (TABS.indexOf(tb) * 100 * (rtl() ? -1 : 1)) + '%)';
    if (tb === tab && !route) {
      const st = stacks[tab];
      if (st.length > 1) { while (st.length > 2) { const v = st.splice(st.length - 2, 1)[0]; v.el.remove(); } pop(); }
      else if (st[0]) { st[0].el.scrollTo({ top: 0, behavior: 'smooth' }); if (st[0].onRetap) st[0].onRetap(); }
      return;
    }
    const was = top();
    tab = tb;
    if (!stacks[tb].length) { const v = build(tb); stage.appendChild(v.el); stacks[tb].push(v); }
    const v = top();
    if (was && was !== v) show(was, false);
    show(v, true);
    if (v.dirty && v.refresh) v.refresh();
    if (!reduce) v.el.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.16,1,.3,1)' });
    saveRoutes();
    if (route) go(route);
  }
  function saveRoutes() { try { sessionStorage.setItem('ft-routes', JSON.stringify({ brand: brandId, tab, st: Object.fromEntries(TABS.map(tb => [tb, stacks[tb].map(v => v.route)])) })); } catch (e) {} }

  // Android back button: close what is open, then step back, then go Home; false = leave the app
  function back() {
    if (!$('#zoom').hidden) { closeZoom(); return true; }
    if (!$('#sheet').hidden) { closeSheet(); return true; }
    if (busy) return true;
    const fl = $('.flip.is-flipped', top() && top().el); if (fl) { flipTo(fl, false); return true; }
    if (selecting || SEL.size) { endSelect(); return true; }
    if (pop()) return true;
    if (tab !== 'home') { switchTab('home'); return true; }
    return false;
  }

  // one tap handler for everything
  document.addEventListener('click', e => {
    const tg = e.target;
    // choosing and sending products, and a group's catalogue
    if (tg.closest('[data-selmode]')) { setSelecting(!selecting); buzz(); return; }
    if (tg.closest('[data-selx]')) { endSelect(); return; }
    if (tg.closest('[data-selshare]')) { const its = [...SEL].map(id => byId.get(id)).filter(Boolean); if (its.length) shareSheet(its, true); return; }
    const s1 = tg.closest('[data-share1]');
    if (s1) { e.stopPropagation(); const o = byId.get(s1.dataset.share1); if (o) shareSheet([o], false); return; }
    const so = tg.closest('[data-selone]');
    if (so) { const o = byId.get(so.dataset.selone); if (o) { toggleSel(o); const on = SEL.has(o.id); so.classList.toggle('is-on', on); $('span', so).textContent = t(on ? 'Chosen' : 'Choose'); buzz(); } return; }
    const ps = tg.closest('[data-pdfsheet]');
    if (ps) { const p = PDFS.find(x => x.id === ps.dataset.pdfsheet); if (p) pdfSheet(p); return; }
    const add = tg.closest('[data-add]');
    if (add) { e.stopPropagation(); quickAdd(byId.get(add.dataset.add), add); return; }
    const sh = tg.closest('[data-sheet]');
    if (sh) { const o = byId.get(sh.dataset.sheet); if (o) itemSheet(o); return; }
    const sp = tg.closest('[data-spec]');
    if (sp) { const o = byId.get(sp.dataset.spec); if (o) zoom(o.spec[0]); return; }
    const goEl = tg.closest('[data-go]');
    if (goEl) {
      fromImg = $('.ph img.is-in', goEl) || null;
      if (goEl.closest('#sheet')) { closeSheet(); fromImg = null; }
      const r = goEl.dataset.go;
      if (r === 'search' || r.indexOf('c/') === 0 || r.indexOf('p/') === 0 || r === 'settings') { if (tab !== 'home') { switchTab('home'); setTimeout(() => go(r), 360); return; } }
      go(r); return;
    }
    if (tg.closest('[data-back]')) { back(); return; }
    const tb = tg.closest('[data-tab]');
    if (tb) { switchTab(tb.dataset.tab); return; }
    if (tg.closest('[data-lang]')) { setLang(lang === 'ar' ? 'en' : 'ar'); return; }
    const ext = tg.closest('[data-open]');
    if (ext) { open(ext.dataset.open); return; }
  });
  function setLang(l) { store.set('app-lang', l); saveRoutes(); try { sessionStorage.setItem('ft-reload', '1'); } catch (e) {} location.reload(); }
  const langPill = () => !(WEB && WEB.brand) || lang === 'ar' ? '<button class="langpill" data-lang>' + (lang === 'ar' ? 'English' : 'عربي') + '</button>' : '';

  /* ================= HOME ================= */
  // a category tile: a product photo on white with the name under it, for both companies
  function catTile(c, i) {
    const d = Math.min(i, 14) * 28;
    return '<button class="ctile ctile--fk tile" style="animation-delay:' + d + 'ms" data-cat data-go="c/' + c.id + '">' + photo(c.tile, c.name) + '<b>' + esc(catLabel(c)) + '</b></button>';
  }
  // the branch's logo at the top of Home: Bait Al Maqdis with its tag line, the others as they are
  function heroLogo() {
    if (BAM) return '<img class="hero__logo hero__logo--bam" src="bam/logo.png" alt="Bait Al Maqdis"><p class="hero__tag"><i></i><span>' + esc(t('TOOLS & MORE')) + '</span><i></i></p>';
    if (brandId === 'fakhri') return '<img class="hero__logo hero__logo--fk" src="' + fkLogo() + '" alt="Fakhri Tools &amp; Workshop Materials Trading LLC">';
    return '<span class="hero__plate hero__plate--' + brandId + '"><img class="hero__logo hero__logo--' + brandId + '" src="' + esc(BR.logo) + '" alt="' + esc(BR.full) + '"></span>';
  }
  /* Bait Al Maqdis home: the logo with the shop's numbers, search, its top ranges big, the PDF catalogues, then every group */
  function viewHomeRows() {
    const top = (BR.first || []).map(x => catBy(BR.cid + x)).filter(Boolean), rest = CATS.filter(c => top.indexOf(c) < 0);
    const parts = P.reduce((a, o) => a + o.r.length, 0);
    const feat = (c, i) => '<button class="fcard tile" style="animation-delay:' + (60 + i * 70) + 'ms" data-cat data-go="c/' + c.id + '">' +
      '<span class="fcard__t"><small>' + esc(t('Top range')) + '</small><b>' + esc(catLabel(c)) + '</b><span>' + esc(cnt(c.items.length, 'product')) + ' · ' + esc(cnt(c.secs.length, 'section')) + '</span>' +
      '<em>' + esc(t('Open')) + I.chev + '</em></span>' + photo(c.tile, c.name) + '</button>';
    const tile = (c, i) => '<button class="btile tile" style="animation-delay:' + (Math.min(i, 12) * 30 + 120) + 'ms" data-cat data-go="c/' + c.id + '">' + photo(c.tile, c.name) +
      '<span class="btile__t"><b>' + esc(catLabel(c)) + '</b><span>' + esc(cnt(c.items.length, 'product')) + '</span></span></button>';
    const covers = PDFS.filter(p => p.cover).slice(0, 3);
    const el = h('<section class="home home--rows">' +
      '<div class="home__top"><button class="ib ib--soft" data-go="settings" aria-label="' + esc(t('Settings')) + '">' + I.gear + '</button>' + langPill() + '</div>' +
      '<div class="bhero tile">' + heroLogo() +
        '<div class="bstats"><div><b>' + nfmt(P.length) + '</b><span>' + esc(t('Products')) + '</span></div><div><b>' + nfmt(CATS.length) + '</b><span>' + esc(t('Ranges')) + '</span></div><div><b>' + nfmt(parts) + '</b><span>' + esc(t('Part numbers')) + '</span></div></div></div>' +
      '<button class="searchbox searchbox--big" data-go="search">' + I.search + '<span>' + esc(t('Search {n} products', { n: nfmt(P.length) })) + '</span></button>' +
      (top.length ? '<h2 class="bh">' + esc(t('Top ranges')) + '</h2><div class="feat">' + top.map(feat).join('') + '</div>' : '') +
      (PDFS.length ? '<button class="pdfpromo tile" data-tab="pdfs"><span class="pdfpromo__covers">' + (covers.length ? covers.map(p => '<img src="' + esc(p.cover) + '" alt="">').join('') : I.pdf) + '</span>' +
        '<span class="pdfpromo__t"><b>' + esc(t('PDF catalogues')) + '</b><span>' + esc(t('{n} catalogues to open or send on WhatsApp', { n: nfmt(PDFS.length) })) + '</span></span>' + I.chev + '</button>' : '') +
      '<h2 class="bh">' + esc(t(top.length ? 'More ranges' : 'All categories')) + '<span>' + nfmt(rest.length) + '</span></h2>' +
      '<div class="bgrid">' + rest.map(tile).join('') + '</div>' +
      '<p class="foot">' + esc(BR.full) + (N && N.version ? '<br>' + esc(t('App version')) + ' ' + esc(N.version()) : '') + '</p>' +
      '</section>');
    return { el };
  }
  function viewHome() {
    if (BAM) return viewHomeRows();
    const el = h('<section class="home">' +
      '<div class="home__top"><button class="ib ib--soft" data-go="settings" aria-label="' + esc(t('Settings')) + '">' + I.gear + '</button>' + langPill() + '</div>' +
      '<div class="hero">' + heroLogo() + '</div>' +
      '<button class="searchbox" data-go="search">' + I.search + '<span>' + esc(t('Search {n} products', { n: nfmt(P.length) })) + '</span></button>' +
      '<h2 class="sech">' + I.dots + '<span>' + esc(t('Product')) + ' <em>' + esc(t('Categories')) + '</em></span></h2>' +
      '<div class="cats">' + CATS.map(catTile).join('') + '</div>' +
      '<p class="foot">' + esc(BR.full) + (N && N.version ? '<br>' + esc(t('App version')) + ' ' + esc(N.version()) : '') + '</p>' +
      '</section>');
    return { el };
  }

  /* ================= ONE CATEGORY ================= */
  function viewCat(id) {
    const c = catBy(id);
    if (!c) return null;
    const CB = c.src === 'bam';
    const groups = CB ? c.secs : [...new Set(c.items.map(o => o.group).filter(Boolean))];
    const gOf = o => CB ? o.sec : o.group;
    const gName = g => CB ? tn(g) : g;
    let cur = '';
    const pdf = CB ? pdfOf(c) : null;
    const el = h('<section class="' + (CB ? 'catv' : '') + '">' + bar(cName(c), '<button class="ib" data-go="search" aria-label="' + esc(t('Search')) + '">' + I.search + '</button>' +
        (CB ? '<button class="ib ib--sel" data-selmode aria-label="' + esc(t('Select')) + '">' + I.select + '</button>' : '')) +
      (CB ? '<div class="chead">' + photo(c.tile, c.name) + '<div class="chead__t"><b>' + esc(cnt(c.items.length, 'product')) + '</b><span>' + esc(t('Tap a card to see the prices')) + '</span></div>' +
        (pdf ? '<button class="chead__pdf" data-pdfsheet="' + esc(pdf.id) + '">' + I.pdf + '<span>' + esc(t('Catalogue')) + '</span></button>' : '') + '</div>' : '') +
      (groups.length > 1 ? '<div class="chips">' + [''].concat(groups).map(g => '<button class="chip' + (g === cur ? ' is-on' : '') + '" data-g="' + esc(g) + '">' + esc(g ? gName(g) : t('All')) + ' <b>' + (g ? c.items.filter(o => gOf(o) === g).length : c.items.length) + '</b></button>').join('') + '</div>' : '') +
      '<div class="view__pad">' + (CB ? '' : '<p class="hint">' + esc(cnt(c.items.length, 'product')) + '</p>') + '<div id="grid"></div></div></section>');
    const v = { el };
    function fill() {
      const g = $('#grid', el), list = c.items.filter(o => !cur || gOf(o) === cur);
      let html = '', last = null, i = 0;
      list.forEach(o => {
        if (CB && !cur && groups.length > 1 && o.sec !== last) { if (last !== null) html += '</div>'; html += '<h3 class="gsec">' + esc(tn(o.sec)) + '</h3><div class="pgrid">'; last = o.sec; }
        else if (last === null) { html += '<div class="pgrid">'; last = ''; }
        html += CB ? flipCard(o, Math.min(i, 8) * 40) : fkCard(o, Math.min(i, 8) * 40);
        i++;
      });
      g.innerHTML = html + '</div>';
      wirePhotos(g);
      if (CB) paintSel(g);
    }
    fill();
    el.addEventListener('click', e => {
      const ch = e.target.closest('.chip[data-g]');
      if (ch) { cur = ch.dataset.g; $$('.chip', el).forEach(x => x.classList.toggle('is-on', x === ch)); fill(); el.scrollTo({ top: 0 }); ch.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); return; }
      if (e.target.closest('[data-share1]')) return;   // the share button on the back of a card (the tap handler below)
      // choosing products to send: a tap picks or drops the card instead of turning it over
      if (CB && (selecting || held)) {
        const card = e.target.closest('.flip');
        if (card && !held) { const o = byId.get(card.dataset.item); if (o) { toggleSel(o); buzz(); } }
        held = false; return;
      }
      const f = e.target.closest('[data-flip]');
      if (f && !e.target.closest('[data-row]')) { const card = f.closest('.flip'); flipTo(card, !card.classList.contains('is-flipped')); buzz(); }
    });
    // a long press on a card starts choosing products to send, with that one chosen
    let held = false, hold = null, hx = 0, hy = 0;
    if (CB) {
      el.addEventListener('touchstart', e => {
        const card = e.target.closest('.flip'); if (!card || card.classList.contains('is-flipped') || e.touches.length > 1) return;
        hx = e.touches[0].clientX; hy = e.touches[0].clientY; clearTimeout(hold);
        hold = setTimeout(() => { hold = null; const o = byId.get(card.dataset.item); if (!o) return; held = true; if (!selecting) setSelecting(true); if (!SEL.has(o.id)) toggleSel(o); buzz(); }, 480);
      }, { passive: true });
      el.addEventListener('touchmove', e => { if (hold && (Math.abs(e.touches[0].clientX - hx) > 10 || Math.abs(e.touches[0].clientY - hy) > 10)) { clearTimeout(hold); hold = null; } }, { passive: true });
      el.addEventListener('touchend', () => { if (hold) { clearTimeout(hold); hold = null; } if (held) setTimeout(() => { held = false; }, 400); }, { passive: true });
      el.addEventListener('contextmenu', e => { if (e.target.closest('.flip')) e.preventDefault(); });
    }
    v.refresh = () => { c.items.forEach(paintItemQuiet); paintSel(el); v.dirty = false; };
    v.onShow = () => paintSel(el);
    return v;
  }
  function paintItemQuiet(o) { if ($('[data-item="' + o.id + '"]')) paintItem(o); }

  /* ================= ONE PRODUCT (Fakhri Tools) ================= */
  const WM = BR.wm ? '<img class="wm" src="' + BR.wm + '" alt="" aria-hidden="true" draggable="false">' : '';   // Fakhri Tools marks its own photos
  function viewProduct(id) {
    const o = byId.get(id);
    if (!o || isB(o)) return null;
    const sibs = o.c.items.filter(x => x !== o);
    const el = h('<section class="pview">' + bar(o.n) +
      '<div class="phero"><div data-hero class="ph-wrap">' + photo(o.img, o.n) + '</div>' + (o.img ? WM + '<button class="phero__zoom" data-zoom aria-label="Zoom">' + I.zoom + '</button>' : '') + '</div>' +
      '<div class="pbody" data-item="' + o.id + '">' +
        '<button class="crumb" data-go="c/' + o.c.id + '">' + esc(catLabel(o.c)) + ' ' + I.chev + '</button>' +
        '<h1>' + esc(o.n) + '</h1>' +
        '<div id="pk"></div>' +
        '<div class="addrow"><div id="qty"></div><button class="btn btn--main" id="addBtn">' + I.plus + esc(t('Add to cart')) + '</button></div>' +
        (sibs.length ? '<h3 class="rail__h">' + esc(t('More in this category')) + '</h3><div class="rail">' + sibs.slice(0, 12).map(x => '<button class="mini" data-go="p/' + x.id + '">' + photo(x.img, x.n) + '<b>' + esc(x.n) + '</b></button>').join('') + '</div>' : '') +
      '</div></section>');
    const v = { el };
    const pk = picker(o); $('#pk', el).appendChild(pk.el);
    const q = qtyBox(1); $('#qty', el).replaceWith(q.el);
    $('#addBtn', el).addEventListener('click', () => {
      if (!pk.check()) return;
      addFk(o, pk.read(), q.get());
      flyToCart($('.phero .ph img', el));
      toast(t('Added to the cart'), t('Open cart'), () => switchTab('cart'));
      pk.reset(); q.set(1);
    });
    const z = $('[data-zoom]', el); if (z) z.addEventListener('click', () => zoom(o.img));
    $('.phero .ph', el).addEventListener('click', () => o.img && zoom(o.img));
    return v;
  }

  /* choice buttons, same rules as the website's product window: one size, any specs & ratings, one material.
     Anything left open is sent as "to confirm". */
  function picker(o, cur) {
    const sp = sizeSpec(o), specs = specOpts(o), m = matOpts(o);
    const el = h('<div class="pk"></div>');
    let s = sp.t === 'one' ? sp.v : '', a = '', b = '', sps = new Set(specs.length === 1 ? specs : []), mt = '';
    const hdr = (x, y) => '<div class="pk__h"><b>' + esc(t(x)) + '</b>' + (y ? '<span>' + esc(t(y)) + '</span>' : '') + '</div>';
    const chip = (row, val, on, extra) => '<button class="sz' + (on ? ' is-on' : '') + (extra || '') + '" data-row2="' + row + '" data-v="' + esc(val) + '">' + (val === '?' ? esc(t('Not sure')) : bd(val)) + '</button>';
    function draw() {
      let x = '';
      if (sp.t === 'one') x = '<div class="pkg">' + hdr('Size') + '<div class="sizes">' + chip('one', sp.v, true) + '</div></div>';
      else if (sp.t === 'sel') x = '<div class="pkg" data-g="size">' + hdr('Size', 'choose one') + '<div class="sizes">' + sp.opts.map(val => chip('s', val, s === val)).join('') + chip('s', '?', s === '?', ' sz--ask') + '</div></div>';
      else if (sp.t === 'pair') {
        const lim = sp.lt && a && a !== '?' ? rung(a) : 99;
        x = '<div class="pkg" data-g="size">' + hdr('Size', sp.lt ? 'big end, then small end' : 'both ends') +
          '<p class="pk__sub">' + (sp.lt ? 'Big end' : 'First end') + '</p><div class="sizes">' + sp.L.map(val => chip('a', val, a === val)).join('') + chip('a', '?', a === '?', ' sz--ask') + '</div>' +
          '<p class="pk__sub">' + (sp.lt ? 'Small end' : 'Second end') + '</p><div class="sizes">' + sp.S.map(val => chip('b', val, b === val, sp.lt && rung(val) >= lim ? ' is-off' : '')).join('') + chip('b', '?', b === '?', ' sz--ask') + '</div></div>';
      } else if (o.size || sp.len) x = '<div class="pkg">' + hdr('Size', sp.hint ? 'we offer ' + sp.hint : '') + '<input class="field" data-t maxlength="40" placeholder="' + esc(sp.hint ? 'Type the size (' + sp.hint + ')' : 'Size, if the customer knows it') + '"></div>';
      if (sp.len) x += '<p class="pk__sub">Length</p><input class="field" data-len maxlength="30" placeholder="Length (' + esc(sp.len) + ')">';
      if (sp.note) x += '<p class="note">' + esc(sp.note) + '</p>';
      if (specs.length) x += '<div class="pkg" data-g="specs">' + hdr('Specs & ratings', specs.length > 1 ? 'tap the ones you need' : '') + '<div class="sizes">' + specs.map(val => chip('sp', val, sps.has(val))).join('') + (specs.length > 1 ? chip('sp', '?', sps.has('?'), ' sz--ask') : '') + '</div></div>';
      if (m.opts.length) x += '<div class="pkg" data-g="mat">' + hdr('Material', m.opts.length > 1 ? 'choose one' : '') + '<div class="sizes">' + (m.opts.length > 1 ? m.opts.map(val => chip('mt', val, mt === val)).join('') : '<button class="sz' + (mt !== '?' ? ' is-on' : '') + '" data-row2="mt" data-v="' + esc(m.opts[0]) + '">' + esc(m.full) + '</button>') + chip('mt', '?', mt === '?', ' sz--ask') + '</div>' + (m.note && m.opts.length > 1 ? '<p class="pk__n">' + esc(m.note) + '</p>' : '') + '</div>';
      const keep = { tx: $('[data-t]', el) && $('[data-t]', el).value, len: $('[data-len]', el) && $('[data-len]', el).value };
      el.innerHTML = x;
      if (keep.tx && $('[data-t]', el)) $('[data-t]', el).value = keep.tx;
      if (keep.len && $('[data-len]', el)) $('[data-len]', el).value = keep.len;
    }
    el.addEventListener('click', e => {
      const c = e.target.closest('.sz'); if (!c) return;
      const row = c.dataset.row2, val = c.dataset.v;
      if (row === 'one') return;
      if (row === 's') s = s === val ? '' : val;
      else if (row === 'a') { a = a === val ? '' : val; if (sp.lt && a && a !== '?' && b && b !== '?' && rung(b) >= rung(a)) b = ''; }
      else if (row === 'b') b = b === val ? '' : val;
      else if (row === 'sp') { if (sps.has(val)) sps.delete(val); else { if (val === '?') sps.clear(); else sps.delete('?'); sps.add(val); } }   // "Not sure" or specs, not both
      else if (row === 'mt') mt = m.opts.length > 1 ? (mt === val ? '' : val) : val === '?' && mt !== '?' ? '?' : '';   // one material: it, or Not sure
      buzz(); draw();
    });
    if (cur) {
      const [base, len] = String(cur.s || '').split(' · ');
      if (sp.t === 'sel' && (sp.opts.includes(base) || base === '?')) s = base;
      if (sp.t === 'pair' && base) { const [x, y] = base === '?' ? ['?', '?'] : base.split(' × '); a = x || ''; b = y || ''; }
      sps = new Set((cur.sp || []).filter(val => val === '?' ? specs.length > 1 : specs.includes(val)));
      mt = (m.opts.length > 1 && m.opts.includes(cur.mt)) || (cur.mt === '?' && m.opts.length) ? cur.mt : '';
      draw();
      const tx = $('[data-t]', el); if (tx && base && base !== '?') tx.value = base;
      const l = $('[data-len]', el); if (l && len) l.value = len;
    } else draw();
    function read() {
      let size = '';
      if (sp.t === 'one') size = sp.v;
      else if (sp.t === 'sel') size = s || (o.size ? '?' : '');
      else if (sp.t === 'pair') size = !a && !b ? '?' : (a === '?' || !a) && (b === '?' || !b) ? '?' : (sp.L.length === 1 ? sp.L[0] : a || '?') + ' × ' + (b || '?');
      else { const tx = $('[data-t]', el); size = (tx ? tx.value.replace(/[|·¦]/g, ' ').trim() : '') || (o.size ? '?' : ''); }
      const l = $('[data-len]', el), len = l ? l.value.replace(/[|·¦]/g, ' ').trim() : '';
      if (len) size = (size || '?') + ' · ' + len;
      return { s: size, sp: specs.filter(val => sps.has(val)).concat(sps.has('?') ? ['?'] : []), mt: m.opts.length > 1 || mt === '?' ? mt : '' };
    }
    // like the website: a size, the specs and the material (when there are several) need a pick or "Not sure" first
    function check() {
      const miss = (sp.t === 'sel' && !s) || (sp.t === 'pair' && (a === '?' ? false : !(sp.L.length === 1 || a) || !b)) ? 'size' : specs.length > 1 && !sps.size ? 'specs' : m.opts.length > 1 && !mt ? 'mat' : '';
      if (!miss) return true;
      const g = $('[data-g="' + miss + '"]', el);
      if (g) { g.scrollIntoView({ block: 'center', behavior: 'smooth' }); if (!reduce) g.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 300 }); g.classList.remove('is-miss'); void g.offsetWidth; g.classList.add('is-miss'); }
      buzz();
      toast(t({ size: 'Choose a size, or tap Not sure', specs: 'Choose the specs & ratings, or tap Not sure', mat: 'Choose a material, or tap Not sure' }[miss]));
      return false;
    }
    function reset() { s = sp.t === 'one' ? sp.v : ''; a = ''; b = ''; mt = ''; sps = new Set(specs.length === 1 ? specs : []); const tx = $('[data-t]', el); if (tx) tx.value = ''; const l = $('[data-len]', el); if (l) l.value = ''; draw(); }
    return { el, read, reset, check };
  }
  // the + on a Fakhri Tools card: one-size products go straight in, others ask for the choices first
  function quickAdd(o, btn) {
    if (!o) return;
    const card = btn.closest('.pcard');
    if (!hasChoices(o)) {
      addFk(o, picker(o).read(), 1);
      flyToCart(card && $('.ph img', card));
      toast(t('Added to the cart'), t('Open cart'), () => switchTab('cart'));
      return;
    }
    const pk = picker(o), q = qtyBox(1);
    const body = h('<div><div class="shead">' + photo(o.img, o.n) + '<div><small>' + esc(catLabel(o.c)) + '</small><b>' + esc(o.n) + '</b></div></div><div id="spk"></div>' +
      '<div class="addrow"><div id="sq"></div><button class="btn btn--main" id="sadd">' + I.plus + esc(t('Add to cart')) + '</button></div>' +
      '<button class="btn btn--ghost btn--full" style="margin-top:10px" data-go="p/' + o.id + '">' + esc(t('See full details')) + '</button></div>');
    $('#spk', body).appendChild(pk.el); $('#sq', body).replaceWith(q.el);
    $('#sadd', body).addEventListener('click', () => {
      if (!pk.check()) return;
      addFk(o, pk.read(), q.get());
      const src = card && $('.ph img', card);
      closeSheet();
      setTimeout(() => flyToCart(src), 120);
      toast(t('Added to the cart'), t('Open cart'), () => switchTab('cart'));
    });
    openSheet(body);
  }

  /* ================= SEARCH ================= */
  const FRAC = [['1-1/2', '1½'], ['1 1/2', '1½'], ['1-1/4', '1¼'], ['1 1/4', '1¼'], ['2-1/2', '2½'], ['2 1/2', '2½'], ['3-1/2', '3½'], ['1/2', '½'], ['3/4', '¾'], ['1/4', '¼'], ['3/8', '⅜'], ['1/8', '⅛']];
  function norm(s) {
    s = ' ' + digits(s).toLowerCase() + ' ';
    FRAC.forEach(([a, b]) => { s = s.split(a).join(b); });
    return s.replace(/(\d[½¼¾⅜⅛]?|[½¼¾⅜⅛])\s*(?:inch|in|'')(?=\W)/g, '$1"')
      .replace(/\bs\.s\.?/g, 'ss').replace(/\bc\.s\.?/g, 'cs').replace(/\bg\.i\.?/g, 'gi').replace(/\bm\.s\.?/g, 'ms').replace(/\bc\.i\.?/g, 'ci').replace(/\bd\.i\.?/g, 'di')
      .replace(/\bss\s?(304|316)l?\b/g, 'ss $1').replace(/(\d)\s*#/g, '$1 lb').replace(/\bnrv\b/g, 'non return check')
      .replace(/stainless( steel)?/g, 'stainless ss').replace(/carbon steel/g, 'carbon cs').replace(/galvani[sz]ed/g, 'galvanised gi').replace(/mild steel/g, 'mild ms').replace(/cast iron/g, 'cast ci').replace(/ductile( iron)?/g, 'ductile di')
      .replace(/(\d)\s*mm\b/g, '$1mm').replace(/[^\w"½¼¾⅜⅛؀-ۿ ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const codeN = s => digits(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  const HAY = new Map();
  function hay(o) {
    if (HAY.has(o.id)) return HAY.get(o.id);
    let x;
    if (isB(o)) {
      const ar = tn(o.n) !== o.n ? tn(o.n) : (BAR_[o.n] || BLOW[o.n.toLowerCase()] || '');
      x = { name: norm(o.n + ' ' + ar).split(' '), rest: norm([o.sec, o.c.name, BAR_[o.sec] || '', BAR_[o.c.name] || ''].join(' ')).split(' '),
        codes: o.r.map(r => codeN(r[0])).filter(Boolean), sizes: new Set(o.r.map(r => norm(r[1] || '').replace(/\s/g, '')).filter(Boolean)), raw: o.r.map(r => norm(r[1] || '')).join(' ') };
    } else {
      const sp = sizeSpec(o);
      x = { name: norm(o.n).split(' '), rest: norm([o.mat, o.specs.join(' '), o.c.name].join(' ')).split(' '), codes: [],
        sizes: new Set((sp.t === 'sel' ? sp.opts : sp.t === 'pair' ? sp.L.concat(sp.S) : sp.t === 'one' ? [sp.v] : []).map(z => z.replace(/\s/g, ''))), raw: o.size.replace(/\s/g, '') };
    }
    HAY.set(o.id, x); return x;
  }
  function search(q) {
    const toks = norm(q).split(' ').filter(Boolean), qc = codeN(q);
    if (!toks.length) return [];
    const out = [];
    P.forEach((o, idx) => {
      const hh = hay(o); let score = 0;
      if (qc.length >= 3 && hh.codes.some(c => c === qc)) { out.push({ o, score: 100, idx }); return; }
      if (qc.length >= 3 && hh.codes.some(c => c.indexOf(qc) === 0)) { out.push({ o, score: 50, idx }); return; }
      for (const tk of toks) {
        const isSize = /^\d+[½¼¾⅜⅛]?"$|^[½¼¾⅜⅛]"$/.test(tk);
        if (isSize) { if (hh.sizes.has(tk) || hh.raw.includes(tk)) { score += 1; continue; } return; }
        if (hh.name.some(w => w.startsWith(tk))) score += 3;
        else if (hh.rest.some(w => w.startsWith(tk))) score += 1;
        else if (/^\d+$/.test(tk) && (hh.sizes.has(tk + '"') || hh.raw.includes(tk))) score += 1;
        else if (hh.raw.includes(tk)) score += 1;
        else return;
      }
      out.push({ o, score, idx });
    });
    return out.sort((x, y) => y.score - x.score || x.idx - y.idx).map(x => x.o);
  }
  // typing mistakes ("camlok", "flang", "hamer"): a word one or two letters off still counts
  function near(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 99;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function fuzzy(q) {
    const toks = norm(q).split(' ').filter(Boolean);
    if (!toks.length || toks.every(tk => tk.length < 4)) return [];
    return P.filter(o => {
      const hh = hay(o), words = hh.name.concat(hh.rest);
      return toks.every(tk => tk.length < 4 ? words.some(w => w.startsWith(tk)) || hh.raw.includes(tk) : words.some(w => w.startsWith(tk) || near(tk, w.slice(0, tk.length + 1)) <= (tk.length > 6 ? 2 : 1) || near(tk, w) <= (tk.length > 6 ? 2 : 1)));
    });
  }
  let recentQ = store.get(K.searches, []);
  function viewSearch() {
    const el = h('<section><div class="sbar"><button class="ib" data-back aria-label="' + esc(t('Back')) + '">' + I.back + '</button><label class="sfield">' + I.search + '<input type="search" enterkeyhint="search" autocomplete="off" placeholder="' + esc(t(ROWS ? 'Search products, sizes or part numbers' : 'Search products or sizes')) + '"><button class="ib" data-clear aria-label="' + esc(t('Clear')) + '" hidden>' + I.x + '</button></label></div><div class="view__pad" id="sres"></div></section>');
    const v = { el }, inp = $('input', el), res = $('#sres', el), clr = $('[data-clear]', el);
    let tm = null;
    function idle() {
      res.innerHTML = (recentQ.length ? '<div class="h-sec"><h2>' + esc(t('Recent')) + '</h2><button data-clr>' + esc(t('Clear')) + '</button></div><div class="sugg">' + recentQ.map(s => '<button class="chip" data-q="' + esc(s) + '">' + esc(s) + '</button>').join('') + '</div>' : '') +
        '<div class="h-sec"><h2>' + esc(t('Jump to a category')) + '</h2></div><div class="plist">' + CATS.map(c => '<button class="prow" data-go="c/' + c.id + '">' + photo(c.tile, c.name) + '<div class="prow__t"><b>' + esc(catLabel(c)) + '</b><span>' + esc(cnt(c.items.length, 'product')) + '</span></div>' + I.chev + '</button>').join('') + '</div>';
      wirePhotos(res);
    }
    function remember(q) { recentQ = [q].concat(recentQ.filter(x => x.toLowerCase() !== q.toLowerCase())).slice(0, 8); store.set(K.searches, recentQ); }
    function run(rem) {
      const q = inp.value.trim();
      clr.hidden = !q;
      if (!q) return idle();
      let r = search(q), fz = false;
      if (!r.length) { r = fuzzy(q); fz = r.length > 0; }
      const toks = q.toLowerCase().split(/\s+/).filter(x => x.length > 0).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const rx = toks.length ? new RegExp('(' + toks.join('|') + ')', 'gi') : null;
      const mark = s => {
        s = String(s); if (!rx || fz) return esc(s);
        let out = '', at = 0;
        s.replace(rx, (m, g, i) => { out += esc(s.slice(at, i)) + '<mark>' + esc(m) + '</mark>'; at = i + m.length; return m; });
        return out + esc(s.slice(at));
      };
      res.innerHTML = '<p class="scount">' + (r.length ? esc(fz ? t('{n} with a similar spelling', { n: cnt(r.length, 'product') }) : t('{n} found', { n: cnt(r.length, 'product') })) : '') + '</p>' + (r.length ? '<div class="plist">' + r.slice(0, 150).map(o => prodRow(o, mark)).join('') + '</div>' :
        '<div class="empty">' + I.search.replace('<svg', '<svg width="56" height="56"') + '<b>' + esc(t('Nothing found for "{q}"', { q })) + '</b>' + esc(t('Try a shorter word or a part number.')) + '</div>');
      wirePhotos(res);
      if (rem && r.length) remember(q);
    }
    inp.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => run(false), 120); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { run(true); inp.blur(); } });
    res.addEventListener('click', e => {
      const c = e.target.closest('[data-q]'); if (c) { inp.value = c.dataset.q; run(true); return; }
      if (e.target.closest('[data-clr]')) { recentQ = []; store.set(K.searches, []); idle(); return; }
      if (e.target.closest('[data-go],[data-sheet]') && inp.value.trim()) remember(inp.value.trim());
    });
    clr.addEventListener('click', e => { e.preventDefault(); inp.value = ''; run(false); inp.focus(); });
    el.addEventListener('scroll', () => { if (document.activeElement === inp) inp.blur(); }, { passive: true });
    run(false);
    v.onShow = () => { if (!inp.value) setTimeout(() => inp.focus(), 360); };
    return v;
  }

  /* ================= SETTINGS ================= */
  function when(ms) {
    const d = (Date.now() - ms) / 1000;
    if (d < 90) return t('just now');
    if (d < 3600) return Math.round(d / 60) + ' min ago';
    if (d < 86400) return Math.round(d / 3600) + ' h ago';
    return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  function catalogueBox() {
    const kv = [[t('Products'), cnt(P.length, 'product') + ' · ' + CATS.length + ' ' + (lang === 'ar' ? 'فئة' : 'categories')]];
    if (ROWS) kv.push([t('Prices'), t('Prices are packed in the app. New prices come with an app update.')]);
    else {
      const ch = N && N.lastChange ? +N.lastChange() : 0, ck = N && N.lastCheck ? +N.lastCheck() : 0;
      kv.push([t('Product list'), N ? (ch ? t('Updated from the website {w}', { w: when(ch) }) : t('As packed in the app')) : t('Always the newest from the website')]);
      if (N) kv.push([t('Last check'), ck ? when(ck) : t('Not yet')]);
      kv.push([t('Prices'), t(BR.wa ? 'Prices are not shown. The shop confirms prices on WhatsApp.' : 'Prices are not shown. The shop confirms them.')]);
    }
    return '<div class="kv">' + kv.map(r => '<div><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>').join('') + '</div>' +
      (FCATS.length ? '<button class="btn btn--ghost btn--full" style="margin-top:12px" id="syncBtn">' + I.sync + esc(t('Check for new products')) + '</button>' : '');
  }
  function viewSettings() {
    const el = h('<section>' + bar(t('Settings')) + '<div class="view__pad">' +
      (LOCK ? '' : '<h3 class="slab">' + esc(t('Branch')) + '</h3><div class="blist">' + Object.keys(BRANDS).map(id => branchCard(id, id === brandId)).join('') + '</div>') +
      '<h3 class="slab">' + esc(t('Language')) + '</h3><div class="segs"><button class="seg' + (lang === 'en' ? ' is-on' : '') + '" data-setlang="en">English</button><button class="seg' + (lang === 'ar' ? ' is-on' : '') + '" data-setlang="ar">العربية</button></div>' +
      '<h3 class="slab">' + esc(t('Look')) + '</h3><div class="segs">' + ['light', 'dark'].map(th => '<button class="seg seg--th' + (theme === th ? ' is-on' : '') + '" data-settheme="' + th + '">' + (th === 'light' ? I.sun : I.moon) + esc(t(th === 'light' ? 'Light' : 'Dark')) + '</button>').join('') + '</div>' +
      '<h3 class="slab">' + esc(t('Products')) + '</h3><div id="catBox">' + catalogueBox() + '</div>' +
      '<p class="foot">' + esc(BR.full) + '<br>' + esc(BR.address) + [[BR.phone, BR.mobile, BR.email].filter(Boolean).join(' · ')].filter(Boolean).map(x => '<br>' + esc(x)).join('') + (N && N.version ? '<br>' + esc(t('App version')) + ' ' + esc(N.version()) : '') + '</p>' +
      '</div></section>');
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-brand]');
      if (b && b.dataset.brand !== brandId) {
        const to = BRANDS[b.dataset.brand];
        confirmSheet(t('Switch to {b}?', { b: to.name }), t('The app icon, name, colours and order form change to {b}. Each branch keeps its own cart and orders.', { b: to.name }), t('Switch'), () => setBrand(to.id));
        return;
      }
      const l = e.target.closest('[data-setlang]'); if (l && l.dataset.setlang !== lang) setLang(l.dataset.setlang);
      const th = e.target.closest('[data-settheme]');
      if (th && th.dataset.settheme !== theme) { setTheme(th.dataset.settheme); $$('[data-settheme]', el).forEach(b => b.classList.toggle('is-on', b.dataset.settheme === theme)); buzz(); }
    });
    return { el, onShow() { const cb = $('#catBox', el); if (cb && !$('.spin', cb)) cb.innerHTML = catalogueBox(); } };
  }

  /* ================= CART ================= */
  function viewCart() {
    const el = h('<section></section>');
    const v = { el };
    function draw() {
      const tt = totals(lines), mixed = tt.b > 0;
      el.innerHTML = pageHead(t('Cart'), lines.length ? '<button class="ib ib--soft" data-clearall aria-label="' + esc(t('Empty cart')) + '">' + I.trash + '</button>' : '') + '<div class="view__pad">' +
        (lines.length ? '<div class="lines">' + lines.map((l, i) => {
          const o = lineProduct(l), p = linePrice(l, o);
          return '<div class="line" data-i="' + i + '">' + photo(lineImg(l, o), l.n) +
            '<div class="line__t"' + (o ? ' ' + openAttr(o) : '') + '><b>' + esc(lineName(l)) + '</b><span class="line__s">' + lineSub(l, o, true) + '</span>' +
              (mixed ? '<span class="line__p">' + (p != null ? money(p) + (l.q > 1 ? ' <i>× ' + nfmt(l.q) + ' = ' + money(round2(p * l.q)) + '</i>' : '') : '<em>' + esc(t('Price on request')) + '</em>') + '</span>' : '') +
              (o ? '' : '<span class="line__s warn">' + esc(t('No longer in the catalogue')) + '</span>') + '</div>' +
            '<div class="line__bot">' + stepper(l.q, ' data-lq="' + i + '"', true) + '<span class="line__links">' + (!lb(l) && o && hasChoices(o) ? '<button data-chg="' + i + '">' + esc(t('Change')) + '</button>' : '') + '<button data-del="' + i + '">' + esc(t('Remove')) + '</button></span></div></div>';
        }).join('') + '</div>' +
        '<div class="card sum">' + sumRows(tt) +
          '<button class="btn btn--main btn--full" data-checkout>' + esc(t('Proceed to checkout')) + '</button>' +
          '<button class="btn btn--ghost btn--full" data-clearall>' + esc(t('Empty cart')) + '</button></div>'
        : '<div class="empty">' + I.cartBig.replace('<svg', '<svg width="60" height="60"') + '<b>' + esc(t('Your cart is empty')) + '</b>' + esc(t('Add products, then place the order from here.')) + '<br><br><button class="btn btn--main" data-tab="home">' + esc(t('Browse products')) + '</button></div>') +
        '</div>';
      wirePhotos(el);
      v.dirty = false;
    }
    el.addEventListener('click', e => {
      const tg = e.target;
      const st = tg.closest('[data-lq] [data-st]');
      if (st) { const l = lines[+st.closest('[data-lq]').dataset.lq]; if (!l) return draw(); l.q = Math.max(1, Math.min(99999, l.q + +st.dataset.st)); buzz(); saveLines(); afterChange(l); draw(); return; }
      const d = tg.closest('[data-del]');
      if (d) {
        const row = d.closest('.line'), gone = lines[+d.dataset.del];
        if (row.classList.contains('is-gone')) return;
        if (!gone) return draw();
        row.classList.add('is-gone');
        setTimeout(() => {
          const i = lines.indexOf(gone); if (i < 0) return;
          lines.splice(i, 1); saveLines(); afterChange(gone); draw();
          toast(t('Removed'), t('Undo'), () => { if (lines.indexOf(gone) > -1) return; lines.splice(Math.min(i, lines.length), 0, gone); saveLines(); afterChange(gone); draw(); });
        }, 260);
        return;
      }
      if (tg.closest('[data-clearall]')) { confirmSheet(t('Empty the cart?'), t('All {n} will be removed.', { n: cnt(lines.length, 'item') }), t('Empty cart'), () => { const was = lines; lines = []; saveLines(); was.forEach(afterChange); draw(); }); return; }
      if (tg.closest('[data-checkout]')) { go('checkout'); return; }
      const cg = tg.closest('[data-chg]');
      if (cg) { changeLine(+cg.dataset.chg, draw); return; }
    });
    el.addEventListener('change', e => {
      const box = e.target.closest('[data-lq]'); if (!box) return;
      const l = lines[+box.dataset.lq], d = qtyIn(e.target.value); if (!l) return draw();
      l.q = Math.max(1, Math.min(99999, d != null ? d : l.q)); saveLines(); afterChange(l); draw();
    });
    draw();
    v.refresh = draw;
    v.onShow = () => { if (v.dirty) draw(); };
    return v;
  }
  function afterChange(l) { const o = lineProduct(l); if (o) paintItemQuiet(o); }
  function sumRows(tt, snap) {
    const r = (k, val, cls) => '<div class="sum__r' + (cls ? ' ' + cls : '') + '"><span>' + esc(k) + '</span><b>' + val + '</b></div>';
    if (!tt.priced) return r(t('Items'), esc(nfmt(tt.items))) + r(t('Pieces'), esc(nfmt(tt.q))) + '<p class="sum__n">' + esc(t(tt.b ? 'Prices on request. The shop quotes them separately.' : BR.wa ? 'Prices are not shown. The shop confirms prices on WhatsApp.' : 'Prices are not shown. The shop confirms them.')) + '</p>';
    return r(t('Items'), esc(nfmt(tt.items))) + (tt.ask ? r(t('Priced subtotal'), money(tt.sum)) + r(t('Awaiting price'), esc(cnt(tt.ask, 'item'))) : '') +
      r(t('Total'), money(tt.sum), 'sum__r--total') + (tt.ask ? '<p class="sum__n">' + esc(t('{n} on request, quoted separately', { n: cnt(tt.ask, 'item') })) + '</p>' : '');
  }
  function changeLine(i, redraw) {
    const l = lines[i], o = lineProduct(l); if (!o) return;
    const pk = picker(o, l);
    const body = h('<div><div class="shead">' + photo(o.img, o.n) + '<div><small>' + esc(catLabel(o.c)) + '</small><b>' + esc(o.n) + '</b></div></div><div id="spk"></div><button class="btn btn--main btn--full" style="margin-top:18px" id="ssave">' + I.check + esc(t('Save changes')) + '</button></div>');
    $('#spk', body).appendChild(pk.el);
    $('#ssave', body).onclick = () => {
      if (!pk.check()) return;
      const pick = pk.read(), nl = Object.assign({}, l, { s: pick.s, sp: pick.sp, mt: pick.mt });
      const dup = lines.findIndex((x, j) => j !== i && lineKey(x) === lineKey(nl));
      if (dup > -1) { lines[dup].q = Math.min(99999, lines[dup].q + l.q); lines.splice(i, 1); } else lines[i] = nl;
      saveLines(); closeSheet(); redraw(); toast(t('Changed'));
    };
    openSheet(body);
  }

  /* ================= CHECKOUT: place the order (no WhatsApp needed) ================= */
  const PAY = ['Cash', 'Card', 'Bank transfer', 'Cheque', 'Credit account'];
  function viewCheckout() {
    const el = h('<section></section>');
    const v = { el };
    if (!ROWS && !cust.delivery) cust.delivery = 'pickup';
    const saveCust = () => store.set(K.cust, cust);
    let bookOpen = false, region = -1, bq = '';
    const CL = BR.clients && window[BR.clients] ? window[BR.clients] : { r: [], l: [] };   // the shop's own customer list (Bait Al Maqdis)
    const field = (key, label, ph, type, req) => '<label class="flab">' + esc(label) + (req ? ' *' : '') + (type === 'area' ? '<textarea class="field" data-c="' + key + '" placeholder="' + esc(ph) + '">' + esc(cust[key] || '') + '</textarea>' :
      '<input class="field" data-c="' + key + '"' + (type === 'tel' ? ' inputmode="tel" type="tel"' : '') + ' placeholder="' + esc(ph) + '" value="' + esc(cust[key] || '') + '">') + '</label>';
    const seg = (key, val, label) => '<button class="seg' + (cust[key] === val ? ' is-on' : '') + '" data-opt="' + key + '" data-val="' + esc(val) + '">' + esc(t(label)) + '</button>';
    function book() {
      const saved = store.get(K.saved, []);
      const list = CL.l.filter(c => (region < 0 || c[1] === region) && (!bq || c[0].toLowerCase().indexOf(bq.toLowerCase()) > -1));
      const mine = saved.filter(c => !bq || (c.name + ' ' + (c.phone || '')).toLowerCase().indexOf(bq.toLowerCase()) > -1);
      return '<div class="book' + (bookOpen ? ' is-open' : '') + '"><button class="book__h" data-book>' + I.user + '<b>' + esc(t('Saved customers')) + '</b><span>' + (CL.l.length + saved.length) + '</span>' + I.down + '</button>' +
        (bookOpen ? '<div class="book__b"><label class="sfield sfield--sm">' + I.search + '<input data-bq placeholder="' + esc(t('Find a customer')) + '" value="' + esc(bq) + '"></label>' +
          (CL.r.length ? '<div class="chips chips--wrap">' + ['-1'].concat(CL.r.map((_, i) => String(i))).map(i => '<button class="chip' + (+i === region ? ' is-on' : '') + '" data-region="' + i + '">' + esc(+i < 0 ? t('All') : CL.r[+i]) + ' <b>' + (+i < 0 ? CL.l.length : CL.l.filter(c => c[1] === +i).length) + '</b></button>').join('') + '</div>' : '') +
          '<div class="book__list">' + (mine.length ? '<p class="book__sub">' + esc(t('Saved on this phone')) + '</p>' + mine.map((c, i) => '<button data-pickmine="' + saved.indexOf(c) + '"><b>' + esc(c.name) + '</b>' + (c.phone ? '<span>' + esc(c.phone) + '</span>' : '') + '</button>').join('') : '') +
            list.slice(0, 300).map(c => '<button data-pick="' + esc(c[0]) + '"><b>' + esc(c[0]) + '</b><span>' + esc(CL.r[c[1]] || '') + '</span></button>').join('') + '</div></div>' : '') + '</div>';
    }
    function draw() {
      const tt = totals(lines);
      el.innerHTML = pageHead(t('Checkout'), '', t('Back to cart')) + '<div class="view__pad">' +
        (!lines.length ? '<div class="empty">' + I.cartBig.replace('<svg', '<svg width="60" height="60"') + '<b>' + esc(t('Your cart is empty')) + '</b><br><button class="btn btn--main" data-tab="home">' + esc(t('Browse products')) + '</button></div></div>' :
        '<div class="card sum">' + sumRows(tt) + '</div>' +
        (ROWS ? '<div id="book">' + book() + '</div>' +
          field('name', t('Customer name'), t('Full name'), 'text', true) + field('phone', t('Phone number (optional)'), '05X XXX XXXX', 'tel') + field('note', t('Note (optional)'), t('Delivery address, site name, anything else'), 'area')
          : field('name', t('Customer (company or workshop)'), '', 'text', true) + field('phone', t('Phone / WhatsApp'), '05X XXX XXXX', 'tel', true) + field('site', t('Location or site (optional)'), '', 'text') +
            '<p class="flab">' + esc(t('Delivery')) + '</p><div class="segs">' + seg('delivery', 'pickup', 'Collect from shop') + seg('delivery', 'deliver', 'Deliver') + '</div>' +
            (cust.delivery === 'deliver' && BR.deliveryNote ? '<p class="note">' + esc(t('Delivery anywhere in the UAE is for orders from AED 5,000. The shop confirms it with the price.')) + '</p>' : '') +
            '<p class="flab">' + esc(t('Payment (optional)')) + '</p><div class="segs segs--wrap">' + PAY.map(p => seg('pay', p, p)).join('') + '</div>' +
            field('note', t('Note (optional)'), t('Anything the shop should know'), 'area')) +
        '<button class="btn btn--main btn--full btn--big" data-place>' + esc(t('Place order')) + '</button>' +
        (ROWS ? '<button class="btn btn--ghost btn--full" data-savecust>' + esc(t('Save these details')) + '</button>' : '') +
        '</div>');
    }
    const redrawBook = () => { const b = $('#book', el); if (!b) return; const y = $('.book__list', b) ? $('.book__list', b).scrollTop : 0; b.innerHTML = book(); const l = $('.book__list', b); if (l) l.scrollTop = y; };
    el.addEventListener('input', e => {
      const f = e.target.closest('[data-c]'); if (f) { cust[f.dataset.c] = f.value; f.classList.remove('is-bad'); saveCust(); return; }
      if (e.target.matches('[data-bq]')) { bq = e.target.value; const b = $('#book', el); const list = h(book()); $('.book__list', b).replaceWith($('.book__list', list)); }
    });
    el.addEventListener('click', e => {
      const tg = e.target;
      const o = tg.closest('[data-opt]');
      if (o) { const k = o.dataset.opt; cust[k] = cust[k] === o.dataset.val && k === 'pay' ? '' : o.dataset.val; saveCust(); buzz(); const y = el.scrollTop; draw(); el.scrollTop = y; return; }
      if (tg.closest('[data-book]')) { bookOpen = !bookOpen; redrawBook(); return; }
      const rg = tg.closest('[data-region]'); if (rg) { region = +rg.dataset.region; redrawBook(); return; }
      const pk = tg.closest('[data-pick]'); if (pk) { cust.name = pk.dataset.pick; saveCust(); bookOpen = false; const y = el.scrollTop; draw(); el.scrollTop = y; buzz(); return; }
      const pm = tg.closest('[data-pickmine]');
      if (pm) { const c = store.get(K.saved, [])[+pm.dataset.pickmine]; if (c) { cust.name = c.name; cust.phone = c.phone || ''; saveCust(); } bookOpen = false; const y = el.scrollTop; draw(); el.scrollTop = y; buzz(); return; }
      if (tg.closest('[data-savecust]')) {
        if (!String(cust.name || '').trim()) { bad(['name']); return; }
        const saved = store.get(K.saved, []).filter(c => c.name.toLowerCase() !== cust.name.trim().toLowerCase());
        saved.unshift({ name: cust.name.trim(), phone: (cust.phone || '').trim() }); store.set(K.saved, saved.slice(0, 200));
        toast(t('Saved')); redrawBook(); return;
      }
      if (tg.closest('[data-place]')) place();
    });
    function bad(keys) {
      keys.forEach(k => { const f = $('[data-c="' + k + '"]', el); if (!f) return; f.classList.add('is-bad'); if (!reduce) f.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 300 }); });
      const f0 = $('[data-c="' + keys[0] + '"]', el); if (f0) f0.scrollIntoView({ block: 'center', behavior: 'smooth' });
      buzz(); toast(keys[0] === 'name' ? t('Type the customer name') : t('Type a phone number the shop can call'));
    }
    function place() {
      if (!lines.length) { draw(); return; }
      const miss = [['name', !String(cust.name || '').trim()], ['phone', !ROWS && !phoneDigits(cust.phone)]].filter(x => x[1]).map(x => x[0]);
      if (miss.length) return bad(miss);
      const c = {}; Object.keys(cust).forEach(k => { const val = String(cust[k] == null ? '' : cust[k]).trim(); if (val) c[k] = val; });
      const x = { id: Date.now().toString(36), no: nextOrderNo(), at: Date.now(), cust: c, lines: lines.map(l => { const z = Object.assign({}, l); if (lb(l)) z.p = linePrice(l); return z; }) };
      if (totals(x.lines, true).priced) x.total = totals(x.lines, true).sum;
      const all = getOrders(); all.unshift(x);
      if (!putOrders(all)) { toast(t('The order could not be saved: the phone is full. Delete some old orders, then try again.'), '', null, 9000); return; }
      const was = lines; lines = []; saveLines(); was.forEach(afterChange);
      cust = ROWS ? {} : { delivery: 'pickup' }; saveCust();
      const ov = stacks.orders[0]; if (ov) ov.dirty = true;
      buzz();
      resetTab('cart'); const cv = stacks.cart[0]; if (cv) cv.refresh();
      stage.appendChild(el); // keep this screen on top while the next one slides in
      stacks.cart.push(v);
      go('placed/' + x.id);
      setTimeout(() => { const i = stacks.cart.indexOf(v); if (i > -1) { stacks.cart.splice(i, 1); el.remove(); saveRoutes(); } }, 600);
    }
    draw();
    v.refresh = draw;
    return v;
  }

  /* ================= ORDER PLACED ================= */
  function viewPlaced(id) {
    const x = getOrders().find(z => z.id === id);
    if (!x) return null;
    const tt = totals(x.lines, true);
    const el = h('<section class="placed"><div class="view__pad">' +
      '<div class="done"><div class="done__tick"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg></div>' +
      '<h1>' + esc(t('Order placed')) + '</h1><p>' + esc(t('Order number')) + '</p><p class="done__no">' + esc(x.no) + '</p>' +
      '<p class="done__sub">' + esc(x.cust.name || '') + ' · ' + esc(cnt(tt.items, 'item')) + (tt.priced ? ' · ' + money(tt.sum) : ' · ' + esc(pcs(tt.q))) + '</p></div>' +
      '<button class="btn btn--main btn--full btn--big" data-k="pdf">' + I.pdf + esc(t('Order form (PDF)')) + '</button>' +
      '<button class="btn btn--wa btn--full" data-k="wa">' + I.wa + esc(t(BR.wa ? 'Send to the shop on WhatsApp' : 'Send on WhatsApp')) + '</button>' +
      '<button class="btn btn--ghost btn--full" data-k="orders">' + esc(t('View my orders')) + '</button>' +
      '<button class="btn btn--link btn--full" data-k="more">' + esc(t('Continue shopping')) + '</button>' +
      '</div></section>');
    el.addEventListener('click', e => {
      const k = e.target.closest('[data-k]'); if (!k) return;
      const w = k.dataset.k;
      if (w === 'pdf') orderPdf(x, 'view');
      else if (w === 'wa') orderPdf(x, 'wa');
      else if (w === 'orders') { resetTab('cart'); switchTab('orders'); setTimeout(() => go('order/' + x.id), 380); }
      else { resetTab('cart'); switchTab('home'); }
    });
    return { el };
  }

  /* ================= ORDERS ================= */
  function ordersHTML(list) {
    if (!list.length) return '<div class="empty">' + I.doc.replace('<svg', '<svg width="60" height="60"') + '<b>' + esc(t('No orders yet')) + '</b>' + esc(t('Orders you place will be listed here.')) + '</div>';
    let last = '';
    return list.map(x => {
      const day = new Date(x.at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
      const head = day !== last ? '<p class="oday">' + esc(day) + '</p>' : ''; last = day;
      const tt = totals(x.lines, true);
      return head + '<button class="order tile" data-order="' + x.id + '"><div class="order__top"><b>' + esc(x.cust.name || '—') + '</b><span class="pill">' + esc(x.no) + '</span></div>' +
        '<span class="order__s">' + esc(cnt(tt.items, 'item')) + ' · ' + (tt.priced ? money(tt.sum) : esc(pcs(tt.q))) + ' · ' + new Date(x.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + '</span>' +
        '<div class="order__thumbs">' + x.lines.slice(0, 5).map(l => photo(lineImg(l, lineProduct(l)), l.n)).join('') + (x.lines.length > 5 ? '<i>+' + (x.lines.length - 5) + '</i>' : '') + '</div></button>';
    }).join('');
  }
  function viewOrders() {
    const el = h('<section></section>');
    const v = { el };
    let q = '';
    const match = x => (x.no + ' ' + (x.cust.name || '') + ' ' + (x.cust.phone || '') + ' ' + x.lines.map(l => l.n + ' ' + (l.c || '')).join(' ')).toLowerCase().indexOf(q.toLowerCase()) > -1;
    function draw() {
      const all = getOrders();
      el.innerHTML = pageHead(t('Orders')) + '<div class="view__pad">' +
        (all.length > 3 ? '<label class="sfield sfield--sm">' + I.search + '<input type="search" placeholder="' + esc(t('Find an order')) + '" value="' + esc(q) + '"></label>' : '') +
        '<div class="orders" id="olist">' + ordersHTML(q ? all.filter(match) : all) + '</div></div>';
      wirePhotos(el);
      const inp = $('input', el);
      if (inp) inp.addEventListener('input', () => { q = inp.value; const ol = $('#olist', el); ol.innerHTML = ordersHTML(getOrders().filter(match)); wirePhotos(ol); });
      v.dirty = false;
    }
    el.addEventListener('click', e => { const o = e.target.closest('[data-order]'); if (o) go('order/' + o.dataset.order); });
    draw();
    v.refresh = draw;
    v.onShow = () => { if (v.dirty) draw(); };
    return v;
  }
  function viewOrder(id) {
    const x = getOrders().find(z => z.id === id);
    if (!x) return null;
    const c = x.cust, tt = totals(x.lines, true);
    const kv = [[t('Placed on'), new Date(x.at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })], [t('Name'), c.name], [t('Phone'), c.phone], [t('Location'), c.site],
      [t('Delivery'), !c.delivery ? '' : c.delivery === 'deliver' ? t('Deliver') : t('Collect from shop')], [t('Payment'), c.pay ? t(c.pay) : ''], ['Needed by', c.by], ['Contact', c.person], [t('Note'), c.note]].filter(r => r[1]);
    const el = h('<section>' + pageHead(x.no, '', t('All orders')) + '<div class="view__pad">' +
      '<div class="card kv2">' + kv.map(r => '<div><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>').join('') +
        '<div class="sum__r sum__r--total"><span>' + esc(t('Total')) + '</span><b>' + (tt.priced ? money(tt.sum) : esc(cnt(tt.items, 'item') + ' · ' + pcs(tt.q))) + '</b></div>' +
        (tt.priced && tt.ask ? '<p class="sum__n">' + esc(t('{n} on request, quoted separately', { n: cnt(tt.ask, 'item') })) + '</p>' : '') + '</div>' +
      '<div class="lines lines--ro">' + x.lines.map(l => { const o = lineProduct(l);
        return '<div class="line">' + photo(lineImg(l, o), l.n) + '<div class="line__t"' + (o ? ' ' + openAttr(o) : '') + '><b>' + esc(lineName(l)) + '</b><span class="line__s">' + (lb(l) ? bd([l.c, ts(l.s), 'qty ' + nfmt(l.q)].filter(Boolean).join(' · ')) : lineSub(l, o, true)) + '</span>' +
          (lb(l) ? '<span class="line__p">' + (l.p != null ? money(round2(l.p * l.q)) : '<em>' + esc(t('On request')) + '</em>') + '</span>' : '<span class="line__q">× ' + nfmt(l.q) + '</span>') + '</div></div>'; }).join('') + '</div>' +
      '<button class="btn btn--main btn--full btn--big" data-k="pdf">' + I.pdf + esc(t('Order form (PDF)')) + '</button>' +
      '<button class="btn btn--wa btn--full" data-k="wa">' + I.wa + esc(t(BR.wa ? 'Send to the shop on WhatsApp' : 'Send on WhatsApp')) + '</button>' +
      '<button class="btn btn--ghost btn--full" data-k="copy">' + I.copy + esc(t('Copy order as text')) + '</button>' +
      '<button class="btn btn--ghost btn--full" data-k="repeat">' + I.sync + esc(t('Repeat order')) + '</button>' +
      '<button class="btn btn--danger btn--full" data-k="del">' + I.trash + esc(t('Delete order')) + '</button>' +
      '</div></section>');
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-k]'); if (!b) return;
      const k = b.dataset.k;
      if (k === 'pdf') orderPdf(x, 'view');
      else if (k === 'wa') orderPdf(x, 'wa');
      else if (k === 'copy') copy(orderText(x), t('Order copied'));
      else if (k === 'repeat') {
        const load = () => {
          lines = x.lines.filter(l => lineProduct(l)).map(l => { const z = Object.assign({}, l); if (lb(l)) z.p = linePrice(l); return z; });
          cust = Object.assign({}, c, { note: '' }); store.set(K.cust, cust); saveLines(); lines.forEach(afterChange);
          resetTab('cart'); const cv = stacks.cart[0]; if (cv) cv.refresh();
          switchTab('cart'); toast(t('Order copied into the cart'));
        };
        if (lines.length) confirmSheet(t('Replace the cart?'), t('The cart already has {n}. They will be replaced by this order.', { n: cnt(lines.length, 'item') }), t('Replace'), load); else load();
      }
      else if (k === 'del') confirmSheet(t('Delete order {no}?', { no: x.no }), t('It is only removed from this phone.'), t('Delete'), () => {
        putOrders(getOrders().filter(z => z.id !== id)); const ov = stacks.orders[0]; if (ov) ov.dirty = true; pop(); toast(t('Order deleted'));
      });
    });
    return { el };
  }

  /* ================= PDFs: the catalogues packed in the app (Bait Al Maqdis: one per group) ================= */
  const pdfTitle = p => tn(t(p.title));
  const pdfMeta = p => p.n ? cnt(p.n, 'product') + ' · ' + t('{n} pages', { n: p.pages }) + ' · ' + p.mb + ' MB' : t(p.sub) + ' · ' + p.mb + ' MB';
  // open it, send it straight to WhatsApp, or hand it to any app
  function pdfDo(p, how) {
    const path = DIR + p.file;
    if (N && how === 'open' && N.viewAsset) return N.viewAsset(path);
    if (N && how === 'wa' && N.shareAssetWa) return N.shareAssetWa(path, pdfTitle(p));
    if (N && N.shareAsset) return N.shareAsset(path, pdfTitle(p));
    if (window.FT_PDF_VIEW) return fetch(path).then(r => r.arrayBuffer()).then(buf => window.FT_PDF_VIEW(new Uint8Array(buf), p.title));
    if (how === 'open') return window.open(path, '_blank');
    shareWebFile(path, p.title);
  }
  function viewPdfs() {
    const list = PDFS;
    const el = h('<section class="pdfv">' + pageHead(t('Catalogues')) + '<div class="view__pad"><p class="hint">' + esc(t('{n} PDF catalogues. Tap a cover to open it.', { n: nfmt(list.length) })) + '</p>' +
      '<div class="pdfgrid">' + list.map((p, i) =>
        '<div class="pdfk tile" style="animation-delay:' + Math.min(i, 10) * 40 + 'ms">' +
          '<button class="pdfk__cv" data-pdf="' + i + '" data-how="open" aria-label="' + esc(t('Open')) + '">' + (p.cover ? '<img src="' + esc(p.cover) + '" alt="" loading="lazy">' : '<span class="pdfk__ph">' + I.pdf + '</span>') + '<i>PDF</i></button>' +
          '<b>' + esc(pdfTitle(p)) + '</b><span>' + esc(p.n ? cnt(p.n, 'product') + ' · ' + t('{n} pages', { n: p.pages }) : pdfMeta(p)) + '</span>' +
          '<span class="pdfk__b"><button class="btn btn--wa" data-pdf="' + i + '" data-how="wa">' + I.wa + '<span>WhatsApp</span></button>' +
          '<button class="btn btn--ghost" data-pdf="' + i + '" data-how="share" aria-label="' + esc(t('Other apps')) + '">' + I.share + '</button></span>' +
        '</div>').join('') + '</div></div></section>');
    el.addEventListener('click', e => { const b = e.target.closest('[data-pdf]'); if (!b) return; buzz(); pdfDo(list[+b.dataset.pdf], b.dataset.how); });
    return { el };
  }
  // one group's catalogue, from that group's screen
  function pdfSheet(p) {
    const b = h('<div class="psheet"><div class="psheet__h">' + (p.cover ? '<img src="' + esc(p.cover) + '" alt="">' : '') + '<div><small>' + esc(t('PDF catalogue')) + '</small><b>' + esc(pdfTitle(p)) + '</b><span>' + esc(pdfMeta(p)) + '</span></div></div>' +
      '<button class="btn btn--wa btn--full btn--big" data-how="wa">' + I.wa + esc(t('Send on WhatsApp')) + '</button>' +
      '<div class="prow2"><button class="btn btn--ghost" data-how="open">' + I.pdf + esc(t('Open')) + '</button><button class="btn btn--ghost" data-how="share">' + I.share + esc(t('Other apps')) + '</button></div></div>');
    b.addEventListener('click', e => { const x = e.target.closest('[data-how]'); if (x) { buzz(); closeSheet(); pdfDo(p, x.dataset.how); } });
    openSheet(b);
  }

  /* ================= choosing products to send a customer (Bait Al Maqdis, Modern Electric) =================
     Select (or a long press on a card) starts it; taps choose cards in any group or from search; Send makes a picture, a PDF
     or a text of just those products, with or without prices, for WhatsApp or any app. */
  const SEL = new Set();
  let selecting = false;
  const selbar = ROWS ? h('<div id="selbar" role="region" aria-label="' + esc(t('Chosen products')) + '"><button class="selbar__x" data-selx aria-label="' + esc(t('Cancel')) + '">' + I.x + '</button>' +
    '<div class="selbar__t"><b></b><span></span></div><button class="selbar__go" data-selshare>' + I.share + '<span>' + esc(t('Send')) + '</span></button></div>') : null;
  if (selbar) document.body.appendChild(selbar);
  function paintSel(r) {
    if (!ROWS) return;
    $$('.flip[data-item]', r || document).forEach(c => c.classList.toggle('is-sel', SEL.has(c.dataset.item)));
    document.body.classList.toggle('is-selecting', selecting);
    const on = selecting || SEL.size > 0;
    selbar.classList.toggle('is-on', on);
    $('b', selbar).textContent = SEL.size ? t('{n} chosen', { n: nfmt(SEL.size) }) : t('Choose products');
    $('span', selbar).textContent = t(SEL.size ? 'Tap Send for a picture, PDF or text' : 'Tap the products to send');
    $('[data-selshare]', selbar).disabled = !SEL.size;
  }
  function setSelecting(on) {
    selecting = on;
    if (on) $$('.flip.is-flipped').forEach(c => flipTo(c, false));
    if (!on) SEL.clear();
    paintSel();
  }
  function toggleSel(o) {
    if (SEL.has(o.id)) SEL.delete(o.id); else SEL.add(o.id);
    selecting = true;
    paintSel();
  }
  function endSelect() { setSelecting(false); }

  /* ---- what is sent: a picture (one long image), PDF pages (A4) or text ---- */
  const SW = 1080, SP = 40, BW = SW - 2 * SP, PAGE_H = Math.round(SW * 297 / 210);
  const FONT = '"Poppins","Segoe UI",Tahoma,sans-serif';
  const imgs = {};
  const loadImg = src => imgs[src] || (imgs[src] = new Promise(res => {
    if (!src) return res(null);
    const i = new Image(); i.onload = () => res(i.naturalWidth ? i : null); i.onerror = () => res(null); i.src = src;
  }));
  const rgb = a => 'rgb(' + a.join(',') + ')';
  const darkHead = () => { const c = (BR.head || '#ffffff').replace('#', ''); return parseInt(c.slice(0, 2), 16) + parseInt(c.slice(2, 4), 16) + parseInt(c.slice(4, 6), 16) < 300; };
  function canvas(w, hh) { const c = document.createElement('canvas'); c.width = w; c.height = Math.max(1, Math.ceil(hh)); return c; }
  // drawing in reading order: x from the left in English, from the right in Arabic
  function pen(c) {
    const g = c.getContext('2d'), W = c.width, r = lang === 'ar';
    g.direction = r ? 'rtl' : 'ltr'; g.textBaseline = 'alphabetic';
    return {
      g, r,
      x: (x, w) => r ? W - x - (w || 0) : x,
      text(s, x, y, end) { s = String(s); g.direction = r && RTL_CH.test(s) ? 'rtl' : 'ltr'; g.textAlign = (!!end) !== r ? 'right' : 'left'; g.fillText(s, r ? W - x : x, y); },
      font(w, px) { g.font = w + ' ' + px + 'px ' + FONT; }
    };
  }
  function rr(g, x, y, w, hh, r) {
    g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + hh - r);
    g.quadraticCurveTo(x + w, y + hh, x + w - r, y + hh); g.lineTo(x + r, y + hh); g.quadraticCurveTo(x, y + hh, x, y + hh - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }
  function fitText(g, s, max) { s = String(s); if (g.measureText(s).width <= max) return s; while (s.length > 1 && g.measureText(s + '…').width > max) s = s.slice(0, -1); return s + '…'; }
  function wrapText(g, s, max, lines) {
    const out = []; let cur = '';
    String(s).split(/\s+/).filter(Boolean).forEach(w => {
      const tryS = cur ? cur + ' ' + w : w;
      if (!cur || g.measureText(tryS).width <= max) cur = tryS; else { out.push(cur); cur = w; }
    });
    if (cur) out.push(cur);
    const fixed = out.map(l => fitText(g, l, max));
    if (fixed.length > lines) { fixed.length = lines; fixed[lines - 1] = fitText(g, fixed[lines - 1] + ' …', max); }
    return fixed;
  }
  function contain(g, img, x, y, w, hh) {
    const k = Math.min(w / img.naturalWidth, hh / img.naturalHeight), iw = img.naturalWidth * k, ih = img.naturalHeight * k;
    g.drawImage(img, x + (w - iw) / 2, y + (hh - ih) / 2, iw, ih);
  }
  const ACC = () => rgb(BR.pdfAccent || [238, 122, 20]);
  // one product: photo, group, name, and a table of its sizes, part numbers and (if asked) prices
  async function productCard(o, prices) {
    const PAD = 30, PH = 220, TX = PAD + PH + 30, TW = BW - TX - PAD, img = await loadImg(o.img);
    const meas = pen(canvas(10, 10)), g0 = meas.g;
    meas.font('700', 34); const name = wrapText(g0, tn(o.n), TW, 3);
    const label = (lang === 'ar' ? tn(o.c.name) + ' · ' + tn(o.sec) : (o.c.name + ' · ' + o.sec).toUpperCase());
    const hasSize = o.r.some(r => r[1]), hasCode = o.r.some(r => r[0]);
    meas.font('600', 23); const codeW = hasCode ? Math.max.apply(null, o.r.map(r => g0.measureText(r[0] || '').width)) : 0;
    const stacked = hasSize && hasCode && codeW > 330;   // long codes (Modern Electric's Tally names): under the size
    const RH = stacked ? 76 : 46, HH = 42, BL = stacked ? 34 : 31;
    // a long list of sizes goes in two columns side by side
    const NC = !stacked && o.r.length > 4 && codeW < (prices ? 190 : 250) ? 2 : 1, PER = Math.ceil(o.r.length / NC), CG = 26;
    const topH = Math.max(PH, 34 + name.length * 44 + 46);
    const H = PAD + topH + 20 + HH + PER * RH + PAD;
    const c = canvas(BW, H), p = pen(c), g = p.g;
    g.fillStyle = '#ffffff'; rr(g, 1, 1, BW - 2, H - 2, 26); g.fill(); g.strokeStyle = '#e4e0d9'; g.lineWidth = 2; g.stroke();
    // photo
    g.save(); rr(g, p.x(PAD, PH), PAD, PH, PH, 18); g.clip(); g.fillStyle = '#ffffff'; g.fillRect(p.x(PAD, PH), PAD, PH, PH);
    if (img) contain(g, img, p.x(PAD, PH) + 14, PAD + 14, PH - 28, PH - 28);
    else { g.fillStyle = '#f2f0ec'; g.fillRect(p.x(PAD, PH), PAD, PH, PH); }
    g.restore(); g.strokeStyle = '#ece9e4'; rr(g, p.x(PAD, PH), PAD, PH, PH, 18); g.stroke();
    // words
    g.fillStyle = ACC(); p.font('600', 19); p.text(fitText(g, label, TW), TX, PAD + 26);
    g.fillStyle = '#17181c'; p.font('700', 34); name.forEach((l, i) => p.text(l, TX, PAD + 34 + 40 + i * 44));
    g.fillStyle = '#6d7079'; p.font('400', 22);
    const meta = o.r.length > 1 ? cnt(o.r.length, 'size') : [ts(o.r[0][1]), o.r[0][0]].filter(Boolean).join(' · ');
    p.text(fitText(g, meta, TW), TX, PAD + 34 + 40 + name.length * 44 + 10);
    // the table: size, part no. and price, in one or two columns
    const y0 = PAD + topH + 20, CW = (BW - 2 * PAD - (NC - 1) * CG) / NC, two = NC > 1;
    const PW = prices ? (two ? 150 : 210) : 0, fs = two ? 22 : 24;
    for (let k = 0; k < NC; k++) {
      const x0 = PAD + k * (CW + CG), rows = o.r.slice(k * PER, k * PER + PER), xEnd = x0 + CW, codeEnd = xEnd - (prices ? PW + 20 : 0);
      if (!rows.length) continue;
      let y = y0;
      g.fillStyle = '#6d7079'; p.font('600', 17);
      p.text((hasSize ? t('Size') : t(BR.codeLabel || 'Part no.')).toUpperCase(), x0 + 12, y + 28);
      if (hasSize && hasCode && !stacked) p.text(t(BR.codeLabel || 'Part no.').toUpperCase(), codeEnd - 12, y + 28, true);
      if (prices) p.text(t('Price').toUpperCase(), xEnd - 12, y + 28, true);
      g.fillStyle = '#17181c'; g.fillRect(p.x(x0, CW), y + HH - 3, CW, 3);
      y += HH;
      rows.forEach((r, i) => {
        if (i % 2) { g.fillStyle = '#f8f6f2'; g.fillRect(p.x(x0, CW), y, CW, RH); }
        g.fillStyle = '#eeebe6'; g.fillRect(p.x(x0, CW), y + RH - 1, CW, 1);
        p.font('600', fs - 1); const cw = hasCode && !stacked && r[0] ? g.measureText(r[0]).width : 0;
        const sizeMax = (prices ? xEnd - PW - 20 : xEnd) - x0 - 24 - (hasSize && hasCode && !stacked ? cw + 24 : 0);
        if (hasSize) {
          g.fillStyle = '#17181c'; p.font('500', fs); p.text(fitText(g, ts(r[1]) || '–', sizeMax), x0 + 12, y + BL);
          if (hasCode && stacked) { g.fillStyle = '#6d7079'; p.font('400', 19); p.text(fitText(g, r[0] || '', (prices ? xEnd - PW - 20 : xEnd) - x0 - 24), x0 + 12, y + 64); }
          else if (hasCode) { g.fillStyle = '#17181c'; p.font('600', fs - 1); p.text(r[0] || '–', codeEnd - 12, y + BL, true); }
        } else { g.fillStyle = '#17181c'; p.font('600', fs - 1); p.text(fitText(g, r[0] || '–', sizeMax), x0 + 12, y + BL); }
        if (prices) {
          const has = r[2] != null; g.fillStyle = has ? ACC() : '#8b8e95'; p.font(has ? '700' : '400', has ? fs : 18);
          p.text(has ? money(r[2]) : t('On request'), xEnd - 12, y + (stacked ? 40 : BL), true);
        }
        y += RH;
      });
    }
    return c;
  }
  // the shop's band at the top: its logo, and how to reach it
  async function headBand(w, hh, small) {
    const c = canvas(w, hh), p = pen(c), g = p.g, dark = darkHead(), logo = await loadImg(BR.logo);
    g.fillStyle = BR.head || '#ffffff'; g.fillRect(0, 0, w, hh);
    g.fillStyle = ACC(); g.fillRect(0, hh - 8, w, 8);
    if (logo) { const lh = small ? 58 : 104, lw = Math.min(small ? 260 : 380, logo.naturalWidth * lh / logo.naturalHeight); contain(g, logo, p.x(SP, lw), (hh - 8 - lh) / 2, lw, lh); }
    g.fillStyle = ACC(); p.font('600', small ? 16 : 18); p.text(t('Product details').toUpperCase(), w - SP, small ? 40 : 58, true);
    g.fillStyle = dark ? '#ffffff' : '#17181c'; p.font('700', small ? 24 : 32); p.text(BR.phone || BR.name, w - SP, small ? 72 : 102, true);
    if (!small && BR.email) { g.fillStyle = dark ? '#b9bac0' : '#6d7079'; p.font('400', 20); p.text(BR.email, w - SP, 138, true); }
    return c;
  }
  function footBand(w, hh, pageNo) {
    const c = canvas(w, hh), p = pen(c), g = p.g;
    g.fillStyle = '#f4f2ee'; g.fillRect(0, 0, w, hh); g.fillStyle = '#d9d5ce'; g.fillRect(SP, 0, w - 2 * SP, 2);
    g.fillStyle = '#17181c'; p.font('700', 22); p.text(fitText(g, BR.full, w - 2 * SP - 140), SP, 44);
    g.fillStyle = '#6d7079'; p.font('400', 19); p.text(fitText(g, BR.address, w - 2 * SP - 140), SP, 74);
    if (hh > 100) { g.fillStyle = ACC(); p.font('600', 19); p.text([BR.phone, BR.mobile, BR.email].filter(Boolean).join('  ·  '), SP, 104); }
    if (pageNo) { g.fillStyle = '#17181c'; p.font('700', 20); p.text(pageNo, w - SP, 44, true); }
    return c;
  }
  const today = () => { const d = new Date(); try { return d.toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return d.toDateString(); } };
  // asPdf: A4 pages; otherwise one picture with every product
  async function sendPages(items, prices, asPdf) {
    try { await Promise.all(['400', '500', '600', '700'].map(w => document.fonts.load(w + ' 30px Poppins'))); } catch (e) {}
    const cards = [];
    for (const o of items) cards.push(await productCard(o, prices));
    const BG = '#f4f2ee', GAP = 18, SUB = 60;
    const subLine = (p, y) => { p.g.fillStyle = '#6d7079'; p.font('400', 22); p.text(today() + '  ·  ' + cnt(items.length, 'product'), SP, y); };
    if (!asPdf) {
      const HB = 176, FB = 140, H = HB + SUB + cards.reduce((a, c) => a + c.height + GAP, 0) + 10 + FB;
      const c = canvas(SW, H), p = pen(c), g = p.g;
      g.fillStyle = BG; g.fillRect(0, 0, SW, H);
      g.drawImage(await headBand(SW, HB), 0, 0); subLine(p, HB + 40);
      let y = HB + SUB; cards.forEach(cd => { g.drawImage(cd, SP, y); y += cd.height + GAP; });
      g.drawImage(footBand(SW, FB), 0, H - FB);
      return [c];
    }
    // pages: the full band on the first, a small one after; cards never split (a very tall one is made smaller)
    const pages = [], FB = 96;
    let c = null, p = null, y = 0, bottom = 0, held = 0;
    const newPage = async () => {
      c = canvas(SW, PAGE_H); p = pen(c); p.g.fillStyle = BG; p.g.fillRect(0, 0, SW, PAGE_H);
      const first = !pages.length, hh = first ? 176 : 100;
      p.g.drawImage(await headBand(SW, hh, !first), 0, 0);
      y = hh + (first ? SUB : 30); if (first) subLine(p, hh + 40);
      bottom = PAGE_H - FB - 20; pages.push(c); held = 0;
    };
    await newPage();
    for (const cd of cards) {
      let w = cd.width, hh = cd.height;
      const room = bottom - (pages.length === 1 ? 176 + SUB : 130);
      if (hh > room) { const k = room / hh; w *= k; hh = room; }
      if (y + hh > bottom && held) await newPage();
      p.g.drawImage(cd, SP + (BW - w) / 2, y, w, hh); y += hh + GAP; held++;
    }
    pages.forEach((pg, i) => pg.getContext('2d').drawImage(footBand(SW, FB, pages.length > 1 ? (i + 1) + ' / ' + pages.length : ''), 0, PAGE_H - FB));
    return pages;
  }
  async function pagesPdf(pages) {
    await window.FT_LOAD_PDF();
    const J = window.jspdf && window.jspdf.jsPDF; if (!J) throw new Error('PDF maker missing');
    const doc = new J({ unit: 'mm', format: 'a4', compress: true });
    pages.forEach((c, i) => { if (i) doc.addPage(); doc.addImage(c.toDataURL('image/jpeg', 0.88), 'JPEG', 0, 0, 210, 297); });
    return doc.output('datauristring').split(',')[1];
  }
  function shareText(items, prices) {
    const L = ['*' + BR.full + '*', t('Product details'), ''];
    items.forEach((o, i) => {
      L.push((i + 1) + '. *' + tn(o.n) + '* (' + tn(o.c.name) + ')');
      o.r.forEach(r => {
        const bits = [ts(r[1]), r[0]].filter(Boolean);
        if (prices) bits.push(r[2] != null ? money(r[2]) : t('Price on request'));
        L.push('    • ' + bits.join('  ·  '));
      });
      L.push('');
    });
    L.push([BR.phone, BR.mobile, BR.email].filter(Boolean).join(' · '));
    L.push(BR.address);
    return L.join('\n');
  }
  // browser: the share menu, or a download
  function webFile(b64, name, mime, cap) {
    const bin = atob(b64), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    let file = null; try { file = new File([u8], name, { type: mime }); } catch (e) {}
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], title: cap }).catch(() => {});
    const url = URL.createObjectURL(new Blob([u8], { type: mime })), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  async function sendMade(m, how, items) {
    const d = new Date(), z = n => (n < 10 ? '0' : '') + n;
    const name = (BR.order.pre || '') + 'products-' + d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + '-' + z(d.getHours()) + z(d.getMinutes());
    const cap = BR.name + ' · ' + cnt(items.length, 'product');
    if (m.kind === 'txt') {
      window.__lastSend = { kind: 'txt', how, size: m.text.length };
      if (how === 'wa') return open(waLink('', m.text));
      if (N && N.share) return N.share(cap, m.text);
      if (navigator.share) return navigator.share({ text: m.text }).catch(() => {});
      return copy(m.text, t('Copied'));
    }
    const pic = m.kind === 'pic';
    const b64 = pic ? m.pages[0].toDataURL('image/jpeg', 0.9).split(',')[1] : await pagesPdf(m.pages);
    const file = name + (pic ? '.jpg' : '.pdf'), mime = pic ? 'image/jpeg' : 'application/pdf';
    window.__lastSend = { kind: m.kind, how, size: b64.length, name: file };
    if (N && N.shareFile) return N.shareFile(b64, file, mime, how === 'wa' ? '' : cap, how === 'wa' ? 'wa' : '');
    webFile(b64, file, mime, cap);
  }
  let shareFmt = 'pic';
  const PIC_MAX = 10;
  function shareSheet(items, fromSel) {
    const many = items.length > PIC_MAX;
    let fmt = many && shareFmt === 'pic' ? 'pdf' : shareFmt, prices = !!store.get(BR.id + '-share-prices', false), job = 0, made = null;
    const b = h('<div class="ssheet"><h3>' + esc(items.length === 1 ? t('Send this product') : t('Send {n}', { n: cnt(items.length, 'product') })) + '</h3>' +
      '<div class="segs segs--3">' + [['pic', 'Picture', I.image], ['pdf', 'PDF', I.pdf], ['txt', 'Text', I.text]].map(f => '<button class="seg seg--ic' + (f[0] === fmt ? ' is-on' : '') + '" data-fmt="' + f[0] + '"' + (f[0] === 'pic' && many ? ' disabled' : '') + '>' + f[2] + '<span>' + esc(t(f[1])) + '</span></button>').join('') + '</div>' +
      (many ? '<p class="snote">' + esc(t('A picture holds up to {n} products. Send more as a PDF.', { n: PIC_MAX })) + '</p>' : '') +
      '<label class="tgl"><span><b>' + esc(t('Show prices')) + '</b><small data-psub></small></span><input type="checkbox" data-prices' + (prices ? ' checked' : '') + '><i aria-hidden="true"></i></label>' +
      '<div class="sprev" data-prev></div>' +
      '<div class="prow2"><button class="btn btn--wa" data-send="wa">' + I.wa + '<span>WhatsApp</span></button><button class="btn btn--ghost" data-send="any">' + I.share + '<span>' + esc(t('Other apps')) + '</span></button></div>' +
      (fromSel ? '<button class="btn btn--link btn--full" data-selclr>' + esc(t('Clear the chosen products')) + '</button>' : '') + '</div>');
    const prev = $('[data-prev]', b), psub = $('[data-psub]', b);
    async function draw() {
      const my = ++job; made = null;
      psub.textContent = t(prices ? 'The price of each size is shown' : 'Sizes and part numbers only, no prices');
      b.classList.add('is-making');
      prev.innerHTML = '<div class="sprev__wait"><span class="spin"></span></div>';
      try {
        if (fmt === 'txt') { const tx = shareText(items, prices); made = { kind: 'txt', text: tx }; prev.innerHTML = '<pre class="sprev__txt"></pre>'; $('pre', prev).textContent = tx; }
        else {
          const pages = await sendPages(items, prices, fmt === 'pdf');
          if (my !== job) return;
          made = { kind: fmt, pages };
          prev.innerHTML = '';
          const im = new Image(); im.className = 'sprev__img'; im.alt = ''; im.src = pages[0].toDataURL('image/jpeg', 0.8); prev.appendChild(im);
          if (pages.length > 1) prev.insertAdjacentHTML('beforeend', '<p class="sprev__n">' + esc(t('{n} pages', { n: pages.length })) + '</p>');
        }
      } catch (e) { if (my === job) prev.innerHTML = '<p class="snote">' + esc(t('Could not make it. Try again.')) + '</p>'; }
      if (my === job) b.classList.remove('is-making');
    }
    b.addEventListener('click', async e => {
      const f = e.target.closest('[data-fmt]');
      if (f) { if (f.disabled || f.dataset.fmt === fmt) return; fmt = shareFmt = f.dataset.fmt; $$('[data-fmt]', b).forEach(x => x.classList.toggle('is-on', x === f)); buzz(); draw(); return; }
      if (e.target.closest('[data-selclr]')) { endSelect(); closeSheet(); return; }
      const s = e.target.closest('[data-send]'); if (!s || !made) return;
      buzz(); s.classList.add('is-busy');
      try { await sendMade(made, s.dataset.send, items); } catch (err) { toast(t('Could not make it. Try again.')); s.classList.remove('is-busy'); return; }
      s.classList.remove('is-busy');
      closeSheet(); if (fromSel) endSelect();
    });
    $('[data-prices]', b).addEventListener('change', e => { prices = e.target.checked; store.set(BR.id + '-share-prices', prices); buzz(); draw(); });
    openSheet(b); draw();
  }

  async function shareWebFile(path, title) {
    try {
      const blob = await (await fetch(path)).blob(), name = path.split('/').pop();
      const file = new File([blob], name, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], title }).catch(() => {});
    } catch (e) {}
    const a = document.createElement('a'); a.href = path; a.download = path.split('/').pop(); document.body.appendChild(a); a.click(); a.remove();
  }

  /* ================= sheet ================= */
  function openSheet(body) {
    const s = $('#sheet');
    $('#toast').classList.remove('is-on');
    $('#sheetBody').innerHTML = ''; $('#sheetBody').appendChild(body); wirePhotos(body);
    s.hidden = false; $('.sheet__panel', s).scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => s.classList.add('is-open')));
  }
  function closeSheet() {
    const s = $('#sheet'); if (s.hidden) return;
    s.classList.remove('is-open');
    if (document.activeElement && s.contains(document.activeElement)) document.activeElement.blur();
    setTimeout(() => { if (!s.classList.contains('is-open')) s.hidden = true; }, 420);
  }
  $('#sheet').addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheet(); });
  // drag the sheet down to close it
  (() => {
    const p = $('.sheet__panel'); let y0 = null, dy = 0;
    p.addEventListener('touchstart', e => { if (p.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
    p.addEventListener('touchmove', e => { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); if (dy > 0) { p.style.transition = 'none'; p.style.transform = 'translateY(' + dy + 'px)'; } }, { passive: true });
    p.addEventListener('touchend', () => { if (y0 === null) return; p.style.transition = ''; p.style.transform = ''; if (dy > 110) closeSheet(); y0 = null; });
  })();
  function confirmSheet(title, text, act, fn) {
    const b = h('<div><h3>' + esc(title) + '</h3><p class="sub">' + esc(text) + '</p><div class="prow2"><button class="btn btn--ghost" data-close>' + esc(t('Cancel')) + '</button><button class="btn btn--main" data-ok>' + esc(act) + '</button></div></div>');
    $('[data-ok]', b).onclick = () => { closeSheet(); fn(); };
    openSheet(b);
  }

  /* ================= zoom (pinch, drag, double-tap) ================= */
  let zs = 1, zx = 0, zy = 0;
  const zimg = $('#zoom .zoom__img img');
  $('.zoom__hint').textContent = t('Pinch or double-tap to zoom');
  function zoom(src) {
    const z = $('#zoom'); zimg.src = src; zs = 1; zx = 0; zy = 0; apply();
    const wm = $('.wm', z); if (BR.wm) wm.src = BR.wm;
    wm.hidden = !BR.wm || src.indexOf(IMG) !== 0;   // the Fakhri Tools mark only on Fakhri Tools photos in the Fakhri Tools branch
    z.hidden = false; $('.zoom__hint', z).style.opacity = 1;
    setTimeout(() => { $('.zoom__hint', z).style.opacity = 0; }, 2200);
    if (!reduce) z.animate([{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.16,1,.3,1)' });
  }
  function closeZoom() { const z = $('#zoom'); if (reduce) { z.hidden = true; return; } z.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).onfinish = () => { z.hidden = true; }; }
  function apply() { zimg.style.transformOrigin = 'center'; zimg.style.transform = 'translate(' + zx + 'px,' + zy + 'px) scale(' + zs + ')'; }
  (() => {
    const z = $('#zoom'); const pts = new Map(); let d0 = 0, s0 = 1, last = 0, px = 0, py = 0;
    z.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeZoom(); });
    z.addEventListener('pointerdown', e => { if (e.target.closest('[data-close]')) return; z.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; d0 = Math.hypot(a[0] - b[0], a[1] - b[1]); s0 = zs; }
      if (pts.size === 1) { const now = Date.now(); if (now - last < 300) { zs = zs > 1.2 ? 1 : 2.6; if (zs === 1) { zx = 0; zy = 0; } zimg.style.transition = 'transform .35s cubic-bezier(.16,1,.3,1)'; apply(); setTimeout(() => { zimg.style.transition = ''; }, 360); } last = now; px = e.clientX; py = e.clientY; }
    });
    z.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; zs = Math.max(1, Math.min(5, s0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / d0)); apply(); }
      else if (pts.size === 1 && zs > 1) { zx += e.clientX - px; zy += e.clientY - py; px = e.clientX; py = e.clientY; apply(); }
    });
    const up = e => { pts.delete(e.pointerId); if (zs <= 1.02) { zs = 1; zx = 0; zy = 0; apply(); } };
    z.addEventListener('pointerup', up); z.addEventListener('pointercancel', up);
  })();

  /* ================= online / updates (Fakhri Tools list) ================= */
  function reloadKeepingPlace() { saveRoutes(); try { sessionStorage.setItem('ft-reload', '1'); } catch (e) {} location.reload(); }
  let asked = false;
  window.FT = {
    back,
    brand: brandId,
    pdfData: id => { const x = getOrders().find(z => z.id === id); return x ? pdfData(x) : null; },   // used by the automated test
    orderText: id => { const x = getOrders().find(z => z.id === id); return x ? orderText(x) : null; },
    top: () => { const v = top(); return v ? v.el : null; },
    onSync(r) {
      const cb = $('#catBox'); if (cb) cb.innerHTML = catalogueBox();
      if (ROWS) return;   // the website's list is not used in this branch
      if (r === 'updated' || r === 'updated-partial') toast(t('New products from the shop are ready'), t('Refresh'), reloadKeepingPlace, 12000);
      else if (r === 'same' && asked) toast(t('You already have the newest list'));
      else if (r === 'offline') toast(t('No internet. The saved catalogue still works.'));
      else if (r === 'failed' && asked) toast(t('Could not reach the website. Try again later.'));
      asked = false;
    }
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('#syncBtn'); if (!b) return;
    b.innerHTML = '<span class="spin"></span>' + esc(t('Checking…'));
    if (!N || !N.syncNow) { reloadKeepingPlace(); return; }
    asked = true; N.syncNow();
  });
  // keyboard up (the page gets much shorter): hide the tab bar so the form has room
  let tallest = innerHeight, wide = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth !== wide) { wide = innerWidth; tallest = innerHeight; }
    tallest = Math.max(tallest, innerHeight);
    document.body.classList.toggle('is-typing', innerHeight < tallest * .78);
  });

  /* ================= start ================= */
  updateBadge();
  let restore = null;
  try { if (sessionStorage.getItem('ft-reload')) { restore = JSON.parse(sessionStorage.getItem('ft-routes') || 'null'); sessionStorage.removeItem('ft-reload'); } } catch (e) {}
  if (restore && restore.st && restore.brand === brandId) {
    TABS.forEach(tb => (restore.st[tb] || []).forEach(r => { tab = tb; try { const v = build(r); stage.appendChild(v.el); stacks[tb].push(v); show(v, false); } catch (e) {} }));
    tab = restore.tab && stacks[restore.tab] && stacks[restore.tab].length ? restore.tab : 'home';
    if (!stacks.home.length) { const v = build('home'); stage.appendChild(v.el); stacks.home.push(v); show(v, false); }
    const t0 = tab; tab = ''; switchTab(t0);
    const s = $('#splash'); if (s) s.remove(); document.body.classList.remove('is-booting');
  } else {
    const hv = build('home'); stage.appendChild(hv.el); stacks.home.push(hv); show(hv, true);
    $('#tabInk').style.transform = 'translateX(0)';
    splash();
  }

  // opening: the branch's logo on its own colour, then the app rises into place
  function splash() {
    const s = $('#splash');
    if (!s) return;
    $('.sp__logo', s).src = brandId === 'fakhri' ? fkLogo() : BR.logo;
    if (reduce) { s.remove(); document.body.classList.remove('is-booting'); return; }
    const ease = 'cubic-bezier(.16,1,.3,1)';
    $('.sp__logo', s).animate([{ opacity: 0, transform: 'scale(.86)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: ease, fill: 'forwards' });
    $('.sp__bar i', s).animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 900, delay: 150, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    setTimeout(() => {
      document.body.classList.remove('is-booting');
      s.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in', fill: 'forwards' }).onfinish = () => s.remove();
    }, 1150);
  }
})();
