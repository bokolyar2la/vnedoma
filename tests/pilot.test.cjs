const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Execute the real handlers with isolated adapters. Never connect to the .env database,
// upload files or send messages while running this suite.
function load(file, mocks = {}, env = {}) {
  const filename = path.resolve(file);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }
  }).outputText;
  const module = { exports: {} };
  const localRequire = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id === 'server-only') return {};
    if (id === '@/lib/prisma') throw new Error('Database adapter must be mocked');
    if (id.startsWith('@/')) {
      const base = path.resolve(id.slice(2));
      return load(fs.existsSync(base + '.ts') ? base + '.ts' : base + '.tsx', mocks, env);
    }
    return require(id);
  };
  vm.runInNewContext(source, { module, exports: module.exports, require: localRequire,
    process: { env }, console: { info() {}, warn() {}, error() {} }, Buffer,
    FormData, URL, Date, setTimeout, clearTimeout, Blob,
    ...mocks.__globals }, { filename });
  return module.exports;
}
const redirect = (url) => { throw new Error('REDIRECT:' + url); };
const navigation = { redirect, notFound() { throw new Error('NOT_FOUND'); } };

test('promo requires explicit enablement and nonempty agreed terms', () => {
  const promo = load('lib/promo.ts');
  for (const input of [{}, { isPromoEnabled: true },
    { isPromoEnabled: false, discountText: '10%' }]) {
    assert.equal(promo.getEventPromoText(input), null);
  }
  assert.equal(promo.normalizeDiscountText('  '), '');
  assert.equal(promo.getEventPromoText({ isPromoEnabled: true, promoCode: 'test', discountText: '5%' }).promoCode, 'TEST');
});

test('sessions reject expired, future, malformed and tampered signed tokens', async () => {
  const secret = 'test-secret-with-at-least-32-characters';
  const now = Date.now();
  const token = (stamp) => {
    const payload = `7.${stamp}`;
    return `${payload}.${crypto.createHmac('sha256', secret).update(payload).digest('base64url')}`;
  };
  let current = token(now - 1000);
  let reads = 0;
  const auth = load('lib/organizer-auth.ts', {
    'next/headers': { cookies: async () => ({ get: () => ({ value: current }) }) },
    '@/lib/prisma': { prisma: { organizerAccount: { findFirst: async () => { reads++; return { id: 7 }; } } } }
  }, { NODE_ENV: 'production', ORGANIZER_AUTH_SECRET: secret });
  assert.equal((await auth.getOrganizerAccount()).id, 7);
  for (current of [token(now - 30 * 86400000), token(now + 60000), token('oops'), token(now) + 'x']) {
    assert.equal(await auth.getOrganizerAccount(), null);
  }
  assert.equal(reads, 1);
});

test('production cannot use absent or example session secrets, even with admin password', async () => {
  for (const secret of [undefined, '', 'short', 'change-me-long-random-string']) {
    const auth = load('lib/organizer-auth.ts', {
      '@/lib/prisma': { prisma: {} }, 'next/headers': { cookies: async () => ({ set() {} }) }
    }, { NODE_ENV: 'production', ORGANIZER_AUTH_SECRET: secret, ADMIN_PASSWORD: 'existing-admin-password' });
    await assert.rejects(auth.setOrganizerSession(7), /ORGANIZER_AUTH_SECRET/);
  }
});

test('public submission preserves existing organizer and rolls back on media failure', async () => {
  for (const failMedia of [false, true]) {
    let state = { organizer: { phone: 'original', websiteUrl: 'https://original.test', address: 'original' }, activities: [], media: [] };
    let notified = false;
    const prisma = {
      category: { findUnique: async () => ({ id: 1 }) },
      $transaction: async (fn) => {
        const draft = structuredClone(state);
        const tx = {
          city: { upsert: async () => ({ id: 1 }) },
          organizer: { upsert: async ({ update }) => { Object.assign(draft.organizer, update); return { id: 1 }; } },
          activity: { findUnique: async () => null, create: async ({ data }) => { const row = { id: 1, ...data }; draft.activities.push(row); return row; } },
          activityMedia: { createMany: async ({ data }) => { if (failMedia) throw new Error('media failure'); draft.media.push(...data); } }
        };
        const result = await fn(tx);
        state = draft;
        return result;
      }
    };
    const handler = load('app/add/actions.ts', {
      '@/lib/prisma': { prisma }, 'next/navigation': navigation, 'next/cache': { revalidatePath() {} },
      '@/lib/s3-upload': { uploadActivityImageField: async () => null },
      '@/lib/booking-notifications': { extractEmailAddress: () => null, notifySubmitterActivityReceived: async () => { notified = true; } }
    });
    const form = new FormData();
    Object.entries({ title: 'Test', description: 'Test', categoryId: '1', organizerName: 'Existing',
      contactPhone: 'replacement', address: 'replacement', privacyConsent: 'on', rightsConfirmation: 'on',
      media1Url: 'https://example.test/photo.png' }).forEach(([k, v]) => form.set(k, v));
    await assert.rejects(handler.createActivity(form), failMedia ? /media failure/ : /REDIRECT:\/add\?success=1/);
    assert.equal(state.organizer.phone, 'original');
    assert.equal(state.organizer.address, 'original');
    assert.equal(state.organizer.websiteUrl, 'https://original.test');
    assert.equal(state.activities.length, failMedia ? 0 : 1);
    assert.equal(state.media.length, failMedia ? 0 : 1);
    assert.equal(notified, !failMedia);
  }
});

test('booking rejects unavailable events and preserves agreed promo instead of fallback', async () => {
  for (const scenario of ['missing', 'disabled', 'custom']) {
    let saved;
    const handler = load('app/activity/actions.ts', {
      'next/navigation': navigation, 'next/cache': { revalidatePath() {} },
      '@/lib/booking-notifications': { notifyOrganizerAboutBooking: async () => {} },
      '@/lib/prisma': { prisma: {
        activity: { findFirst: async () => ({ id: 1, slug: 'test', organizerId: 1 }) },
        organizerAccount: { findMany: async () => [{ id: 1, billingStatus: 'active', billingPlan: 'active', paidUntil: new Date(Date.now() + 86400000) }] },
        event: { findFirst: async ({ where }) => {
          assert.equal(where.activityId, 1);
          assert.ok(where.OR.length === 2, 'must filter expired events on submission');
          return scenario === 'missing' ? null : { id: 2, isPromoEnabled: scenario === 'custom', promoCode: 'SPECIAL', discountText: '5%' };
        } },
        activityBookingRequest: { create: async ({ data }) => { saved = data; } }
      } }
    });
    const form = new FormData();
    for (const [k, v] of Object.entries({ activityId: '1', eventId: '2', name: 'Test', contact: 'test' })) form.set(k, v);
    await assert.rejects(handler.createActivityBookingRequest(form), /REDIRECT:/);
    if (scenario === 'missing') assert.equal(saved, undefined);
    else {
      assert.equal(saved.eventId, 2);
      assert.equal(saved.promoCode, scenario === 'custom' ? 'SPECIAL' : null);
      assert.equal(saved.discountText, scenario === 'custom' ? '5%' : null);
    }
  }
});

test('notification never invents a discount', async () => {
  let sent;
  const notifications = load('lib/booking-notifications.ts', {
    '@/lib/email': { getAppBaseUrl: () => 'https://example.test', textToHtml: (s) => s,
      sendServiceEmail: async (input) => { sent = input; return { status: 'sent' }; } }
  });
  await notifications.notifyOrganizerAboutBooking({ activityTitle: 'Test', customerName: 'Test', customerContact: 'Test', notificationEmail: 'test@example.test' });
  assert.ok(!sent.text.includes('10%'));
  assert.ok(!sent.text.includes('Бонус'));
});

test('admin cannot publish enabled promo without agreed terms', async () => {
  const admin = load('app/admin/activities/actions.ts', {
    '@/lib/prisma': { prisma: {} }, 'next/navigation': navigation,
    'next/cache': { revalidatePath() {} }, '@/lib/booking-notifications': {}, '@/lib/s3-upload': {}
  });
  const form = new FormData();
  for (const [k, v] of Object.entries({ activityId: '1', eventTitle: 'Test', startsAt: '2026-10-01T19:00:00+03:00', isPromoEnabled: 'on' })) form.set(k, v);
  assert.match((await admin.createAdminActivityEvent(form)).error, /согласованные условия/);
});

test('event expiry uses end time when provided and start time otherwise', () => {
  const { getUpcomingEventWhere, getEventExpiresAt } = load('lib/events.ts');
  const now = new Date('2026-10-01T18:00:00Z');
  const where = getUpcomingEventWhere(now);
  assert.equal(where.OR[0].endsAt.gte, now);
  assert.equal(where.OR[1].endsAt, null);
  assert.equal(where.OR[1].startsAt.gte, now);
  const startsAt = new Date('2026-10-01T17:00:00Z');
  const endsAt = new Date('2026-10-01T19:00:00Z');
  assert.ok(getEventExpiresAt({ startsAt, endsAt }) > now);
  assert.ok(getEventExpiresAt({ startsAt, endsAt: null }) < now);
});

test('admin event saves without promo and returns validation errors without database writes', async () => {
  let saved;
  const admin = load('app/admin/activities/actions.ts', {
    '@/lib/prisma': { prisma: {
      activity: { findUniqueOrThrow: async () => ({ slug: 'test' }) },
      event: { create: async ({ data }) => { saved = data; } }
    } },
    'next/navigation': navigation, 'next/cache': { revalidatePath() {} },
    '@/lib/booking-notifications': {}, '@/lib/s3-upload': {}
  });
  const form = new FormData();
  for (const [k, v] of Object.entries({ activityId: '1', eventTitle: 'Test', startsAt: '2026-10-01T19:00:00+03:00' })) form.set(k, v);
  assert.ok((await admin.createAdminActivityEvent(form)).success);
  assert.equal(saved.isPromoEnabled, false);
  assert.equal(saved.discountText, '');
  assert.equal(saved.startsAt.toISOString(), '2026-10-01T16:00:00.000Z');
  saved = undefined;
  form.set('endDate', '2026-10-02');
  assert.match((await admin.createAdminActivityEvent(form)).error, /дату и время окончания/);
  assert.equal(saved, undefined);
  form.delete('endDate');
  form.set('endsAt', '2026-10-01T18:00:00+03:00');
  assert.match((await admin.createAdminActivityEvent(form)).error, /позже начала/);
  assert.equal(saved, undefined);
});

test('date fields render native calendars and preserve Moscow hidden timestamp', () => {
  const { OrganizerEventDateTimeFields } = load('components/OrganizerEventDateTimeFields.tsx');
  const html = renderToStaticMarkup(React.createElement(OrganizerEventDateTimeFields, {
    defaultStartsAt: '2026-10-01T19:30', defaultEndsAt: '2026-10-01T21:00'
  }));
  assert.equal((html.match(/type="date"/g) || []).length, 2);
  assert.ok(html.includes('value="2026-10-01T19:30:00+03:00"'));
  assert.ok(html.includes('value="2026-10-01T21:00:00+03:00"'));
});

test('admin form keeps fields mounted on validation error and resets only after success', async () => {
  for (const success of [false, true]) {
    const changes = [];
    let stateIndex = 0;
    let refreshed = false;
    const component = load('components/AdminEventForm.tsx', {
      react: { ...React, useRef: () => ({ current: false }),
        useState: (initial) => { const index = stateIndex++; return [initial, (value) => changes.push({ index, value })]; } },
      'next/navigation': { useRouter: () => ({ refresh: () => { refreshed = true; } }) },
      __globals: { FormData: class { constructor(form) { assert.equal(form, 'existing form'); } } }
    });
    const element = component.AdminEventForm({ action: async () => success ? { success: 'Saved' } : { error: 'Missing discount' }, children: null });
    await element.props.onSubmit({ preventDefault() {}, currentTarget: 'existing form' });
    assert.equal(changes.some(({ index }) => index === 2), success, 'form key must not change on error');
    assert.equal(refreshed, success);
    assert.ok(changes.some(({ index, value }) => index === 1 && (success ? value.success : value.error)));
  }
});

function fixture() {
  return { id: 1, slug: 'test', title: 'Тестовая встреча', description: 'Можно прийти одному и познакомиться с людьми.',
    address: 'Тула, тестовая улица', priceFrom: 1000, priceTo: null, imageUrl: null,
    contactUrl: 'https://example.test/contact', contactPhone: null,
    city: { name: 'Тула', slug: 'tula' }, category: { name: 'Игры', slug: 'games' }, organizer: { name: 'Тестовый организатор' },
    tags: [], media: [], events: [1, 2].map((id) => ({ id, title: `Встреча ${id}`, startsAt: new Date(`2026-10-0${id}T16:00:00Z`), endsAt: null,
      price: id === 1 ? 0 : 1000, signupUrl: `https://example.test/event-${id}`, isPromoEnabled: id === 2, promoCode: 'ВЛЮДИ', discountText: 'Скидка 10%' })) };
}

test('real activity page sends each event to organizer despite active platform booking', async () => {
  const activity = fixture();
  const mocks = {
    'next/navigation': navigation,
    '@/app/activity/actions': { createActivityBookingRequest() {} },
    '@/lib/prisma': { prisma: {
      activity: { findFirst: async () => activity, findMany: async () => [] },
      organizerAccount: { findMany: async () => [{ billingStatus: 'active', billingPlan: 'active', paidUntil: new Date(Date.now() + 86400000) }] }
    } }
  };
  const page = load('app/activity/[slug]/page.tsx', mocks);
  const html = renderToStaticMarkup(await page.default({ params: Promise.resolve({ slug: 'test' }) }));
  assert.ok(html.includes('href="https://example.test/event-1"'));
  assert.ok(html.includes('href="https://example.test/event-2"'));
  assert.ok(!html.includes('id="booking-form"'));
  assert.ok(!html.includes('href="#booking-form"'));
  assert.ok(html.includes('Бесплатно'));
  if (process.env.PILOT_PREVIEW) {
    fs.mkdirSync('tmp/pilot', { recursive: true });
    fs.writeFileSync('tmp/pilot/preview.html', '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body>' + html + '</body></html>');
  }
});

test('tracking retains event ID and retries when beacon queue rejects the click', async () => {
  const calls = [];
  const tracking = load('components/MetrikaGoals.tsx', { __globals: {
    window: { location: { pathname: '/activity/test' }, ym: (...args) => calls.push(['goal', ...args]) },
    document: { referrer: '' }, navigator: { sendBeacon: () => false },
    fetch: async (url, options) => { calls.push(['fetch', JSON.parse(options.body)]); }
  } });
  const link = tracking.TrackedExternalLink({ goal: 'organizer_contact_click', activityStat: { activityId: 1, eventId: 2, type: 'signup_click' }, href: 'https://example.test/event-2' });
  link.props.onClick({});
  assert.equal(calls[0][0], 'goal');
  assert.equal(calls[1][1].eventId, 2);
});
