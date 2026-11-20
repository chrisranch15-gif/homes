/* ============================================================
   LISTING CONCIERGE — ENGINE
   Pure logic. No DOM. Runs in the browser and in node tests.
   Facts → assets · events → state machine → workflows →
   policy-checked, idempotent actions → audit.
   ============================================================ */
var LC = (function () {
  'use strict';

  /* ---------- Tenants (white-label configuration, not code) ---------- */
  var TENANTS = {
    ranch: {
      id: 'ranch',
      name: 'The Ranch Real Estate Group',
      affiliation: 'Keller Williams Puget Sound',
      firm: 'Keller Williams Realty Puget Sound', office: '33434 8th Ave S, Suite 103, Federal Way, WA 98003',
      agent: { id: 'chris', name: 'Chris Ranch', role: 'Listing agent', phone: '(253) 335-5630', tel: '+12533355630' },
      brand: { serif: "'Playfair Display'", sans: "'Inter'", ink: '#1E2327', ground: '#F7F5F1', accent: '#8C6A43', night: '#16191B',
        fonts: 'family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600' },
      disclaimer: 'Information deemed reliable, not guaranteed. Equal Housing Opportunity.',
      policies: {
        'publish.story': 'verified', 'send.seller_live': 'authorized', 'send.seller_update': 'auto',
        'send.seller_report': 'auto', 'post.social': 'auto', 'send.agent_network': 'auto',
        'notify.agent': 'auto', 'send.guest_followup': 'consent', 'send.review_invite': 'auto',
        'price.change': 'human', 'reply.seller_judgment': 'human', 'mls.change': 'human',
        'openhouse.schedule': 'seller', 'route.vendor': 'consent',
        'send.buyer_ack': 'consent', 'send.buyer_followup': 'consent', 'request.feedback': 'auto', 'send.offer_notice': 'human', 'send.anniversary': 'human', 'send.milestone': 'auto', 'send.follower_update': 'consent', 'send.homebook': 'human'
      }
    },
    northline: {
      id: 'northline',
      name: 'Northline Realty',
      affiliation: 'Fictional second tenant · white-label test',
      agent: { id: 'ava', name: 'Ava Lind', role: 'Listing agent' },
      brand: { serif: "'Cormorant Garamond'", sans: "'Manrope'", ink: '#14231C', ground: '#F3F4EF', accent: '#3E6B57', night: '#0F1A15',
        fonts: 'family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Manrope:wght@400;500;600' },
      disclaimer: 'Demo tenant. Equal Housing Opportunity.',
      policies: {
        'publish.story': 'verified', 'send.seller_live': 'human', 'send.seller_update': 'auto',
        'send.seller_report': 'human', 'post.social': 'human', 'send.agent_network': 'auto',
        'notify.agent': 'auto', 'send.guest_followup': 'consent', 'send.review_invite': 'auto',
        'price.change': 'human', 'reply.seller_judgment': 'human', 'mls.change': 'human',
        'openhouse.schedule': 'seller', 'route.vendor': 'consent',
        'send.buyer_ack': 'consent', 'send.buyer_followup': 'consent', 'request.feedback': 'auto', 'send.offer_notice': 'human', 'send.anniversary': 'human', 'send.milestone': 'auto', 'send.follower_update': 'consent', 'send.homebook': 'human'
      }
    }
  };

  /* ---------- Media: ingested from Google Drive (folder "19917 145th") ---------- */
  // [file, drive sequence #, chapter, room, alt]
  var MEDIA = [
    ['great-room', 53, 1, 'Great room', 'Two-story great room with fireplace and a wall of glass to the covered deck'],
    ['front-dusk', 24, 0, 'Front elevation', 'Contemporary two-story front elevation beneath tall evergreens'],
    ['kitchen-island', 54, 1, 'Kitchen', 'Kitchen with oversized island, white shaker cabinetry, brass hardware and gas range'],
    ['kitchen-great', 47, 1, 'Kitchen & great room', 'Kitchen island open to the great room and dining area'],
    ['kitchen', 52, 1, 'Kitchen', 'Kitchen with walk-in pantry beyond'],
    ['kitchen-wide', 48, 1, 'Kitchen', 'Kitchen island with fireplace and great room beyond'],
    ['kitchen-galley', 50, 1, 'Kitchen', 'Kitchen run toward the walk-in pantry'],
    ['great-room2', 43, 1, 'Great room', 'Fireplace seating with open views to the kitchen'],
    ['dining', 51, 1, 'Dining', 'Dining room with brass globe chandelier'],
    ['dining2', 49, 1, 'Dining', 'Dining room looking to the covered deck'],
    ['entry-hall', 55, 1, 'Entry', 'Entry hall with custom console and gallery wall'],
    ['mudroom', 57, 1, 'Mudroom', 'Built-in mudroom bench with hooks and cubbies'],
    ['powder', 56, 1, 'Main-floor bath', 'Main-floor bathroom with quartz vanity'],
    ['pantry', 45, 1, 'Walk-in pantry', 'Walk-in pantry shelving'],
    ['mtn-alpenglow', 31, 2, 'Mount Rainier view', 'Alpenglow on Mount Rainier above the neighborhood, seen from the home'],
    ['mtn-moonrise', 32, 2, 'Mount Rainier view', 'Moonrise over Mount Rainier at dusk, seen from an upstairs window'],
    ['mtn-closeup', 33, 2, 'Mount Rainier view', 'Mount Rainier in evening light from upstairs'],
    ['mtn-clearday', 34, 2, 'Mount Rainier view', 'Mount Rainier on a clear winter day above the rooftops'],
    ['primary-bed2', 28, 2, 'Primary suite', 'Primary suite with tray ceiling'],
    ['primary-bed', 27, 2, 'Primary suite', 'Primary suite seating and windows'],
    ['primary-bed3', 30, 2, 'Primary suite', 'Primary suite toward the bath'],
    ['primary-bath2', 25, 2, 'Primary bath', 'Primary bath with soaking tub and dual vanity'],
    ['primary-tub', 20, 2, 'Primary bath', 'Soaking tub beside the shower'],
    ['primary-vanity-hall', 16, 2, 'Primary bath', 'Dual vanity opening to the primary suite'],
    ['primary-closet', 26, 2, 'Primary closet', 'Custom primary closet system'],
    ['bedroom-gray', 32, 2, 'Bedroom', 'Upstairs bedroom with clerestory window'],
    ['bedroom-green', 58, 2, 'Bedroom', 'Bedroom with green accent wall'],
    ['office-bed', 35, 2, 'Bedroom', 'Bedroom styled as a study'],
    ['hall-bath', 29, 2, 'Full bath', 'Upstairs full bath with dual vanity'],
    ['laundry', 33, 2, 'Laundry', 'Upstairs laundry with sink'],
    ['deck-fire', 8, 3, 'Covered deck', 'Composite deck with sectional seating and fire table'],
    ['deck', 7, 3, 'Covered deck', 'Composite deck and covered outdoor room'],
    ['covered-deck', 9, 3, 'Covered deck', 'Covered deck with string lights facing the evergreens'],
    ['greenbelt-yard', 5, 3, 'Backyard', 'Fenced lawn backing to the greenbelt'],
    ['rear-yard', 3, 3, 'Backyard', 'Rear elevation, deck and lawn'],
    ['rear-garden', 4, 3, 'Garden', 'Raised garden beds and rear elevation'],
    ['aerial-backyard', 22, 3, 'Aerial', 'Aerial of the fenced lot and deck'],
    ['aerial-pin', 18, 4, 'Setting', 'Aerial with the home marked along the greenbelt edge'],
    ['aerial-greenbelt', 17, 4, 'Setting', 'Aerial of the street and forested open space'],
    ['aerial-mountains', 21, 4, 'Tehaleh', 'Aerial of Tehaleh with the Cascades beyond'],
    ['aerial-street', 23, 4, 'Street', 'Aerial of the street and greenbelt'],
    ['clubhouse-sign', 6, 4, 'Clubhouse', 'Developer signage for the planned Tehaleh clubhouse'],
    ['clubhouse-front', 11, 4, 'Clubhouse', 'Clubhouse under construction'],
    ['clubhouse-aerial', 10, 4, 'Clubhouse', 'Aerial of the clubhouse under construction'],
    ['clubhouse-aerial2', 15, 4, 'Clubhouse', 'Aerial of the clubhouse site and neighborhood'],
    ['clubhouse-aerial3', 14, 4, 'Clubhouse', 'Aerial of the clubhouse with mountain views'],
    ['front', 1, 0, 'Front elevation', 'Front elevation and driveway'],
    ['front-street', 2, 0, 'Front elevation', 'Front elevation from the street']
  ].map(function (m) {
    return { id: m[0], file: 'photos/' + m[0] + '.jpg', thumb: 'thumbs/' + m[0] + '.jpg', seq: m[1], chapter: m[2], room: m[3], alt: m[4],
      listing: 'L-19917', source: 'Google Drive · 19917 145th / 19917-145th-St-E[1200] · #' + m[1] };
  });

  /* ---------- Fact record ---------- */
  function F(key, label, value, status, source, extra) {
    var f = { key: key, label: label, value: value, status: status, source: source };
    for (var k in (extra || {})) f[k] = extra[k];
    return f;
  }
  var SEED_FACTS = [
    F('address', 'Address', '19917 145th St E, Bonney Lake, WA', 'verified', 'Listing agreement'),
    F('community', 'Community', 'Tehaleh', 'verified', 'Listing agreement'),
    F('price', 'List price', 775000, 'verified', 'Agreed with seller'),
    F('beds', 'Bedrooms', 5, 'verified', 'Agent walk-through', { note: 'Main-floor 5th bedroom/office has no closet' }),
    F('baths', 'Bathrooms', 2.75, 'verified', 'Agent walk-through'),
    F('sqft', 'Interior square footage', null, 'conflict', 'County record and builder plan disagree', { options: ['County record', 'Builder plan'] }),
    F('upgrades', 'Upgrades', 'Over $100K in upgrades', 'verified', 'Seller-provided, agent-approved remarks'),
    F('school_district', 'School district', 'Sumner-Bonney Lake School District', 'verified', 'Approved remarks'),
    F('great_room', 'Great room', 'Soaring two-story great room with fireplace', 'verified', 'Photos 43, 53'),
    F('kitchen', 'Kitchen', 'Oversized island, white shaker cabinetry, brass hardware, gas range and walk-in pantry', 'verified', 'Photos 45–54'),
    F('character', 'Character', 'Custom millwork, designer accents and updated lighting', 'verified', 'Approved remarks'),
    F('main_floor', 'Main floor', 'Main-floor 5th bedroom/office (no closet) beside a ¾ bath, plus a beautifully appointed mudroom', 'verified', 'Agent walk-through'),
    F('primary', 'Primary suite', 'Mount Rainier views, soaking tub, frameless glass shower and custom closet system', 'verified', 'Photos 20–31'),
    F('views', 'Views', 'Mount Rainier from the primary suite and two more bedrooms', 'verified', 'Photos 31, 34 · agent walk-through'),
    F('fourth_bedroom', 'Fourth bedroom', 'Oversized fourth bedroom with walk-in closet overlooks the greenbelt and doubles as a potential bonus room', 'verified', 'Agent walk-through'),
    F('upper', 'Upper level', 'Full bath, laundry with quartz counters and sink, and new flooring', 'verified', 'Photos 29, 33'),
    F('lot', 'Lot', 'Generous fenced lot backing to recorded open-space greenbelt and towering evergreens', 'verified', 'Plat · photos 5, 17, 18'),
    F('deck', 'Outdoor living', 'New 24×22 covered outdoor living space with composite decking and a plumbed fire pit', 'verified', 'Seller invoice · photos 7–9'),
    F('storage', 'Storage closet', 'Large covered storage closet beside the deck', 'verified', 'Corrected from “beneath the deck”'),
    F('systems', 'Systems', 'Central AC, Cat-6 wiring, EV charger', 'verified', 'Seller disclosure'),
    F('garage', 'Garage', 'Extra-long garage with kick-out storage', 'verified', 'Agent walk-through'),
    F('trails', 'Trails', '40+ miles of trails', 'verified', 'Tehaleh community materials'),
    F('parks', 'Parks', '18 parks', 'verified', 'Tehaleh community materials'),
    F('amenities', 'Amenities', 'The Post café and the planned Retreat clubhouse', 'verified', 'Approved remarks · developer signage (photo 6)'),
    F('nearby', 'Nearby', 'Costco, Target and Lake Tapps', 'verified', 'Approved remarks'),
    F('water_view', 'Water view', 'Water view', 'removed', 'Not supported by site or photos'),
    F('shiplap', 'Shiplap', 'Shiplap accents', 'removed', 'Unconfirmed')
  ];
  var BLOCKED_PHRASES = ['water view', 'shiplap', 'beneath the deck', 'under the deck'];

  /* ---------- Silent talkers: room cards placed in the home, written only from verified facts ---------- */
  // [id, room, headline, fact keys, photo, story section]
  var TALKERS = [
    ['whole', 'Welcome', null, ['upgrades', 'character'], 'front-dusk', 's-story'],
    ['kitchen', 'Kitchen', 'Made for gathering', ['kitchen'], 'kitchen-island', 's-story'],
    ['great', 'Great room', 'Two stories of light', ['great_room'], 'great-room', 's-story'],
    ['main', 'Main floor', 'Room to work from home', ['main_floor'], 'great-room2', 's-home'],
    ['primary', 'Primary suite', 'Wake up to Mount Rainier', ['primary'], 'primary-bed2', 's-story'],
    ['fourth', 'Fourth bedroom', 'A bonus room in waiting', ['fourth_bedroom'], 'primary-closet', 's-home'],
    ['upper', 'Upper level', 'Everyday ease upstairs', ['upper'], 'primary-bath2', 's-home'],
    ['deck', 'Outdoor living', 'Brand new, built to be lived on', ['deck', 'storage'], 'deck-fire', 's-story'],
    ['yard', 'The yard', 'Your own backdrop of evergreens', ['lot'], 'greenbelt-yard', 's-story'],
    ['systems', 'Comfort & tech', 'The upgrades you don’t see', ['systems'], 'kitchen-wide', 's-home'],
    ['garage', 'Garage', 'Space for the gear', ['garage'], 'front-dusk', 's-home']
  ];

  /* ---------- Journey: explicit states and verified transitions ---------- */
  var STATES = {
    signed: 'Listing signed', preparing: 'Preparing', coming_soon: 'Coming soon', marketing_ready: 'Marketing ready',
    active: 'Active', market_engagement: 'Market engagement', temp_off_market: 'Temporarily off market',
    under_contract: 'Under contract', closed: 'Closed', withdrawn: 'Withdrawn', canceled: 'Canceled', expired: 'Expired'
  };
  var SPINE = ['signed', 'preparing', 'marketing_ready', 'active', 'market_engagement', 'under_contract', 'closed'];
  var MLS_MAP = {
    'Coming Soon': { to: 'coming_soon', from: ['preparing', 'marketing_ready'] },
    'Active': { to: 'active', from: ['marketing_ready', 'coming_soon', 'temp_off_market', 'under_contract', 'withdrawn'] },
    'Pending': { to: 'under_contract', from: ['active', 'market_engagement'] },
    'Sold': { to: 'closed', from: ['under_contract'] },
    'Temporarily Off Market': { to: 'temp_off_market', from: ['active', 'market_engagement'] },
    'Withdrawn': { to: 'withdrawn', from: ['coming_soon', 'active', 'market_engagement', 'temp_off_market'] },
    'Canceled': { to: 'canceled', from: ['coming_soon', 'active', 'market_engagement', 'temp_off_market', 'withdrawn'] },
    'Expired': { to: 'expired', from: ['active', 'market_engagement', 'temp_off_market'] }
  };

  /* ---------- Rules in plain words; some can be switched, some never ---------- */
  var POLICY_WORDS = {
    auto: 'Runs on its own', verified: 'Only after a verified trigger', authorized: 'Only if the seller authorized it',
    human: 'Waits for you', seller: 'Waits for the seller', consent: 'Only with the person’s consent'
  };
  var ADJUSTABLE = { 'post.social': ['auto', 'human'], 'send.agent_network': ['auto', 'human'], 'send.seller_report': ['auto', 'human'], 'send.seller_update': ['auto', 'human'], 'send.seller_live': ['authorized', 'human'] };
  var LOCKED = ['price.change', 'mls.change', 'reply.seller_judgment', 'publish.story', 'send.guest_followup', 'route.vendor', 'openhouse.schedule', 'send.buyer_ack', 'send.buyer_followup', 'send.offer_notice', 'send.follower_update'];
  var KIND_WORDS = {
    'publish.story': 'Publish the Property Story', 'send.seller_live': 'Tell the seller they’re live', 'send.seller_update': 'Update the seller',
    'send.seller_report': 'Send the weekly report', 'post.social': 'Post to social', 'send.agent_network': 'Announce to the agent network',
    'notify.agent': 'Route a request to the agent', 'send.guest_followup': 'Follow up with open-house guests', 'send.review_invite': 'Invite an honest review',
    'price.change': 'Change the price', 'reply.seller_judgment': 'Answer a seller’s judgment question', 'mls.change': 'Change anything on NWMLS',
    'openhouse.schedule': 'Confirm an open house', 'route.vendor': 'Introduce a Home Edit partner', 'prepare.openhouse': 'Prepare the open-house kit',
    'assign.sign': 'Point a sign at a home', 'regenerate.assets': 'Rebuild every page and post from the facts',
    'send.buyer_ack': 'Reply instantly to a buyer’s request', 'send.buyer_followup': 'Check in with a buyer who went quiet', 'request.feedback': 'Ask the buyer’s agent for showing feedback',
    'send.offer_notice': 'Tell the seller an offer arrived', 'send.anniversary': 'Home-anniversary note to past sellers', 'send.milestone': 'Remind the seller of contract milestones',
    'send.follower_update': 'Tell followers what changed', 'send.homebook': 'Send the home book to the new owners', 'create.listing': 'Set up a new listing'
  };

  /* ---------- Estimated staff effort each automated action replaces ---------- */
  var SAVES = {
    'publish.story': [24, 45, 6], 'send.seller_live': [8, 10, 2], 'post.social': [14, 15, 3], 'send.agent_network': [10, 12, 3],
    'notify.agent': [4, 3, 1], 'send.guest_followup': [6, 6, 2], 'send.seller_update': [6, 8, 2], 'send.seller_report': [30, 50, 7],
    'prepare.openhouse': [40, 60, 8], 'send.review_invite': [6, 6, 2], 'regenerate.assets': [20, 30, 5], 'ingest.photos': [60, 40, 4],
    'answer.question': [3, 5, 2], 'route.vendor': [5, 6, 2], 'assign.sign': [3, 4, 1], 'send.buyer_ack': [5, 5, 2], 'send.buyer_followup': [5, 6, 2], 'request.feedback': [6, 8, 3], 'send.milestone': [4, 5, 2], 'send.follower_update': [3, 4, 1], 'create.listing': [90, 120, 9]
  };

  function rid(p) { return (p || '') + Math.random().toString(36).slice(2, 8).toUpperCase(); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function money(n) { return '$' + Number(n).toLocaleString('en-US'); }

  /* ---------- Seed ---------- */
  function seed(now) {
    var t = now || Date.now();
    var code = 'RANCH-' + rid().slice(0, 4);
    return {
      v: 3, created: t,
      tenants: {
        ranch: { listings: { 'L-19917': {
          id: 'L-19917', tenant: 'ranch', state: 'marketing_ready', activations: 0,
          history: [{ at: t, from: null, to: 'preparing', why: 'Listing agreement completed' }, { at: t, from: 'preparing', to: 'marketing_ready', why: 'Facts, photos and marketing approved' }],
          facts: clone(SEED_FACTS),
          mode: 'editorial',
          sellers: [{ id: 'S1', name: 'Seller', code: code, tone: 'celebratory', authorized: { launch_comms: true }, share: 'S1' + rid().slice(0, 3).toLowerCase() }],
          authorizations: { mls_activation: false },
          approvals: [], exceptions: [], outbox: [], leads: [], scans: [], visits: [], shares: [], questions: [],
          openHouses: [], reports: [], updates: [], reviews: [], vendorIntros: [],
          ledger: {}, audit: [], events: [], runs: [], jobs: [], showings: [], offers: [], contract: null, followers: [], followFeed: [], homeBook: null, favorites: [], saved: { clicks: 0, minutes: 0, tabs: 0, actions: 0 },
          providers: { email: 'ok', social: 'ok', showing: 'ok' }
        } } },
        northline: { listings: {} }
      },
      signs: {
        'R-014-A': { id: 'R-014-A', cta: 'explore', listing: 'L-19917', tenant: 'ranch', history: [] },
        'R-014-B': { id: 'R-014-B', cta: 'valuation', listing: 'L-19917', tenant: 'ranch', history: [] },
        'R-022-A': { id: 'R-022-A', cta: 'explore', listing: null, tenant: 'ranch', history: [] }
      }
    };
  }

  /* ============================================================
     ENGINE
     ============================================================ */
  function createEngine(db, opts) {
    opts = opts || {};
    var now = opts.now || function () { return Date.now(); };
    var hooks = opts.hooks || {};
    var tenantId = opts.tenant || 'ranch';
    var providerFail = {}; // simulated outages keyed by provider, count of remaining failures

    function T() {
      var base = TENANTS[tenantId], o = db.tenantSettings && db.tenantSettings[tenantId];
      if (!o) return base;
      var t = {}; for (var k in base) t[k] = base[k];
      if (o.name) t.name = o.name; if (o.affiliation) t.affiliation = o.affiliation;
      if (o.agentName || o.agentEmail) t.agent = { id: base.agent.id, name: o.agentName || base.agent.name, email: o.agentEmail || '', role: base.agent.role };
      return t;
    }
    function setTenantSettings(o) {
      db.tenantSettings = db.tenantSettings || {}; var cur = db.tenantSettings[tenantId] || {};
      ['name', 'affiliation', 'agentName', 'agentEmail'].forEach(function (k) { if (o[k] != null) cur[k] = String(o[k]).slice(0, 120); });
      db.tenantSettings[tenantId] = cur;
      if (hooks.change) hooks.change();
      return T();
    }
    var RUN = null;
    function policyOf(kind) {
      var o = db.policyOverrides && db.policyOverrides[tenantId];
      if (o && o[kind] && LOCKED.indexOf(kind) < 0) return o[kind];
      return T().policies[kind] || 'auto';
    }
    function step(type, text, extra) {
      if (!RUN) return;
      var st = { type: type, text: text };
      for (var k in (extra || {})) st[k] = extra[k];
      RUN.steps.push(st);
    }
    function beginRun(l, trigger, who) {
      if (RUN) return false;
      RUN = { id: rid('W'), at: now(), trigger: trigger, who: who, steps: [] };
      return true;
    }
    function endRun(l, own) {
      if (!own || !RUN) return;
      if (!l.runs) l.runs = [];
      if (RUN.steps.length) { l.runs.unshift(RUN); if (l.runs.length > 60) l.runs.length = 60; }
      RUN = null;
    }
    function describe(type, p) {
      switch (type) {
        case 'mls.status': return ['NWMLS reported “' + p.status + '”' + (p.verified ? '' : ' (unverified)'), 'NWMLS feed'];
        case 'authorize': return ['Go-live authorized by ' + (p.by || 'staff'), 'You'];
        case 'qr.scanned': return ['Sign ' + p.sign + ' was scanned', 'Visitor'];
        case 'lead.created': return [(p.name || 'A visitor') + ' asked for a ' + (p.kind || 'showing').replace('-', ' '), p.source === 'open-house' ? 'Host' : 'Buyer'];
        case 'question.asked': return [(p.from === 'seller' ? 'Your seller' : 'A buyer') + ' asked “' + p.text + '”', p.from === 'seller' ? 'Seller' : 'Buyer'];
        case 'openhouse.requested': return ['Open house requested · ' + (p.label || ''), 'You'];
        case 'openhouse.checkin': return [p.guest && p.guest.name ? p.guest.name + ' signed in at the open house' : 'A guest arrived at the open house', 'Host'];
        case 'openhouse.completed': return ['The host ended the open house', 'Host'];
        case 'weekly.tick': return ['Weekly report time', 'Clock'];
        case 'price.change.requested': return ['Price change requested to ' + money(p.to), 'You'];
        case 'vendor.intro': return ['Home Edit introduction requested (' + p.category + ')', 'Visitor'];
        case 'provider.outage': return ['The ' + p.provider + ' connection stopped working', 'Outside service'];
        case 'provider.restore': return ['The ' + p.provider + ' connection was restored', 'You'];
        case 'share.created': return ['Your seller shared their link', 'Seller'];
        case 'seller.note': return ['You asked the Concierge to update your seller', 'You'];
        case 'showing.confirmed': return ['Showing confirmed for ' + (p.label || ''), 'You'];
        case 'showing.feedback': return ['Showing feedback arrived', 'Buyer’s agent'];
        case 'lead.contacted': return ['You reached the buyer', 'You'];
        case 'offer.received': return ['An offer arrived', 'Buyer’s agent'];
        case 'contract.dates': return ['Contract dates entered', 'You'];
        case 'follow.created': return [(p.name || 'A buyer') + ' started following this home', 'Buyer'];
        case 'follow.stopped': return ['A follower stopped following', 'Buyer'];
      }
      return [type, 'System'];
    }
    function L(id) {
      var bucket = db.tenants[tenantId];
      if (!bucket || !bucket.listings[id]) {
        // strict tenant isolation: a listing is only reachable through its own tenant
        throw new Error('Access denied: ' + id + ' is not a listing of tenant ' + tenantId);
      }
      var lx = bucket.listings[id];
      if (!lx.followers) lx.followers = []; if (!lx.followFeed) lx.followFeed = []; if (!lx.favorites) lx.favorites = [];
      return lx;
    }
    function audit(l, kind, text, data) {
      var e = { id: rid('A'), at: now(), kind: kind, text: text, data: data || null };
      l.audit.unshift(e); if (l.audit.length > 400) l.audit.length = 400;
      return e;
    }
    function credit(l, key) {
      var s = SAVES[key]; if (!s) return;
      l.saved.clicks += s[0]; l.saved.minutes += s[1]; l.saved.tabs += s[2]; l.saved.actions += 1;
    }
    function fact(l, key) {
      for (var i = 0; i < l.facts.length; i++) if (l.facts[i].key === key) return l.facts[i];
      return null;
    }
    function V(l, key) { var f = fact(l, key); return f && f.status === 'verified' ? f.value : null; }

    /* ---------- providers (simulated adapters; each confirms delivery) ---------- */
    function provider(name, payload) {
      if (providerFail[name] > 0) { providerFail[name]--; throw new Error(name + ' provider unavailable'); }
      return { status: 'delivered', providerId: name.toUpperCase() + '-' + rid(), at: now(), payload: payload };
    }

    /* ---------- the one door every action goes through ---------- */
    // policy → idempotency → retries → confirmed result → audit
    function perform(l, key, kind, run, meta) {
      meta = meta || {};
      var label = meta.label || KIND_WORDS[kind] || kind;
      var policy = policyOf(kind);
      var rule = { kind: kind, policy: policy, words: POLICY_WORDS[policy] };
      if (l.ledger[key]) { audit(l, 'dedupe', 'Skipped duplicate: ' + label, { key: key }); step('dupe', label + ' — already done, not repeated', { rule: rule }); return { deduped: true, result: l.ledger[key] }; }
      if (policy === 'human' && !meta.approved) { step('held', label + ' — waiting for you', { rule: rule }); return { pending: requestApproval(l, key, kind, meta, 'staff') }; }
      if (policy === 'seller' && !meta.approved) { step('held', label + ' — waiting for the seller', { rule: rule }); return { pending: requestApproval(l, key, kind, meta, 'seller') }; }
      if (policy === 'authorized' && !meta.authorized && !meta.approved) { step('held', label + ' — the seller hasn’t authorized it, so it waits for you', { rule: rule }); return { pending: requestApproval(l, key, kind, meta, 'staff', 'Seller has not authorized this message') }; }
      if (policy === 'consent' && !meta.consent) { audit(l, 'blocked', 'Not sent — no consent: ' + label); step('blocked', label + ' — not sent, no consent', { rule: rule }); return { blocked: 'consent' }; }
      if (policy === 'verified' && !meta.verified) { audit(l, 'blocked', 'Waiting for a verified trigger: ' + label); step('blocked', label + ' — not without a verified trigger', { rule: rule }); return { blocked: 'unverified' }; }
      var attempts = 0, last;
      while (attempts < 3) {
        attempts++;
        try {
          var r = run();
          l.ledger[key] = { at: now(), kind: kind, attempts: attempts, providerId: r && r.providerId };
          credit(l, kind);
          audit(l, 'action', label + (attempts > 1 ? ' (after ' + attempts + ' attempts)' : ''), { key: key, providerId: r && r.providerId });
          step('done', label + (attempts > 1 ? ' (on attempt ' + attempts + ')' : ''), { rule: rule, proof: r && r.providerId });
          return { ok: true, result: r, attempts: attempts };
        } catch (e) { last = e; }
      }
      var ex = raise(l, 'integration', meta.label ? meta.label + ' failed' : kind + ' failed', last.message + ' — retried 3 times, then paused. Nothing was sent twice.', { key: key, kind: kind, meta: meta });
      ex.retry = { key: key, kind: kind };
      audit(l, 'failure', label + ' failed after 3 attempts', { key: key });
      step('failed', label + ' — failed 3 times, paused, and sent to your Desk', { rule: rule });
      return { failed: true, exception: ex };
    }

    function send(l, kind, channel, to, subject, body, meta, key) {
      return perform(l, key, kind, function () {
        var r = provider(channel, { to: to, subject: subject });
        l.outbox.unshift({ id: rid('M'), at: now(), kind: kind, channel: channel, to: to, subject: subject, body: body, status: r.status, providerId: r.providerId });
        return r;
      }, Object.assign({}, meta, { payload: meta.payload || { send: { kind: kind, channel: channel, to: to, subject: subject, body: body } } }));
    }

    function requestApproval(l, key, kind, meta, who, reason) {
      for (var i = 0; i < l.approvals.length; i++) if (l.approvals[i].key === key && l.approvals[i].status === 'open') return l.approvals[i];
      var a = { id: rid('AP'), key: key, kind: kind, who: who, at: now(), status: 'open', label: meta.label || kind, detail: meta.detail || '', reason: reason || '', payload: meta.payload || null };
      l.approvals.unshift(a);
      audit(l, 'approval', 'Waiting for ' + (who === 'seller' ? 'seller' : 'staff') + ' approval: ' + a.label);
      return a;
    }
    function raise(l, type, title, detail, data) {
      for (var i = 0; i < l.exceptions.length; i++) {
        var x = l.exceptions[i]; if (x.open && x.type === type && x.title === title) return x;
      }
      var e = { id: rid('EX'), type: type, title: title, detail: detail, data: data || null, at: now(), open: true };
      l.exceptions.unshift(e);
      step('desk', 'Put on your Desk: ' + title);
      return e;
    }
    function resolve(l, id, how) {
      l.exceptions.forEach(function (x) { if (x.id === id && x.open) { x.open = false; x.resolved = now(); x.how = how; } });
    }

    /* ---------- state machine ---------- */
    function transition(l, to, why) {
      var from = l.state;
      if (from === to) return false;
      l.state = to;
      l.history.push({ at: now(), from: from, to: to, why: why });
      audit(l, 'state', STATES[from] + ' → ' + STATES[to], { why: why });
      step('state', 'Journey moved: ' + STATES[from] + ' → ' + STATES[to]);
      onEnter(l, to, from);
      if (hooks.change) hooks.change();
      return true;
    }

    function onEnter(l, s, from) {
      var A = l.activations;
      if (s === 'active') { l.activations++; A = l.activations; launch(l, A, from); if (from === 'under_contract' || from === 'temp_off_market') notifyFollowers(l, 'back:' + A, 'Back on the market', street(l) + ' is available again.'); }
      if (s === 'under_contract') notifyFollowers(l, 'pending:' + A, 'Under contract', street(l) + ' is now under contract. If it comes back on the market, you’ll be the first to know.');
      if (s === 'closed') notifyFollowers(l, 'sold', 'Sold', street(l) + ' has sold. Thanks for following — we can send first notice of similar homes in Tehaleh if you like.');
      if (s === 'under_contract') {
        perform(l, 'story.pending:' + A, 'publish.story', function () { return provider('web', { state: 'pending' }); }, { verified: true, label: 'Property Story marked “Pending”' });
        sellerMsg(l, 'pending:' + A, 'Under contract', quiet(l) ? 'Your home is under contract. Here is what happens next, step by step.' : 'Congratulations — your home is under contract. Here is the roadmap to closing.');
        l.contract = { milestones: [], confirmed: null };
        raise(l, 'contract', 'Enter the contract dates', 'Inspection, appraisal, financing and closing. The seller sees the timeline once you confirm it, and gets a reminder before each one.');
        (l.jobs || []).forEach(function (j) { if (!j.done && (j.type === 'weekly_report' || j.type === 'buyer_checkin')) { j.done = true; j.skipped = 'Under contract'; } });
      }
      if (s === 'closed') {
        l.closingBook = { at: now() };
        l.homeBook = l.homeBook || { code: 'HOME-' + rid().slice(0, 5), at: now(), sent: false };
        perform(l, 'homebook:' + l.homeBook.code, 'send.homebook', function () { var r = provider('email', { to: 'New owners' }); l.homeBook.sent = now(); return r; }, { label: 'Home book for the new owners', detail: 'Their link: ' + l.homeBook.code + '. You add a personal note before it goes.' });
        schedule(l, 'anniv:' + now(), 'anniversary', now() + 365 * 864e5, {}, 'One-year home-anniversary note to your sellers');
        sellerMsg(l, 'closed', 'Closed', quiet(l) ? 'Your sale has closed. Thank you for trusting us with it.' : 'Your home has officially sold. A recap of everything that went into it is in your portal.');
        l.sellers.forEach(function (sl) {
          // honest reviews: every eligible client is invited — no filtering by satisfaction, no incentives
          var r = send(l, 'send.review_invite', 'email', sl.name, 'Would you share your experience?', 'If you have a moment, an honest review helps other families. Thank you either way.', { label: 'Review invitation to ' + sl.name }, 'review:' + sl.id);
          if (r.ok) l.reviews.push({ seller: sl.id, invited: now(), response: null });
        });
      }
      if (s === 'withdrawn' || s === 'canceled' || s === 'expired' || s === 'temp_off_market') {
        perform(l, 'story.hide:' + s + ':' + A, 'publish.story', function () { return provider('web', { state: 'hidden' }); }, { verified: true, label: 'Property Story taken private (' + STATES[s] + ')' });
        sellerMsg(l, 'status:' + s + ':' + A, STATES[s], 'Your listing status is now “' + STATES[s] + '”. Chris will be in touch personally about next steps.');
      }
    }
    function quiet(l) { return l.sellers[0] && l.sellers[0].tone === 'quiet'; }

    function sellerMsg(l, keySuffix, title, text, kind) {
      var r = send(l, kind || 'send.seller_update', 'email', 'Seller', title, text, { label: 'Seller update: ' + title }, 'seller:' + keySuffix);
      // the portal only shows what was actually delivered
      if (r.ok) l.updates.unshift({ id: rid('U'), at: now(), title: title, text: text });
      return r;
    }

    /* ---------- launch workflow: runs only on a verified activation ---------- */
    function launch(l, A, from, approvedLive) {
      var relaunch = from === 'under_contract' || from === 'temp_off_market' || from === 'withdrawn';
      perform(l, 'story.publish:' + A, 'publish.story', function () { return provider('web', { url: 'story' }); }, { verified: true, label: 'Property Story published' });
      var s = l.sellers[0];
      var live = quiet(l) ? 'Your home is now live. Your private link is ready whenever you want it.' : 'Your home is officially live. Its story is ready to share.';
      var r = perform(l, 'seller.live:' + A, 'send.seller_live', function () {
        var res = provider('email', { to: s.name });
        l.outbox.unshift({ id: rid('M'), at: now(), kind: 'send.seller_live', channel: 'email', to: s.name, subject: relaunch ? 'Back on the market' : 'Your home is officially live', body: live, status: res.status, providerId: res.providerId });
        l.updates.unshift({ id: rid('U'), at: now(), title: relaunch ? 'Back on the market' : 'Officially live', text: live, reveal: true });
        return res;
      }, { authorized: !!(s.authorized && s.authorized.launch_comms), approved: !!approvedLive, label: 'Launch message to seller' });
      var posts = assets(l).social;
      posts.forEach(function (p, i) {
        send(l, 'post.social', 'social', p.network, p.network + ' post', p.text, { label: 'Social post ' + (i + 1) + ' (' + p.network + ')' }, 'social:' + A + ':' + i);
      });
      send(l, 'send.agent_network', 'email', 'Agent network', 'New on market: ' + V(l, 'address'), assets(l).agentEmail, { label: 'Agent network announcement' }, 'agents:' + A);
      if (l.state === 'active') transition(l, 'market_engagement', 'Launch workflow complete');
      schedule(l, 'weekly:' + nextFriday9(now()), 'weekly_report', nextFriday9(now()), {}, 'Friday weekly report to your seller');
      return r;
    }

    /* ---------- assets: every channel generated from one fact record ---------- */
    function assets(l) {
      var v = function (k) { return V(l, k); };
      var addr = v('address') || '';
      var street = addr.split(',')[0];
      var price = v('price') != null ? money(v('price')) : null;
      var sq = v('sqft');
      var bits = function (arr) { return arr.filter(Boolean).join(' '); };
      var sentence = function (val, pre, post) { return val ? (pre || '') + val + (post || '') : ''; };
      var remarks = bits([
        sentence(v('upgrades'), '', ' and a rare combination of designer interiors, generous outdoor living and a peaceful greenbelt setting!'),
        sentence(v('community'), 'This beautifully updated ', ' home' + (v('school_district') ? ' in the ' + v('school_district') : '') + ' impresses from the moment you enter.'),
        sentence(lower(v('great_room')), 'A ', (v('kitchen') ? ' opens to a gorgeous kitchen with ' + lower(v('kitchen')) + '.' : '.')),
        sentence(v('character'), '', ' add character throughout.'),
        sentence(v('main_floor'), '', '.'),
        sentence(v('primary'), 'Upstairs, the primary suite enjoys ', '.'),
        v('views') ? 'Two more bedrooms also capture mountain views' + (v('fourth_bedroom') ? ', while an ' + lower(v('fourth_bedroom')) + '.' : '.') : sentence(v('fourth_bedroom'), 'An ', '.'),
        sentence(lower(v('upper')), 'A ', ' complete the upper level.'),
        sentence(lower(v('lot')), 'A ', '.'),
        sentence(lower(v('deck')), 'The ', (v('storage') ? ', with a ' + lower(v('storage')) + '.' : '.')),
        sentence(v('systems'), '', (v('garage') ? ' and an ' + lower(v('garage')) + '.' : '.')),
        sq ? Number(sq).toLocaleString('en-US') + ' verified square feet.' : '',
        (v('trails') ? 'Enjoy Tehaleh’s ' + v('trails') + (v('parks') ? ', ' + v('parks') : '') + (v('amenities') ? ', ' + v('amenities') : '') + '.' : ''),
        sentence(v('nearby'), '', ' nearby.')
      ]).replace(/\s+/g, ' ').replace(/ ,/g, ',').trim();
      var specs = [price, v('beds') != null ? v('beds') + ' bedrooms*' : null, v('baths') != null ? v('baths') + ' baths' : null, sq ? Number(sq).toLocaleString('en-US') + ' sq ft' : null].filter(Boolean).join(' · ');
      return {
        remarks: remarks,
        specs: specs,
        headline: 'A home that feels different.',
        social: [
          { network: 'Instagram', photo: 'great-room', text: 'Just listed in Tehaleh — ' + street + '. ' + bits([v('great_room') ? v('great_room') + '.' : '', v('views') ? v('views') + '.' : '']) + ' ' + specs },
          { network: 'Facebook', photo: 'deck-fire', text: 'Room to unwind: ' + lower(v('deck') || 'outdoor living') + '. ' + (v('lot') ? v('lot') + '.' : '') + ' ' + specs },
          { network: 'Instagram', photo: 'mtn-alpenglow', text: 'Mornings with a view. ' + (v('views') || '') + '. ' + street + ', Bonney Lake.' }
        ].map(function (p) { p.text = p.text.replace(/\s+/g, ' ').replace(/\.\./g, '.').trim(); return p; }),
        agentEmail: 'New listing: ' + street + ' · ' + specs + '. ' + remarks.slice(0, 280) + '…',
        brochure: remarks,
        talkingPoints: [
          v('upgrades') ? v('upgrades') + ' — start with the ' + (v('deck') ? '24×22 covered deck and plumbed fire pit' : 'kitchen') + '.' : null,
          v('views') ? v('views') + '; the fourth bedroom overlooks the greenbelt.' : null,
          v('main_floor') ? 'Main-floor 5th bedroom is an office with no closet — say so plainly.' : null,
          v('lot') ? 'Backs to recorded open space. ' + (v('storage') ? 'Storage closet is beside the deck.' : '') : null,
          v('systems') ? v('systems') + '. ' + (v('garage') || '') : null
        ].filter(Boolean)
      };
    }
    function lower(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }

    function allAssetText(l) {
      var a = assets(l);
      return [a.remarks, a.specs, a.agentEmail, a.brochure].concat(a.social.map(function (p) { return p.text; })).concat(a.talkingPoints).join(' \n ');
    }

    /* ---------- facts ---------- */
    function setFact(id, key, value, status, source) {
      var l = L(id); var f = fact(l, key);
      if (!f) { f = { key: key, label: key, value: null, status: 'pending', source: '' }; l.facts.push(f); }
      var own = beginRun(l, 'Fact changed: ' + f.label, 'You');
      try { return setFactIn(l, f, key, value, status, source); } finally { endRun(l, own); }
    }
    function setFactIn(l, f, key, value, status, source) {
      var before = f.status + ':' + f.value;
      f.value = value; f.status = status || 'verified'; f.source = source || f.source; f.updated = now();
      audit(l, 'fact', f.label + ' → ' + (f.status === 'verified' ? formatValue(f) : f.status), { before: before });
      l.exceptions.forEach(function (x) { if (x.open && x.type === 'fact' && x.data && x.data.key === key && f.status !== 'conflict') { x.open = false; x.resolved = now(); x.how = 'Fact set'; } });
      perform(l, 'regen:' + key + ':' + now() + ':' + rid(), 'regenerate.assets', function () { return { providerId: 'RENDER-' + rid() }; }, { label: 'Every page, email, post and flyer rebuilt from the fact record' });
      if (hooks.change) hooks.change();
      return f;
    }
    function formatValue(f) {
      if (f.value == null) return '—';
      if (f.key === 'price') return money(f.value);
      if (f.key === 'sqft') return Number(f.value).toLocaleString('en-US') + ' sq ft';
      return String(f.value);
    }
    function scanConflicts(l) {
      l.facts.forEach(function (f) {
        if (f.status === 'conflict') raise(l, 'fact', f.label + ': sources disagree', f.source + '. It stays off every page until you choose.', { key: f.key });
      });
    }

    /* ---------- events: the only way the world changes the listing ---------- */
    function emit(id, type, p) {
      var l = L(id); p = p || {};
      var ev = { id: rid('E'), at: now(), type: type, p: p };
      l.events.unshift(ev); if (l.events.length > 300) l.events.length = 300;
      var d = describe(type, p);
      var own = type !== 'site.visit' && beginRun(l, d[0], d[1]);
      var out;
      try { out = handle(l, type, p, ev); } finally { endRun(l, own); }
      if (hooks.change) hooks.change();
      return out;
    }

    function handle(l, type, p, ev) {
      var A = l.activations;
      switch (type) {
        case 'mls.status': {
          var m = MLS_MAP[p.status];
          if (!m) { audit(l, 'rejected', 'Unknown MLS status “' + p.status + '”'); return { rejected: 'unknown' }; }
          if (!p.verified) { audit(l, 'rejected', 'MLS status “' + p.status + '” ignored — not verified from the MLS feed'); step('blocked', 'Ignored — not confirmed by the NWMLS feed, so nothing launched'); return { rejected: 'unverified' }; }
          if (m.from.indexOf(l.state) < 0) { audit(l, 'rejected', 'MLS “' + p.status + '” is not a valid move from ' + STATES[l.state]); step('blocked', '“' + p.status + '” isn’t a valid next step from ' + STATES[l.state] + ' — rejected'); return { rejected: 'invalid' }; }
          if (m.to === 'active' && !l.authorizations.mls_activation) {
            raise(l, 'authorization', 'MLS shows Active, but activation was not authorized', 'Confirm the seller signed off on going live before the Concierge launches anything.', { status: p.status });
            audit(l, 'rejected', 'Activation held — no authorization on file'); step('held', 'Launch held — no go-live authorization on file'); return { rejected: 'unauthorized' };
          }
          return { ok: transition(l, m.to, 'Verified NWMLS status: ' + p.status) };
        }
        case 'authorize': { l.authorizations[p.what] = true; audit(l, 'authorization', 'Authorized: ' + p.what + ' by ' + (p.by || 'staff')); step('note', 'Authorization recorded in the audit trail'); return { ok: true }; }
        case 'site.visit': {
          var sess = p.session || rid('V');
          var dup = l.visits.some(function (v) { return v.session === sess; });
          if (!dup) l.visits.push({ at: now(), session: sess, source: p.source || 'direct', share: p.share || null, demo: !!p.demo });
          return { ok: !dup };
        }
        case 'qr.scanned': {
          var sign = db.signs[p.sign];
          if (!sign) return { dest: 'unknown' };
          l.scans.push({ at: now(), sign: sign.id, cta: sign.cta, demo: !!p.demo });
          step('note', 'Scan counted for ' + sign.cta + ' — a tracked visit, not a lead');
          audit(l, 'scan', 'Sign ' + sign.id + ' scanned (' + sign.cta + ') — tracked, not a lead');
          return { dest: sign.cta };
        }
        case 'share.created': { l.shares.push({ at: now(), seller: p.seller, channel: p.channel || 'link' }); return { ok: true }; }
        case 'seller.note': return sellerMsg(l, 'note:' + rid(), 'A note from ' + T().agent.name.split(' ')[0], p.text);
        case 'lead.contacted': { var lc = leadById(l, p.lead); if (!lc) return {}; lc.status = 'contacted'; lc.contacted = now(); step('note', 'Marked as personally contacted — reminders stand down'); return { ok: true }; }
        case 'showing.confirmed': {
          var lq = leadById(l, p.lead); if (!lq) return {};
          var sh = { id: rid('SH'), lead: lq.id, at: p.at, label: p.label || '', status: 'scheduled', feedback: null };
          l.showings.unshift(sh); lq.status = 'scheduled';
          send(l, 'send.buyer_ack', 'email', lq.contact, 'Your tour is confirmed', 'You’re confirmed for ' + sh.label + ' at ' + street(l) + '. The full story is here whenever you want another look.', { consent: lq.consent, label: 'Tour confirmation to ' + (lq.name || 'the buyer') }, 'confirm:' + sh.id);
          schedule(l, 'fb:' + sh.id, 'showing_feedback', p.at + 2 * 36e5, { showing: sh.id }, 'Ask for feedback after the ' + sh.label + ' showing');
          return { ok: true, showing: sh };
        }
        case 'showing.feedback': {
          var sf = null; l.showings.forEach(function (x) { if (x.id === p.showing) sf = x; }); if (!sf || sf.feedback) return { ok: false };
          sf.feedback = { interest: p.interest, note: String(p.note || '').slice(0, 300), at: now() }; sf.status = 'completed';
          var word = { high: 'strong', medium: 'moderate', low: 'light' }[p.interest] || 'noted';
          // the seller hears the substance, never the buyer’s identity
          sellerMsg(l, 'fb:' + sf.id, 'Showing feedback', 'Feedback from a recent showing: interest is ' + word + '.' + (sf.feedback.note ? ' “' + sf.feedback.note + '”' : ''));
          return { ok: true };
        }
        case 'offer.received': {
          var of = { id: rid('OF'), at: now(), via: p.via || 'buyer’s agent' }; l.offers.unshift(of);
          send(l, 'notify.agent', 'email', T().agent.name, 'An offer arrived on ' + street(l), 'Review it in your transaction system. The Concierge never reads, shares or summarizes offer terms.', { label: 'Offer alert to ' + T().agent.name }, 'offer:' + of.id);
          raise(l, 'offer', 'An offer arrived', 'Review it with your seller. The Concierge never shares or summarizes offer terms — it only tells the seller one arrived, after you approve.', { offer: of.id });
          sellerMsg(l, 'offer:' + of.id, 'An offer arrived', 'An offer has arrived on your home. ' + T().agent.name.split(' ')[0] + ' will call you to go through it together.', 'send.offer_notice');
          return { ok: true, offer: of };
        }
        case 'contract.dates': {
          var c = l.contract || (l.contract = { milestones: [] });
          c.milestones = ['inspection', 'appraisal', 'financing', 'closing'].filter(function (k) { return p[k]; }).map(function (k) { return { key: k, label: { inspection: 'Inspection', appraisal: 'Appraisal', financing: 'Financing', closing: 'Closing' }[k], at: p[k], done: false }; });
          c.confirmed = now();
          c.milestones.forEach(function (m) { schedule(l, 'ms:' + m.key + ':' + m.at, 'milestone', m.at - 2 * 864e5, { key: m.key }, 'Remind the seller: ' + m.label.toLowerCase() + ' in two days'); });
          l.exceptions.forEach(function (x) { if (x.open && x.type === 'contract') { x.open = false; x.resolved = now(); } });
          sellerMsg(l, 'timeline:' + c.confirmed, 'Your path to closing', 'Your timeline is confirmed: ' + c.milestones.map(function (m) { return m.label + ' ' + new Date(m.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }).join(' · ') + '.');
          return { ok: true };
        }
        case 'lead.created': return lead(l, p);
        case 'follow.created': return follow(l, p);
        case 'follow.stopped': {
          var fs = followerBy(l, p.code); if (!fs || !fs.active) return { ok: false };
          fs.active = false; fs.stopped = now(); audit(l, 'consent', 'Follower opted out — no more updates'); step('note', 'Opted out — this person gets nothing further', { rule: { words: POLICY_WORDS.consent } });
          return { ok: true };
        }
        case 'question.asked': return question(l, p);
        case 'openhouse.requested': {
          var oh = { id: rid('OH'), start: p.start, end: p.end, label: p.label || '', host: p.host || T().agent.name, status: 'awaiting_seller', guests: 0, qr: 0, notes: [] };
          l.openHouses.unshift(oh);
          perform(l, 'oh.approve:' + oh.id, 'openhouse.schedule', function () { return { providerId: 'CAL-' + rid() }; }, { label: 'Open house ' + p.label, payload: { oh: oh.id }, detail: p.label });
          return { ok: true, oh: oh };
        }
        case 'openhouse.checkin': {
          var o = ohById(l, p.oh); if (!o) return {};
          if (p.via === 'qr') o.qr++; else o.guests++;
          if (p.guest) o.notes.push({ at: now(), name: p.guest.name || '', note: p.guest.note || '', tags: p.guest.tags || [], consent: !!p.guest.consent });
          return { ok: true };
        }
        case 'openhouse.completed': {
          var oo = ohById(l, p.oh); if (!oo || oo.status === 'completed') return { ok: false };
          oo.status = 'completed'; oo.completed = now();
          oo.notes.forEach(function (g) {
            if (g.tags.indexOf('Wants showing') >= 0 && g.consent) lead(l, { kind: 'showing', name: g.name, source: 'open-house', cta: 'host-capture', channel: 'in-person', consent: true, silent: true });
          });
          schedule(l, 'ohfu:' + oo.id, 'oh_followup', now() + 36e5, { oh: oo.id }, 'Thank-you notes to open-house guests');
          var total = oo.guests + oo.qr;
          var leads = oo.notes.filter(function (g) { return g.consent && g.tags.indexOf('Wants showing') >= 0; }).length;
          sellerMsg(l, 'oh:' + oo.id, 'Open house recap', total + ' groups came through. ' + (leads ? leads + ' asked for a private showing.' : 'No private showing requests yet.') + ' Notes from the host are in your portal.');
          return { ok: true };
        }
        case 'weekly.tick': {
          var rep = report(l);
          l.reports.unshift(rep);
          send(l, 'send.seller_report', 'email', 'Seller', 'Your weekly report', rep.summary, { label: 'Weekly report to seller' }, 'report:' + rep.week);
          return { ok: true, report: rep };
        }
        case 'price.change.requested': {
          return perform(l, 'price:' + p.to + ':' + A, 'price.change', function () {
            setFact(l.id, 'price', p.to, 'verified', 'Price change approved');
            return { providerId: 'PRICE-' + rid() };
          }, { label: 'Price change to ' + money(p.to), detail: 'Requires your approval — the Concierge never changes price on its own.', payload: { to: p.to } });
        }
        case 'vendor.intro': {
          var v = { at: now(), category: p.category, name: p.name, consent: !!p.consent };
          var r = perform(l, 'vendor:' + rid(), 'route.vendor', function () { l.vendorIntros.push(v); return provider('email', { to: p.category }); }, { consent: p.consent, label: 'Home Edit introduction (' + p.category + ')' });
          return r;
        }
        case 'provider.outage': { providerFail[p.provider] = p.failures || 99; audit(l, 'system', 'Simulated outage: ' + p.provider); return { ok: true }; }
        case 'provider.restore': { providerFail[p.provider] = 0; audit(l, 'system', p.provider + ' reconnected'); return { ok: true }; }
      }
      audit(l, 'event', 'Unhandled event ' + type);
      return { unhandled: true };
    }
    function street(l) { return (V(l, 'address') || '').split(',')[0]; }
    function leadById(l, id) { for (var i = 0; i < l.leads.length; i++) if (l.leads[i].id === id) return l.leads[i]; return null; }
    function followerBy(l, code) { var c = String(code || '').toUpperCase(); for (var i = 0; i < l.followers.length; i++) if (l.followers[i].code === c) return l.followers[i]; return null; }
    function follow(l, p) {
      var contact = String(p.contact || '').trim();
      if (!contact) return { ok: false, error: 'contact' };
      var f = null; l.followers.forEach(function (x) { if (x.contact.toLowerCase() === contact.toLowerCase()) f = x; });
      if (f) { f.active = true; f.consent = f.consent || !!p.consent; step('dupe', 'Already following — same person, no second sign-up'); return { ok: true, follower: f, existing: true }; }
      f = { id: rid('FW'), code: 'FW-' + rid().slice(0, 5), at: now(), name: String(p.name || '').slice(0, 60), contact: contact.slice(0, 120), channel: /@/.test(contact) ? 'email' : 'text',
        consent: !!p.consent, active: true, source: p.source || 'story', seen: now() };
      l.followers.unshift(f);
      send(l, 'send.follower_update', f.channel, f.contact, 'You’re following ' + street(l), 'We’ll let you know the moment anything changes: price, open houses, or status. Your personal link: ' + f.code + '. Reply STOP any time.', { consent: f.consent, label: 'Welcome to ' + (f.name || 'a new follower') }, 'follow:welcome:' + f.id);
      send(l, 'notify.agent', 'email', T().agent.name, 'New follower', (f.name || 'A buyer') + ' is following ' + street(l) + ' (' + f.channel + ').', { label: (f.name || 'A buyer') + ' is following — ' + T().agent.name + ' told' }, 'follow:agent:' + f.id);
      return { ok: true, follower: f };
    }
    function notifyFollowers(l, key, title, text) {
      var item = { id: rid('FU'), at: now(), title: title, text: text };
      l.followFeed.unshift(item);
      var sent = 0;
      l.followers.forEach(function (f) {
        if (!f.active) return;
        var r = send(l, 'send.follower_update', f.channel, f.contact, title + ' · ' + street(l), text, { consent: f.consent, label: title + ' → ' + (f.name || 'follower') }, 'follow:' + key + ':' + f.id);
        if (r.ok) sent++;
      });
      if (l.followers.some(function (f) { return f.active; })) step('note', title + ' — ' + sent + ' follower' + (sent === 1 ? '' : 's') + ' told');
      return sent;
    }
    function nextFriday9(t) { var d = new Date(t); d.setHours(9, 0, 0, 0); var add = (5 - d.getDay() + 7) % 7; if (add === 0 && t >= d.getTime()) add = 7; d.setDate(d.getDate() + add); return d.getTime(); }
    function schedule(l, key, type, due, p, label) {
      l.jobs = l.jobs || [];
      for (var i = 0; i < l.jobs.length; i++) if (l.jobs[i].key === key) return l.jobs[i];
      var j = { key: key, type: type, due: due, p: p || {}, label: label, done: false };
      l.jobs.push(j); step('note', 'Scheduled: ' + label + ' — ' + new Date(due).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }));
      return j;
    }
    var LIVE = ['active', 'market_engagement'];
    function runJob(l, j) {
      var own = beginRun(l, 'The clock: ' + j.label, 'Clock');
      try {
        if (j.type === 'weekly_report') {
          if (LIVE.indexOf(l.state) >= 0) { handle(l, 'weekly.tick', {}, null); schedule(l, 'weekly:' + nextFriday9(j.due + 1000), 'weekly_report', nextFriday9(j.due + 1000), {}, 'Friday weekly report to your seller'); }
          else step('blocked', 'Skipped — the listing isn’t on the market');
        } else if (j.type === 'oh_followup') {
          var oo = ohById(l, j.p.oh);
          (oo ? oo.notes : []).forEach(function (g, i) {
            send(l, 'send.guest_followup', 'email', g.name || 'Guest', 'Thank you for visiting ' + street(l), 'Thanks for stopping by. Here is the full story, and a private tour whenever you like.', { consent: g.consent, label: 'Follow-up to ' + (g.name || 'guest') }, 'ohfu:' + oo.id + ':' + i);
          });
        } else if (j.type === 'lead_nudge') {
          var ld = leadById(l, j.p.lead);
          if (!ld || ld.status === 'contacted' || ld.status === 'scheduled') step('note', 'No reminder needed — already handled');
          else send(l, 'notify.agent', 'email', T().agent.name, 'Still waiting: ' + (ld.name || 'a buyer'), (ld.name || 'A buyer') + ' asked for a ' + ld.kind + ' a day ago and hasn’t had a personal reply yet.', { label: 'Reminder to ' + T().agent.name + ': ' + (ld.name || 'a buyer') + ' is waiting' }, 'nudge:' + ld.id);
        } else if (j.type === 'buyer_checkin') {
          var lb = leadById(l, j.p.lead);
          if (!lb || lb.status === 'scheduled' || LIVE.indexOf(l.state) < 0) step('note', 'No check-in needed');
          else { var oh = l.openHouses.filter(function (o) { return o.status === 'scheduled'; })[0];
            send(l, 'send.buyer_followup', 'email', lb.contact, 'Still thinking about ' + street(l) + '?', 'Just checking in. ' + (oh ? 'There’s an open house ' + oh.label + '. ' : '') + 'Happy to arrange a private tour whenever suits you.', { consent: lb.consent, label: 'One gentle check-in to ' + (lb.name || 'the buyer') }, 'checkin:' + lb.id); }
        } else if (j.type === 'showing_feedback') {
          var sh = null; l.showings.forEach(function (x) { if (x.id === j.p.showing) sh = x; });
          if (sh && !sh.feedback) send(l, 'request.feedback', 'email', 'Buyer’s agent', 'How did the showing go?', 'Two quick questions about ' + street(l) + ': overall interest, and anything that stood out.', { label: 'Feedback requested for the ' + sh.label + ' showing' }, 'fbreq:' + sh.id);
        } else if (j.type === 'fact_recheck') {
          raise(l, 'recheck', 'Time to re-confirm the neighborhood facts', 'Trails, parks and the clubhouse timeline were last checked a month ago. Confirm they’re still accurate.', { places: (db.places && Object.keys(db.places)) || ['tehaleh'] });
          schedule(l, 'recheck:' + (j.due + 30 * 864e5), 'fact_recheck', j.due + 30 * 864e5, {}, 'Monthly re-check of neighborhood facts');
        } else if (j.type === 'milestone') {
          var m = l.contract && l.contract.milestones.filter(function (x) { return x.key === j.p.key; })[0];
          if (m && l.state === 'under_contract') send(l, 'send.milestone', 'email', 'Seller', 'Coming up: ' + m.label, m.label + ' is scheduled for ' + new Date(m.at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) + '. ' + T().agent.name.split(' ')[0] + ' will guide you through it.', { label: 'Seller reminder: ' + m.label.toLowerCase() + ' in two days' }, j.key);
        } else if (j.type === 'anniversary') {
          send(l, 'send.anniversary', 'email', 'Past seller', 'One year ago today', 'One year ago your home sold. Thank you again for trusting us — if anyone you know is thinking of moving, we’d be honored to help.', { label: 'Home-anniversary note' }, j.key);
        }
      } finally { endRun(l, own); }
    }
    function tick(id) {
      var l = L(id), t = now(), ran = [];
      l.jobs = l.jobs || [];
      if (!l.jobs.some(function (j) { return j.type === 'fact_recheck' && !j.done; })) {
        var own0 = beginRun(l, 'The clock started', 'Clock'); try { schedule(l, 'recheck:' + ((l.created || db.created || t) + 30 * 864e5), 'fact_recheck', (db.created || t) + 30 * 864e5, {}, 'Monthly re-check of neighborhood facts'); } finally { endRun(l, own0); }
      }
      if (LIVE.indexOf(l.state) >= 0 && !l.jobs.some(function (j) { return j.type === 'weekly_report' && !j.done; })) {
        var own1 = beginRun(l, 'The clock started', 'Clock'); try { schedule(l, 'weekly:' + nextFriday9(t), 'weekly_report', nextFriday9(t), {}, 'Friday weekly report to your seller'); } finally { endRun(l, own1); }
      }
      for (var guard = 0; guard < 60; guard++) {
        var due = l.jobs.filter(function (j) { return !j.done && j.due <= t; }).sort(function (a, b) { return a.due - b.due; })[0];
        if (!due) break;
        due.done = true; due.ran = t; runJob(l, due); ran.push(due);
      }
      if (ran.length && hooks.change) hooks.change();
      return ran;
    }
    function ohById(l, id) { for (var i = 0; i < l.openHouses.length; i++) if (l.openHouses[i].id === id) return l.openHouses[i]; return null; }

    function lead(l, p) {
      var ld = { id: rid('LD'), at: now(), kind: p.kind || 'showing', name: p.name || '', contact: p.contact || '', when: p.when || '',
        message: p.message || '', source: p.source || 'direct', cta: p.cta || '', channel: p.channel || 'web', consent: !!p.consent,
        agent: T().agent.id, status: 'new', demo: !!p.demo };
      l.leads.unshift(ld);
      var r = send(l, 'notify.agent', 'email', T().agent.name, 'New ' + ld.kind + ' request', (ld.name || 'A visitor') + ' · ' + ld.contact + ' · via ' + ld.source + '/' + ld.cta, { label: (ld.kind === 'showing' ? 'Showing' : 'Request') + ' routed to ' + T().agent.name }, 'lead:' + ld.id);
      ld.status = r.ok ? 'delivered' : 'pending';
      if (ld.contact && !p.silent && !p.demo) {
        var who = T().agent.name.split(' ')[0];
        send(l, 'send.buyer_ack', 'email', ld.contact, 'Thank you — ' + street(l), ld.kind === 'valuation' ? 'Thank you for asking. ' + who + ' prepares every valuation personally and will be in touch shortly.' : 'Thank you for your interest in ' + street(l) + '. ' + who + ' will confirm a time with you personally, usually within the hour.', { consent: ld.consent, label: 'Instant reply to ' + (ld.name || 'the buyer') }, 'ack:' + ld.id);
      }
      schedule(l, 'nudge:' + ld.id, 'lead_nudge', now() + 864e5, { lead: ld.id }, 'Check that ' + (ld.name || 'a new request') + ' got a personal reply');
      if (ld.kind === 'showing' && ld.consent && ld.contact) schedule(l, 'checkin:' + ld.id, 'buyer_checkin', now() + 3 * 864e5, { lead: ld.id }, 'Gentle check-in with ' + (ld.name || 'the buyer'));
      return { ok: true, lead: ld, delivery: r };
    }

    function question(l, p) {
      var q = { id: rid('Q'), at: now(), from: p.from || 'seller', text: p.text, answer: p.answer || null, by: p.answer ? 'concierge' : null, escalated: false };
      if (!q.answer) {
        q.escalated = true;
        raise(l, 'judgment', (q.from === 'seller' ? 'A question from your seller' : 'A buyer question'), '“' + q.text + '”', { q: q.id });
        if (q.from === 'seller') requestApproval(l, 'reply:' + q.id, 'reply.seller_judgment', { label: 'Reply to: “' + q.text + '”', detail: p.draft || '' }, 'staff');
      } else credit(l, 'answer.question');
      l.questions.unshift(q);
      audit(l, 'question', (q.escalated ? 'Escalated to ' + T().agent.name + ': ' : 'Answered from the fact record: ') + q.text);
      if (!q.escalated) step('done', 'Answered from verified facts', { rule: { words: 'Facts only — judgment goes to you' } });
      return { ok: true, q: q };
    }

    /* ---------- approvals ---------- */
    function approve(id, approvalId, decision, extra) {
      var l = L(id); var a = null;
      l.approvals.forEach(function (x) { if (x.id === approvalId) a = x; });
      if (!a || a.status !== 'open') return { ok: false };
      var own = beginRun(l, (a.who === 'seller' ? 'Your seller ' : 'You ') + (decision === 'approve' ? 'approved: ' : 'declined: ') + a.label, a.who === 'seller' ? 'Seller' : 'You');
      try { return decide(l, a, decision, extra); } finally { endRun(l, own); }
    }
    function decide(l, a, decision, extra) {
      a.status = decision === 'approve' ? 'approved' : 'declined'; a.decided = now();
      audit(l, 'approval', (a.status === 'approved' ? 'Approved: ' : 'Declined: ') + a.label);
      if (a.status !== 'approved') { if (hooks.change) hooks.change(); return { ok: true, declined: true }; }
      var res;
      if (a.kind === 'send.seller_live') {
        l.sellers[0].authorized.launch_comms = true;
        res = launch(l, l.activations, null, true);
      } else if (a.kind === 'openhouse.schedule') {
        var oh = ohById(l, a.payload.oh); oh.status = 'scheduled';
        res = perform(l, a.key, a.kind, function () { return { providerId: 'CAL-' + rid() }; }, { approved: true, label: 'Open house confirmed' });
        perform(l, 'oh.prep:' + oh.id, 'prepare.openhouse', function () { return { providerId: 'KIT-' + rid() }; }, { label: 'Open house kit: invitations, social graphic, host packet, print inserts' });
        send(l, 'post.social', 'social', 'Instagram', 'Open house', 'Open house · ' + (a.detail || '') + ' · ' + V(l, 'address').split(',')[0], { label: 'Open house announcement' }, 'ohsocial:' + oh.id);
        notifyFollowers(l, 'oh:' + oh.id, 'Open house', 'Open house ' + (a.detail || oh.label || '') + '. Stop by, no appointment needed.');
        perform(l, 'oh.sign:' + oh.id, 'assign.sign', function () { db.signs['R-014-A'].listing = l.id; db.signs['R-014-A'].history.push({ at: now(), listing: l.id }); return { providerId: 'SIGN-R014' }; }, { label: 'Sign R-014 assigned to this home' });
      } else if (a.kind === 'reply.seller_judgment') {
        var q = null; l.questions.forEach(function (x) { if ('reply:' + x.id === a.key) q = x; });
        if (q) { q.answer = (extra && extra.text) || a.detail || 'Chris will call you shortly.'; q.by = T().agent.name; }
        res = send(l, 'send.seller_update', 'email', 'Seller', 'Reply from ' + T().agent.name, q ? q.answer : '', { label: 'Reply sent to seller' }, a.key);
        l.exceptions.forEach(function (x) { if (x.open && x.type === 'judgment' && q && x.data && x.data.q === q.id) { x.open = false; x.resolved = now(); } });
      } else if (a.kind === 'price.change') {
        res = perform(l, a.key, a.kind, function () { setFact(l.id, 'price', a.payload.to, 'verified', 'Price change approved by ' + T().agent.name); return { providerId: 'PRICE-' + rid() }; }, { approved: true, label: 'Price changed to ' + money(a.payload.to) });
        notifyFollowers(l, 'price:' + a.payload.to, 'New price', street(l) + ' is now ' + money(a.payload.to) + '.');
        sellerMsg(l, 'price:' + a.payload.to, 'Price updated', 'Your new list price of ' + money(a.payload.to) + ' is reflected everywhere your home appears.');
      } else if (a.payload && a.payload.send) {
        var sd = a.payload.send;
        res = send(l, sd.kind, sd.channel, sd.to, sd.subject, sd.body, { approved: true, label: a.label }, a.key);
        if (res.ok && sd.to === 'Seller') l.updates.unshift({ id: rid('U'), at: now(), title: sd.subject, text: sd.body });
      } else {
        res = perform(l, a.key, a.kind, function () { return { providerId: 'OK-' + rid() }; }, { approved: true, label: a.label });
      }
      if (hooks.change) hooks.change();
      return { ok: true, result: res };
    }

    function retry(id, exId) {
      var l = L(id); var ex = null; l.exceptions.forEach(function (x) { if (x.id === exId) ex = x; });
      if (!ex || !ex.retry) return { ok: false };
      var own = beginRun(l, 'You asked the Concierge to resume: ' + ex.title, 'You');
      try { return retryIn(l, ex, exId); } finally { endRun(l, own); }
    }
    function retryIn(l, ex, exId) {
      var m = ex.data && ex.data.meta || {};
      var r;
      if (ex.retry.kind === 'post.social') {
        var idx = Number(String(ex.retry.key).split(':').pop()) || 0;
        var p = assets(l).social[idx] || assets(l).social[0];
        r = send(l, 'post.social', 'social', p.network, p.network + ' post', p.text, m, ex.retry.key);
      } else r = perform(l, ex.retry.key, ex.retry.kind, function () { return provider('email', {}); }, m);
      if (r.ok || r.deduped) resolve(l, exId, 'Retried successfully');
      if (hooks.change) hooks.change();
      return r;
    }

    /* ---------- reporting: first-party, sourced, never invented ---------- */
    function report(l) {
      var t = now(), week = 7 * 864e5, since = t - week;
      var inWin = function (arr) { return arr.filter(function (x) { return x.at >= since; }); };
      var visits = inWin(l.visits), scans = inWin(l.scans), leads = inWin(l.leads).filter(function (x) { return x.kind === 'showing'; });
      var guests = l.openHouses.filter(function (o) { return o.status === 'completed' && o.completed >= since; }).reduce(function (s, o) { return s + o.guests + o.qr; }, 0);
      var demo = visits.some(function (v) { return v.demo; }) || scans.some(function (v) { return v.demo; }) || leads.some(function (v) { return v.demo; });
      var lastAt = function (arr) { return arr.length ? Math.max.apply(null, arr.map(function (x) { return x.at; })) : null; };
      var metrics = [
        { key: 'visits', label: 'Property site visits', value: visits.length, source: 'First-party site analytics', window: '7 days', updated: lastAt(l.visits), status: 'live' },
        { key: 'showings', label: 'Showing requests', value: leads.length, source: 'Showing requests captured on the site and at events', window: '7 days', updated: lastAt(l.leads), status: 'live' },
        { key: 'scans', label: 'QR scans', value: scans.length, source: 'Sign scans (tracked interactions, not leads)', window: '7 days', updated: lastAt(l.scans), status: 'live' },
        { key: 'guests', label: 'Open-house guests', value: guests, source: 'Host-entered attendance (not leads)', window: '7 days', updated: lastAt(l.openHouses.filter(function (o) { return o.completed; }).map(function (o) { return { at: o.completed }; })), status: 'live' },
        { key: 'shared', label: 'Visits from your shared link', value: visits.filter(function (v) { return v.source === 'seller-share'; }).length, source: 'Your tracked link (counts only, never identities)', window: '7 days', updated: lastAt(l.visits.filter(function (v) { return v.source === 'seller-share'; })), status: 'live' },
        { key: 'portals', label: 'Zillow & Redfin views', value: null, source: 'No legitimate data feed connected', window: '—', updated: null, status: 'unavailable' }
      ];
      metrics.forEach(function (m) { if (m.status === 'live' && m.updated && t - m.updated > 2 * 864e5) m.status = 'stale'; if (m.status === 'live' && m.value === 0 && !m.updated) m.status = 'no-data'; });
      var bySource = {};
      visits.forEach(function (v) { bySource[v.source] = (bySource[v.source] || 0) + 1; });
      var days = []; for (var d = 6; d >= 0; d--) { var s0 = t - (d + 1) * 864e5, s1 = t - d * 864e5; days.push(visits.filter(function (v) { return v.at >= s0 && v.at < s1; }).length); }
      var insight;
      var conv = visits.length ? leads.length / visits.length : 0;
      if (visits.length >= 100 && conv < 0.02) insight = 'Lots of visits, few showing requests. That points to testing the lead photo, headline and page experience first — not a price change.';
      else if (visits.length < 30) insight = 'Early days. Visits are still building; the next lift should come from the agent network and the open house.';
      else insight = 'Healthy interest and showing requests. Keep the story in front of buyers and follow up quickly on every request.';
      var summary = visits.length + ' site visits, ' + leads.length + ' showing requests, ' + scans.length + ' QR scans and ' + guests + ' open-house guests this week. ' + insight;
      return { id: rid('R'), week: Math.floor(t / week), at: t, metrics: metrics, bySource: bySource, days: days, insight: insight, summary: summary, demo: demo };
    }

    /* ---------- the Concierge’s grounded answers (no model needed) ---------- */
    var TOPICS = [
      [/(water|lake view)/i, 'water_view'], [/(shiplap)/i, 'shiplap'], [/(price|cost|list)/i, 'price'], [/(bed|bedroom|office|closet)/i, 'beds'], [/(bath)/i, 'baths'], [/(school|district)/i, 'school_district'],
      [/(sq|square|size|footage)/i, 'sqft'], [/(view|rainier|mountain)/i, 'views'], [/(deck|fire|outdoor|patio)/i, 'deck'], [/(yard|lot|greenbelt|fence)/i, 'lot'],
      [/(kitchen|pantry|island)/i, 'kitchen'], [/(\bac\b|air|cooling|\bev\b|charger|cat-?6|network)/i, 'systems'], [/(garage|parking|storage)/i, 'garage'],
      [/(trail|park|clubhouse|amenit|post)/i, 'amenities']
    ];
    var JUDGMENT = /(should|offer|negotiat|lower|reduce|hold|accept|counter|worth|advice|recommend|strategy|price drop)/i;
    function answer(id, text) {
      var l = L(id);
      if (JUDGMENT.test(text)) return null;
      for (var i = 0; i < TOPICS.length; i++) {
        if (TOPICS[i][0].test(text)) {
          var f = fact(l, TOPICS[i][1]);
          if (!f) continue;
          if (f.status === 'removed') return 'We don’t claim a ' + f.label.toLowerCase() + ' for this home — it isn’t supported, so it was removed from every listing material.';
          if (f.status !== 'verified') return null;
          var PHRASE = {
            views: 'Yes — Mount Rainier is visible from the primary suite and two more bedrooms. The fourth bedroom looks out over the greenbelt.',
            beds: 'Five bedrooms. One note: the main-floor 5th bedroom is an office with no closet.',
            baths: 'There are 2.75 baths, including a ¾ bath on the main floor.',
            deck: 'A new 24×22 covered outdoor living space with composite decking and a plumbed fire pit, with a large covered storage closet beside the deck.',
            systems: 'Yes — central AC, plus Cat-6 wiring and an EV charger.',
            school_district: 'The home is in the Sumner-Bonney Lake School District. For school assignments, check with the district directly.',
            lot: 'A generous fenced lot that backs to recorded open-space greenbelt and towering evergreens.'
          };
          if (PHRASE[f.key]) return PHRASE[f.key];
          var extra = f.key === 'beds' ? ' (' + fact(l, 'beds').note + ')' : f.key === 'amenities' ? '. Tehaleh also offers ' + V(l, 'trails') + ' and ' + V(l, 'parks') : '';
          return f.label + ': ' + formatValue(f) + extra + '.';
        }
      }
      return null;
    }

    function signResolve(signId) {
      var s = db.signs[signId];
      if (!s) return { kind: 'unknown' };
      if (!s.listing) return { kind: 'fallback', sign: s };
      return { kind: s.cta, sign: s, listing: s.listing };
    }

    function sellerLogin(id, code) {
      var l = L(id);
      var s = null; l.sellers.forEach(function (x) { if (x.code.toUpperCase() === String(code || '').trim().toUpperCase()) s = x; });
      audit(l, 'access', s ? 'Seller signed in' : 'Seller sign-in refused (wrong code)');
      return s ? { ok: true, seller: s.id, token: 'tok-' + s.id + '-' + rid() } : { ok: false };
    }

    function sellerView(id, token) {
      // seller-facing data is filtered: no audit, no other leads' identities, no staff notes
      if (!token || token.indexOf('tok-') !== 0) throw new Error('Private: seller sign-in required');
      var l = L(id);
      return { state: l.state, updates: l.updates, approvals: l.approvals.filter(function (a) { return a.who === 'seller' && a.status === 'open'; }),
        done: l.audit.filter(function (a) { return a.kind === 'action'; }).slice(0, 8).map(function (a) { return { at: a.at, text: a.text }; }),
        report: l.reports[0] || null, seller: l.sellers[0], questions: l.questions.filter(function (q) { return q.from === 'seller'; }) };
    }

    function setPolicy(kind, value) {
      if (LOCKED.indexOf(kind) >= 0 || !ADJUSTABLE[kind] || ADJUSTABLE[kind].indexOf(value) < 0) return { ok: false, locked: true };
      db.policyOverrides = db.policyOverrides || {}; db.policyOverrides[tenantId] = db.policyOverrides[tenantId] || {};
      db.policyOverrides[tenantId][kind] = value;
      if (hooks.change) hooks.change();
      return { ok: true };
    }

    return {
      db: db, T: T, L: L, emit: emit, tick: tick, now: now, policyOf: policyOf, setPolicy: setPolicy, setTenantSettings: setTenantSettings,
      proposeFacts: function (id, items, source) {
        // AI intake: anything extracted from notes enters as PENDING — never published until a person verifies it
        var l = L(id); var added = [];
        var own = beginRun(l, 'Notes read by the Concierge (' + (source || 'pasted text') + ')', 'You');
        try {
          (items || []).slice(0, 12).forEach(function (it) {
            if (!it || !it.label || !it.value) return;
            var key = 'x_' + String(it.label).toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);
            if (fact(l, key)) return;
            var blocked = BLOCKED_PHRASES.some(function (p) { return (it.label + ' ' + it.value).toLowerCase().indexOf(p) >= 0; });
            var f = { key: key, label: String(it.label).slice(0, 60), value: String(it.value).slice(0, 240), status: blocked ? 'removed' : 'pending', source: 'Extracted from ' + (source || 'notes') + ' · needs verification' };
            l.facts.push(f); added.push(f);
            step(blocked ? 'blocked' : 'held', f.label + (blocked ? ' — matches a removed claim, kept off' : ' — added as pending; waits for you to verify'), { rule: { words: 'AI may propose facts, never publish them' } });
          });
        } finally { endRun(l, own); }
        if (hooks.change) hooks.change();
        return added;
      },
      setLeadPhoto: function (id, photo, why) {
        var l = L(id); var own = beginRun(l, 'Lead photo changed' + (why ? ' — ' + why : ''), 'You');
        try { l.heroPhoto = photo; audit(l, 'story', 'Lead photo set to ' + photo); step('done', 'Property Story, social image and story card now lead with “' + photo.replace(/-/g, ' ') + '”', { rule: { words: 'Runs on its own' } }); } finally { endRun(l, own); }
        if (hooks.change) hooks.change();
      },
      approve: approve, retry: retry,
      followerView: function (id, code) {
        var l = L(id), f = followerBy(l, code); if (!f) throw new Error('Unknown follower link');
        return { follower: { name: f.name, code: f.code, active: f.active, channel: f.channel, at: f.at }, state: l.state, feed: l.followFeed.filter(function (u) { return u.at >= f.at - 1000; }), price: V(l, 'price') };
      },
      homeBook: function (id, code) {
        var l = L(id); if (!l.homeBook || l.homeBook.code !== String(code || '').toUpperCase()) throw new Error('Private: home book link required');
        return { ok: true, book: l.homeBook };
      },
      createListing: function (p) {
        // ten-minute setup: what the agent enters is verified by the agent; nothing goes public until photos, facts and a verified NWMLS status are in
        var bucket = db.tenants[tenantId]; var id = 'L-' + String(p.address || '').replace(/\D/g, '').slice(0, 6) + rid().slice(0, 2);
        var fx = [];
        var add = function (key, label, value, src) { if (value !== '' && value != null) fx.push({ key: key, label: label, value: value, status: 'verified', source: src || 'Entered by ' + T().agent.name + ' at setup' }); };
        add('address', 'Address', String(p.address || '').slice(0, 140)); add('price', 'List price', Number(p.price) || null); add('beds', 'Bedrooms', Number(p.beds) || null); add('baths', 'Baths', Number(p.baths) || null);
        if (p.sqft) fx.push({ key: 'sqft', label: 'Interior square feet', value: Number(p.sqft), status: 'pending', source: 'Entered at setup · confirm against county or builder record' });
        if (p.highlights) fx.push({ key: 'x_highlights', label: 'Highlights from the agent', value: String(p.highlights).slice(0, 400), status: 'pending', source: 'Setup notes · each claim checked before it publishes' });
        var nl = { id: id, tenant: tenantId, state: 'preparing', activations: 0, created: now(), history: [{ at: now(), from: null, to: 'preparing', why: 'Set up in ten minutes' }], facts: fx, mode: p.mode || 'editorial',
          sellers: [{ id: 'S1', name: p.seller || 'Seller', email: p.sellerEmail || '', code: (T().id === 'ranch' ? 'RANCH-' : 'NL-') + rid().slice(0, 4), tone: p.tone || 'celebratory', authorized: { launch_comms: !!p.launchOk }, share: 'S1' + rid().slice(0, 3).toLowerCase() }],
          authorizations: { mls_activation: false }, approvals: [], exceptions: [], outbox: [], leads: [], scans: [], visits: [], shares: [], questions: [], openHouses: [], reports: [], updates: [], reviews: [], vendorIntros: [],
          ledger: {}, audit: [], events: [], runs: [], jobs: [], showings: [], offers: [], contract: null, followers: [], followFeed: [], homeBook: null, favorites: [], saved: { clicks: 0, minutes: 0, tabs: 0, actions: 0 },
          providers: { email: 'ok', social: 'ok', showing: 'ok' }, photosFolder: p.photos || '', checklist: { photos: !!p.photosReady, facts: false, seller: !!p.seller, mls: false } };
        bucket.listings[id] = nl;
        credit(nl, 'create.listing');
        audit(nl, 'state', 'Listing set up — ' + fx.length + ' facts entered, photos ' + (p.photos ? 'folder linked' : 'still to come'));
        if (hooks.change) hooks.change();
        return nl;
      },
      talkers: function (id) {
        var l = L(id), custom = l.talkersCustom || [];
        var cards = TALKERS.map(function (t) {
          var facts = t[3].map(function (k) { return fact(l, k); });
          if (facts.some(function (f) { return !f || f.status !== 'verified'; })) return { id: t[0], room: t[1], held: true, why: 'Waits until ' + facts.filter(function (f) { return !f || f.status !== 'verified'; }).map(function (f) { return f ? f.label.toLowerCase() : 'a fact'; }).join(' and ') + ' is verified' };
          var body = (t[2] ? facts : facts.slice(1)).map(function (f) { return String(f.value).replace(/\.$/, ''); }).join('. ') + '.';
          return { id: t[0], room: t[1], title: t[2] || String(facts[0].value), body: body, photo: t[4], section: t[5], sources: facts.map(function (f) { return f.source; }), off: (l.talkersOff || []).indexOf(t[0]) >= 0 };
        });
        custom.forEach(function (c) { cards.push({ id: c.id, room: c.room, title: c.title, body: c.body, photo: c.photo || 'front-dusk', section: 's-home', sources: ['Written by ' + T().agent.name], custom: true, off: (l.talkersOff || []).indexOf(c.id) >= 0 }); });
        return cards.filter(function (c) { return !c.body || !BLOCKED_PHRASES.some(function (p) { return (c.title + ' ' + c.body).toLowerCase().indexOf(p) >= 0; }); });
      },
      addTalker: function (id, c) {
        var l = L(id), txt = (c.title + ' ' + c.body).toLowerCase();
        var hit = BLOCKED_PHRASES.filter(function (p) { return txt.indexOf(p) >= 0; });
        if (hit.length) return { ok: false, blocked: hit };
        l.talkersCustom = l.talkersCustom || [];
        var card = { id: rid('TK'), room: String(c.room || 'Room').slice(0, 40), title: String(c.title || '').slice(0, 60), body: String(c.body || '').slice(0, 220), photo: c.photo };
        l.talkersCustom.push(card); audit(l, 'story', 'Silent talker added: ' + card.room);
        if (hooks.change) hooks.change(); return { ok: true, card: card };
      },
      toggleTalker: function (id, tid) { var l = L(id); l.talkersOff = l.talkersOff || []; var i = l.talkersOff.indexOf(tid); if (i >= 0) l.talkersOff.splice(i, 1); else l.talkersOff.push(tid); if (hooks.change) hooks.change(); },
      listings: function () { return Object.keys(db.tenants[tenantId].listings).map(function (k) { return db.tenants[tenantId].listings[k]; }); }, setFact: setFact, fact: fact, V: V,
      assets: function (id) { return assets(L(id)); }, allAssetText: function (id) { return allAssetText(L(id)); },
      report: function (id) { return report(L(id)); }, answer: answer, raise: function (id, a, b, c, d) { return raise(L(id), a, b, c, d); },
      resolve: function (id, x, h) { resolve(L(id), x, h); if (hooks.change) hooks.change(); }, scanConflicts: function (id) { scanConflicts(L(id)); },
      transition: function (id, to, why) { return transition(L(id), to, why); }, signResolve: signResolve, sellerLogin: sellerLogin, sellerView: sellerView,
      formatValue: formatValue, forTenant: function (t) { return createEngine(db, { now: now, hooks: hooks, tenant: t }); }, tenant: function () { return tenantId; }
    };
  }

  return { TALKERS: TALKERS, POLICY_WORDS: POLICY_WORDS, ADJUSTABLE: ADJUSTABLE, LOCKED: LOCKED, KIND_WORDS: KIND_WORDS, TENANTS: TENANTS, MEDIA: MEDIA, STATES: STATES, SPINE: SPINE, SEED_FACTS: SEED_FACTS, BLOCKED_PHRASES: BLOCKED_PHRASES, SAVES: SAVES,
    seed: seed, createEngine: createEngine, money: money, rid: rid, clone: clone };
})();
if (typeof module !== 'undefined') module.exports = LC;
