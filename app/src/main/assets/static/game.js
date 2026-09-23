/* ── CONSTANTS ──────────────────────────────────────────────── */
const NUM_BOARDS = 8;
const RANK_LABELS = ['D', 'C', 'B', 'A', 'S', 'Z'];
const RANK_COLORS = { D:'#4CAF50', C:'#2196F3', B:'#FFC107', A:'#FF9800', S:'#F44336', Z:'#9C27B0' };
const RANK_DECAY  = { D:0.045, C:0.075, B:0.115, A:0.165, S:0.260, Z:0.380 };
const RANK_MULT   = { D:1, C:1.5, B:2, A:3, S:5, Z:8 };
const SLOT_MACHINE_COST = 100;
const SCRATCH_COST = 50;
const SELL_REFUND_RATIO = 0.5;

/* ── SPRITE LOADER ──────────────────────────────────────────────
 * All reusable SVG art lives in static/sprites/ as standalone .svg
 * files using `currentColor` where appropriate. Sprites is populated
 * by Sprites.preload() before the game boots, so the rest of the
 * code can just read `Sprites.flag`, `Sprites.mine_mine`, etc.        */
const Sprites = {};
const SPRITE_FILES = {
    flag:'flag', mine:'mine', check:'check', cross:'cross', dot:'dot',
    mine_mine:'mine-mine', trench_mine:'trench-mine', grenade_mine:'grenade-mine',
    totem_mine:'totem-mine', fractal_mine:'fractal-mine',
    kickstart_mine:'kickstart-mine', diffusal_mine:'diffusal-mine', pipe_mine:'pipe-mine',
    steel_mine:'steel-mine',
     prospector_mine:'prospector-mine', fortune_mine:'fortune-mine',
     dealer_mine:'dealer-mine', bargain_mine:'bargain-mine', mipen_meimer:'mipen-meimer',
    nuke_mimb:'nuke-mimb', tsar_mimba:'tsar-mimba',
    feat_board:'feat-board', feat_streak:'feat-streak', feat_collector:'feat-collector',
    feat_score:'feat-score', feat_score_hi:'feat-score-hi',
    feat_level:'feat-level', feat_level_hi:'feat-level-hi',
    feat_meta:'feat-meta', feat_secret:'feat-secret', feat_circle:'feat-circle',
    feat_lock:'feat-lock', feat_fun:'feat-fun',
    float_circle:'float-circle', float_blob:'float-blob', float_shard:'float-shard',
    float_ring:'float-ring', float_roundsq:'float-roundsq', float_cross:'float-cross',
    float_tri:'float-tri', float_dot:'float-dot',
    /* UI sprites — referenced by elements with [data-sprite="key"] in HTML
     * and injected by Sprites.hydrateUi() after preload completes.        */
    ui_settings:'ui-settings', ui_info:'ui-info', ui_refresh:'ui-refresh',
    ui_star:'ui-star',
};

/* Per-theme difficulty icon variants (each color = own SVG file).
 * Stored under static/assets/themes/<theme>/diff-<level>.svg and
 * static/assets/difficulties/diff-hard-locked.svg for the gray
 * locked state. Populated by Sprites.preload() into Sprites.themedDiff
 * = { <theme>: { easy, normal, hard }, _locked: <hardLockedSvg> }.    */
const THEMED_DIFF_THEMES = ['green','red','blue','yellow','purple','black','synthwave','spamton','danger_zone','volatile','blueprint','retro_terminal'];
const THEMED_DIFF_LEVELS = ['easy','normal','hard'];
Sprites.themedDiff = {};

Sprites.preload = async function() {
    const fetches = [];
    /* Generic sprites */
    for (const [key, file] of Object.entries(SPRITE_FILES)) {
        fetches.push(
            fetch(`static/sprites/${file}.svg`, { cache: 'force-cache' })
                .then(r => r.text())
                .then(t => { Sprites[key] = t.trim(); })
        );
    }
    /* Themed difficulty icons — one SVG per theme/level combo */
    for (const theme of THEMED_DIFF_THEMES) {
        Sprites.themedDiff[theme] = {};
        for (const level of THEMED_DIFF_LEVELS) {
            fetches.push(
                fetch(`static/assets/themes/${theme}/diff-${level}.svg`, { cache: 'force-cache' })
                    .then(r => r.text())
                    .then(t => { Sprites.themedDiff[theme][level] = t.trim(); })
            );
        }
    }
    /* Locked-hard variant (theme-independent gray) */
    fetches.push(
        fetch('static/assets/difficulties/diff-hard-locked.svg', { cache: 'force-cache' })
            .then(r => r.text())
            .then(t => { Sprites.themedDiff._locked = t.trim(); })
    );
    await Promise.all(fetches);
};

/* ── HOLD-TO-CONFIRM (removed — buttons respond to normal clicks) ── */
const HoldConfirm = {
    duration: 0,
    EXCLUDE_SELECTOR: '',
    _states: new WeakMap(),
    _allowedClicks: new WeakSet(),
    _swallowUntil: 0,
    matches()      { return false; },
    closestTarget(){ return null;  },
    start()        {},
    cancel()       {},
    _fire()        {},
    _ensureRing()  {},
    _perimeter()   { return 0; },
    init()         {},
};
window.HoldConfirm = HoldConfirm;

/* Inject the appropriate per-color difficulty SVG into every element
 * tagged with [data-themed-diff="easy|normal|hard"]. Hard uses the
 * locked gray variant when hardUnlocked is false.                      */
Sprites.renderThemedDiff = function(themeKey, hardUnlocked) {
    const themePack = Sprites.themedDiff[themeKey] || Sprites.themedDiff.green;
    if (!themePack) return;
    document.querySelectorAll('[data-themed-diff]').forEach(el => {
        const level = el.dataset.themedDiff;
        let svg;
        if (level === 'hard' && !hardUnlocked) svg = Sprites.themedDiff._locked;
        else svg = themePack[level];
        if (svg) el.innerHTML = svg;
    });
};

/* Convenience accessors that wrap the cached SVG with the right
 * sizing / class attributes the rest of the codebase expects. If the
 * sprite hasn't loaded yet (e.g. an early render before the loading
 * screen completes preload) we just return ''; consumers re-render
 * after loading is done.                                              */
const _withAttrs = (svg, attrs) => svg ? svg.replace(/^<svg\b/, `<svg ${attrs}`) : '';
const FLAG_SVG       = () => _withAttrs(Sprites.flag,  'class="cell-svg-icon" aria-hidden="true"');
const MINE_SVG       = () => _withAttrs(Sprites.mine,  'class="cell-svg-icon" aria-hidden="true"');
const CHECK_SVG      = () => _withAttrs(Sprites.check, 'width="16" height="16" aria-hidden="true"');
const CROSS_SVG      = () => _withAttrs(Sprites.cross, 'width="16" height="16" aria-hidden="true"');
const CROSS_BIG_SVG  = () => _withAttrs(Sprites.cross, 'aria-hidden="true"');
const MINE_DOT_SVG   = () => _withAttrs(Sprites.dot,   'width="8" height="8" style="display:inline-block;vertical-align:middle" aria-hidden="true"');

/* Floating-background sprites use currentColor; spawnShape() sets
 * `style.color` on the wrapper to apply the theme tint.               */
const FLOAT_SPRITE_KEYS = {
    circle:'float_circle', blob:'float_blob', shard:'float_shard', ring:'float_ring',
    roundsq:'float_roundsq', cross:'float_cross', tri:'float_tri', dot:'float_dot',
};

/* ── MINE DEFINITIONS ────────────────────────────────────────── */
const MINE_DEFS = {
    mine_mine: {
        id: 'mine_mine', name: 'Mine Mine', cost: 50,
        color: '#f44336', maxCharges: 2, placesPerBoard: 2,
        rarity: 'common',
        requirement: 'None',
        effect: 'When placed, it marks every mine in the surrounding tiles. It helps you identify nearby danger without opening more cells.',
        trigger: 'Instantly on placement',
        limit: '2 per board',
        icon: () => Sprites.mine_mine
    },
    trench_mine: {
        id: 'trench_mine', name: 'Trench Mine', cost: 100,
        color: '#795548', maxCharges: 2, placesPerBoard: 2,
        rarity: 'common',
        requirement: 'Zero tile adjacent to numbered tiles',
        effect: 'When your Style rank rises, it rewards Spts based on the numbers around it. It turns careful placement near clues into extra score.',
        trigger: 'On each Style rank-up',
        limit: '2 per board',
        icon: () => Sprites.trench_mine
    },
    grenade_mine: {
        id: 'grenade_mine', name: 'Grenade Mine', cost: 220,
        color: '#4CAF50', maxCharges: 2, placesPerBoard: 2,
        rarity: 'common',
        requirement: 'None',
        effect: 'It waits until Style rank C, then activates automatically. A safe placement reveals nearby cells; a bad placement ends the run.',
        trigger: 'Auto-activates once Style rank C is reached',
        limit: '2 per board',
        icon: () => Sprites.grenade_mine
    },
    totem_mine: {
        id: 'totem_mine', name: 'Totem Mine', cost: 250,
        color: '#FFC107', maxCharges: 2, placesPerBoard: 1,
        rarity: 'uncommon', passive: true,
        requirement: 'None',
        effect: 'It absorbs one mine that would end your run, giving you another chance. The protection is consumed after it saves you.',
        trigger: 'Passive — triggers on a lethal dig',
        limit: '1 per run (permanently consumed)',
        icon: () => Sprites.totem_mine
    },
    fractal_mine: {
        id: 'fractal_mine', name: 'Fractal Mine', cost: 300,
        color: '#9C27B0', maxCharges: 1, placesPerBoard: 1,
        rarity: 'rare',
        requirement: 'None',
        effect: 'When a mine within three tiles triggers, it sets off the other mines in that area. It is powerful when placed in a dense cluster.',
        trigger: 'On any mine trigger in radius',
        limit: '1 per board',
        icon: () => Sprites.fractal_mine
    },
    kickstart_mine: {
        id: 'kickstart_mine', name: 'Kickstart Mine', cost: 180,
        color: '#00BCD4', maxCharges: 3, placesPerBoard: 1,
        rarity: 'uncommon', passive: true,
        requirement: 'None',
        effect: 'Your first dig on every board starts with a Style boost. It helps your score build immediately instead of waiting for a streak.',
        trigger: 'Passive — on first dig of the board',
        limit: '1 per board',
        icon: () => Sprites.kickstart_mine
    },
    diffusal_mine: {
        id: 'diffusal_mine', name: 'Diffusal Mine', cost: 260,
        color: '#009688', maxCharges: 2, placesPerBoard: 1,
        rarity: 'uncommon', passive: true,
        requirement: 'None',
        effect: 'When a mine would kill you, it gives you ten seconds to flag that tile. Flag it in time to survive and gain two Style ranks; miss it and the run ends.',
        trigger: 'Passive — triggers on a lethal dig',
        limit: '1 per run (permanently consumed)',
        icon: () => Sprites.diffusal_mine
    },
    steel_mine: {
        id: 'steel_mine', name: 'Steel Mine', cost: 220,
        color: '#90A4AE', maxCharges: 1, placesPerBoard: 1,
        rarity: 'uncommon', passive: true,
        requirement: 'None',
        effect: 'For every 100 Spts earned during the run, it grants 50 Rpts. It turns a strong Style score into more spending power.',
        trigger: 'Passive — on each Spts milestone',
        limit: '1 per board',
        icon: () => Sprites.steel_mine
    },
    prospector_mine: {
        id: 'prospector_mine', name: 'Prospector Mine', cost: 200,
        color: '#C49A3A', maxCharges: 1, placesPerBoard: 1,
        rarity: 'uncommon', passive: true,
        requirement: 'None',
        effect: 'The first Mine Market reroll each run is free.',
        trigger: 'On the first Mine Market reroll each run',
        limit: '1 free reroll per run',
        icon: () => Sprites.prospector_mine
    },
    fortune_mine: {
        id: 'fortune_mine', name: 'Fortune Mine', cost: 280,
        color: '#8E44AD', maxCharges: 1, placesPerBoard: 1,
        rarity: 'rare', passive: true,
        requirement: 'None',
        effect: 'Mine Markets have a chance to contain one discounted mine.',
        trigger: 'When the market opens',
        limit: '1 discounted offer per market',
        icon: () => Sprites.fortune_mine
    },
    dealer_mine: {
        id: 'dealer_mine', name: 'Dealer Mine', cost: 280,
        color: '#1565C0', maxCharges: 1, placesPerBoard: 1,
        rarity: 'rare', passive: true,
        requirement: 'None',
        effect: 'Mine Markets offer one additional mine.',
        trigger: 'When the market opens',
        limit: '1 additional offer per market',
        icon: () => Sprites.dealer_mine
    },
    bargain_mine: {
        id: 'bargain_mine', name: 'Bargain Mine', cost: 220,
        color: '#00897B', maxCharges: 1, placesPerBoard: 1,
        rarity: 'uncommon', passive: true,
        requirement: 'None',
        effect: 'Mine purchases have a chance to refund 50% of their cost.',
        trigger: 'After purchasing a mine',
        limit: 'Chance applies to each purchase',
        icon: () => Sprites.bargain_mine
    },
    mipen_meimer: {
        id: 'mipen_meimer', name: 'Mipen Meimer', cost: 320,
        color: '#D84315', maxCharges: 1, placesPerBoard: 1,
        rarity: 'rare', passive: true,
        requirement: 'None',
        effect: 'Gain one random Common or Uncommon mine whenever you enter a Mine Market. Cannot grant itself or Legendary mines.',
        trigger: 'When you enter a Mine Market',
        limit: 'Cannot grant Legendary mines or itself',
        icon: () => Sprites.mipen_meimer
    },
    pipe_mine: {
        id: 'pipe_mine', name: 'Pipe Mine', cost: 240,
        color: '#607D8B', maxCharges: 3, placesPerBoard: 1,
        rarity: 'rare',
        requirement: 'None',
        effect: 'It waits until Style rank B, then blasts a wide horizontal band and safely opens about a third of its remaining safe cells, leaving some gaps.',
        trigger: 'Auto-activates once Style rank B is reached',
        limit: '1 per board · 3 charges',
        icon: () => Sprites.pipe_mine
    },
    nuke_mimb: {
        id: 'nuke_mimb', name: 'Nuke Mimb', cost: 500,
        color: '#FF5722', maxCharges: 1, placesPerBoard: 1,
        rarity: 'legendary',
        requirement: 'None',
        effect: 'When placed, it instantly reveals about half of the remaining safe cells at random. It is a high-impact way to clear a dangerous board.',
        trigger: 'Instantly on placement',
        limit: '1 per board',
        icon: () => Sprites.nuke_mimb
    },
    tsar_mimba: {
        id: 'tsar_mimba', name: 'Tsar Mimba', cost: 550,
        color: '#3F51B5', maxCharges: 1, placesPerBoard: 1,
        rarity: 'legendary',
        requirement: 'None',
        effect: 'After placement, every Style rank-up removes the board’s outermost ring of tiles. It reshapes the board as your score climbs.',
        trigger: 'Passive — on each Style rank-up after placement',
        limit: '1 per board',
        icon: () => Sprites.tsar_mimba
    }
};
const ALL_MINE_IDS = Object.keys(MINE_DEFS);

/* ── FEAT ICONS ────────────────────────────────────────────────
 * Pulled from the sprite cache. Each entry is sized 18x18 and uses
 * currentColor so the parent's `color:` controls the icon tint.       */
const FEAT_ICON_KEYS = [
    'board','streak','collector','score','score_hi','level','level_hi',
    'meta','secret','circle','lock','fun',
];
const _featIcon = (key) => _withAttrs(Sprites['feat_' + key] || Sprites.feat_board, 'width="18" height="18"');
const FEAT_ICONS_SVG = new Proxy({}, {
    get: (_t, key) => _featIcon(key),
    has: (_t, key) => FEAT_ICON_KEYS.includes(key),
});

/* ── BOARD CONFIGS ──────────────────────────────────────────── */
const BOARD_CONFIGS = {
    easy: [
        { cols:8,  rows:10, mines:10 }, { cols:9,  rows:10, mines:12 },
        { cols:10, rows:11, mines:15 }, { cols:10, rows:12, mines:18 },
        { cols:11, rows:12, mines:21 }, { cols:11, rows:13, mines:24 },
        { cols:12, rows:13, mines:27 }, { cols:12, rows:14, mines:30 },
    ],
    normal: [
        { cols:12, rows:14, mines:26 }, { cols:12, rows:15, mines:30 },
        { cols:13, rows:16, mines:35 }, { cols:13, rows:17, mines:40 },
        { cols:14, rows:18, mines:45 }, { cols:14, rows:19, mines:51 },
        { cols:15, rows:20, mines:57 }, { cols:16, rows:22, mines:65 },
    ],
    hard: [
        { cols:16, rows:18, mines:50 }, { cols:16, rows:20, mines:58 },
        { cols:17, rows:21, mines:67 }, { cols:17, rows:22, mines:75 },
        { cols:18, rows:23, mines:84 }, { cols:19, rows:24, mines:94 },
        { cols:20, rows:26, mines:104 },{ cols:22, rows:28, mines:115 },
    ],
};

/* ── THEMES ─────────────────────────────────────────────────── */
const THEMES = {
    green:    { name:'Green Theme',    accent:'#4CAF50', cost:0,    diff:{ easy:'#43A047', normal:'#2E7D32', hard:'#1B5E20' } },
    red:      { name:'Red Theme',      accent:'#F44336', cost:500,  diff:{ easy:'#E53935', normal:'#C62828', hard:'#8E0000' } },
    blue:     { name:'Blue Theme',     accent:'#2196F3', cost:500,  diff:{ easy:'#1E88E5', normal:'#1976D2', hard:'#283593' } },
    yellow:   { name:'Yellow Theme',   accent:'#FFC107', cost:500,  diff:{ easy:'#FBC02D', normal:'#F9A825', hard:'#F57F17' } },
    purple:   { name:'Purple Theme',   accent:'#9C27B0', cost:500,  diff:{ easy:'#AB47BC', normal:'#8E24AA', hard:'#4A148C' } },
    black:    { name:'Black Theme',    accent:'#111111', cost:0,    secret:true, diff:{ easy:'#424242', normal:'#212121', hard:'#000000' } },
    synthwave:{ name:'Synthwave Theme',accent:'#ff2bd6', cost:1000, rarity:'uncommon', diff:{ easy:'#00B8D4', normal:'#ff2bd6', hard:'#7c1fa3' } },
    spamton:  { name:'Spamton Theme',  accent:'#FF2BD6', cost:1000, rarity:'uncommon', diff:{ easy:'#F59E0B', normal:'#EC4899', hard:'#7C1FA3' } },
    danger_zone:    { name:'Danger Zone',     accent:'#FFD500', accent2:'#111111', cost:1000, rarity:'uncommon', diff:{ easy:'#F59E0B', normal:'#D97706', hard:'#1F2937' } },
    volatile:       { name:'Volatile',        accent:'#E63312', accent2:'#FF7A00', cost:1000, rarity:'uncommon', diff:{ easy:'#F97316', normal:'#E63312', hard:'#B71C1C' } },
    blueprint:      { name:'Blueprint',       accent:'#2FD1FF', accent2:'#123B66', cost:1000, rarity:'uncommon', diff:{ easy:'#38BDF8', normal:'#0284C7', hard:'#123B66' } },
    retro_terminal: { name:'Retro Terminal',  accent:'#33FF66', cost:1000, rarity:'uncommon', diff:{ easy:'#22C55E', normal:'#16A34A', hard:'#0C8A2E' } },
};

/* ── FEAT DEFINITIONS ────────────────────────────────────────── */
const FEAT_DEFS = [
    { id:'boards_5',       cat:'board',     name:'Board Clearer I',    desc:'Clear 5 boards total',                    iconKey:'board' },
    { id:'boards_10',      cat:'board',     name:'Board Clearer II',   desc:'Clear 10 boards total',                   iconKey:'board' },
    { id:'boards_20',      cat:'board',     name:'Board Clearer III',  desc:'Clear 20 boards total',                   iconKey:'board' },
    { id:'boards_25',      cat:'board',     name:'Board Clearer IV',   desc:'Clear 25 boards total',                   iconKey:'board' },
    { id:'consec_10',      cat:'board',     name:'Streak I',           desc:'Clear 10 consecutive boards',             iconKey:'streak' },
    { id:'consec_20',      cat:'board',     name:'Streak II',          desc:'Clear 20 consecutive boards',             iconKey:'streak' },
    { id:'consec_25',      cat:'board',     name:'Streak III',         desc:'Clear 25 consecutive boards',             iconKey:'streak' },
    { id:'srun_100',       cat:'score', sub:'run', name:'Style 100',   desc:'Reach 100 style score in a run',          iconKey:'score' },
    { id:'srun_200',       cat:'score', sub:'run', name:'Style 200',   desc:'Reach 200 style score in a run',          iconKey:'score' },
    { id:'srun_350',       cat:'score', sub:'run', name:'Style 350',   desc:'Reach 350 style score in a run',          iconKey:'score' },
    { id:'srun_550',       cat:'score', sub:'run', name:'Style 550',   desc:'Reach 550 style score in a run',          iconKey:'score_hi' },
    { id:'srun_800',       cat:'score', sub:'run', name:'Style 800',   desc:'Reach 800 style score in a run',          iconKey:'score_hi' },
    { id:'srun_1150',      cat:'score', sub:'run', name:'Style 1150',  desc:'Reach 1150 style score in a run',         iconKey:'score_hi' },
    { id:'sboard_25',      cat:'score', sub:'board', name:'Board Style 25',  desc:'Score 25 style in one board',       iconKey:'score' },
    { id:'sboard_50',      cat:'score', sub:'board', name:'Board Style 50',  desc:'Score 50 style in one board',       iconKey:'score' },
    { id:'sboard_100',     cat:'score', sub:'board', name:'Board Style 100', desc:'Score 100 style in one board',      iconKey:'score_hi' },
    { id:'sboard_200',     cat:'score', sub:'board', name:'Board Style 200', desc:'Score 200 style in one board',      iconKey:'score_hi' },
    { id:'sboard_350',     cat:'score', sub:'board', name:'Board Style 350', desc:'Score 350 style in one board',      iconKey:'score_hi' },
    { id:'sboard_500',     cat:'score', sub:'board', name:'Board Style 500', desc:'Score 500 style in one board',      iconKey:'score_hi' },
    { id:'all_themes',     cat:'collector', name:'Color Collector',    desc:'Purchase all available themes',           iconKey:'collector' },
    { id:'fun_code',       cat:'collector', name:'Cheat Enabled',      desc:'Enter a Fun Code',                        iconKey:'fun' },
    { id:'big_shot',       cat:'collector', name:'BIG SHOT',           desc:'Purchase the Spamton Theme',              iconKey:'collector' },
    { id:'all_boards_done',cat:'collector', name:'Board Completionist',desc:'Complete all board feats',                iconKey:'meta' },
    { id:'all_score_done', cat:'collector', name:'Score Completionist',desc:'Complete all score feats',                iconKey:'meta' },
    { id:'hopeless_5',     cat:'market',    name:'Hopeless I',         desc:'Lose 5 scratch cards in a row',           iconKey:'fun' },
    { id:'hopeless_10',    cat:'market',    name:'Hopeless II',        desc:'Lose 10 scratch cards in a row',          iconKey:'fun' },
    { id:'hopeless_15',    cat:'market',    name:'Hopeless III',       desc:'Lose 15 scratch cards in a row',          iconKey:'fun' },
    { id:'hopeless_20',    cat:'market',    name:'Hopeless IV',        desc:'Lose 20 scratch cards in a row',          iconKey:'fun' },
    { id:'circle_board',   cat:'original',  name:'Geometric Shift',   desc:'Transform the board into a circle',       iconKey:'circle',  secret:true },
    { id:'score_69',       cat:'original',  name:'Nice.',             desc:'Score exactly 69 style in one action',    iconKey:'score_hi',secret:true },
    { id:'sixty_nine_better', cat:'original', name:'69 Better',       desc:'Find the secret 67 code',                 iconKey:'fun',     secret:true },
    { id:'ultrakill',      cat:'original',  name:'Progression is Dead', desc:'Points are fuel\nBoards are full',      iconKey:'secret',  secret:true },
    { id:'edgelord_phase', cat:'original',  name:"it's just a phase", desc:'Unlock the black theme',                  iconKey:'secret',  secret:true },
    { id:'tsar_mimba_bought', cat:'original', name:'The biggest boom known to minekind', desc:'bought the Tsar mimba!', iconKey:'secret', secret:true },
];

/* ── SOUND ENGINE ───────────────────────────────────────────── */
class SoundEngine {
    constructor() { this.ctx = null; this.muted = false; this.sfxVolume = 0.8; }
    _ctx() {
        try {
            if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (this.ctx.state === 'suspended') this.ctx.resume();
            return this.ctx;
        } catch(e) { return null; }
    }
    _tone(freq, type, t0, attack, decay, vol) {
        try {
            const ctx = this._ctx(); if (!ctx) return;
            const v = vol * this.sfxVolume;
            const osc = ctx.createOscillator(), gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = type; osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, t0);
            gain.gain.linearRampToValueAtTime(v, t0 + attack);
            gain.gain.exponentialRampToValueAtTime(0.001, t0 + attack + decay);
            osc.start(t0); osc.stop(t0 + attack + decay + 0.05);
        } catch(e) {}
    }
    _noise(dur, vol = 0.35) {
        try {
            const ctx = this._ctx(); if (!ctx) return;
            const sr = ctx.sampleRate, n = Math.floor(sr * dur);
            const buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
            for (let i = 0; i < n; i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/n, 2.2);
            const src = ctx.createBufferSource(), gain = ctx.createGain();
            src.buffer = buf; src.connect(gain); gain.connect(ctx.destination);
            gain.gain.value = vol * this.sfxVolume; src.start(); src.stop(ctx.currentTime + dur);
        } catch(e) {}
    }
    play(sound) {
        if (this.muted || this.sfxVolume === 0) return;
        try {
            const ctx = this._ctx(); if (!ctx) return;
            const t = ctx.currentTime;
            switch(sound) {
                case 'dig':
                    this._tone(900,'sine',t,0.002,0.032,0.11);
                    this._tone(1280,'triangle',t+0.012,0.002,0.028,0.055);
                    this._noise(0.06, 0.08);
                    break;
                case 'reveal':
                    this._tone(520,'sine',t,0.002,0.018,0.065);
                    this._tone(740,'sine',t+0.01,0.001,0.016,0.038);
                    break;
                case 'flag':
                    this._tone(700,'triangle',t,0.003,0.05,0.09);
                    this._tone(1050,'sine',t+0.028,0.003,0.06,0.07);
                    this._tone(1400,'sine',t+0.068,0.002,0.045,0.055);
                    this._tone(1760,'sine',t+0.1,0.002,0.038,0.04);
                    break;
                case 'unflag':
                    this._tone(500,'sine',t,0.003,0.05,0.075);
                    this._tone(340,'triangle',t+0.025,0.003,0.055,0.05);
                    break;
                case 'mine':
                    this._noise(0.45,0.32);
                    this._tone(880,'sawtooth',t,0.002,0.34,0.10);
                    this._tone(660,'square',t+0.04,0.003,0.28,0.10);
                    this._tone(1320,'sine',t+0.10,0.004,0.22,0.08);
                    break;
                case 'btn':
                    this._tone(520,'sine',t,0.002,0.032,0.055);
                    this._tone(680,'sine',t+0.015,0.001,0.022,0.03);
                    break;
                case 'complete':
                    [440,554,659,880,1108].forEach((f,i) => this._tone(f,'triangle',t+i*0.065,0.01,0.24,0.11));
                    this._tone(1760,'sine',t+0.32,0.005,0.30,0.09);
                    this._tone(1318,'sine',t+0.38,0.004,0.24,0.08);
                    break;
                case 'lvlup':
                    [523,659,784,1047,1319,1568].forEach((f,i) => this._tone(f,'triangle',t+i*0.06,0.01,0.22,0.12));
                    this._tone(2093,'sine',t+0.36,0.006,0.28,0.1);
                    break;
                case 'purchase':
                    this._tone(1046,'triangle',t,0.004,0.08,0.10);
                    this._tone(1319,'sine',t+0.042,0.004,0.12,0.10);
                    this._tone(1760,'sine',t+0.095,0.003,0.18,0.09);
                    this._tone(2093,'sine',t+0.16,0.003,0.16,0.08);
                    break;
                case 'error':
                    this._tone(880,'square',t,0.004,0.10,0.08);
                    this._tone(660,'square',t+0.065,0.004,0.12,0.08);
                    this._noise(0.08, 0.14);
                    break;
                case 'redeem':
                    this._tone(1046,'sine',t,0.005,0.09,0.10);
                    this._tone(1319,'sine',t+0.07,0.004,0.12,0.10);
                    this._tone(1568,'sine',t+0.14,0.004,0.20,0.11);
                    this._tone(2093,'sine',t+0.22,0.004,0.24,0.12);
                    break;
                case 'modal':
                    this._tone(600,'sine',t,0.003,0.055,0.08);
                    this._tone(760,'sine',t+0.03,0.003,0.055,0.06);
                    break;
                case 'tab':
                    this._tone(680,'sine',t,0.002,0.034,0.06);
                    this._tone(860,'sine',t+0.018,0.002,0.028,0.042);
                    break;
                case 'rankup':
                    this._tone(880,'sine',t,0.004,0.10,0.14);
                    this._tone(1108,'sine',t+0.07,0.004,0.14,0.12);
                    this._tone(1320,'triangle',t+0.15,0.003,0.18,0.10);
                    this._tone(1760,'sine',t+0.23,0.003,0.22,0.09);
                    break;
                case 'quickdig':
                    this._tone(1400,'sine',t,0.002,0.028,0.10);
                    this._tone(1100,'triangle',t+0.022,0.002,0.05,0.08);
                    this._tone(1600,'sine',t+0.046,0.002,0.035,0.05);
                    break;
                case 'ultrakill':
                    this._noise(0.18,0.28);
                    this._tone(1480,'sawtooth',t,0.002,0.28,0.18);
                    this._tone(1108,'square',t+0.05,0.003,0.24,0.14);
                    this._tone(1760,'sine',t+0.14,0.004,0.20,0.10);
                    break;
                case 'runover':
                    this._noise(0.22,0.22);
                    this._tone(1175,'triangle',t,0.004,0.22,0.10);
                    this._tone(880,'sine',t+0.09,0.005,0.24,0.08);
                    this._tone(740,'square',t+0.22,0.004,0.22,0.07);
                    break;
                case 'boardwin':
                    [392,494,587,698,880,1047,1319].forEach((f,i) => this._tone(f,'triangle',t+i*0.06,0.01,0.30,0.12));
                    this._tone(1760,'sine',t+0.42,0.006,0.38,0.10);
                    this._tone(2349,'sine',t+0.54,0.005,0.34,0.10);
                    break;
                case 'slot_spin':
                    this._tone(280+Math.random()*180,'triangle',t,0.001,0.022,0.04);
                    break;
                case 'slot_stop':
                    this._tone(740,'sine',t,0.003,0.065,0.12);
                    this._tone(986,'sine',t+0.045,0.003,0.10,0.10);
                    this._tone(1245,'triangle',t+0.1,0.002,0.12,0.09);
                    break;
                case 'mine_place':
                    this._tone(760,'triangle',t,0.005,0.07,0.11);
                    this._tone(540,'sine',t+0.04,0.004,0.09,0.09);
                    break;
                case 'mine_mine_fx':
                    [1047,1319,1568,2093].forEach((f,i) => this._tone(f,'triangle',t+i*0.035,0.007,0.14,0.11));
                    break;
                case 'grenade_fx':
                    this._noise(0.5,0.42);
                    this._tone(1480,'sawtooth',t,0.002,0.34,0.18);
                    this._tone(1108,'square',t+0.06,0.003,0.30,0.14);
                    this._tone(1760,'sine',t+0.18,0.003,0.24,0.10);
                    break;
                case 'totem_fx':
                    [523,659,784,1047,1319,1568,2093].forEach((f,i) => this._tone(f,'sine',t+i*0.055,0.005,0.20,0.11));
                    break;
                case 'trench_fx':
                    this._tone(220,'sawtooth',t,0.004,0.14,0.10);
                    this._tone(440,'square',  t+0.05,0.003,0.10,0.08);
                    this._tone(880,'triangle',t+0.10,0.003,0.10,0.07);
                    break;
                case 'fractal_fx':
                    [392,523,659,784,988,1175,1397,1760].forEach((f,i) => this._tone(f,'square',t+i*0.04,0.003,0.10,0.08));
                    this._noise(0.18, 0.18);
                    break;
                case 'scratch_reveal':
                    this._noise(0.18, 0.22);
                    this._tone(880,'sine',t+0.05,0.004,0.12,0.10);
                    this._tone(1108,'sine',t+0.12,0.004,0.16,0.10);
                    break;
            }
        } catch(e) {}
    }
}

/* ── FLOATING BACKGROUND ────────────────────────────────────── */
class FloatingBackground {
    constructor(particleAmount) {
        this.container = document.getElementById('floating-bg');
        this.shapes = [];
        this.particleAmount = particleAmount !== undefined ? particleAmount : 1.0;
        this.maxShapes = Math.max(2, Math.round(14 * this.particleAmount));
        this.spawnInterval = null;
        this.init();
    }
    _getThemeColor() {
        /* getComputedStyle forces a style recalc — cache the result and
         * only recompute when the theme actually changes (invalidated
         * via invalidateThemeColor(), called from applyTheme/previewTheme)
         * instead of on every single particle spawn (every 1.2-2.4s).    */
        if (this._cachedThemeColor === undefined) {
            this._cachedThemeColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#4CAF50';
        }
        return this._cachedThemeColor;
    }
    invalidateThemeColor() { this._cachedThemeColor = undefined; }
    _hexToRgb(hex) {
        const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i,'#$1$1$2$2$3$3'));
        return r ? { r:parseInt(r[1],16), g:parseInt(r[2],16), b:parseInt(r[3],16) } : { r:100,g:160,b:200 };
    }
    _makeColor(opacity) {
        const { r,g,b } = this._hexToRgb(this._getThemeColor());
        return `rgba(${r},${g},${b},${opacity})`;
    }
    setParticleAmount(amt) {
        this.particleAmount = amt;
        this.maxShapes = Math.max(2, Math.round(14 * amt));
        if (this.spawnInterval) { clearInterval(this.spawnInterval); this.spawnInterval = null; }
        if (amt > 0) this.spawnInterval = setInterval(() => this.spawnShape(), Math.max(1200, 2400 / amt));
    }
    init() {
        const count = Math.max(0, Math.round(6 * this.particleAmount));
        for (let i = 0; i < count; i++) setTimeout(() => this.spawnShape(), i * 400);
        this.spawnInterval = setInterval(() => this.spawnShape(), Math.max(1200, 2400));
    }
    spawnShape() {
        if (this.particleAmount <= 0) return;
        if (this.shapes.length >= this.maxShapes) {
            const old = this.shapes.shift();
            if (old && old.parentNode) old.parentNode.removeChild(old);
        }
        const shape = document.createElement('div');
        /* Restrict the menu/game backdrop to three primitive shapes only:
         * square (roundsq), circle (dot), and triangle (tri). */
        const keys  = ['roundsq', 'dot', 'tri'];
        const type  = keys[Math.floor(Math.random() * keys.length)];
        shape.className = 'floating-shape';
        /* Bigger, more opaque shapes spawn at the bottom; the floatUp keyframe
         * scales them down and fades them out as they rise.                     */
        const size = 60 + Math.random() * 110;
        shape.style.width = `${size}px`; shape.style.height = `${size}px`;
        shape.style.left  = `${Math.random() * 100}%`;
        shape.style.animationDuration = `${16 + Math.random() * 18}s`;
        const opacity = 0.22 + Math.random() * 0.18;
        /* Sprites use currentColor → set the wrapper's color so the
         * shape inherits the active theme tint at the chosen opacity. */
        if (document.body.classList.contains('theme-spamton')) {
            /* Start mostly yellow; after a few spawns mix in pink. */
            const spawnCount = this.shapes.length;
            const pinkChance = Math.min(0.45, spawnCount * 0.06);
            const pick = Math.random() < pinkChance
                ? `rgba(255,43,214,${opacity})`
                : `rgba(255,215,0,${opacity})`;
            shape.style.color = pick;
        } else {
            shape.style.color = this._makeColor(opacity);
        }
        shape.innerHTML = Sprites[FLOAT_SPRITE_KEYS[type]] || '';
        this.container.appendChild(shape);
        this.shapes.push(shape);
        setTimeout(() => {
            const idx = this.shapes.indexOf(shape);
            if (idx > -1) this.shapes.splice(idx, 1);
            if (shape.parentNode) shape.parentNode.removeChild(shape);
        }, 40000);
    }
}

/* ── STYLE METER ────────────────────────────────────────────── */
class StyleMeter {
    constructor() {
        this.rankIdx  = 0;
        this.fill     = 0;
        this.score    = 0;
        this.lastActionTime = Date.now();
        this.active   = false;
        this.decayFrame = null;
        this.lastDecayTick = 0;
        this.onRankUp = null;

        this.el         = document.getElementById('style-meter');
        this.ringFill   = document.getElementById('sm-ring-fill');
        this.rankLabel  = document.getElementById('sm-rank-letter');
        this.scoreEl    = document.getElementById('sm-score');
        this.rankWrap   = document.getElementById('sm-rank-wrap');
    }
    get rank() { return RANK_LABELS[this.rankIdx]; }
    get color(){ return RANK_COLORS[this.rank]; }

    show() {
        if (!this.el) return;
        this.el.classList.remove('hidden');
        this.active = true;
        this._startDecay();
    }
    hide() {
        if (!this.el) return;
        this.el.classList.add('hidden');
        this.active = false;
        this._stopDecay();
    }
    reset() {
        this.rankIdx = 0; this.fill = 0; this.score = 0;
        this.lastActionTime = Date.now();
        this._update();
    }

    onAction(type) {
        if (!this.active) return 0;
        const now = Date.now();
        const dt  = (now - this.lastActionTime) / 1000;
        this.lastActionTime = now;
        if (this.el) this.el.classList.remove('is-decaying');
        const mult = RANK_MULT[this.rank];

        let fillBoost = 0, scoreGain = 0;
        if      (type === 'dig')      { fillBoost = 0.084; scoreGain = 1 * mult; }
        else if (type === 'quickdig') { fillBoost = 0.189; scoreGain = 3 * mult; }
        else if (type === 'cascade')  { fillBoost = 0.0158; scoreGain = 0.4 * mult; }
        else if (type === 'trench')   { fillBoost = 0; scoreGain = 0; } // handled externally

        if (dt < 1.5) fillBoost += 0.0368;
        else if (dt < 3) fillBoost += 0.0158;

        this.fill = Math.min(1, this.fill + fillBoost);
        const prevFloor = Math.floor(this.score);
        this.score += scoreGain;
        const newFloor  = Math.floor(this.score);
        const hit69 = prevFloor < 69 && newFloor >= 69;

        if (this.fill >= 1) this._rankUp();
        this._update();
        return { scoreGain, hit69 };
    }

    addScore(pts) {
        this.score += pts;
        this._update();
    }

    _rankUp() {
        if (this.rankIdx >= RANK_LABELS.length - 1) { this.fill = 1; return; }
        this.rankIdx++;
        this.fill = 0.15;
        if (this.rankWrap) {
            this.rankWrap.classList.remove('rank-bump','rank-decay');
            void this.rankWrap.offsetWidth;
            this.rankWrap.classList.add('rank-bump');
            this.rankWrap.classList.toggle('z-smolder', this.rank === 'Z');
            setTimeout(() => this.rankWrap && this.rankWrap.classList.remove('rank-bump'), 700);
        }
        if (this.onRankUp) this.onRankUp(this.rank);
    }
    _rankDown() {
        if (this.rankIdx <= 0) { this.fill = 0; return; }
        this.rankIdx--;
        this.fill = 0.55;
        if (this.rankWrap) {
            this.rankWrap.classList.remove('rank-bump','z-smolder');
            this.rankWrap.classList.add('rank-decay');
            setTimeout(() => this.rankWrap && this.rankWrap.classList.remove('rank-decay'), 800);
        }
    }
    _startDecay() {
        this._stopDecay();
        this.lastDecayTick = performance.now();
        const tick = (ts) => {
            if (!this.active) return;
            const dt = Math.min(0.12, Math.max(0, (ts - this.lastDecayTick) / 1000));
            this.lastDecayTick = ts;
            const rate = RANK_DECAY[this.rank];
            this.fill = Math.max(0, this.fill - rate * dt);
            if (this.el) this.el.classList.add('is-decaying');
            if (this.fill <= 0 && this.rankIdx > 0) this._rankDown();
            this._update();
            this.decayFrame = requestAnimationFrame(tick);
        };
        this.decayFrame = requestAnimationFrame(tick);
    }
    _stopDecay() {
        if (this.decayFrame) { cancelAnimationFrame(this.decayFrame); this.decayFrame = null; }
        if (this.el) this.el.classList.remove('is-decaying');
    }
    _update() {
        if (!this.el) return;
        /* Skip redundant DOM writes when nothing actually changed since
         * the last frame — this runs at 60fps while the meter is active,
         * so avoiding no-op style/text writes meaningfully cuts main
         * thread + layout work during gameplay.                          */
        if (this._lastColor !== this.color) {
            document.documentElement.style.setProperty('--sm-color', this.color);
            this._lastColor = this.color;
        }
        if (this.rankLabel && this._lastRank !== this.rank) {
            this.rankLabel.textContent = this.rank;
            this._lastRank = this.rank;
        }
        const scoreFloor = Math.floor(this.score);
        if (this.scoreEl && this._lastScore !== scoreFloor) {
            this.scoreEl.textContent = scoreFloor;
            this._lastScore = scoreFloor;
        }
        if (this.ringFill) {
            const offset = Math.max(0, Math.min(1, 1 - this.fill));
            if (this._lastOffset !== offset) {
                this.ringFill.style.strokeDashoffset = offset;
                this._lastOffset = offset;
            }
        }
    }
    getFinalRank() { return this.rank; }
    getScore()     { return Math.floor(this.score); }
}

/* ── FEAT NOTIFICATION QUEUE ────────────────────────────────── */
class FeatNotifyQueue {
    constructor() {
        this.queue   = [];
        this.showing = false;
        this.el      = document.getElementById('feat-notify-container');
    }
    push(def) {
        this.queue.push(def);
        if (!this.showing) this._next();
    }
    _next() {
        if (!this.queue.length) { this.showing = false; return; }
        this.showing = true;
        const def = this.queue.shift();
        const icon = FEAT_ICONS_SVG[def.iconKey] || FEAT_ICONS_SVG.board;
        const el = document.createElement('div');
        el.className = 'feat-notify';
        el.innerHTML = `<div class="feat-notify-icon">${icon}</div>
            <div class="feat-notify-text">
                <span class="feat-notify-title">Feat Unlocked!</span>
                <span class="feat-notify-name">${def.name}</span>
                <span class="feat-notify-desc">${def.desc}</span>
            </div>`;
        if (this.el) this.el.appendChild(el);
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => { el.remove(); this._next(); }, 400);
        }, 2800);
    }
}

/* ══════════════════════════════════════════════════════════════ */
/*  MINESWEEPER                                                   */
/* ══════════════════════════════════════════════════════════════ */
class Minesweeper {
    constructor() {
        this.sfx        = new SoundEngine();
        this.styleMeter = new StyleMeter();
        this.notifyQ    = new FeatNotifyQueue();

        this.rows = 10; this.cols = 8; this.mines = 10;
        this.board = []; this.revealed = []; this.flagged = [];
        this.gameOver = false; this.firstClick = true;
        this.timer = 0; this.timerInterval = null;
        this.mode = 'dig'; this.circleMode = false;
        this.zoomLevel = 1; this.minZoom = 0.35; this.maxZoom = 2.5;
        this.scrollX = 0; this.scrollY = 0;
        this.velocityX = 0; this.velocityY = 0;
        this.isDragging = false; this.hasDragged = false;
        this.dragStartX = 0; this.dragStartY = 0;
        this.lastX = 0; this.lastY = 0;
        this.dragThreshold = 8; this.animationId = null;

        this.boardStyleScore = 0;
        this.runStyleScore   = 0;
        this.steelMilestoneScore = 0;

        /* Run points (separate from main points) */
        this.runPoints = 0;

        /* Particle amount */
        this.particleAmount = parseFloat(localStorage.getItem('ms_particle_amount') ?? '1.0');

        this.currentSlot = parseInt(localStorage.getItem('ms_save_slot') || '0');

        this.points       = parseInt(localStorage.getItem('ms_points') || '0');
        this.hardUnlocked = localStorage.getItem('ms_hard_unlocked') === 'true';
        this.infiniteCoins = localStorage.getItem('ms_infinite_coins') === 'true';

        this.ownedThemes  = JSON.parse(localStorage.getItem('ms_owned_themes') || '["green"]');
        this.activeTheme  = localStorage.getItem('ms_active_theme') || 'green';
        this._previewTheme = null;

        this.feats = this._loadFeats();
        this.unviewedFeatIds = JSON.parse(localStorage.getItem('ms_unviewed_feats') || '[]');
        this.newFeatItemIds = JSON.parse(localStorage.getItem('ms_new_feat_items') || localStorage.getItem('ms_unviewed_feats') || '[]');
        const storedFeatTabIndicators = localStorage.getItem('ms_feat_tab_indicators');
        this.featTabIndicatorCats = JSON.parse(storedFeatTabIndicators || '[]');
        if (!Array.isArray(this.featTabIndicatorCats)) this.featTabIndicatorCats = [];
        if (!storedFeatTabIndicators) {
            this.featTabIndicatorCats = [...new Set(this.newFeatItemIds
                .map(id => FEAT_DEFS.find(def => def.id === id)?.cat).filter(Boolean))];
        }

        /* Player mines loadout (max 6) */
        this.playerMines = [];
        /* Totem mine triggered flag for this run */
        this.totemTriggered = false;
        /* Banned mine IDs from slot machine for this run */
        this.bannedMineIds = [];
        /* Trench mines placed on board this board (cleared each board) */
        this.trenchMines = []; // [{r, c}]
        /* Fractal mines placed on board this board (cleared each board) */
        this.fractalMines = []; // [{r, c}]
        /* Dormant mines (grenade/pipe) waiting for a Style rank threshold */
        this.dormantMines = []; // [{r, c, id, slotIndex, requiredRankIdx}]
        /* Whether a Tsar Mimba is armed on this board (shrinks on rank-up) */
        this.tsarArmed = false;
        /* Diffusal Mine active countdown state */
        this.diffusalCountdown = null;
        /* Tsar Mimba shrink progress + voided cell tracking */
        this.boardRingInset = 0;
        this.voidedCells = new Set();
        /* Throttle: timestamp of last successful placement (1/sec cap) */
        this._lastPlaceAt = 0;
        /* Slot machine used this market visit */
        this.slotUsed = false;
        this.marketFirstRerollFree = false;
        this.marketShopDiscounts = [];
        this.marketShopRerollCount = 0;
        this.mineBuyingPopup = true;
        this.featIndicators = true;
        this._mineHudRenderId = 0;

        this.runState = this._loadRunState();
        this._loadActiveSlotSnapshot();

        this.currentDifficulty = this.runState ? this.runState.difficulty : null;
        this.carouselIndex     = this.runState ? this.runState.currentBoard : 0;
        this.storeTab = 'themes';
        this.featsTab = 'board';
        this.texts = {};
        this._lastTextJson = '';

        this._redThemeClicks  = [];
        this._saveSwitchTimes = [];
        this._tingTriggered   = false;
        this._tingAnomalySet  = false;

        this.floatingBg = null;

        this.applyTheme(this.activeTheme);
        if (this.infiniteCoins) document.body.classList.add('dev-mode');
        this.loadSettings();
        this.loadTexts();
        this.bindMenuEvents();
        this.renderDifficultyGrid();
        this.renderLevelBar();
        this.renderCarousel();
        this.refreshMenuButtons();
        this._updateNotifDot();
        this._updateTabDots();

        /* Wire style meter rank-up callback for trench mine */
        this.styleMeter.onRankUp = (rank) => this._onStyleRankUp(rank);

        /* Kick off sprite preload, then show loading screen.       */
        this._showLoadingScreen();
    }

    /* ══ LOADING SCREEN ══════════════════════════════════════════ */
    async _showLoadingScreen() {
        const screen  = document.getElementById('loading-screen');
        const barEl   = document.getElementById('loading-bar-fill');
        const pctEl   = document.getElementById('loading-pct');
        const textEl  = document.getElementById('loading-text');
        const sqEl    = document.getElementById('loading-sq');
        const iconEl  = document.getElementById('loading-sq-icon');

        /* Wait for sprite assets before doing anything that depends
         * on them (mine icons, flag/mine cell renders, particles).  */
        await Sprites.preload();

        if (!screen) { this._afterLoading(); return; }

        const mineIds = Object.keys(MINE_DEFS);
        let sqRotation = 0;

        /* Random mine icon each cycle, but never immediately repeated:
         * shuffle a fresh queue whenever the current one runs out, and
         * swap the queue's first pick with its second if it would echo
         * the last icon shown (i.e. straddling two shuffled queues).   */
        let iconQueue = [];
        let lastIconId = null;
        const refillQueue = () => {
            const arr = mineIds.slice();
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            if (arr.length > 1 && arr[0] === lastIconId) [arr[0], arr[1]] = [arr[1], arr[0]];
            iconQueue = arr;
        };
        const swapIcon = () => {
            if (iconQueue.length === 0) refillQueue();
            const id = iconQueue.shift();
            lastIconId = id;
            const def = MINE_DEFS[id];
            if (iconEl && def) iconEl.innerHTML = def.icon();
        };
        swapIcon();

        const duration = 2200 + Math.random() * 800;
        const startTime = performance.now();
        let lastCycle = -1;
        const CYCLE_MS = 550;

        const dots = ['', '.', '..', '...'];
        let dotIdx = 0;
        const dotInterval = setInterval(() => {
            dotIdx = (dotIdx + 1) % dots.length;
            if (textEl) textEl.textContent = `Loading${dots[dotIdx]}`;
        }, 340);

        const animate = (now) => {
            const elapsed = now - startTime;
            if (elapsed >= duration) {
                clearInterval(dotInterval);
                if (barEl) barEl.style.width = '100%';
                if (pctEl) pctEl.textContent = '100%';
                setTimeout(() => {
                    screen.classList.add('fade-out');
                    setTimeout(() => {
                        screen.style.display = 'none';
                        this._afterLoading();
                    }, 500);
                }, 200);
                return;
            }

            /* Non-linear: slow start, fast end (ease-in) */
            const t = elapsed / duration;
            const eased = 0.25 * t + 0.75 * t * t;
            const pct = Math.min(99, Math.round(eased * 100));
            if (barEl) barEl.style.width = pct + '%';
            if (pctEl) pctEl.textContent = pct + '%';

            /* Rotate square + swap icon each cycle */
            const cycle = Math.floor(elapsed / CYCLE_MS);
            if (cycle > lastCycle) {
                lastCycle = cycle;
                sqRotation += 90;
                if (sqEl) sqEl.style.transform = `rotate(${sqRotation}deg)`;
                if (iconEl) iconEl.style.transform = `rotate(${-sqRotation}deg)`;
                swapIcon();
            }

            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    _afterLoading() {
        this.floatingBg = new FloatingBackground(this.particleAmount);
        /* Re-render any menu surfaces that include sprite icons —
         * the initial constructor pass ran before sprites finished
         * loading and rendered them as empty strings.               */
        Sprites.renderThemedDiff(this.activeTheme || 'green', this.hardUnlocked);
        this.renderDifficultyGrid();
        this.renderCarousel();
        /* If the app was restarted/reloaded mid-run, the menu's mine
         * loadout HUD was never rendered on boot — only later user
         * actions (buying, selling, opening the market) triggered it.
         * Render it now so the active run's loadout shows immediately. */
        this.renderMineHud();
    }

    /* ══ RUN STATE ═════════════════════════════════════════════ */
    _loadRunState() {
        try { return JSON.parse(localStorage.getItem('ms_run_state')) || null; }
        catch(e) { return null; }
    }
    _saveRunState() {
        if (this.runState) localStorage.setItem('ms_run_state', JSON.stringify(this.runState));
        else localStorage.removeItem('ms_run_state');
        /* Keep the active save-slot snapshot in lockstep with the standalone
         * run state.  Board completion advances currentBoard after the
         * per-board payout is saved, so without this sync a later menu
         * resume can restore the just-completed board from the stale slot. */
        if (Number.isInteger(this.currentSlot)) this.saveCurrentToSlot(this.currentSlot);
    }
    _clearRunState() {
        this.runState = null;
        localStorage.removeItem('ms_run_state');
        if (Number.isInteger(this.currentSlot)) this.saveCurrentToSlot(this.currentSlot);
    }

    /* ══ FEATS ═════════════════════════════════════════════════ */
    _loadFeats() {
        const d = this._defaultFeats();
        try {
            const s = localStorage.getItem('ms_feats');
            return s ? { ...d, ...JSON.parse(s) } : d;
        } catch(e) { return d; }
    }
    _saveFeats() { localStorage.setItem('ms_feats', JSON.stringify(this.feats)); }
    _defaultFeats() {
        return { boardsCleared:0, currentConsecutive:0, bestConsecutive:0, totalEarned:0, bestRunStyleScore:0, bestBoardStyleScore:0, funCodeUsed:false, scratchLossStreak:0, bestScratchLossStreak:0, completed:{} };
    }

    _loadActiveSlotSnapshot() {
        const d = this.getSlotData(this.currentSlot);
        if (!d) return;
        this.points = d.points || 0;
        this.hardUnlocked = d.hardUnlocked || false;
        this.runState = d.runState || null;
        this.feats = { ...this._defaultFeats(), ...(d.feats || {}) };
        this.ownedThemes = d.ownedThemes || ['green'];
        this.activeTheme = d.activeTheme || 'green';
        this.infiniteCoins = d.infiniteCoins === true;
        this.unviewedFeatIds = d.unviewedFeatIds || [];
        this.newFeatItemIds = d.newFeatItemIds || this.unviewedFeatIds.slice();
        this.featTabIndicatorCats = Array.isArray(d.featTabIndicatorCats)
            ? d.featTabIndicatorCats
            : [...new Set(this.newFeatItemIds.map(id => FEAT_DEFS.find(def => def.id === id)?.cat).filter(Boolean))];
        if (d.darkMode !== undefined) {
            document.body.classList.toggle('dark-mode', d.darkMode);
            localStorage.setItem('darkMode', d.darkMode);
        }
        /* Restore run-specific data */
        if (d.runPoints !== undefined) this.runPoints = d.runPoints;
        if (d.playerMines !== undefined) this.playerMines = d.playerMines;
        if (d.totemTriggered !== undefined) this.totemTriggered = d.totemTriggered;
        if (d.bannedMineIds !== undefined) this.bannedMineIds = d.bannedMineIds;
    }

    _isFeatDone(id) {
        const f = this.feats;
        const c = f.completed || {};
        const boardFeats  = ['boards_5','boards_10','boards_20','boards_25','consec_10','consec_20','consec_25'];
        const scoreFeats  = ['srun_100','srun_200','srun_350','srun_550','srun_800','srun_1150','sboard_25','sboard_50','sboard_100','sboard_200','sboard_350','sboard_500'];
        switch(id) {
            case 'boards_5':   return f.boardsCleared >= 5;
            case 'boards_10':  return f.boardsCleared >= 10;
            case 'boards_20':  return f.boardsCleared >= 20;
            case 'boards_25':  return f.boardsCleared >= 25;
            case 'consec_10':  return f.bestConsecutive >= 10;
            case 'consec_20':  return f.bestConsecutive >= 20;
            case 'consec_25':  return f.bestConsecutive >= 25;
            case 'srun_100':   return f.bestRunStyleScore >= 100;
            case 'srun_200':   return f.bestRunStyleScore >= 200;
            case 'srun_350':   return f.bestRunStyleScore >= 350;
            case 'srun_550':   return f.bestRunStyleScore >= 550;
            case 'srun_800':   return f.bestRunStyleScore >= 800;
            case 'srun_1150':  return f.bestRunStyleScore >= 1150;
            case 'sboard_25':  return f.bestBoardStyleScore >= 25;
            case 'sboard_50':  return f.bestBoardStyleScore >= 50;
            case 'sboard_100': return f.bestBoardStyleScore >= 100;
            case 'sboard_200': return f.bestBoardStyleScore >= 200;
            case 'sboard_350': return f.bestBoardStyleScore >= 350;
            case 'sboard_500': return f.bestBoardStyleScore >= 500;
            case 'all_themes': return Object.entries(THEMES).filter(([,t]) => !t.secret).every(([k]) => this.ownedThemes.includes(k));
            case 'fun_code':   return f.funCodeUsed === true;
            case 'all_boards_done': return boardFeats.every(x => c[x] || this._isFeatDone(x));
            case 'all_score_done':  return scoreFeats.every(x => c[x] || this._isFeatDone(x));
            case 'hopeless_5':  return (f.bestScratchLossStreak||0) >= 5  || (f.scratchLossStreak||0) >= 5;
            case 'hopeless_10': return (f.bestScratchLossStreak||0) >= 10 || (f.scratchLossStreak||0) >= 10;
            case 'hopeless_15': return (f.bestScratchLossStreak||0) >= 15 || (f.scratchLossStreak||0) >= 15;
            case 'hopeless_20': return (f.bestScratchLossStreak||0) >= 20 || (f.scratchLossStreak||0) >= 20;
            case 'big_shot':   return this.ownedThemes.includes('spamton');
            case 'circle_board': case 'score_69': case 'ultrakill': case 'ting': case 'edgelord_phase': case 'sixty_nine_better': case 'tsar_mimba_bought':
                return c[id] === true;
        }
        return false;
    }

    checkFeats() {
        let anyNew = false;
        for (const def of FEAT_DEFS) {
            if (!this.feats.completed[def.id] && this._isFeatDone(def.id)) {
                this.feats.completed[def.id] = true; anyNew = true;
                if (!this.unviewedFeatIds.includes(def.id)) this.unviewedFeatIds.push(def.id);
                if (!this.newFeatItemIds.includes(def.id)) this.newFeatItemIds.push(def.id);
                if (!this.featTabIndicatorCats.includes(def.cat)) this.featTabIndicatorCats.push(def.cat);
                this.notifyQ.push(def);
            }
        }
        if (anyNew) { this._saveFeats(); this._saveFeatIndicators(); this._updateNotifDot(); this._updateTabDots(); }
    }

    _unlockSecret(id) {
        if (this.feats.completed[id]) return;
        this.feats.completed[id] = true;
        const def = FEAT_DEFS.find(d => d.id === id);
        if (def) {
            if (!this.unviewedFeatIds.includes(id)) this.unviewedFeatIds.push(id);
            if (!this.newFeatItemIds.includes(id)) this.newFeatItemIds.push(id);
            if (!this.featTabIndicatorCats.includes(def.cat)) this.featTabIndicatorCats.push(def.cat);
            this.notifyQ.push(def);
        }
        this._saveFeats(); this._saveFeatIndicators(); this._updateNotifDot(); this._updateTabDots();
    }

    _updateNotifDot() {
        const dot = document.getElementById('feats-notif-dot');
        const featsBtn = document.getElementById('feats-btn');
        if (dot) dot.classList.add('hidden');
        if (featsBtn) {
            featsBtn.classList.toggle(
                'feat-indicator-active',
                this.featIndicators && this.newFeatItemIds.length > 0
            );
        }
    }

    _saveFeatIndicators() {
        localStorage.setItem('ms_unviewed_feats', JSON.stringify(this.unviewedFeatIds));
        localStorage.setItem('ms_new_feat_items', JSON.stringify(this.newFeatItemIds));
        localStorage.setItem('ms_feat_tab_indicators', JSON.stringify(this.featTabIndicatorCats));
        if (Number.isInteger(this.currentSlot)) this.saveCurrentToSlot(this.currentSlot);
    }

    t(key, fallback = '') {
        return this.texts && this.texts[key] !== undefined ? this.texts[key] : fallback;
    }

    async loadTexts() {
        try {
            const res = await fetch(`static/text.json?v=${Date.now()}`, { cache: 'no-store' });
            if (!res.ok) return;
            const raw = await res.text();
            if (raw === this._lastTextJson) return;
            this._lastTextJson = raw;
            this.texts = JSON.parse(raw);
            this.applyTexts();
        } catch(e) {}
    }

    applyTexts() {
        document.querySelectorAll('[data-text]').forEach(el => {
            const key = el.dataset.text;
            if (this.texts[key] !== undefined) el.textContent = this.texts[key];
        });
        document.querySelectorAll('[data-placeholder]').forEach(el => {
            const key = el.dataset.placeholder;
            if (this.texts[key] !== undefined) el.setAttribute('placeholder', this.texts[key]);
        });
        if (this.texts.pageTitle) document.title = this.texts.pageTitle;
    }

    /* ══ SAVE SYSTEM ══════════════════════════════════════════ */
    _buildSaveData() {
        return {
            points: this.points, hardUnlocked: this.hardUnlocked,
            runState: this.runState, feats: this.feats,
            ownedThemes: this.ownedThemes, activeTheme: this.activeTheme,
            infiniteCoins: this.infiniteCoins,
            unviewedFeatIds: this.unviewedFeatIds,
            newFeatItemIds: this.newFeatItemIds,
            featTabIndicatorCats: this.featTabIndicatorCats,
            darkMode: document.body.classList.contains('dark-mode'),
            runPoints: this.runPoints,
            playerMines: this.playerMines,
            totemTriggered: this.totemTriggered,
            bannedMineIds: this.bannedMineIds,
            timestamp: Date.now()
        };
    }
    saveCurrentToSlot(n) { localStorage.setItem(`ms_save_${n}`, JSON.stringify(this._buildSaveData())); }
    getSlotData(n) {
        try { return JSON.parse(localStorage.getItem(`ms_save_${n}`)) || null; }
        catch(e) { return null; }
    }
    switchSlot(n) {
        if (n === this.currentSlot) { document.getElementById('saves-modal').classList.remove('show'); return; }
        this.saveCurrentToSlot(this.currentSlot);
        this.currentSlot = n;
        localStorage.setItem('ms_save_slot', n);
        const d = this.getSlotData(n);
        if (d) {
            this.points = d.points || 0;
            this.hardUnlocked = d.hardUnlocked || false;
            this.runState = d.runState || null;
            this.feats = { ...this._defaultFeats(), ...(d.feats||{}) };
            this.unviewedFeatIds = d.unviewedFeatIds || [];
            this.newFeatItemIds = d.newFeatItemIds || this.unviewedFeatIds.slice();
            this.featTabIndicatorCats = Array.isArray(d.featTabIndicatorCats)
                ? d.featTabIndicatorCats
                : [...new Set(this.newFeatItemIds.map(id => FEAT_DEFS.find(def => def.id === id)?.cat).filter(Boolean))];
            this.ownedThemes = d.ownedThemes || ['green'];
            this.activeTheme = d.activeTheme || 'green';
            this.infiniteCoins = d.infiniteCoins === true;
            this.runPoints = d.runPoints || 0;
            this.playerMines = d.playerMines || [];
            this.totemTriggered = d.totemTriggered || false;
            this.bannedMineIds = d.bannedMineIds || [];
            if (d.darkMode !== undefined) {
                document.body.classList.toggle('dark-mode', d.darkMode);
                const tog = document.getElementById('dark-mode-toggle');
                if (tog) tog.checked = d.darkMode;
                localStorage.setItem('darkMode', d.darkMode);
            }
        } else {
            this.points = 0; this.hardUnlocked = false;
            this.runState = null;
            this.feats = this._defaultFeats();
            this.unviewedFeatIds = []; this.newFeatItemIds = []; this.featTabIndicatorCats = [];
            this.ownedThemes = ['green']; this.activeTheme = 'green'; this.infiniteCoins = false;
            this.runPoints = 0; this.playerMines = []; this.totemTriggered = false; this.bannedMineIds = [];
        }
        localStorage.setItem('ms_points', this.points);
        localStorage.setItem('ms_hard_unlocked', this.hardUnlocked);
        localStorage.setItem('ms_owned_themes', JSON.stringify(this.ownedThemes));
        localStorage.setItem('ms_active_theme', this.activeTheme);
        localStorage.setItem('ms_infinite_coins', this.infiniteCoins);
        this._saveFeats(); this._saveFeatIndicators();
        document.body.classList.toggle('dev-mode', this.infiniteCoins);
        this.applyTheme(this.activeTheme);
        this.currentDifficulty = this.runState ? this.runState.difficulty : null;
        this.carouselIndex = this.runState ? this.runState.currentBoard : 0;
        this.renderDifficultyGrid(); this.renderLevelBar(); this.renderCarousel(); this.refreshMenuButtons();
        this._updateNotifDot(); this._updateTabDots();
        if (this.currentDifficulty) {
            document.querySelectorAll('.diff-box').forEach(b => b.classList.remove('selected'));
            const box = document.getElementById(`diff-${this.currentDifficulty}`);
            if (box) box.classList.add('selected');
        }
        document.getElementById('saves-modal').classList.remove('show');
        this.renderMineHud();
        this.sfx.play('btn');
    }
    renderSavesModal() {
        const wrap = document.getElementById('save-slots');
        if (!wrap) return;
        wrap.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const d = this.getSlotData(i);
            const isActive = i === this.currentSlot;
            const isEmpty  = !d && !isActive;
            const div = document.createElement('div');
            div.className = `save-slot${isActive ? ' active-slot' : ''}${isEmpty ? ' empty-slot' : ''}`;
            if (isEmpty) {
                div.innerHTML = `
                    <div class="save-slot-header">
                        <div class="save-slot-title-wrap">
                            <span class="save-slot-number">${String(i + 1).padStart(2, '0')}</span>
                            <span class="save-slot-name">Profile ${i + 1}</span>
                        </div>
                        <span class="save-slot-badge save-slot-badge-empty">EMPTY</span>
                    </div>
                    <div class="save-slot-empty-copy">No saved run yet</div>
                `;
            } else {
                const pts  = isActive ? this.points : (d && d.points || 0);
                const inf  = isActive ? this.infiniteCoins : (d && d.infiniteCoins === true);
                const ago  = d && d.timestamp ? this._timeAgo(d.timestamp) : 'just now';
                const run = isActive ? this.runState : (d && d.runState);
                const board = run && Number.isFinite(run.currentBoard) ? `${Math.min(run.currentBoard + 1, NUM_BOARDS)}/${NUM_BOARDS}` : '—';
                const mineCount = isActive
                    ? (this.playerMines || []).filter(Boolean).length
                    : ((d && d.playerMines) || []).filter(Boolean).length;
                div.innerHTML = `
                    <div class="save-slot-header">
                        <div class="save-slot-title-wrap">
                            <span class="save-slot-number">${String(i + 1).padStart(2, '0')}</span>
                            <span class="save-slot-name">Profile ${i + 1}</span>
                            ${isActive ? '<span class="save-slot-badge">ACTIVE</span>' : ''}
                        </div>
                        <span class="save-slot-actions">
                            <button class="save-delete-btn juicy-btn" data-delete-slot="${i}">Delete</button>
                        </span>
                    </div>
                    <div class="save-slot-stats">
                        <div class="save-slot-stat">
                            <span class="save-slot-stat-label">POINTS</span>
                            <strong>${inf ? '∞' : pts.toLocaleString()}</strong>
                        </div>
                        <div class="save-slot-stat">
                            <span class="save-slot-stat-label">BOARD</span>
                            <strong>${board}</strong>
                        </div>
                        <div class="save-slot-stat">
                            <span class="save-slot-stat-label">MINES</span>
                            <strong>${mineCount}/6</strong>
                        </div>
                    </div>
                    <div class="save-slot-footer">
                        <span class="save-slot-info">${ago}</span>
                        <span class="save-slot-open-hint">${isActive ? 'CURRENT' : 'TAP TO OPEN'}</span>
                    </div>
                `;
            }
            div.addEventListener('click', () => { this.sfx.play('btn'); this.switchSlot(i); });
            const del = div.querySelector('.save-delete-btn');
            if (del) del.addEventListener('click', e => { e.stopPropagation(); this.confirmDeleteSlot(i); });
            wrap.appendChild(div);
        }
    }
    confirmDeleteSlot(n) {
        this.showDiffModal(`Delete Slot ${n+1}?`, 'This save file will be permanently removed.', [
            {label:'Delete', cls:'abort-btn', action:()=>this.deleteSlot(n)},
            {label:'Cancel', cls:'menu-link-btn', action:()=>{}}
        ]);
    }
    deleteSlot(n) {
        localStorage.removeItem(`ms_save_${n}`);
        if (n === this.currentSlot) {
            this.points = 0; this.hardUnlocked = false; this.runState = null;
            this.feats = this._defaultFeats();
            this.unviewedFeatIds = []; this.newFeatItemIds = []; this.featTabIndicatorCats = [];
            this.ownedThemes = ['green']; this.activeTheme = 'green'; this.infiniteCoins = false;
            this.runPoints = 0; this.playerMines = []; this.totemTriggered = false; this.bannedMineIds = [];
            this.currentDifficulty = null; this.carouselIndex = 0;
            localStorage.setItem('ms_points', this.points);
            localStorage.setItem('ms_hard_unlocked', 'false');
            localStorage.setItem('ms_owned_themes', JSON.stringify(this.ownedThemes));
            localStorage.setItem('ms_active_theme', this.activeTheme);
            localStorage.setItem('ms_infinite_coins', 'false');
            this._clearRunState(); this._saveFeats(); this._saveFeatIndicators();
            document.body.classList.remove('dev-mode');
            this.applyTheme(this.activeTheme);
            this.renderDifficultyGrid(); this.renderLevelBar(); this.renderCarousel(); this.refreshMenuButtons();
            this._updateNotifDot(); this._updateTabDots();
        }
        this.renderSavesModal();
        this.sfx.play('error');
    }
    _timeAgo(ts) {
        const s = Math.floor((Date.now() - ts) / 1000);
        if (s < 60) return 'just now';
        if (s < 3600) return `${Math.floor(s/60)}m ago`;
        if (s < 86400) return `${Math.floor(s/3600)}h ago`;
        return `${Math.floor(s/86400)}d ago`;
    }

    /* ══ RUN POINTS ═══════════════════════════════════════════ */
    addRunPoints(n) {
        this.runPoints += n;
        this._updateRunPtsHud();
        this.saveCurrentToSlot(this.currentSlot);
    }
    spendRunPoints(n) {
        if (this.runPoints < n && !this.infiniteCoins) return false;
        if (!this.infiniteCoins) this.runPoints -= n;
        this._updateRunPtsHud();
        this.saveCurrentToSlot(this.currentSlot);
        return true;
    }
    _updateRunPtsHud() {
        const el = document.getElementById('run-pts-hud-val');
        if (!el) return;
        const prev = parseInt(el.textContent) || 0;
        el.textContent = this.runPoints;
        if (this.runPoints !== prev) {
            el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
            setTimeout(() => el.classList.remove('bump'), 250);
        }
    }
    _flushRunPointsToMain() {
        if (this.runPoints > 0) {
            this.points += this.runPoints;
            localStorage.setItem('ms_points', this.points);
            this.runPoints = 0;
            this.renderLevelBar();
        }
    }
    _resetRunState() {
        this.runPoints = 0;
        this.playerMines = [];
        this.totemTriggered = false;
        this.bannedMineIds = [];
        this.trenchMines = [];
        this.fractalMines = [];
        this.dormantMines = [];
        this.tsarArmed = false;
        this.diffusalCountdown = null;
        this.boardRingInset = 0;
        this.voidedCells = new Set();
        this._updateRunPtsHud();
        this.renderMineHud();
    }

    /* ══ THEMES ════════════════════════════════════════════════ */
    applyTheme(key) {
        const t = THEMES[key]; if (!t) return;
        Object.keys(THEMES).forEach(k => document.body.classList.remove(`theme-${k}`));
        document.body.classList.add(`theme-${key}`);
        document.documentElement.style.setProperty('--accent', t.accent);
        document.documentElement.style.setProperty('--accent2', t.accent2 || t.accent);
        Sprites.renderThemedDiff(key, this.hardUnlocked);
        if (this.floatingBg) this.floatingBg.invalidateThemeColor();
        if (document.getElementById('carousel-wrapper')) this.renderCarousel();
    }
    previewTheme(key) {
        this._previewTheme = key;
        const t = THEMES[key]; if (!t) return;
        Object.keys(THEMES).forEach(k => document.body.classList.remove(`theme-${k}`));
        document.body.classList.add(`theme-${key}`);
        document.documentElement.style.setProperty('--accent', t.accent);
        document.documentElement.style.setProperty('--accent2', t.accent2 || t.accent);
        Sprites.renderThemedDiff(key, this.hardUnlocked);
        if (this.floatingBg) this.floatingBg.invalidateThemeColor();
        if (document.getElementById('carousel-wrapper')) this.renderCarousel();
    }
    revertPreview() { this._previewTheme = null; this.applyTheme(this.activeTheme); }
    selectTheme(key) {
        if (!this.ownedThemes.includes(key)) return;
        if (key === 'red') this._trackRedTheme();
        this.activeTheme = key;
        localStorage.setItem('ms_active_theme', key);
        this.applyTheme(key);
        this.renderStoreThemes();
        this.renderDifficultyGrid();
    }
    purchaseTheme(key, onDone) {
        const t = THEMES[key]; if (!t) return;
        if (this.ownedThemes.includes(key)) { this.selectTheme(key); if (onDone) onDone(); return; }
        if (!this.infiniteCoins && this.points < t.cost) {
            this.sfx.play('error');
            const currentPoints = this.points;
            const remainingPoints = currentPoints - t.cost;
            const purchaseSwatches = document.getElementById('shortfall-theme-swatches');
            const swatchColors = [t.accent, t.accent2 || t.accent, t.diff?.easy, t.diff?.hard].filter(Boolean);
            if (purchaseSwatches) purchaseSwatches.innerHTML = swatchColors.map(color => `<span style="background:${color}"></span>`).join('');
            const purchaseName = document.getElementById('shortfall-theme-name');
            if (purchaseName) purchaseName.textContent = t.name;
            const currentEl = document.getElementById('shortfall-current-points');
            const costEl = document.getElementById('shortfall-cost');
            const remainingEl = document.getElementById('shortfall-remaining-points');
            if (currentEl) currentEl.textContent = currentPoints;
            if (costEl) costEl.textContent = t.cost;
            if (remainingEl) remainingEl.textContent = remainingPoints;
            const body = document.getElementById('points-shortfall-body');
            if (body) body.textContent = `You need ${Math.abs(remainingPoints)} more points to buy this theme.`;
            const closeShortfall = () => {
                document.getElementById('points-shortfall-modal').classList.remove('show');
                this.sfx.play('btn');
            };
            document.getElementById('points-shortfall-close-btn').onclick = closeShortfall;
            document.getElementById('points-shortfall-ok-btn').onclick = closeShortfall;
            document.getElementById('points-shortfall-modal').classList.add('show');
            return;
        }
        document.getElementById('purchase-title').textContent = `Buy ${t.name}?`;
        const purchaseCurrent = document.getElementById('purchase-current-points');
        const purchaseCost = document.getElementById('purchase-cost');
        const purchaseRemaining = document.getElementById('purchase-remaining-points');
        const purchaseBody = document.getElementById('purchase-body');
        const purchaseName = document.getElementById('purchase-theme-name');
        const purchaseSwatches = document.getElementById('purchase-theme-swatches');
        const infinite = this.infiniteCoins;
        const currentPoints = infinite ? '∞' : this.points;
        const costPoints = infinite ? 'FREE' : t.cost;
        const remainingPoints = infinite ? '∞' : this.points - t.cost;
        if (purchaseCurrent) purchaseCurrent.textContent = currentPoints;
        if (purchaseCost) purchaseCost.textContent = costPoints;
        if (purchaseRemaining) purchaseRemaining.textContent = remainingPoints;
        if (purchaseName) purchaseName.textContent = t.name;
        if (purchaseSwatches) {
            const swatchColors = [t.accent, t.accent2 || t.accent, t.diff?.easy, t.diff?.hard].filter(Boolean);
            purchaseSwatches.innerHTML = swatchColors.map(color => `<span style="background:${color}"></span>`).join('');
        }
        if (purchaseBody) purchaseBody.textContent = infinite
            ? 'You have unlimited points — this theme is free.'
            : 'Your remaining points after this purchase.';
        document.getElementById('purchase-modal').classList.add('show');
        document.getElementById('purchase-confirm-btn').onclick = () => {
            document.getElementById('purchase-modal').classList.remove('show');
            if (!this.infiniteCoins) { this.points -= t.cost; localStorage.setItem('ms_points', this.points); }
            this.ownedThemes.push(key);
            localStorage.setItem('ms_owned_themes', JSON.stringify(this.ownedThemes));
            this.selectTheme(key); this.renderLevelBar(); this.checkFeats();
            this.sfx.play('purchase');
            const card = document.querySelector(`.theme-card[data-theme-key="${key}"]`);
            if (card) { card.classList.add('purchase-pop'); setTimeout(() => card.classList.remove('purchase-pop'), 450); }
            if (onDone) onDone();
        };
        const cancelPurchase = () => {
            document.getElementById('purchase-modal').classList.remove('show'); this.sfx.play('btn');
        };
        document.getElementById('purchase-cancel-btn').onclick = cancelPurchase;
        document.getElementById('purchase-cancel-action-btn').onclick = cancelPurchase;
        this.sfx.play('modal');
    }
    renderStoreThemes() {
        const commonPanel   = document.getElementById('store-panel-themes');
        const uncommonPanel = document.getElementById('store-panel-uncommon');
        const isDark = document.body.classList.contains('dark-mode');
        const s1 = isDark ? '#1e1e1e' : '#3a3a3a';
        const s2 = isDark ? '#333333' : '#666666';
        const s3 = isDark ? '#4a4a4a' : '#999999';
        const adj = (hex) => {
            if (!isDark) return hex;
            const rv = parseInt(hex.slice(1,3),16), gv = parseInt(hex.slice(3,5),16), bv = parseInt(hex.slice(5,7),16);
            const lum = (rv*299+gv*587+bv*114)/1000;
            if (lum < 25) { const boost=35; return `rgb(${Math.min(255,rv+boost)},${Math.min(255,gv+boost)},${Math.min(255,bv+boost)})`; }
            return hex;
        };
        const cardHtml = ([key, t]) => {
            const owned = this.ownedThemes.includes(key);
            const active= key === this.activeTheme;
            const isUncommon = t.rarity === 'uncommon';
            const pill  = active ? `<span class="theme-cost-pill pill-active">Active</span>`
                        : owned  ? `<span class="theme-cost-pill pill-owned">Owned</span>`
                        :          `<span class="theme-cost-pill">${t.cost} pts</span>`;
            const rarityBadge = isUncommon ? `<span class="uc-rarity-badge">✦ UNCOMMON</span>` : '';
            const particles = isUncommon ? `<div class="uc-particles" aria-hidden="true">
                <span class="uc-p uc-p1"></span><span class="uc-p uc-p2"></span>
                <span class="uc-p uc-p3"></span><span class="uc-p uc-p4"></span>
                <span class="uc-p uc-p5"></span><span class="uc-p uc-p6"></span>
            </div>` : '';
            return `<div class="theme-card${active?' theme-active-card':''}${isUncommon?' uncommon-card':''}" data-theme-key="${key}" style="${active?`border-color:${t.accent};box-shadow:0 0 0 2px ${t.accent}`:''}">
                ${particles}
                <div class="theme-swatches"><div class="swatch" style="background:${adj(s1)}"></div><div class="swatch" style="background:${adj(s2)}"></div><div class="swatch" style="background:${adj(s3)}"></div><div class="swatch" style="background:${t.accent}"></div></div>
                <span class="theme-card-name">${t.name}</span>${pill}${rarityBadge}</div>`;
        };
        const visible = Object.entries(THEMES).filter(([key, t]) => !t.secret || this.ownedThemes.includes(key));
        const commons   = visible.filter(([k, t]) => t.rarity !== 'uncommon');
        const uncommons = visible.filter(([k, t]) => t.rarity === 'uncommon');

        if (commonPanel) commonPanel.innerHTML = `<div class="themes-grid">${commons.map(cardHtml).join('')}</div>`;
        if (uncommonPanel) {
            uncommonPanel.innerHTML = uncommons.length
                ? `<div class="themes-grid">${uncommons.map(cardHtml).join('')}</div>`
                : `<div style="text-align:center;padding:28px 0;color:var(--text-muted);font-size:.82rem;font-weight:700">Coming soon.</div>`;
        }

        const bindCards = (panel) => {
            if (!panel) return;
            panel.querySelectorAll('.theme-card').forEach(card => {
                const key = card.dataset.themeKey;
                let pressTimer = null, isPreviewing = false;
                card.addEventListener('pointerdown', () => { pressTimer = setTimeout(() => { isPreviewing=true; this.previewTheme(key); }, 180); });
                card.addEventListener('pointerup',   () => {
                    clearTimeout(pressTimer);
                    if (isPreviewing) { this.revertPreview(); isPreviewing=false; }
                    else { const owned=this.ownedThemes.includes(key); if(owned){this.selectTheme(key);this.sfx.play('btn');}else{this.purchaseTheme(key,null);} }
                });
                card.addEventListener('pointerleave',() => { clearTimeout(pressTimer); if(isPreviewing){this.revertPreview();isPreviewing=false;} });
                card.addEventListener('contextmenu', e => e.preventDefault());
            });
        };
        bindCards(commonPanel);
        bindCards(uncommonPanel);
    }

    /* ══ FEATS PANEL ═══════════════════════════════════════════ */
    renderFeatsPanel(tab) {
        const list = document.getElementById('feats-list');
        if (!list) return;
        const isDev = this.infiniteCoins;
        if (tab === 'original') {
            const secretDefs = FEAT_DEFS.filter(d => d.cat === 'original');
            const unlockedSecrets = secretDefs.filter(d => this.feats.completed && this.feats.completed[d.id]);
            if (unlockedSecrets.length === 0) { list.innerHTML = `<div class="feats-empty-msg">Nothing here yet...</div>`; return; }
            list.innerHTML = unlockedSecrets.map(d => this._renderFeatItem(d, true, isDev)).join('');
            this._bindFeatItemMarkers(list); return;
        }
        if (tab === 'score') {
            const runDefs   = FEAT_DEFS.filter(d => d.cat === 'score' && d.sub === 'run');
            const boardDefs = FEAT_DEFS.filter(d => d.cat === 'score' && d.sub === 'board');
            list.innerHTML =
                `<div class="feats-section-header">Run Score</div>` +
                runDefs.map(d => this._renderFeatItem(d, this._isFeatDone(d.id), isDev)).join('') +
                `<div class="feats-section-header" style="margin-top:8px">Board Score</div>` +
                boardDefs.map(d => this._renderFeatItem(d, this._isFeatDone(d.id), isDev)).join('');
            this._bindFeatItemMarkers(list); return;
        }
        if (tab === 'board') {
            const streakDefs = FEAT_DEFS.filter(d => d.cat === 'board' && d.id.startsWith('consec_'));
            const clearDefs = FEAT_DEFS.filter(d => d.cat === 'board' && d.id.startsWith('boards_'));
            list.innerHTML =
                `<div class="feats-section-header">Streaks</div>` +
                streakDefs.map(d => this._renderFeatItem(d, this._isFeatDone(d.id), isDev)).join('') +
                `<div class="feats-section-header" style="margin-top:8px">Board Clears</div>` +
                clearDefs.map(d => this._renderFeatItem(d, this._isFeatDone(d.id), isDev)).join('');
            this._bindFeatItemMarkers(list); return;
        }
        if (tab === 'market') {
            const hopeless = FEAT_DEFS.filter(d => d.cat === 'market' && d.id.startsWith('hopeless_'));
            list.innerHTML =
                `<div class="feats-section-header">Hopeless</div>` +
                hopeless.map(d => this._renderFeatItem(d, this._isFeatDone(d.id), isDev)).join('');
            this._bindFeatItemMarkers(list); return;
        }
        const defs = FEAT_DEFS.filter(d => d.cat === tab && !d.sub);
        if (defs.length === 0) { list.innerHTML = `<div class="feats-empty-msg">Nothing here yet.</div>`; return; }
        list.innerHTML = defs.map(d => this._renderFeatItem(d, this._isFeatDone(d.id), isDev)).join('');
        this._bindFeatItemMarkers(list);
    }

    _renderFeatItem(def, done, isDev) {
        const iconSvg = done ? (FEAT_ICONS_SVG[def.iconKey] || FEAT_ICONS_SVG.board) : FEAT_ICONS_SVG.lock;
        const devStyle = isDev && done ? ' dev-feat' : '';
        const indicator = done && this.newFeatItemIds.includes(def.id) ? ' feat-item-indicator-active' : '';
        return `<div class="feat-item ${done?'feat-done':'feat-locked'}${devStyle}${indicator}" data-feat-id="${def.id}">
            <div class="feat-icon">${iconSvg}</div>
            <div class="feat-text">
                <span class="feat-name">${def.name}</span>
                <span class="feat-desc">${def.desc}</span>
            </div></div>`;
    }

    _markFeatTabSeen(tab) {
        const hasPendingInTab = this.newFeatItemIds.some(id =>
            FEAT_DEFS.find(def => def.id === id)?.cat === tab
        );
        const before = this.featTabIndicatorCats.length;
        if (hasPendingInTab && !this.featTabIndicatorCats.includes(tab)) {
            this.featTabIndicatorCats.push(tab);
        } else if (!hasPendingInTab) {
            this.featTabIndicatorCats = this.featTabIndicatorCats.filter(cat => cat !== tab);
        }
        if (before !== this.featTabIndicatorCats.length) {
            this._saveFeatIndicators();
        }
        this._updateNotifDot(); this._updateTabDots();
    }
    _bindFeatItemMarkers(list) {
        list.querySelectorAll('.feat-item[data-feat-id]').forEach(item => {
            item.addEventListener('click', () => this._markFeatItemSeen(item.dataset.featId));
        });
    }
    _markFeatItemSeen(id) {
        const beforeItems = this.newFeatItemIds.length;
        const beforeUnviewed = this.unviewedFeatIds.length;
        this.newFeatItemIds = this.newFeatItemIds.filter(x => x !== id);
        this.unviewedFeatIds = this.unviewedFeatIds.filter(x => x !== id);
        const item = document.querySelector(`.feat-item[data-feat-id="${id}"]`);
        if (item) {
            item.classList.remove('feat-item-indicator-active', 'feat-item-indicator-pulse');
            item.querySelectorAll('.feat-new-marker').forEach(marker => marker.remove());
        }
        const featDef = FEAT_DEFS.find(def => def.id === id);
        if (featDef && !this.newFeatItemIds.some(featId =>
            FEAT_DEFS.find(def => def.id === featId)?.cat === featDef.cat
        )) {
            this.featTabIndicatorCats = this.featTabIndicatorCats.filter(cat => cat !== featDef.cat);
        }
        if (beforeItems !== this.newFeatItemIds.length || beforeUnviewed !== this.unviewedFeatIds.length) {
            this._saveFeatIndicators();
        }
        this._updateNotifDot(); this._updateTabDots();
    }

    _clearAllFeatIndicators() {
        this.unviewedFeatIds = [];
        this.newFeatItemIds = [];
        this.featTabIndicatorCats = [];
        this._saveFeatIndicators();
        document.querySelectorAll('.feat-item-indicator-active, .feat-item-indicator-pulse').forEach(item => {
            item.classList.remove('feat-item-indicator-active', 'feat-item-indicator-pulse');
        });
        this._updateNotifDot();
        this._updateTabDots();
    }
    _updateTabDots() {
        document.querySelectorAll('#feats-side-nav .feats-side-nav-btn, #feats-tab-bar .tab-btn').forEach(btn => {
            btn.querySelectorAll('.notif-dot').forEach(dot => dot.remove());
            btn.classList.toggle(
                'feat-tab-indicator-active',
                this.featIndicators && this.featTabIndicatorCats.includes(btn.dataset.featsTab)
            );
        });
    }

    _updateFeatIndicators() {
        document.body.classList.toggle('feat-indicators-disabled', !this.featIndicators);
        this._updateNotifDot();
        this._updateTabDots();
    }

    /* ══ COLLECTION MODAL ════════════════════════════════════ */
    renderCollectionMines() {
        const panel = document.getElementById('coll-panel-mines');
        if (!panel) return;
        panel.innerHTML = `<div class="mines-collection-grid">${ALL_MINE_IDS.map(id => {
            const def = MINE_DEFS[id];
            const rarity = def.rarity || 'common';
            const rarityBadge = `<span class="mine-coll-rarity rarity-${rarity}">${rarity}</span>`;
            return `<div class="mine-coll-card" data-mine-id="${id}">
                <div class="mine-coll-icon" data-rarity="${rarity}" style="background:${def.color}22;border:2px solid ${def.color}44">${def.icon()}</div>
                <span class="mine-coll-name">${def.name}</span>
                ${rarityBadge}
            </div>`;
        }).join('')}</div>`;
        panel.querySelectorAll('.mine-coll-card').forEach(card => {
            card.addEventListener('click', () => {
                this.sfx.play('btn');
                this.showMineInfo(card.dataset.mineId);
            });
        });
    }

    showMineInfo(mineId) {
        const def = MINE_DEFS[mineId]; if (!def) return;
        document.getElementById('mine-info-icon-wrap').innerHTML = def.icon();
        document.getElementById('mine-info-icon-wrap').style.background = def.color + '22';
        document.getElementById('mine-info-icon-wrap').style.border = `2px solid ${def.color}66`;
        document.getElementById('mine-info-name').textContent = def.name;
        const rarityEl = document.getElementById('mine-info-rarity');
        if (rarityEl) {
            rarityEl.textContent = `Rarity · ${def.rarity}`;
            rarityEl.className = `mine-info-rarity rarity-${def.rarity}`;
        }
        document.getElementById('mine-info-effect').textContent = def.effect;
        /* Show/hide PASSIVE tag and hide placement counter row for passive mines */
        const passiveTag = document.getElementById('mine-info-passive-tag');
        if (passiveTag) passiveTag.classList.toggle('hidden', !def.passive);
        document.getElementById('mine-info-modal').classList.add('show');
        this.sfx.play('modal');
    }

    /* ══ POINTS ═══════════════════════════════════════════════ */
    renderLevelBar() { this.renderPointsDisplay(); }
    renderPointsDisplay() {
        const hasRun = !!this.runState;
        const normalRow = document.getElementById('points-row-normal');
        const splitRow  = document.getElementById('points-row-split');
        if (normalRow) normalRow.classList.toggle('hidden', hasRun);
        if (splitRow)  splitRow.classList.toggle('hidden', !hasRun);
        const pd = document.getElementById('points-display');
        if (pd) pd.textContent = this.infiniteCoins ? '∞' : this.points.toLocaleString();
        const pdPerm = document.getElementById('points-display-perm');
        if (pdPerm) pdPerm.textContent = this.infiniteCoins ? '∞' : this.points.toLocaleString();
        const pdRun = document.getElementById('points-display-run');
        if (pdRun) pdRun.textContent = this.runPoints.toLocaleString();
    }
    awardPoints(n) {
        const earned = n * 10;
        if (!this.infiniteCoins) { this.points += earned; localStorage.setItem('ms_points', this.points); }
        this.feats.totalEarned += earned;
        this._saveFeats(); this.renderLevelBar(); this.checkFeats();
        return earned;
    }

    /* ══ SETTINGS ══════════════════════════════════════════════ */
    loadSettings() {
        /* Dark mode is the first-launch default, but an explicit light-mode
         * choice must remain false instead of being treated as "unset". */
        const storedDarkMode = localStorage.getItem('darkMode');
        const dark = storedDarkMode === null ? true : storedDarkMode === 'true';
        document.body.classList.toggle('dark-mode', dark);
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) darkModeToggle.checked = dark;
        if (storedDarkMode === null) localStorage.setItem('darkMode', 'true');
        const meterRight = localStorage.getItem('ms_style_meter_right') === 'true';
        document.body.classList.toggle('style-meter-right', meterRight);
        const meterToggle = document.getElementById('style-meter-position-toggle');
        if (meterToggle) meterToggle.checked = meterRight;
        const vol = parseFloat(localStorage.getItem('ms_sfx_volume') ?? '0.8');
        this.sfx.sfxVolume = vol;
        const slider  = document.getElementById('sfx-volume-slider');
        const display = document.getElementById('sfx-vol-display');
        if (slider)  slider.value = Math.round(vol * 100);
        if (display) display.textContent = `${Math.round(vol*100)}%`;

        const pAmt = parseFloat(localStorage.getItem('ms_particle_amount') ?? '1.0');
        this.particleAmount = pAmt;
        const pSlider  = document.getElementById('particle-amount-slider');
        const pDisplay = document.getElementById('particle-amount-display');
        if (pSlider)  pSlider.value = Math.round(pAmt * 100);
        if (pDisplay) pDisplay.textContent = `${Math.round(pAmt * 100)}%`;

        this.mineBuyingPopup = localStorage.getItem('ms_mine_buying_popup') !== 'false';
        const mineBuyToggle = document.getElementById('mine-buying-popup-toggle');
        if (mineBuyToggle) mineBuyToggle.checked = this.mineBuyingPopup;

        this.featIndicators = localStorage.getItem('ms_feat_indicators') !== 'false';
        const featIndicatorsToggle = document.getElementById('feat-indicators-toggle');
        if (featIndicatorsToggle) featIndicatorsToggle.checked = this.featIndicators;
        this._updateFeatIndicators();
    }

    /* ══ DIFFICULTY GRID ═══════════════════════════════════════ */
    renderDifficultyGrid() {
        const hardBox = document.getElementById('diff-hard');
        if (this.hardUnlocked) { hardBox.classList.add('hard-unlocked'); hardBox.classList.remove('diff-locked'); }
        else { hardBox.classList.remove('hard-unlocked'); hardBox.classList.add('diff-locked'); }
        document.getElementById('difficulty-grid').classList.toggle('run-locked', !!this.runState);
        /* Always keep the selected-difficulty highlight in sync with
         * currentDifficulty here, instead of relying on every call site
         * to also poke the '.selected' class — this is what was missing
         * on a cold page load mid-run, leaving no difficulty box marked
         * selected even though the run's difficulty was locked in.      */
        document.querySelectorAll('.diff-box').forEach(b => b.classList.remove('selected'));
        if (this.currentDifficulty) {
            const box = document.getElementById(`diff-${this.currentDifficulty}`);
            if (box) box.classList.add('selected');
        }
        Sprites.renderThemedDiff(this.activeTheme || 'green', this.hardUnlocked);
    }

    showDiffModal(title, bodyHtml, buttons) {
        document.getElementById('diff-modal-title').textContent = title;
        document.getElementById('diff-modal-body').innerHTML = bodyHtml;
        const wrap = document.getElementById('diff-modal-buttons');
        wrap.innerHTML = '';
        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.className = `${b.cls} juicy-btn`;
            btn.textContent = b.label;
            btn.onclick = () => { document.getElementById('diff-modal').classList.remove('show'); b.action(); };
            wrap.appendChild(btn);
        });
        document.getElementById('diff-modal').classList.add('show');
        this.sfx.play('modal');
    }

    selectDifficulty(key) {
        if (this.runState) return;
        this.currentDifficulty = key;
        document.querySelectorAll('.diff-box').forEach(b => b.classList.remove('selected'));
        const box = document.getElementById(`diff-${key}`);
        if (box) box.classList.add('selected');
        this.renderCarousel(); this.refreshMenuButtons(); this.sfx.play('btn');
    }

    onDifficultyClick(key) {
        if (this.runState) {
            this.showDiffModal(this.t('difficultyLockedTitle','Difficulty Locked'), this.t('difficultyLockedBody','Finish or abort the current run before changing difficulty.'), [{label:this.t('ok','OK'),cls:'restart-btn',action:()=>{}}]);
            return;
        }
        if (key === 'soon') { this.showDiffModal(this.t('comingSoon','Coming Soon'), this.t('difficultySoon','This difficulty is not available yet.'), [{label:this.t('ok','OK'),cls:'restart-btn',action:()=>{}}]); return; }
        if (key === 'hard' && !this.hardUnlocked) {
            const canAfford = this.points >= 800 || this.infiniteCoins;
            this.showDiffModal(this.t('unlockHardTitle','Unlock Hard?'),`Hard mode costs <strong>800 pts</strong>. You have <strong>${this.infiniteCoins?'∞':this.points}</strong>.`,[
                canAfford ? {label:this.t('unlock','Unlock'),cls:'confirm-btn',action:()=>this.unlockHard()} : {label:this.t('notEnoughPts','Not enough pts'),cls:'menu-link-btn',action:()=>{}},
                {label:this.t('cancel','Cancel'),cls:'menu-link-btn',action:()=>{}}
            ]); return;
        }
        this.selectDifficulty(key);
    }
    unlockHard() {
        if (!this.infiniteCoins) { this.points -= 800; localStorage.setItem('ms_points', this.points); }
        this.hardUnlocked = true; localStorage.setItem('ms_hard_unlocked', 'true');
        this.renderLevelBar(); this.renderDifficultyGrid(); this.selectDifficulty('hard'); this.sfx.play('purchase');
    }

    /* ══ CAROUSEL ══════════════════════════════════════════════ */
    getBoardConfig(boardIdx) {
        const diff = (this.runState && this.runState.difficulty) || this.currentDifficulty || 'easy';
        return BOARD_CONFIGS[diff][boardIdx] || BOARD_CONFIGS.easy[0];
    }
    renderCarousel(slideDir) {
        const idx       = this.carouselIndex;
        const rs        = this.runState;
        const unlocked  = rs ? rs.unlockedUpTo : 0;
        const diff      = rs ? rs.difficulty : this.currentDifficulty;
        const themeKey  = this._previewTheme || this.activeTheme;
        const theme     = THEMES[themeKey];
        const diffColor = diff ? (theme ? theme.diff[diff] : '#aaa') : '#aaa';

        const makeCard = (boardIdx) => {
            if (boardIdx < 0 || boardIdx >= NUM_BOARDS) return '';
            const cfg = this.getBoardConfig(boardIdx);
            const isU = boardIdx <= unlocked;
            const isC = rs && boardIdx < rs.currentBoard;
            const isRecent = rs && isC && boardIdx === rs.currentBoard - 1;
            const lockedCls = isU ? (isC ? 'is-completed' : '') : 'is-locked';
            const rankLetter = rs && rs.boardRanks && rs.boardRanks[boardIdx];
            const rankColor  = rankLetter ? RANK_COLORS[rankLetter] : '';
            const bandColor = isRecent && rankColor ? rankColor : (isC ? '#4CAF50' : (isU ? diffColor : '#bbb'));
            const borderStyle = isRecent && rankColor ? `border-color:${rankColor};--recent-rank-color:${rankColor};` : '';
            return `<div class="board-card ${lockedCls}${isRecent?' is-most-recent':''}" style="${borderStyle}" data-carousel-board="${boardIdx}">
                <div class="card-band" style="background:${bandColor}">BOARD ${boardIdx+1}</div>
                <div class="card-num num-font" style="color:${isU?diffColor:'#aaa'}">${boardIdx+1}</div>
                <div class="card-dims" style="color:${isU?'':'var(--text-muted)'}">
                    ${isU ? `${cfg.cols}×${cfg.rows} · ${cfg.mines}${MINE_DOT_SVG()}` : 'LOCKED'}
                </div>
                ${rankLetter ? `<div class="card-rank-badge" style="--rank-color:${rankColor}">${rankLetter}</div>` : ''}
            </div>`;
        };

        const wrapper = document.getElementById('carousel-wrapper');
        if (slideDir) {
            wrapper.classList.remove('slide-next','slide-prev');
            void wrapper.offsetWidth;
            wrapper.classList.add(slideDir === 1 ? 'slide-next' : 'slide-prev');
            setTimeout(() => wrapper.classList.remove('slide-next','slide-prev'), 380);
        }

        document.getElementById('slot-left').innerHTML   = makeCard(idx - 1);
        document.getElementById('slot-center').innerHTML = makeCard(idx);
        document.getElementById('slot-right').innerHTML  = makeCard(idx + 1);
        document.getElementById('carousel-counter').textContent = `${idx + 1} / ${NUM_BOARDS}`;

        /* Tapping either side card is an alternate to swiping. A swipe sets
         * a short suppression window so the synthetic post-touch click does
         * not advance the carousel a second time. */
        const bindSideTap = (slotId, direction) => {
            const card = document.querySelector(`#${slotId} .board-card`);
            if (!card) return;
            card.addEventListener('click', (event) => {
                event.stopPropagation();
                if (Date.now() < (this._carouselSuppressTapUntil || 0)) return;
                this.navigateCarousel(direction);
            });
        };
        bindSideTap('slot-left', -1);
        bindSideTap('slot-right', 1);

        /* Mine Market indicators: one per market between two boards.
         * Left ind = market between board (idx-1) and board idx → marketIdx = idx-1
         * Right ind = market between board idx and board (idx+1) → marketIdx = idx
         * A market is "reached" when the player has unlocked the next board through it.
         * The currently-paused market is highlighted. */
        const mmIndL = document.getElementById('mm-car-ind-l');
        const mmIndR = document.getElementById('mm-car-ind-r');
        const hasRun = !!rs;
        const currentMarketIdx = (hasRun && rs.pausedInMarket) ? (rs.currentBoard - 1) : -1;
        const setupInd = (ind, marketIdx) => {
            if (!ind) return;
            ind.classList.remove('reached','highlight','hidden-ind');
            if (marketIdx < 0 || marketIdx > NUM_BOARDS - 2) {
                ind.classList.add('hidden-ind');
                return;
            }
            const reached = hasRun && rs.unlockedUpTo > marketIdx;
            if (reached) ind.classList.add('reached');
            if (marketIdx === currentMarketIdx) ind.classList.add('highlight');
        };
        setupInd(mmIndL, idx - 1);
        setupInd(mmIndR, idx);

        const dots = document.getElementById('carousel-dots');
        dots.innerHTML = Array.from({length: NUM_BOARDS}, (_,i) => {
            const isA = i === idx;
            const isC = rs && i < rs.currentBoard;
            const isU = i <= unlocked;
            const cls = isA ? 'active' : (isC ? 'completed' : (isU ? 'unlocked' : ''));
            return `<div class="carousel-dot ${cls}" data-dot="${i}"></div>`;
        }).join('');
        dots.querySelectorAll('.carousel-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const ni = parseInt(dot.dataset.dot);
                const dir = ni > this.carouselIndex ? 1 : -1;
                this.carouselIndex = ni;
                this.renderCarousel(dir); this.updateBoardCounters(); this.refreshMenuButtons();
            });
        });
        this.updateBoardCounters();
    }

    updateBoardCounters() {
        const cfg = this.getBoardConfig(this.carouselIndex);
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.textContent = val;
            el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
            setTimeout(() => el.classList.remove('pop'), 220);
        };
        setVal('cols-value', cfg.cols); setVal('rows-value', cfg.rows); setVal('mines-value', cfg.mines);
    }

    navigateCarousel(dir) {
        const ni = this.carouselIndex + dir;
        if (ni < 0 || ni >= NUM_BOARDS) return;
        this.carouselIndex = ni;
        this.renderCarousel(dir); this.refreshMenuButtons();
    }

    bindCarouselSwipe() {
        const wrapper = document.getElementById('carousel-wrapper');
        let startX = 0, moved = false;
        wrapper.addEventListener('touchstart',  e => { startX=e.touches[0].clientX; moved=false; }, {passive:true});
        wrapper.addEventListener('touchmove',   e => { if(Math.abs(e.touches[0].clientX-startX)>10) moved=true; }, {passive:true});
        wrapper.addEventListener('touchend',    e => {
            if(!moved) return;
            const dx=e.changedTouches[0].clientX-startX;
            if(dx<-50) { this._carouselSuppressTapUntil = Date.now() + 350; this.navigateCarousel(1); }
            else if(dx>50) { this._carouselSuppressTapUntil = Date.now() + 350; this.navigateCarousel(-1); }
        });
        wrapper.addEventListener('mousedown',   e => { startX=e.clientX; moved=false; });
        wrapper.addEventListener('mousemove',   e => { if(e.buttons&&Math.abs(e.clientX-startX)>10) moved=true; });
        wrapper.addEventListener('mouseup',     e => {
            if(!moved) return;
            const dx=e.clientX-startX;
            if(dx<-50) { this._carouselSuppressTapUntil = Date.now() + 350; this.navigateCarousel(1); }
            else if(dx>50) { this._carouselSuppressTapUntil = Date.now() + 350; this.navigateCarousel(-1); }
        });
    }

    /* ══ MENU BUTTONS ══════════════════════════════════════════ */
    refreshMenuButtons() {
        const rs = this.runState, hasRun = !!rs;
        const diff = this.currentDifficulty;
        const unlocked = rs ? rs.unlockedUpTo : 0;
        const playBtn = document.getElementById('play-btn'), contBtn = document.getElementById('continue-btn'), abortBtn = document.getElementById('abort-btn');
        if (hasRun) {
            playBtn.classList.add('hidden'); contBtn.classList.remove('hidden'); abortBtn.classList.remove('hidden');
        } else {
            contBtn.classList.add('hidden'); abortBtn.classList.add('hidden');
            if (diff && !['cs1','cs2','cs3'].includes(diff)) {
                playBtn.classList.remove('hidden');
                playBtn.classList.toggle('greyed', this.carouselIndex > unlocked);
            } else playBtn.classList.add('hidden');
        }
    }

    /* ══ RUN FLOW ══════════════════════════════════════════════ */
    startRun() {
        if (this.runState) return;
        if (!this.currentDifficulty) return;
        const boardIdx = this.carouselIndex;
        const cfg = this.getBoardConfig(boardIdx);
        this.runState = { active:true, difficulty:this.currentDifficulty, currentBoard:boardIdx, unlockedUpTo:boardIdx, paused:false, boardState:null, boardRanks:[] };
        this._saveRunState();
        this.rows = cfg.rows; this.cols = cfg.cols; this.mines = cfg.mines;
        this.runStyleScore = 0; this.boardStyleScore = 0; this.steelMilestoneScore = 0;
        this._resetRunState();
        this.sfx.play('btn');
        this.transitionToGame(() => {
            this.createFreshBoard(); this.bindGameEvents(); this.setupScrolling(); this.updateBoardIndicator();
        });
    }
    continueRun() {
        if (!this.runState) return;
        /* Migrate snapshots written by the old completion flow.  Those
         * snapshots could contain a final rank for currentBoard while still
         * pointing at that completed board, which made Continue recreate it. */
        const rs = this.runState;
        const savedBoardWasCompleted = !rs.boardState
            && Array.isArray(rs.boardRanks)
            && RANK_LABELS.includes(rs.boardRanks[rs.currentBoard]);
        if (savedBoardWasCompleted && rs.currentBoard < NUM_BOARDS - 1) {
            rs.completedBoard = rs.currentBoard;
            rs.currentBoard++;
            rs.unlockedUpTo = Math.max(rs.unlockedUpTo || 0, rs.currentBoard);
            rs.paused = true;
            rs.pausedInMarket = false;
            this.carouselIndex = rs.currentBoard;
            this._saveRunState();
        }
        /* If we paused by going to the menu from Mine Market, reopen Mine Market */
        if (this.runState.pausedInMarket) {
            this.sfx.play('btn');
            /* Keep pausedInMarket set until showMineMarket() reads it.
             * Clearing it here made the market look like a fresh entry and
             * generated a new shop inventory every time the player returned
             * from the menu. */
            this.showMineMarket();
            return;
        }
        /* A completed board advances currentBoard before its popup is shown.
         * If the player reaches the menu before entering the market, resume
         * the pending market instead of recreating the previous board. */
        if (this.runState.completedBoard === this.runState.currentBoard - 1
            && !this.runState.boardState) {
            this.sfx.play('btn');
            this.showMineMarket();
            return;
        }
        rs.paused = false; this._saveRunState();
        this.currentDifficulty = rs.difficulty;
        this.carouselIndex = rs.currentBoard;
        const cfg = this.getBoardConfig(rs.currentBoard);
        this.rows = cfg.rows; this.cols = cfg.cols; this.mines = cfg.mines;
        this.sfx.play('btn');
        this.transitionToGame(() => {
            if (rs.boardState) {
                const s = rs.boardState;
                this.rows = s.rows; this.cols = s.cols; this.mines = s.mines;
                this.board = s.board; this.revealed = s.revealed; this.flagged = s.flagged;
                this.timer = s.timer; this.mode = s.mode; this.firstClick = s.firstClick;
                this.boardStyleScore = s.boardStyleScore || 0;
                this.runStyleScore   = s.runStyleScore || 0;
                this.gameOver = false;
                const gb = document.getElementById('game-board');
                gb.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
                gb.style.transform = 'scale(1)';
                this.zoomLevel = 1; this.scrollX = 0; this.scrollY = 0;
                document.getElementById('zoom-level').textContent = '100%';
                this.updateCellFontSize(); this.updateBoardPosition();
                this.renderBoard(); this.renderSavedState(); this.updateDisplay();
                this.bindGameEvents(); this.setupScrolling();
                if (!this.firstClick) { if (this.timerInterval) clearInterval(this.timerInterval); this.startTimer(); }
                this._autoFitBoard();
            } else {
                this.createFreshBoard(); this.bindGameEvents(); this.setupScrolling();
            }
            this.updateBoardIndicator();
            this._updateRunPtsHud();
            this.renderMineHud();
        });
    }
    abortRun() {
        /* Show confirm modal instead of directly aborting */
        const modal = document.getElementById('abort-confirm-modal');
        if (modal) { modal.classList.add('show'); this.sfx.play('modal'); return; }
        this._doAbortRun();
    }
    _doAbortRun() {
        if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
        /* Aborting grants the same payout as losing: flag bonus → PTS plus
         * RPTS earned this run flushed to PTS.                              */
        let correctFlags = 0;
        if (this.board && this.flagged && this.rows && this.cols) {
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    if (this.board[i] && this.board[i][j] === -1
                        && this.flagged[i] && this.flagged[i][j]) correctFlags++;
                }
            }
        }
        this.styleMeter.hide(); this.styleMeter.reset();
        this._flushRunPointsToMain();
        if (correctFlags > 0) this.awardPoints(correctFlags);
        this._clearRunState(); this.runState = null; this.carouselIndex = 0;
        this._resetRunState();
        this.renderDifficultyGrid(); this.renderCarousel(); this.refreshMenuButtons();
        this.sfx.play('btn');
        document.getElementById('game-screen').classList.add('hidden');
        this.showMenu();
    }
    pauseRun() {
        if (!this.runState) return;
        const state = {
            rows:this.rows, cols:this.cols, mines:this.mines,
            board:this.board, revealed:this.revealed, flagged:this.flagged,
            timer:this.timer, mode:this.mode, firstClick:this.firstClick,
            boardStyleScore:this.boardStyleScore, runStyleScore:this.runStyleScore
        };
        this.runState.paused = true; this.runState.boardState = state; this._saveRunState();
    }

    boardComplete() {
        if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
        this.gameOver = true;
        const rs = this.runState;
        const boardNum = rs ? rs.currentBoard + 1 : 1;
        const isLast = rs && rs.currentBoard === NUM_BOARDS - 1;

        const finalRank  = this.styleMeter ? this.styleMeter.getFinalRank() : 'D';
        const boardScore = this.styleMeter ? this.styleMeter.getScore() : 0;
        this._setBoardStyleScore(boardScore);
        this.runStyleScore  += boardScore;
        if (rs && !rs.boardRanks) rs.boardRanks = [];
        if (rs)  rs.boardRanks[rs.currentBoard] = finalRank;

        this.feats.bestBoardStyleScore = Math.max(this.feats.bestBoardStyleScore || 0, boardScore);
        this.feats.bestRunStyleScore   = Math.max(this.feats.bestRunStyleScore   || 0, this.runStyleScore);

        /* Economy: 1 Rpt per 2 Spts — add silently; HUD bumps after animation */
        const rptsEarned = Math.floor(boardScore / 2);
        this.runPoints += rptsEarned;
        this.saveCurrentToSlot(this.currentSlot);

        let correctFlags = 0;
        for (let i=0; i<this.rows; i++) for (let j=0; j<this.cols; j++)
            if (this.board[i][j]===-1 && this.flagged[i][j]) correctFlags++;
        /* Mid-run flag bonus → RPTS; final board flush → PTS via _flushRunPointsToMain */
        let earned = 0;
        if (isLast) {
            earned = this.awardPoints(correctFlags);
        } else {
            const flagBonus = correctFlags * 10;
            if (flagBonus > 0) this.addRunPoints(flagBonus);
            earned = flagBonus;
        }

        this.feats.boardsCleared++;
        this.feats.currentConsecutive++;
        this.feats.bestConsecutive = Math.max(this.feats.bestConsecutive, this.feats.currentConsecutive);
        this._saveFeats(); this.checkFeats();
        this.sfx.play('complete');
        document.body.classList.add('board-complete-pulse');
        setTimeout(() => document.body.classList.remove('board-complete-pulse'), 700);

        this.styleMeter.hide();

        const el = document.getElementById('board-finished-modal');
        const overallRank = this.getOverallRunRank(finalRank);
        const rankLetterEl = document.getElementById('bf-rank-badge-letter');
        if (rankLetterEl) { rankLetterEl.textContent = overallRank; rankLetterEl.style.color = RANK_COLORS[overallRank]; }
        document.getElementById('bf-time').textContent = this._formatTime(this.timer);
        document.getElementById('bf-board-stat').textContent = `${boardNum}/${NUM_BOARDS}`;
        document.getElementById('bf-flags-stat').textContent = `${correctFlags}`;

        if (isLast) {
            this.carouselIndex = 0;
            this._clearRunState(); this.runState = null;
            this.sfx.play('boardwin');
            document.getElementById('bf-title').textContent = this.t('runComplete','Run Complete!');
            document.getElementById('bf-continue-btn').textContent = this.t('backToMenu','Back to Menu');
            this._flushRunPointsToMain();
        } else {
            if (rs) {
                /* Preserve the completed-board transition separately from
                 * currentBoard so a menu detour still knows the next step is
                 * the Mine Market, not a replay of the old board. */
                rs.completedBoard = rs.currentBoard;
                rs.currentBoard++;
                rs.unlockedUpTo = Math.max(rs.unlockedUpTo, rs.currentBoard);
                rs.boardState = null;
                rs.paused = true;
                rs.pausedInMarket = false;
                this.carouselIndex = rs.currentBoard;
                this._saveRunState();
            }
            document.getElementById('bf-title').textContent = `${this.t('board','Board')} ${boardNum} ${this.t('completeWord','Complete')}!`;
            document.getElementById('bf-continue-btn').textContent = 'Continue';
        }
        el.classList.add('show');
        /* Animate Spts → Rpts conversion */
        this._animateSptConversion(
            document.getElementById('bf-spts-val'),
            document.getElementById('bf-rpts-val'),
            document.getElementById('bf-convert-arrow'),
            boardScore, rptsEarned,
            () => { this._updateRunPtsHud(); }
        );
    }

    getOverallRunRank(fallbackRank = 'D') {
        const ranks = this.runState && Array.isArray(this.runState.boardRanks)
            ? this.runState.boardRanks.filter(rank => RANK_LABELS.includes(rank))
            : [];
        if (!ranks.length) return fallbackRank;
        const avg = ranks.reduce((sum, rank) => sum + RANK_LABELS.indexOf(rank), 0) / ranks.length;
        return RANK_LABELS[Math.max(0, Math.min(RANK_LABELS.length - 1, Math.round(avg)))];
    }

    _formatTime(s) {
        if (!s) return '0s';
        if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`;
        return `${s}s`;
    }

    /* Animate Spts → Rpts conversion in the board-finished modal.
     * Phase 1: count spts up from 0.
     * Phase 2: arrow pulses.
     * Phase 3: count rpts up from 0 then bump HUD via onDone().        */
    _animateSptConversion(sptEl, rptEl, arrowEl, spts, rpts, onDone) {
        if (sptEl) { sptEl.textContent = '0'; sptEl.classList.remove('done'); }
        if (rptEl) { rptEl.textContent = '+0'; rptEl.classList.remove('done'); }
        if (arrowEl) arrowEl.classList.remove('pulse');

        const animCounter = (el, to, dur, fmt, cb) => {
            const start = performance.now();
            const step = (now) => {
                const t = Math.min(1, (now - start) / dur);
                const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
                if (el) el.textContent = fmt(Math.round(to * ease));
                if (t < 1) requestAnimationFrame(step);
                else if (cb) cb();
            };
            requestAnimationFrame(step);
        };

        setTimeout(() => {
            /* Phase 1: spts */
            animCounter(sptEl, spts, 550, v => `${v}`, () => {
                if (sptEl) sptEl.classList.add('done');
                if (arrowEl) arrowEl.classList.add('pulse');
                /* Phase 2: brief arrow flash, then rpts */
                setTimeout(() => {
                    if (arrowEl) arrowEl.classList.remove('pulse');
                    animCounter(rptEl, rpts, 450, v => `+${v}`, () => {
                        if (rptEl) rptEl.classList.add('done');
                        if (onDone) onDone();
                    });
                }, 220);
            });
        }, 300); /* wait for modal pop-in */
    }

    startNextBoard() {
        document.getElementById('board-finished-modal').classList.remove('show');
        if (!this.runState) { this.showMenu(); return; }
        /* Show MineMarket between boards */
        this.showMineMarket();
    }

    updateBoardIndicator() {
        const el = document.getElementById('board-indicator');
        if (!el) return;
        const n = this.runState ? this.runState.currentBoard + 1 : 1;
        el.textContent = `${n}/8`;
    }

    /* ══ MINE MARKET ═══════════════════════════════════════════ */
    showMineMarket() {
        /* If we were paused in this market, restore prior shop state instead of resetting. */
        const resumingMarket = this.runState && this.runState.pausedInMarket;
        if (this.runState) {
            /* Keep this marker set for the whole time the market is visible.
             * A reload while shopping must reopen the market rather than
             * interpreting the run as ready for the next board. */
            this.runState.pausedInMarket = true;
            /* Entering the market consumes the pending board-completion
             * transition.  Continue clears pausedInMarket in closeMineMarket. */
            this.runState.completedBoard = null;
            this._saveRunState();
        }

        if (!resumingMarket) {
            /* Reset per-market state on fresh entry */
            this.slotUsed = false;
            this.scratchBought = false;
            this.slotBought = false;
            this.marketShopRerollCount = 0;
            this.marketFirstRerollFree = this._hasPassiveMine('prospector_mine');
            /* Fresh collection shop with reroll cost reset */
            this.marketShopRerollCost = 50;
            this._rerollMarketShop();
            this._grantMipenMeimerGift();
        }
        if (!this.marketShop) { this.marketShopRerollCost = 50; this._rerollMarketShop(); }

        /* Remove any unavailable mines (e.g. a used Totem or a Totem already
         * in the loadout) from existing shop slots.  This also repairs a
         * market that was generated before the player bought the Totem. */
        if (this.marketShop) {
            for (let i = 0; i < this.marketShop.length; i++) {
                if (this._isMineUnavailableForShop(this.marketShop[i])) {
                    this.marketShop[i] = this._pickRandomMine();
                    this.marketShopSold[i] = false;
                    if (this.marketShopDiscounts) this.marketShopDiscounts[i] = false;
                }
            }
        }

        /* Replenish all mine charges */
        this.playerMines.forEach(m => { m.charges = m.maxCharges; });
        this.renderMineHud();

        /* Update UI */
        const el = document.getElementById('mine-market-screen');
        const boardBadge = document.getElementById('mm-board-badge');
        if (boardBadge && this.runState) {
            boardBadge.textContent = `Board ${this.runState.currentBoard} of ${NUM_BOARDS} cleared`;
        }
        const rptEl = document.getElementById('mm-run-pts');
        if (rptEl) rptEl.textContent = this.runPoints;

        /* Reset scratch card */
        const scratchFront = document.getElementById('scratch-front');
        const scratchResult = document.getElementById('scratch-result');
        if (scratchFront) { scratchFront.classList.remove('hidden'); scratchFront.style.transform = ''; }
        if (scratchResult) { scratchResult.classList.add('hidden'); scratchResult.textContent = ''; scratchResult.className = 'scratch-result hidden'; }

        /* Reset buy buttons */
        const scratchBuyBtn = document.getElementById('scratch-buy-btn');
        const scratchActBtn = document.getElementById('scratch-btn');
        if (scratchBuyBtn) { scratchBuyBtn.textContent = `BUY · ${SCRATCH_COST} Rpts.`; scratchBuyBtn.classList.remove('spent'); }
        if (scratchActBtn) { scratchActBtn.textContent = 'SCRATCH'; scratchActBtn.classList.remove('used'); scratchActBtn.classList.add('mm-act-disabled'); }

        const slotBuyBtn = document.getElementById('slot-buy-btn');
        const slotActBtn = document.getElementById('slot-btn');
        if (slotBuyBtn) { slotBuyBtn.textContent = `BUY · ${SLOT_MACHINE_COST} Rpts.`; slotBuyBtn.classList.remove('spent'); }
        if (slotActBtn) { slotActBtn.textContent = 'SPIN'; slotActBtn.classList.remove('used'); slotActBtn.classList.add('mm-act-disabled'); }

        /* Render slot machine mini display */
        this._renderSlotMini();

        /* Render collection shop */
        this.renderMarketShop();

        /* Transition to market */
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('menu-screen').classList.add('hidden');
        el.classList.remove('hidden');
        this.saveCurrentToSlot(this.currentSlot);
    }

    doScratchBuy() {
        if (this.scratchBought) return;
        if (this.runPoints < SCRATCH_COST && !this.infiniteCoins) { this.sfx.play('error'); return; }
        this.spendRunPoints(SCRATCH_COST);
        this.scratchBought = true;
        const buyBtn = document.getElementById('scratch-buy-btn');
        const actBtn = document.getElementById('scratch-btn');
        if (buyBtn) { buyBtn.textContent = 'BOUGHT'; buyBtn.classList.add('spent'); }
        if (actBtn) actBtn.classList.remove('mm-act-disabled');
        const rptEl = document.getElementById('mm-run-pts');
        if (rptEl) rptEl.textContent = this.runPoints;
        this.sfx.play('purchase');
    }

    doSlotBuy() {
        if (this.slotBought || this.slotUsed) return;
        if (this.runPoints < SLOT_MACHINE_COST && !this.infiniteCoins) { this.sfx.play('error'); return; }
        this.spendRunPoints(SLOT_MACHINE_COST);
        this.slotBought = true;
        const buyBtn = document.getElementById('slot-buy-btn');
        const actBtn = document.getElementById('slot-btn');
        if (buyBtn) { buyBtn.textContent = 'BOUGHT'; buyBtn.classList.add('spent'); }
        if (actBtn) actBtn.classList.remove('mm-act-disabled');
        const rptEl = document.getElementById('mm-run-pts');
        if (rptEl) rptEl.textContent = this.runPoints;
        this.sfx.play('purchase');
    }

    closeMineMarket() {
        document.getElementById('mine-market-screen').classList.add('hidden');
        if (!this.runState) { this.showMenu(); return; }
        /* Proceed to next board */
        this.runState.paused = false;
        this.runState.pausedInMarket = false;
        this.currentDifficulty = this.runState.difficulty;
        this._saveRunState();
        const cfg = this.getBoardConfig(this.runState.currentBoard);
        this.rows = cfg.rows; this.cols = cfg.cols; this.mines = cfg.mines;
        this.boardStyleScore = 0;
        this.trenchMines = [];
        this.fractalMines = [];
        this.dormantMines = [];
        this.tsarArmed = false;
        this.diffusalCountdown = null;
        this.boardRingInset = 0;
        this.voidedCells = new Set();
        /* Reset per-board placement counts */
        this.playerMines.forEach(m => { m.boardPlacedCount = 0; });
        document.getElementById('game-screen').classList.remove('hidden');
        this.createFreshBoard(); this.bindGameEvents(); this.setupScrolling(); this.updateBoardIndicator();
    }

    _renderSlotMini() {
        const mineIds = ALL_MINE_IDS;
        ['smr-0','smr-1','smr-2'].forEach((id, i) => {
            const el = document.getElementById(id);
            if (!el) return;
            const def = MINE_DEFS[mineIds[i % mineIds.length]];
            el.innerHTML = def ? def.icon() : '?';
        });
    }

    /* ── Scratch Card ──
     * Buyable and playable any number of times per market visit — each
     * play consumes the "bought" state so another BUY is required before
     * scratching again, but there's no longer a one-time-per-visit lock. */
    doScratch() {
        if (!this.scratchBought) return;
        this.scratchBought = false;
        const actBtn = document.getElementById('scratch-btn');
        if (actBtn) { actBtn.textContent = 'SCRATCH'; actBtn.classList.add('mm-act-disabled'); }

        const win = Math.random() < 0.5;
        const scratchFront = document.getElementById('scratch-front');
        const scratchResult = document.getElementById('scratch-result');

        if (scratchFront) {
            scratchFront.style.transform = 'scale(0) rotate(20deg)';
            scratchFront.style.transition = 'transform .3s cubic-bezier(.3,.7,.3,1.5)';
        }
        this.sfx.play('scratch_reveal');
        setTimeout(() => {
            if (scratchFront) scratchFront.classList.add('hidden');
            if (scratchResult) {
                scratchResult.classList.remove('hidden');
                if (win) {
                    const prize = SCRATCH_COST * 2;
                    scratchResult.classList.add('win');
                    scratchResult.textContent = `+${prize}`;
                    this.addRunPoints(prize);
                    this.sfx.play('purchase');
                    this.feats.scratchLossStreak = 0;
                    this._saveFeats();
                } else {
                    scratchResult.classList.add('lose');
                    scratchResult.innerHTML = CROSS_BIG_SVG();
                    this.sfx.play('error');
                    this.feats.scratchLossStreak = (this.feats.scratchLossStreak || 0) + 1;
                    if ((this.feats.scratchLossStreak || 0) > (this.feats.bestScratchLossStreak || 0)) {
                        this.feats.bestScratchLossStreak = this.feats.scratchLossStreak;
                    }
                    this._saveFeats();
                    this.checkFeats();
                }
            }
            const rptEl = document.getElementById('mm-run-pts');
            if (rptEl) rptEl.textContent = this.runPoints;

            /* Animate the result away and bring the card face back before
             * making the next ticket available. */
            setTimeout(() => {
                if (scratchResult) scratchResult.classList.add('scratch-result-exit');
                if (scratchFront) {
                    scratchFront.classList.remove('hidden');
                    scratchFront.classList.add('scratch-front-returning');
                    scratchFront.style.transition = 'none';
                    scratchFront.style.transform = '';
                }
                setTimeout(() => {
                    if (scratchFront) {
                        scratchFront.classList.remove('scratch-front-returning');
                        scratchFront.style.transition = '';
                        scratchFront.style.transform = '';
                    }
                    if (scratchResult) {
                        scratchResult.classList.add('hidden');
                        scratchResult.textContent = '';
                        scratchResult.className = 'scratch-result hidden';
                    }
                    const buyBtn = document.getElementById('scratch-buy-btn');
                    if (buyBtn) { buyBtn.textContent = `BUY · ${SCRATCH_COST} Rpts.`; buyBtn.classList.remove('spent'); }
                }, 280);
            }, 1400);
        }, 320);
    }

    /* ── Slot Machine ── */
    openSlotMachine() {
        if (!this.slotBought || this.slotUsed) return;
        const popup = document.getElementById('slot-popup');
        if (!popup) return;
        /* Initialize reels */
        this._initSlotReels();
        popup.querySelector('.slot-popup-content')?.classList.remove('slot-popup-expanded');
        /* Reset controls */
        const spinBtn = document.getElementById('slot-spin-btn');
        const stopBtn = document.getElementById('slot-stop-btn');
        if (spinBtn) { spinBtn.classList.remove('hidden'); spinBtn.disabled = false; }
        if (stopBtn) {
            stopBtn.classList.add('hidden');
            stopBtn.classList.remove('slot-stop-disappearing');
        }
        /* Reset stopped-reel options */
        for (let i = 0; i < 3; i++) {
            const indicator = document.getElementById(`slot-stop-ind-${i}`);
            if (indicator) { indicator.innerHTML = ''; indicator.classList.add('hidden'); }
            const option = document.getElementById(`slot-reel-option-${i}`);
            if (option) { option.innerHTML = ''; option.classList.add('hidden'); }
        }
        popup.classList.add('show');
        this.sfx.play('modal');
        this._setupSlotSpinStop();
    }

    _initSlotReels() {
        const ITEM_HEIGHT = 80;
        const slotMineIds = this._getShopMinePool({ includeLegendary: true });
        this._slotMineIds = slotMineIds.length ? slotMineIds : ALL_MINE_IDS.slice();
        const MAX_MINES = this._slotMineIds.length;
        /* Build strips with all mine icons repeated */
        for (let i = 0; i < 3; i++) {
            const strip = document.getElementById(`slot-strip-${i}`);
            if (!strip) continue;
            strip.innerHTML = '';
            strip.style.transition = '';
            /* Repeat mines list 6 times for scroll effect */
            for (let rep = 0; rep < 6; rep++) {
                this._slotMineIds.forEach(id => {
                    const def = MINE_DEFS[id];
                    const item = document.createElement('div');
                    item.className = 'slot-reel-item';
                    /* Names are intentionally hidden while the reel spins. */
                    item.innerHTML = def.icon();
                    strip.appendChild(item);
                });
            }
            /* Stagger starting positions so reels show different mines */
            const startOffset = Math.floor(MAX_MINES / 3) * i * ITEM_HEIGHT;
            this._slotOffset = this._slotOffset || [0, 0, 0];
            this._slotOffset[i] = startOffset;
            strip.style.transform = `translateY(-${startOffset}px)`;
        }
        this._slotSpinning = false;
        this._slotStopped = [false, false, false];
        this._slotPickedIds = [];
        if (this._slotInterval) { clearInterval(this._slotInterval); this._slotInterval = null; }
    }

    _setupSlotSpinStop() {
        const spinBtn = document.getElementById('slot-spin-btn');
        const stopBtn = document.getElementById('slot-stop-btn');
        if (!spinBtn || !stopBtn) return;

        const ITEM_HEIGHT = 80;
        const slotMineIds = this._slotMineIds || ALL_MINE_IDS;
        const MAX_MINES = slotMineIds.length;
        let stoppedCount = 0;

        /* Replace buttons to remove stale listeners */
        const newSpin = spinBtn.cloneNode(true);
        spinBtn.parentNode.replaceChild(newSpin, spinBtn);
        const newStop = stopBtn.cloneNode(true);
        stopBtn.parentNode.replaceChild(newStop, stopBtn);

        const startSpin = () => {
            newSpin.classList.add('hidden');
            newStop.classList.remove('hidden', 'slot-stop-disappearing');
            this._slotSpinning = true;
            this._slotStopped = [false, false, false];
            this._slotPickedIds = [];
            stoppedCount = 0;
            for (let i = 0; i < 3; i++) {
                const indicator = document.getElementById(`slot-stop-ind-${i}`);
                if (indicator) { indicator.innerHTML = ''; indicator.classList.add('hidden'); }
                const option = document.getElementById(`slot-reel-option-${i}`);
                if (option) { option.innerHTML = ''; option.classList.add('hidden'); }
            }
            let tick = 0;
            this._slotInterval = setInterval(() => {
                tick++;
                for (let i = 0; i < 3; i++) {
                    if (this._slotStopped[i]) continue;
                    const speed = 28 + i * 6; // 28, 34, 40 — each reel slightly different
                    this._slotOffset[i] = (this._slotOffset[i] + speed) % (ITEM_HEIGHT * MAX_MINES);
                    const strip = document.getElementById(`slot-strip-${i}`);
                    if (strip) strip.style.transform = `translateY(-${this._slotOffset[i]}px)`;
                }
                if (tick % 2 === 0) this.sfx.play('slot_spin');
            }, 28); // fast: ~35fps
        };

        const stopOne = () => {
            if (stoppedCount >= 3) return;
            const i = stoppedCount;
            this._slotStopped[i] = true;
            /* Snap to a rarity-weighted mine — legendaries are only ever
             * obtainable through the Slot Machine, so keep them a rare,
             * lucky pull here too rather than as common as everything else. */
            const pickedIds = this._slotPickedIds || [];
            const availableSlotMines = this._getShopMinePool({ includeLegendary: true })
                .filter(id => !pickedIds.includes(id));
            if (!availableSlotMines.length) return;
            const pickedId = this._pickRarityWeightedId(availableSlotMines);
            this._slotPickedIds.push(pickedId);
            const def = MINE_DEFS[pickedId];
            const idx = slotMineIds.indexOf(pickedId);
            const targetOffset = idx * ITEM_HEIGHT;
            this._slotOffset[i] = targetOffset;
            const strip = document.getElementById(`slot-strip-${i}`);
            if (strip) {
                strip.style.transition = 'transform .28s cubic-bezier(.2,.8,.2,1)';
                strip.style.transform = `translateY(-${targetOffset}px)`;
                setTimeout(() => { if (strip) strip.style.transition = ''; }, 340);
            }
            if (stoppedCount === 0) {
                document.querySelector('#slot-popup .slot-popup-content')?.classList.add('slot-popup-expanded');
            }
            this._showSlotReelStop(i, pickedId);
            this._showSlotReelOption(i, pickedId);
            this.sfx.play('slot_stop');
            stoppedCount++;
            if (stoppedCount === 3) {
                clearInterval(this._slotInterval); this._slotInterval = null;
                this._slotSpinning = false;
                newStop.classList.add('slot-stop-disappearing');
                setTimeout(() => {
                    newStop.classList.add('hidden');
                    newStop.classList.remove('slot-stop-disappearing');
                }, 280);
                 /* The stopped reels are now the result picker; no duplicate
                  * three-card result row is needed. */
            }
        };

        newSpin.addEventListener('click', startSpin);
        newStop.addEventListener('click', stopOne);
    }

    _showSlotReelOption(reelIndex, mineId) {
        const optionEl = document.getElementById(`slot-reel-option-${reelIndex}`);
        const def = MINE_DEFS[mineId];
        if (!optionEl || !def) return;
        /* The same popup can be opened more than once. Replace the option
         * node so its delegated card action cannot accumulate listeners. */
        const option = optionEl.cloneNode(false);
        optionEl.replaceWith(option);
        const isFull = this.playerMines.length >= 6;
        option.innerHTML = `
            <div class="slot-reel-option-actions">
                <button type="button" class="slot-reel-view-btn">VIEW</button>
                <button type="button" class="slot-reel-take-btn juicy-btn"${isFull ? ' disabled' : ''}>TAKE</button>
            </div>
        `;
        option.classList.remove('hidden');
        option.querySelector('.slot-reel-view-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showMineInfo(mineId);
        });
        option.querySelector('.slot-reel-take-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this._takeSlotMachineMine(mineId);
        });
        option.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            this._takeSlotMachineMine(mineId);
        });
    }

    _showSlotReelStop(reelIndex, mineId) {
        const indicator = document.getElementById(`slot-stop-ind-${reelIndex}`);
        const def = MINE_DEFS[mineId];
        if (!indicator || !def) return;
        indicator.innerHTML = `<span class="slot-reel-stopped-name">${def.name}</span>`;
        indicator.classList.remove('hidden');
    }

    _takeSlotMachineMine(mineId) {
        if (this.slotUsed || this.playerMines.length >= 6) return;
        if (!this.addMineToLoadout(mineId, 0)) return;
        this.slotUsed = true;
        const slotActBtn = document.getElementById('slot-btn');
        if (slotActBtn) {
            slotActBtn.textContent = 'USED';
            slotActBtn.classList.add('used', 'mm-act-disabled');
        }
        document.getElementById('slot-popup')?.classList.remove('show');
        const rptEl = document.getElementById('mm-run-pts');
        if (rptEl) rptEl.textContent = this.runPoints;
        this.sfx.play('purchase');
    }

    /* ── Collection Shop (random rarity-weighted mines) ── */
    _mineRarityWeight(id) {
        const def = MINE_DEFS[id];
        if (!def) return 1;
        /* Driven by the explicit `rarity` field on each MINE_DEFS entry. */
        switch (def.rarity) {
            case 'common':    return 5;
            case 'uncommon':  return 2;
            case 'rare':      return 0.7;
            case 'legendary': return 0.25;
            default:          return 1;
        }
    }
    _isMineUnavailableForShop(mineId) {
        if (!mineId) return false;
        if ((this.bannedMineIds || []).includes(mineId)) return true;
        /* Totem is unique for a run while it is owned.  A sold Totem is
         * intentionally eligible again; a triggered Totem remains banned. */
        return mineId === 'totem_mine' && this._hasPassiveMine('totem_mine');
    }
    _getShopMinePool({ includeLegendary = false } = {}) {
        return ALL_MINE_IDS.filter(id => {
            const def = MINE_DEFS[id];
            if (!def) return false;
            if (!includeLegendary && !this.infiniteCoins && def.rarity === 'legendary') return false;
            return !this._isMineUnavailableForShop(id);
        });
    }
    _pickRarityWeightedId(ids) {
        const weights = ids.map(id => this._mineRarityWeight(id));
        const total = weights.reduce((s,w) => s+w, 0);
        let r = Math.random() * total;
        for (let i = 0; i < ids.length; i++) {
            r -= weights[i];
            if (r <= 0) return ids[i];
        }
        return ids[0];
    }
    _pickRandomMine() {
        /* Legendary mines normally never appear in the normal shop
         * inventory — they're only obtainable via the Slot Machine —
         * unless the player has redeemed the infinite-coins cheat code,
         * in which case legendaries are also allowed to show up here.   */
        const ids = this._getShopMinePool();
        return this._pickRarityWeightedId(ids);
    }
    _rerollMarketShop() {
        const count = this._hasPassiveMine('dealer_mine') ? 3 : 2;
        this.marketShop = Array.from({ length: count }, () => this._pickRandomMine());
        this.marketShopSold = Array(count).fill(false);
        this.marketShopDiscounts = Array(count).fill(false);
        if (this._hasPassiveMine('fortune_mine') && Math.random() < 0.5) {
            this.marketShopDiscounts[Math.floor(Math.random() * count)] = true;
        }
    }
    _syncMarketShopSlotCount() {
        const count = this._hasPassiveMine('dealer_mine') ? 3 : 2;
        if (!Array.isArray(this.marketShop)) {
            this._rerollMarketShop();
            return count;
        }

        /* Preserve the current market when Dealer Mine is bought or sold
         * during a visit, only adding/removing the dealer-specific slot. */
        this.marketShop = this.marketShop.slice(0, count);
        this.marketShopSold = Array.isArray(this.marketShopSold)
            ? this.marketShopSold.slice(0, count) : [];
        this.marketShopDiscounts = Array.isArray(this.marketShopDiscounts)
            ? this.marketShopDiscounts.slice(0, count) : [];
        while (this.marketShop.length < count) this.marketShop.push(this._pickRandomMine());
        while (this.marketShopSold.length < count) this.marketShopSold.push(false);
        while (this.marketShopDiscounts.length < count) this.marketShopDiscounts.push(false);
        return count;
    }
    renderMarketShop() {
        const slotCount = this._syncMarketShopSlotCount();
        for (let i = 0; i < 3; i++) {
            const slot = document.getElementById(`mm-shop-slot-${i}`);
            if (!slot) continue;
            if (i >= slotCount) {
                slot.className = 'mm-shop-slot empty hidden';
                slot.innerHTML = '';
                continue;
            }
            const mineId = this.marketShop && this.marketShop[i];
            if (!mineId) { slot.className = 'mm-shop-slot empty'; slot.innerHTML = '<span class="mm-shop-slot-name" style="opacity:.5">—</span>'; continue; }
            const def = MINE_DEFS[mineId];
            const sold = this.marketShopSold && this.marketShopSold[i];
            const discounted = this.marketShopDiscounts && this.marketShopDiscounts[i];
            const price = discounted ? Math.floor(def.cost * 0.5) : def.cost;
            const canAfford = this.infiniteCoins || this.runPoints >= price;
            const isFull = this.playerMines.length >= 6;
            slot.className = `mm-shop-slot${sold ? ' sold' : ''}`;
            slot.innerHTML = `
                <div class="mm-shop-slot-icon" data-rarity="${def.rarity}" style="background:${def.color}22;border:2px solid ${def.color}55">${def.icon()}</div>
                <div class="mm-shop-slot-name">${def.name}</div>
                <div class="mm-shop-slot-cost">${price}${discounted ? ` <s>${def.cost}</s>` : ''} Rpts.</div>
                <button class="mm-shop-slot-buy juicy-btn ${(!canAfford || isFull || sold) ? 'disabled' : ''}" data-shop-idx="${i}">${sold ? 'SOLD' : 'BUY'}</button>
            `;
            const btn = slot.querySelector('.mm-shop-slot-buy');
            if (btn && !sold) {
                btn.addEventListener('click', (e) => { e.stopPropagation(); this._buyMarketShopMine(i); });
            }
            /* Tap card → show mine info */
            slot.addEventListener('click', () => { this.showMineInfo(mineId); });
        }
        /* Update reroll button cost & affordability */
        const rcEl = document.getElementById('mm-shop-reroll-cost');
        const nextRerollCost = this.marketFirstRerollFree && this.marketShopRerollCount === 0
            ? 0 : this.marketShopRerollCost;
        if (rcEl) rcEl.textContent = nextRerollCost;
        const rbtn = document.getElementById('mm-shop-reroll-btn');
        if (rbtn) {
            const canReroll = this.infiniteCoins || this.runPoints >= nextRerollCost;
            rbtn.classList.toggle('disabled', !canReroll);
        }
    }
    _buyMarketShopMine(slotIdx) {
        const mineId = this.marketShop && this.marketShop[slotIdx];
        if (!mineId || this.marketShopSold[slotIdx]) { this.sfx.play('error'); return; }
        const def = MINE_DEFS[mineId];
        if (this.playerMines.length >= 6) { this.sfx.play('error'); return; }
        const discounted = this.marketShopDiscounts && this.marketShopDiscounts[slotIdx];
        const price = discounted ? Math.floor(def.cost * 0.5) : def.cost;
        if (!this.infiniteCoins && this.runPoints < price) { this.sfx.play('error'); return; }
        if (this.mineBuyingPopup) {
            this._showMineBuyConfirm(slotIdx);
            return;
        }
        this._completeMarketShopMine(slotIdx);
    }
    _completeMarketShopMine(slotIdx) {
        const mineId = this.marketShop && this.marketShop[slotIdx];
        if (!mineId || this.marketShopSold[slotIdx]) return;
        const def = MINE_DEFS[mineId];
        if (!def || this.playerMines.length >= 6) return;
        const discounted = this.marketShopDiscounts && this.marketShopDiscounts[slotIdx];
        const price = discounted ? Math.floor(def.cost * 0.5) : def.cost;
        if (!this.spendRunPoints(price)) { this.sfx.play('error'); return; }
        this.addMineToLoadout(mineId);
        this.marketShopSold[slotIdx] = true;
        if (this._hasPassiveMine('bargain_mine') && Math.random() < 0.5) {
            this.addRunPoints(Math.floor(price * 0.5));
            this._spawnStyleTriggerText('Bargain refund!', '#00897B');
        }
        const rptEl = document.getElementById('mm-run-pts');
        if (rptEl) rptEl.textContent = this.runPoints;
        this.sfx.play('purchase');
        this.renderMarketShop();
    }
    _showMineBuyConfirm(slotIdx) {
        const mineId = this.marketShop && this.marketShop[slotIdx];
        if (!mineId || this.marketShopSold[slotIdx]) return;
        const def = MINE_DEFS[mineId];
        if (!def || this.playerMines.length >= 6) return;
        const discounted = this.marketShopDiscounts && this.marketShopDiscounts[slotIdx];
        const price = discounted ? Math.floor(def.cost * 0.5) : def.cost;
        if (!this.infiniteCoins && this.runPoints < price) { this.sfx.play('error'); return; }

        const modal = document.getElementById('mine-buy-confirm-modal');
        if (!modal) return;
        const icon = document.getElementById('mine-buy-icon');
        const name = document.getElementById('mine-buy-name');
        const rarity = document.getElementById('mine-buy-rarity');
        const current = document.getElementById('mine-buy-current-points');
        const cost = document.getElementById('mine-buy-cost');
        const after = document.getElementById('mine-buy-after-points');
        if (icon) {
            icon.innerHTML = def.icon();
            icon.style.background = `${def.color}22`;
            icon.style.borderColor = `${def.color}66`;
        }
        if (name) name.textContent = def.name;
        if (rarity) {
            rarity.textContent = def.rarity;
            rarity.className = `mine-info-rarity rarity-${def.rarity}`;
        }
        if (current) current.textContent = this.infiniteCoins ? '∞' : this.runPoints;
        if (cost) cost.textContent = this.infiniteCoins ? 'FREE' : price;
        if (after) after.textContent = this.infiniteCoins ? '∞' : this.runPoints - price;

        const closeBuy = () => {
            modal.classList.remove('show');
            this.sfx.play('btn');
        };
        document.getElementById('mine-buy-cancel-btn').onclick = closeBuy;
        document.getElementById('mine-buy-cancel-action-btn').onclick = closeBuy;
        document.getElementById('mine-buy-confirm-btn').onclick = () => {
            modal.classList.remove('show');
            this._completeMarketShopMine(slotIdx);
        };
        modal.classList.add('show');
        this.sfx.play('modal');
    }
    _doMarketShopReroll() {
        const free = this.marketFirstRerollFree && this.marketShopRerollCount === 0;
        const cost = free ? 0 : this.marketShopRerollCost;
        if (!this.infiniteCoins && this.runPoints < cost) { this.sfx.play('error'); return; }
        if (!this.infiniteCoins) this.spendRunPoints(cost);
        this.marketShopRerollCount++;
        if (!free) this.marketShopRerollCost = cost + 25;
        this._rerollMarketShop();
        const rptEl = document.getElementById('mm-run-pts');
        if (rptEl) rptEl.textContent = this.runPoints;
        this.sfx.play('btn');
        this.renderMarketShop();
    }

    _hasPassiveMine(mineId) {
        return this.playerMines.some(m => m && m.id === mineId);
    }

    _grantMipenMeimerGift() {
        if (!this._hasPassiveMine('mipen_meimer') || this.playerMines.length >= 6) return;
        const eligible = ALL_MINE_IDS.filter(id => {
            const rarity = MINE_DEFS[id].rarity;
            return id !== 'mipen_meimer'
                && (rarity === 'common' || rarity === 'uncommon')
                && !this._isMineUnavailableForShop(id);
        });
        if (!eligible.length) return;
        const giftId = this._pickRarityWeightedId(eligible);
        if (this.addMineToLoadout(giftId)) {
            this._spawnStyleTriggerText(`${MINE_DEFS[giftId].name} free!`, '#D84315');
            this.sfx.play('purchase');
        }
    }

    /* ══ MINE LOADOUT ══════════════════════════════════════════ */
    addMineToLoadout(mineId) {
        if (this.playerMines.length >= 6) return false;
        const def = MINE_DEFS[mineId];
        if (!def) return false;
        /* Keep Totem unique and respect permanent run bans for consumed
         * passive mines, regardless of which shop granted the mine. */
        if (this._isMineUnavailableForShop(mineId)) return false;
        this.playerMines.push({
            id: mineId, charges: def.maxCharges, maxCharges: def.maxCharges,
            boardPlacedCount: 0
        });
        if (mineId === 'tsar_mimba') this._unlockSecret('tsar_mimba_bought');
        this.renderMineHud();
        this.saveCurrentToSlot(this.currentSlot);
        return true;
    }

    sellMine(slotIndex) {
        const mine = this.playerMines[slotIndex];
        if (!mine) return;
        const def = MINE_DEFS[mine.id];
        const refund = Math.floor(def.cost * SELL_REFUND_RATIO);
        this.playerMines.splice(slotIndex, 1);
        if (mine.id === 'totem_mine') {
            /* Selling is the one path that makes an untriggered Totem
             * eligible again during the same run. */
            this.bannedMineIds = (this.bannedMineIds || []).filter(id => id !== 'totem_mine');
        }
        this.addRunPoints(refund);
        this.renderMineHud();
        /* A full loadout disables the current shop's BUY buttons.  Selling
         * immediately creates space, so refresh the existing shop in place
         * without generating a new inventory. */
        if (document.getElementById('mine-market-screen')) this.renderMarketShop();
        this.saveCurrentToSlot(this.currentSlot);
        this.sfx.play('btn');
    }

    renderMineHud() {
        const allSlotEls = document.querySelectorAll('.mine-hud .mine-hud-slots');
        if (!allSlotEls.length) return;
        const renderId = ++this._mineHudRenderId;
        allSlotEls.forEach(slotsEl => {
            slotsEl.innerHTML = '';
            for (let i = 0; i < 6; i++) {
                const mine = this.playerMines[i];
                const slot = document.createElement('div');
                if (mine) {
                    const def = MINE_DEFS[mine.id];
                    const depleted = mine.charges <= 0;
                    const boardUsed = mine.boardPlacedCount >= (this._getMineMaxPerBoard(mine.id));
                    slot.className = `mine-slot${depleted ? ' depleted' : ''}${boardUsed && !depleted ? ' active-board-used' : ''}`;
                    slot.dataset.slotIndex = i;
                    const counterHtml = def.passive ? '' : `<span class="mine-slot-counter">${mine.charges}/${mine.maxCharges}</span>`;
                    /* Names removed — long mine names overlapped in the
                     * compact HUD. Icons only; tap a slot for an info
                     * popup showing the name/description instead.        */
                    slot.title = def.name;
                    slot.innerHTML = `<div class="mine-slot-icon-wrap" style="background:${def.color}22;border:2px solid ${def.color}55">${def.icon()}${counterHtml}<svg class="mine-sell-progress" viewBox="0 0 44 44" aria-hidden="true"><circle class="mine-sell-progress-circle" cx="22" cy="22" r="19" pathLength="1" stroke="var(--accent)"/></svg></div><div class="mine-sell-card sell-card-hidden"><button type="button" class="mine-sell-btn">SELL</button></div>`;
                    /* Tap = info, hold = reveal Sell, drag = place or swap. */
                    this._bindMineTaps(slot, i);
                    this._bindMineDrag(slot, i);
                } else {
                    slot.className = 'mine-slot empty-slot';
                    slot.innerHTML = `<div class="mine-slot-icon-wrap"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>`;
                }
                slotsEl.appendChild(slot);
            }
        });
        this._updateMineHudVisibility();
    }

    _updateMineHudVisibility() {
        const hasRun = !!this.runState;
        const hasMines = (this.playerMines || []).some(m => !!m);
        const showAny = hasRun || hasMines;
        const huds = {
            'mine-hud-menu':   showAny,
            'mine-hud-game':   showAny,
            'mine-hud-market': showAny,
            'mine-hud-bf':     showAny,
        };
        Object.entries(huds).forEach(([id, show]) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (show) {
                el.classList.remove('hud-out', 'hud-empty');
            } else {
                el.classList.add('hud-out');
            }
        });
    }

    _getMineMaxPerBoard(mineId) {
        const limits = {
            mine_mine: 2, trench_mine: 2, grenade_mine: 2,
            totem_mine: 1, fractal_mine: 1,
            kickstart_mine: 1, diffusal_mine: 1, pipe_mine: 1,
            nuke_mimb: 1, tsar_mimba: 1,
        };
        return limits[mineId] || 1;
    }

    _bindMineTaps(slot, slotIndex) {
        const HOLD_MS = 540;
        const TAP_MOVE_THRESH = 8;
        let holdTimer = null;
        let downX = 0, downY = 0, didMove = false, holdTriggered = false;
        const sellCard = slot.querySelector('.mine-sell-card');
        const sellBtn = sellCard?.querySelector('.mine-sell-btn');
        const clearHoldTimer = () => {
            if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
        };
        const hideOtherSellCards = () => {
            document.querySelectorAll('.mine-slot.mine-slot-held').forEach(other => {
                if (other !== slot) {
                    other.classList.remove('mine-slot-held');
                    other.querySelector('.mine-sell-card')?.classList.remove('sell-card-visible');
                }
            });
            document.querySelectorAll('.mine-slot.sell-preparing').forEach(other => other.classList.remove('sell-preparing'));
        };
        /* Click-through fix: capture the pointer to this exact slot element
         * on press, and stop the event from bubbling to whatever menu/board
         * UI happens to sit behind the HUD. Without pointer capture, a
         * re-render mid-gesture (e.g. renderMineHud() after a sell) can let
         * the eventual pointerup land on a freshly-created element — or,
         * since .mine-hud overlays menu/board chrome, an un-captured tap can
         * leak through to a button underneath. See modal-click-through-guard
         * and hold-to-confirm memory notes for the same pattern elsewhere. */
        slot.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.mine-sell-card')) return;
            downX = e.clientX; downY = e.clientY; didMove = false;
            holdTriggered = false;
            hideOtherSellCards();
            slot.classList.add('sell-preparing');
            if (slot.setPointerCapture) { try { slot.setPointerCapture(e.pointerId); } catch (_) {} }
            e.stopPropagation();
            clearHoldTimer();
            holdTimer = setTimeout(() => {
                if (!didMove && slot.isConnected && this.playerMines[slotIndex]) {
                    holdTriggered = true;
                    slot.classList.remove('sell-preparing');
                    slot.classList.add('mine-slot-held');
                    sellCard?.classList.remove('sell-card-hidden');
                    sellCard?.classList.add('sell-card-visible');
                    this.sfx.play('btn');
                }
            }, HOLD_MS);
        });
        slot.addEventListener('pointermove', (e) => {
            if (Math.abs(e.clientX - downX) > TAP_MOVE_THRESH || Math.abs(e.clientY - downY) > TAP_MOVE_THRESH) {
                didMove = true;
                clearHoldTimer();
                slot.classList.remove('sell-preparing');
            }
        });
        const finishPointer = (e) => {
            clearHoldTimer();
            slot.classList.remove('sell-preparing');
            e.stopPropagation();
            if (slot.releasePointerCapture) { try { slot.releasePointerCapture(e.pointerId); } catch (_) {} }
            if (didMove || holdTriggered) {
                return;
            }
            const mine = this.playerMines[slotIndex];
            if (!mine) return;
            this.showMineInfo(mine.id);
        };
        slot.addEventListener('pointerup', finishPointer);
        slot.addEventListener('pointercancel', finishPointer);
        sellBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this._showSellConfirm(slotIndex);
        });
        slot.addEventListener('click', (e) => { e.stopPropagation(); });
    }

    _showSellConfirm(slotIndex) {
        const mine = this.playerMines[slotIndex]; if (!mine) return;
        const def = MINE_DEFS[mine.id];
        const refund = Math.floor(def.cost * SELL_REFUND_RATIO);
        const modal = document.getElementById('sell-confirm-modal');
        const icon = document.getElementById('sell-mine-icon');
        const name = document.getElementById('sell-mine-name');
        const rarity = document.getElementById('sell-mine-rarity');
        const current = document.getElementById('sell-current-points');
        const refundEl = document.getElementById('sell-refund-points');
        const after = document.getElementById('sell-after-points');
        if (!modal) return;

        if (icon) {
            icon.innerHTML = def.icon();
            icon.style.background = `${def.color}22`;
            icon.style.borderColor = `${def.color}66`;
        }
        if (name) name.textContent = def.name;
        if (rarity) {
            rarity.textContent = def.rarity;
            rarity.className = `mine-info-rarity rarity-${def.rarity}`;
        }
        if (current) current.textContent = this.runPoints;
        if (refundEl) refundEl.textContent = `+${refund}`;
        if (after) after.textContent = this.runPoints + refund;

        const closeSell = () => {
            modal.classList.remove('show');
            this.sfx.play('btn');
        };
        document.getElementById('sell-cancel-btn').onclick = closeSell;
        document.getElementById('sell-cancel-action-btn').onclick = closeSell;
        document.getElementById('sell-confirm-btn').onclick = () => {
            modal.classList.remove('show');
            this.sellMine(slotIndex);
        };
        modal.classList.add('show');
        this.sfx.play('modal');
    }

    _bindMineDrag(slot, slotIndex) {
        const ghost = document.getElementById('mine-drag-ghost');
        if (!ghost) return;
        let isDragging = false, startX = 0, startY = 0;
        const DRAG_THRESH = 10;

        const startDrag = (x, y) => {
            const mine = this.playerMines[slotIndex];
            if (!mine) return;
            const def = MINE_DEFS[mine.id];
            if (!def.passive && mine.charges <= 0) return;
            isDragging = true; startX = x; startY = y;
            ghost.innerHTML = def.icon();
            ghost.style.background = def.color + '33';
            ghost.style.border = `2px solid ${def.color}`;
            ghost.style.left = x + 'px'; ghost.style.top = y + 'px';
            ghost.classList.remove('hidden');
        };
        const moveDrag = (x, y) => {
            if (!isDragging) return;
            ghost.style.left = x + 'px'; ghost.style.top = y + 'px';
            /* Highlight board cell below */
            ghost.style.display = 'none';
            const el = document.elementFromPoint(x, y);
            ghost.style.display = '';
            document.querySelectorAll('.cell.mine-drop-target').forEach(c => c.classList.remove('mine-drop-target'));
            const cell = el && el.closest ? el.closest('.cell') : null;
            if (cell) cell.classList.add('mine-drop-target');
        };
        const endDrag = (x, y) => {
            if (!isDragging) return;
            isDragging = false;
            ghost.classList.add('hidden');
            document.querySelectorAll('.cell.mine-drop-target').forEach(c => c.classList.remove('mine-drop-target'));
            ghost.style.display = 'none';
            const el = document.elementFromPoint(x, y);
            ghost.style.display = '';
            if (el) {
                const cell = el.closest ? el.closest('.cell') : null;
                if (cell) {
                    const r = parseInt(cell.dataset.row), c = parseInt(cell.dataset.col);
                    const mine = this.playerMines[slotIndex];
                    const def = mine && MINE_DEFS[mine.id];
                    if (def?.passive) {
                        this.sfx.play('error');
                    } else if (!isNaN(r) && !isNaN(c)) {
                        this.placeMineOnBoard(slotIndex, r, c);
                    }
                } else {
                    /* Check if dropped on another mine slot (reorder) */
                    const targetSlot = el.closest('.mine-slot');
                    if (targetSlot && targetSlot !== slot) {
                        const targetIdx = parseInt(targetSlot.dataset.slotIndex);
                        if (!isNaN(targetIdx)) this._reorderMine(slotIndex, targetIdx);
                    }
                }
            }
        };

        slot.addEventListener('pointerdown', e => {
            if (e.target.closest('.mine-sell-card')) return;
            /* Click-through fix: keep this gesture bound to the slot that
             * was actually pressed, and don't let it bubble to menu/board
             * chrome sitting behind the HUD (see _bindMineTaps above for
             * the full rationale — same pattern applied to drag-start). */
            e.stopPropagation();
            /* Don't start drag immediately, wait for movement */
            const ox = e.clientX, oy = e.clientY;
            const pid = e.pointerId;
            const onMove = (ev) => {
                if (Math.abs(ev.clientX - ox) > DRAG_THRESH || Math.abs(ev.clientY - oy) > DRAG_THRESH) {
                    document.removeEventListener('pointermove', onMove, true);
                    document.removeEventListener('pointerup', onUp, true);
                    /* _bindMineTaps sets pointer-capture on the slot so that
                     * all pointer events are directed there (preventing
                     * click-through).  Once a drag begins we must release
                     * that capture so the eventual pointerup fires on the
                     * actual element under the cursor (the board cell) and
                     * reaches the document-level dragEnd listener rather
                     * than being swallowed by the slot's stopPropagation. */
                    try { slot.releasePointerCapture(pid); } catch(_) {}
                    startDrag(ev.clientX, ev.clientY);
                    document.addEventListener('pointermove', dragMove, true);
                    document.addEventListener('pointerup', dragEnd, true);
                }
            };
            const onUp = () => {
                document.removeEventListener('pointermove', onMove, true);
                document.removeEventListener('pointerup', onUp, true);
            };
            document.addEventListener('pointermove', onMove, true);
            document.addEventListener('pointerup', onUp, true);
        });
        const dragMove = (e) => moveDrag(e.clientX, e.clientY);
        const dragEnd = (e) => {
            endDrag(e.clientX, e.clientY);
            document.removeEventListener('pointermove', dragMove, true);
            document.removeEventListener('pointerup', dragEnd, true);
        };
    }

    _stylePlacedMineOverlay(overlay, cell, mineId) {
        const def = MINE_DEFS[mineId];
        if (!overlay || !cell || !def) return;
        const r = parseInt(cell.dataset.row), c = parseInt(cell.dataset.col);
        const onNumber = this.revealed[r] && this.revealed[r][c] && this.board[r][c] > 0;
        overlay.classList.toggle('on-number', !!onNumber);
        if (onNumber) {
            overlay.style.color = def.color;
            overlay.style.background = 'var(--card)';
            overlay.style.borderRadius = '';
        } else {
            overlay.style.color = '';
            overlay.style.background = def.color + '33';
            overlay.style.borderRadius = '9px';
        }
    }

    _schedulePlacedMineEffect(overlay, mineId, r, c, slotIndex, delay = 300) {
        if (!overlay) return;
        if (overlay._mineEffectTimer) clearTimeout(overlay._mineEffectTimer);
        overlay._mineEffectPending = true;
        overlay._mineEffectDueAt = Date.now() + delay;
        overlay._mineEffectTimer = setTimeout(() => {
            overlay._mineEffectTimer = null;
            overlay._mineEffectPending = false;
            this._executeMineEffect(mineId, r, c, slotIndex);
            if (['mine_mine', 'grenade_mine', 'pipe_mine', 'nuke_mimb'].includes(mineId)) {
                if (!overlay.parentNode) return;
                overlay.classList.add('fading');
                setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 500);
            }
        }, Math.max(0, delay));
    }

    _bindPlacedMineDrag(overlay, slotIndex, r, c) {
        const ghost = document.getElementById('mine-drag-ghost');
        const mine = this.playerMines[slotIndex];
        if (!overlay || !ghost || !mine) return;
        overlay._mineRef = mine;
        let holdTimer = null;
        let isDragging = false;
        let didMove = false;
        let startX = 0, startY = 0;
        let currentR = r, currentC = c;
        const HOLD_MS = 400;
        const MOVE_THR = 10;

        const clearHold = () => {
            if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
        };
        const setGhost = (x, y) => {
            const def = MINE_DEFS[mine.id];
            ghost.innerHTML = def.icon();
            ghost.style.background = def.color + '33';
            ghost.style.border = `2px solid ${def.color}`;
            ghost.style.left = x + 'px';
            ghost.style.top = y + 'px';
            ghost.classList.remove('hidden');
        };
        const moveGhost = (x, y) => {
            if (!isDragging) return;
            ghost.style.left = x + 'px';
            ghost.style.top = y + 'px';
            ghost.style.display = 'none';
            const el = document.elementFromPoint(x, y);
            ghost.style.display = '';
            document.querySelectorAll('.cell.mine-drop-target').forEach(cell => cell.classList.remove('mine-drop-target'));
            const cell = el && el.closest ? el.closest('.cell') : null;
            if (cell) cell.classList.add('mine-drop-target');
        };
        const finishDrag = (x, y) => {
            if (!isDragging) return;
            isDragging = false;
            ghost.classList.add('hidden');
            document.querySelectorAll('.cell.mine-drop-target').forEach(cell => cell.classList.remove('mine-drop-target'));
            ghost.style.display = 'none';
            const el = document.elementFromPoint(x, y);
            ghost.style.display = '';
            const cell = el && el.closest ? el.closest('.cell') : null;
            if (cell) {
                const targetR = parseInt(cell.dataset.row), targetC = parseInt(cell.dataset.col);
                if (!isNaN(targetR) && !isNaN(targetC) && this.movePlacedMineOnBoard(overlay, targetR, targetC)) {
                    currentR = targetR;
                    currentC = targetC;
                }
            }
            overlay.classList.remove('mine-moving');
        };
        const cancel = () => {
            clearHold();
            if (isDragging) {
                isDragging = false;
                ghost.classList.add('hidden');
                ghost.style.display = 'none';
                document.querySelectorAll('.cell.mine-drop-target').forEach(cell => cell.classList.remove('mine-drop-target'));
                overlay.classList.remove('mine-moving');
            }
        };

        overlay.addEventListener('pointerdown', e => {
            if (e.button !== undefined && e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            didMove = false;
            startX = e.clientX; startY = e.clientY;
            if (overlay.setPointerCapture) {
                try { overlay.setPointerCapture(e.pointerId); } catch (_) {}
            }
            clearHold();
            holdTimer = setTimeout(() => {
                if (didMove || overlay._mineEffectPending === false) return;
                isDragging = true;
                overlay.classList.add('mine-moving');
                setGhost(e.clientX, e.clientY);
            }, HOLD_MS);
        });
        overlay.addEventListener('pointermove', e => {
            e.preventDefault();
            e.stopPropagation();
            if (Math.abs(e.clientX - startX) > MOVE_THR || Math.abs(e.clientY - startY) > MOVE_THR) {
                didMove = true;
                if (!isDragging) clearHold();
            }
            moveGhost(e.clientX, e.clientY);
        });
        overlay.addEventListener('pointerup', e => {
            e.preventDefault();
            e.stopPropagation();
            clearHold();
            if (isDragging) finishDrag(e.clientX, e.clientY);
            else if (!didMove && overlay.parentNode) this.handleCellTap(currentR, currentC);
            if (overlay.releasePointerCapture) {
                try { overlay.releasePointerCapture(e.pointerId); } catch (_) {}
            }
        });
        overlay.addEventListener('pointercancel', e => {
            e.stopPropagation();
            cancel();
        });
        overlay.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
        });
    }

    movePlacedMineOnBoard(overlay, targetR, targetC) {
        if (!overlay || !this.getCell(targetR, targetC)) return false;
        const sourceCell = overlay.closest('.cell');
        const targetCell = this.getCell(targetR, targetC);
        if (!sourceCell || sourceCell === targetCell) return false;
        if (this.flagged[targetR] && this.flagged[targetR][targetC]) {
            this.sfx.play('error');
            return false;
        }
        const otherMine = targetCell.querySelector('.mine-cell-placed');
        if (otherMine && otherMine !== overlay) {
            this.sfx.play('error');
            return false;
        }

        const oldR = parseInt(sourceCell.dataset.row), oldC = parseInt(sourceCell.dataset.col);
        const mineId = overlay.dataset.mineId;
        const mine = overlay._mineRef;
        const slotIndex = Math.max(0, this.playerMines.indexOf(mine));

        if (overlay._mineEffectTimer) {
            const remaining = Math.max(0, (overlay._mineEffectDueAt || Date.now()) - Date.now());
            clearTimeout(overlay._mineEffectTimer);
            overlay._mineEffectTimer = null;
            if (overlay._mineEffectPending) {
                this._schedulePlacedMineEffect(overlay, mineId, targetR, targetC, slotIndex, remaining);
            }
        }

        const dormant = this.dormantMines.find(item => item.r === oldR && item.c === oldC && item.id === mineId);
        if (dormant) {
            dormant.r = targetR;
            dormant.c = targetC;
        }
        if (mineId === 'trench_mine') {
            const placed = this.trenchMines.find(item => item.r === oldR && item.c === oldC);
            if (placed) { placed.r = targetR; placed.c = targetC; }
        } else if (mineId === 'fractal_mine') {
            const placed = this.fractalMines.find(item => item.r === oldR && item.c === oldC);
            if (placed) { placed.r = targetR; placed.c = targetC; }
            sourceCell.style.boxShadow = '';
            targetCell.style.boxShadow = '0 0 0 4px #9C27B0, 0 0 14px #9C27B099';
            this._updateFractalIndicators();
        } else if (mineId === 'totem_mine' || mineId === 'diffusal_mine') {
            sourceCell.style.boxShadow = '';
            const color = mineId === 'totem_mine' ? '#FFC107' : '#00BCD4';
            targetCell.style.boxShadow = `0 0 0 4px ${color}, 0 0 12px ${color}66`;
        }

        targetCell.appendChild(overlay);
        overlay.dataset.row = targetR;
        overlay.dataset.col = targetC;
        this._stylePlacedMineOverlay(overlay, targetCell, mineId);
        overlay.classList.remove('fading');
        this.sfx.play('mine_place');
        this.saveCurrentToSlot(this.currentSlot);
        this.saveCurrentBoardToRun();
        return true;
    }

    _reorderMine(fromIdx, toIdx) {
        if (fromIdx === toIdx) return;
        /* True swap (not a shift): dragging slot A onto slot B trades their
         * positions directly, leaving every other slot untouched.         */
        const parents = document.querySelectorAll('.mine-hud .mine-hud-slots');
        const oldRects = [];
        parents.forEach(p => {
            const a = p.children[fromIdx], b = p.children[toIdx];
            if (a && b) oldRects.push({ parent: p, aRect: a.getBoundingClientRect(), bRect: b.getBoundingClientRect() });
        });

        const mines = [...this.playerMines];
        [mines[fromIdx], mines[toIdx]] = [mines[toIdx], mines[fromIdx]];
        this.playerMines = mines;
        this.renderMineHud();
        this.saveCurrentToSlot(this.currentSlot);
        this.sfx.play('btn');

        /* FLIP-style swap animation: slide each slot from its previous
         * screen position into its new one so the swap reads as a smooth
         * exchange instead of an instant jump.                            */
        requestAnimationFrame(() => {
            oldRects.forEach(({ parent, aRect, bRect }) => {
                const newA = parent.children[fromIdx], newB = parent.children[toIdx];
                if (!newA || !newB) return;
                [[newA, aRect], [newB, bRect]].forEach(([el, oldRect]) => {
                    const newRect = el.getBoundingClientRect();
                    const dx = oldRect.left - newRect.left, dy = oldRect.top - newRect.top;
                    if (!dx && !dy) return;
                    el.style.transition = 'none';
                    el.style.transform = `translate(${dx}px, ${dy}px)`;
                    requestAnimationFrame(() => {
                        el.style.transition = 'transform .28s cubic-bezier(.3,.7,.3,1.5)';
                        el.style.transform = '';
                    });
                });
            });
        });
    }

    placeMineOnBoard(slotIndex, r, c) {
        const mine = this.playerMines[slotIndex]; if (!mine) return;
        const def = MINE_DEFS[mine.id];
        if (mine.charges <= 0) { this.sfx.play('error'); return; }
        const maxPerBoard = this._getMineMaxPerBoard(mine.id);
        if (mine.boardPlacedCount >= maxPerBoard) { this.sfx.play('error'); return; }
        /* Mines may be placed on any tile (unopened, opened, number, empty).
         * Per-mine effects still respect their own rules below. */
        if (this.flagged[r] && this.flagged[r][c]) { this.sfx.play('error'); return; }

        /* Throttle: cap mine placement to one per second. Quietly chirps and
         * pulses the offending HUD slot if the player tries to spam.        */
        const now = Date.now();
        if (now - this._lastPlaceAt < 1000) {
            this.sfx.play('error');
            this._flashPlaceCooldown(slotIndex);
            return;
        }

        /* Additional requirements */
        if (mine.id === 'trench_mine') {
            /* Must be on zero tile adjacent to number tiles */
            if (this.firstClick || !this.board[r] || this.board[r][c] !== 0) { this.sfx.play('error'); return; }
            const adj = this._getAdj(r, c);
            const hasAdjacentNumbers = adj.some(([ar, ac]) => this.board[ar][ac] > 0);
            if (!hasAdjacentNumbers) { this.sfx.play('error'); return; }
        }
        if (mine.id === 'grenade_mine') {
            /* Grenade ends the run only when placed on an UNREVEALED non-mine tile.
             * On a revealed tile (number/empty), it has no effect (whiff). */
            if (this.revealed[r] && this.revealed[r][c] && this.board[r][c] !== -1) {
                /* Allow placement but it whiffs — handled in _executeMineEffect */
            }
        }
        if (mine.id === 'pipe_mine' || mine.id === 'nuke_mimb') {
            /* Both must be placed on an unopened tile. Placing on an
             * already-revealed tile is an incorrect placement and ends
             * the run immediately.                                       */
            if (this.revealed[r] && this.revealed[r][c]) {
                mine.charges--;
                mine.boardPlacedCount++;
                this._lastPlaceAt = now;
                this.renderMineHud();
                const badCell = this.getCell(r, c);
                const rect = badCell ? badCell.getBoundingClientRect() : null;
                const cx = rect ? rect.left + rect.width/2 : window.innerWidth/2;
                const cy = rect ? rect.top + rect.height/2 : window.innerHeight/2;
                this.spawnExplosion(cx, cy, def.color, 18);
                document.body.classList.add('runover-pulse');
                setTimeout(() => document.body.classList.remove('runover-pulse'), 500);
                this._spawnStyleTriggerText('Bad placement!', def.color);
                this.sfx.play('mine');
                this.saveCurrentToSlot(this.currentSlot);
                setTimeout(() => { this.gameOver = true; this.endGame(); }, 550);
                return;
            }
        }

        /* Grenade/Pipe are rank-gated but placeable immediately: if the
         * required Style rank hasn't been reached yet, the mine sits
         * dormant on the board and auto-activates on a later rank-up. */
        const REQUIRED_RANK_IDX = { grenade_mine: 1, pipe_mine: 2 };
        const reqIdx = REQUIRED_RANK_IDX[mine.id];
        const isDormant = reqIdx !== undefined && this.styleMeter.rankIdx < reqIdx;

        /* Deduct charges and increment board count */
        mine.charges--;
        mine.boardPlacedCount++;
        this._lastPlaceAt = now;
        this.renderMineHud();

        /* Play place sound */
        this.sfx.play('mine_place');

        /* Show a persistent mine icon on the cell. mine_mine/grenade_mine fade after their effect. */
        const cell = this.getCell(r, c);
        let overlay = null;
        if (cell) {
            /* Remove any prior placed-overlay on this tile */
            const prior = cell.querySelector('.mine-cell-placed');
            if (prior) prior.remove();
            overlay = document.createElement('div');
            overlay.className = 'mine-cell-placed';
            overlay.dataset.mineId = mine.id;
            overlay.innerHTML = def.icon();
            /* If placed on a revealed numbered tile, render as small corner
             * badge so the underlying number remains visible.              */
            const onNumber = this.revealed[r] && this.revealed[r][c] && this.board[r][c] > 0;
            if (onNumber) {
                overlay.classList.add('on-number');
                overlay.style.color = def.color;
            } else {
                overlay.style.background = def.color + '33';
                overlay.style.borderRadius = '9px';
            }
            if (isDormant) overlay.classList.add('mine-dormant');
            overlay.dataset.row = r;
            overlay.dataset.col = c;
            overlay._mineRef = mine;
            cell.appendChild(overlay);
            this._bindPlacedMineDrag(overlay, slotIndex, r, c);
        }

        if (isDormant) {
            this.dormantMines.push({ r, c, id: mine.id, slotIndex, requiredRankIdx: reqIdx });
            this._spawnStyleTriggerText(`${def.name} armed (dormant)`, def.color);
            this.saveCurrentToSlot(this.currentSlot);
            return;
        }

        /* Execute mine effect after the short placement animation. The
         * scheduled work is attached to the overlay so a long-press move can
         * cancel it and reschedule the effect at the new position. */
        this._schedulePlacedMineEffect(overlay, mine.id, r, c, slotIndex);
        this.saveCurrentToSlot(this.currentSlot);
    }

    /* ── Dormant mines (Grenade/Pipe) — activate once required rank hit ── */
    _checkDormantMines() {
        if (!this.dormantMines.length) return;
        const rankIdx = this.styleMeter.rankIdx;
        const ready = this.dormantMines.filter(m => rankIdx >= m.requiredRankIdx);
        if (!ready.length) return;
        this.dormantMines = this.dormantMines.filter(m => rankIdx < m.requiredRankIdx);
        ready.forEach((m, i) => {
            setTimeout(() => {
                const cell = this.getCell(m.r, m.c);
                const overlay = cell && cell.querySelector('.mine-cell-placed');
                if (overlay) {
                    overlay._mineEffectPending = false;
                    overlay.classList.remove('mine-dormant');
                }
                this._executeMineEffect(m.id, m.r, m.c, m.slotIndex);
                if (cell && (m.id === 'grenade_mine')) {
                    if (overlay) {
                        overlay.classList.add('fading');
                        setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 500);
                    }
                }
            }, i * 260);
        });
    }

    _executeMineEffect(mineId, r, c, slotIndex) {
        const cell = this.getCell(r, c);
        const cellRect = cell ? cell.getBoundingClientRect() : null;
        const cx = cellRect ? cellRect.left + cellRect.width/2 : 0;
        const cy = cellRect ? cellRect.top + cellRect.height/2 : 0;

        switch(mineId) {
            case 'mine_mine': {
                const adj = this._getAdj(r, c);
                const adjMines = adj.filter(([ar, ac]) => this.board[ar] && this.board[ar][ac] === -1 && !this.flagged[ar][ac]);
                if (adjMines.length > 0) {
                    adjMines.forEach(([ar, ac], i) => {
                        setTimeout(() => {
                            this.flagged[ar][ac] = true;
                            const ac2 = this.getCell(ar, ac);
                            if (ac2) { ac2.classList.add('flagged'); ac2.innerHTML = ''; ac2.insertAdjacentHTML('beforeend', FLAG_SVG()); this.playCellFx(ac2, 'flag-pop'); }
                        }, i * 80);
                    });
                    this.sfx.play('mine_mine_fx');
                    this.spawnExplosion(cx, cy, '#f44336', 12);
                    this._spawnStyleTriggerText(`+${adjMines.length} flag${adjMines.length!==1?'s':''}!`, '#f44336');
                    this.updateDisplay();
                } else {
                    /* Disappearing animation */
                    if (cell) {
                        cell.style.transition = 'transform .4s cubic-bezier(.3,.7,.3,1.5), opacity .4s';
                        cell.style.transform = 'scale(0) rotate(180deg)';
                        cell.style.opacity = '0';
                        setTimeout(() => {
                            cell.style.transform = ''; cell.style.opacity = ''; cell.style.transition = '';
                        }, 500);
                    }
                    this.sfx.play('btn');
                }
                break;
            }
            case 'trench_mine': {
                /* Register trench mine position */
                this.trenchMines.push({r, c});
                /* Flash effect */
                if (cell) { cell.style.boxShadow = `0 0 0 4px #795548`; setTimeout(() => { cell.style.boxShadow = ''; }, 600); }
                this.sfx.play('mine_place');
                this._spawnStyleTriggerText('Trench armed', '#a87555');
                break;
            }
            case 'grenade_mine': {
                const isMine = this.board[r] && this.board[r][c] === -1;
                const wasRevealed = this.revealed[r] && this.revealed[r][c];
                this.spawnExplosion(cx, cy, '#4CAF50', 20);
                /* Grenade shockwave on cell */
                if (cell) {
                    const sw = document.createElement('div');
                    sw.className = 'grenade-shockwave';
                    cell.appendChild(sw);
                    setTimeout(() => sw.remove(), 600);
                }
                document.body.classList.add('runover-pulse');
                setTimeout(() => document.body.classList.remove('runover-pulse'), 500);
                this.sfx.play('grenade_fx');
                this._spawnStyleTriggerText(isMine ? 'Boom!' : 'Whiff!', isMine ? '#4CAF50' : '#999');
                if (isMine) {
                    /* Grenade detonated a real mine: chain any nearby fractals. */
                    this._triggerFractalChain(r, c);
                    /* Open area around placement (nerfed from 3 → 2). Keep
                     * a fallback so a successful grenade never produces a
                     * completely empty reveal when its local area is already
                     * clear. */
                    const RADIUS = 2;
                    const revealTargets = [];
                    for (let di = -RADIUS; di <= RADIUS; di++) {
                        for (let dj = -RADIUS; dj <= RADIUS; dj++) {
                            const nr = r + di, nc = c + dj;
                            if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;
                            if (this.board[nr][nc] !== -1 && !this.revealed[nr][nc] && !this.flagged[nr][nc]) {
                                revealTargets.push({ r: nr, c: nc, delay: (Math.abs(di) + Math.abs(dj)) * 40 });
                            }
                        }
                    }
                    if (!revealTargets.length) {
                        for (let nr = 0; nr < this.rows; nr++) {
                            for (let nc = 0; nc < this.cols; nc++) {
                                if (this.board[nr][nc] !== -1 && !this.revealed[nr][nc] && !this.flagged[nr][nc]) {
                                    revealTargets.push({ r: nr, c: nc, delay: 0 });
                                }
                            }
                        }
                    }
                    revealTargets.forEach(({ r: targetR, c: targetC, delay }) => {
                        setTimeout(() => { this.reveal(targetR, targetC); }, delay);
                    });
                } else if (!wasRevealed) {
                    /* End the run only if placed on a hidden non-mine tile */
                    setTimeout(() => { this.gameOver = true; this.endGame(); }, 600);
                }
                /* If wasRevealed and not a mine: whiffs (just visual) */
                break;
            }
            case 'totem_mine': {
                /* Totem is now active as a passive protection */
                /* Visual indicator on cell */
                if (cell) {
                    cell.style.boxShadow = `0 0 0 4px #FFC107, 0 0 12px #FFC10766`;
                    /* Keep glow until triggered or board cleared */
                }
                this.sfx.play('mine_place');
                break;
            }
            case 'fractal_mine': {
                /* Register fractal mine: it sits dormant and reacts when any
                 * mine inside its 3×3 radius is triggered.                  */
                this.fractalMines.push({r, c});
                if (cell) {
                    cell.style.boxShadow = `0 0 0 4px #9C27B0, 0 0 14px #9C27B099`;
                }
                this.sfx.play('mine_place');
                this._spawnStyleTriggerText('Fractal armed', '#9C27B0');
                this._updateFractalIndicators();
                break;
            }
            case 'kickstart_mine': {
                /* Passive — its effect fires from digCell() on first click,
                 * this case only handles a direct manual placement (no-op
                 * visual flash since the passive path already awarded it). */
                if (cell) { cell.style.boxShadow = `0 0 0 4px #FF9800, 0 0 12px #FF980066`; setTimeout(() => { if (cell) cell.style.boxShadow=''; }, 500); }
                this.sfx.play('mine_place');
                break;
            }
            case 'diffusal_mine': {
                /* Passive — armed automatically; actual diffuse-or-lose logic
                 * runs from reveal() when a mine is hit. Placement just arms it. */
                if (cell) { cell.style.boxShadow = `0 0 0 4px #00BCD4, 0 0 12px #00BCD466`; }
                this.sfx.play('mine_place');
                this._spawnStyleTriggerText('Diffusal armed', '#00BCD4');
                break;
            }
            case 'pipe_mine': {
                /* Reveal ~1/3 of remaining safe tiles in a wide horizontal
                 * BAND (multiple rows, not a single line) extending outward
                 * from the placement point, with a handful of random gaps
                 * left unrevealed so the shape looks imperfect/organic
                 * rather than a clean straight tunnel. Mine tiles are
                 * skipped (not detonated) as the blast passes over them.   */
                const remainingSafe = [];
                for (let i = 0; i < this.rows; i++) for (let j = 0; j < this.cols; j++) {
                    if (this.board[i][j] !== -1 && !this.revealed[i][j]) remainingSafe.push([i, j]);
                }
                const targetCount = Math.max(1, Math.ceil(remainingSafe.length / 3));
                const BAND_HALF = 1; /* band spans r-1..r+1 when in bounds */
                const bandRows = [];
                for (let dr = -BAND_HALF; dr <= BAND_HALF; dr++) {
                    const rr = r + dr;
                    if (rr >= 0 && rr < this.rows) bandRows.push(rr);
                }
                const dir = Math.random() < 0.5 ? 1 : -1;
                const GAP_CHANCE = 0.22; /* imperfections along the band */
                const queue = [];
                for (let nc = c + dir; nc >= 0 && nc < this.cols; nc += dir) {
                    bandRows.forEach(rr => queue.push([rr, nc]));
                }
                let revealedCount = 0;
                const doStep = (i) => {
                    if (i >= queue.length || revealedCount >= targetCount) return;
                    const [nr, ncc] = queue[i];
                    if (this.board[nr][ncc] === -1 || Math.random() < GAP_CHANCE) { setTimeout(() => doStep(i + 1), 40); return; }
                    if (!this.revealed[nr][ncc]) { this.reveal(nr, ncc); revealedCount++; }
                    setTimeout(() => doStep(i + 1), 40);
                };
                this.spawnExplosion(cx, cy, '#607D8B', 14);
                this.sfx.play('mine_place');
                this._spawnStyleTriggerText('Pipe blast!', '#607D8B');
                doStep(0);
                break;
            }
            case 'nuke_mimb': {
                /* Reveal a random 50% of remaining safe tiles. */
                const remaining = [];
                for (let i = 0; i < this.rows; i++) for (let j = 0; j < this.cols; j++) {
                    if (this.board[i][j] !== -1 && !this.revealed[i][j]) remaining.push([i, j]);
                }
                for (let i = remaining.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
                }
                const half = remaining.slice(0, Math.ceil(remaining.length / 2));
                this.spawnExplosion(cx, cy, '#E91E63', 24);
                document.body.classList.add('runover-pulse');
                setTimeout(() => document.body.classList.remove('runover-pulse'), 500);
                this.sfx.play('grenade_fx');
                this._spawnStyleTriggerText('NUKE!', '#E91E63');
                half.forEach(([nr, nc], i) => {
                    setTimeout(() => { if (!this.revealed[nr][nc]) this.reveal(nr, nc); }, i * 12);
                });
                break;
            }
            case 'tsar_mimba': {
                /* Arm the board-shrink mechanic; each future Style rank-up
                 * voids the outermost remaining ring of tiles.             */
                this.tsarArmed = true;
                if (cell) { cell.style.boxShadow = `0 0 0 4px #3F51B5, 0 0 14px #3F51B599`; }
                this.sfx.play('mine_place');
                this._spawnStyleTriggerText('Tsar armed', '#3F51B5');
                break;
            }
        }
    }

    /* ── Cooldown / blocked-placement feedback ───────────────── */
    _flashPlaceCooldown(slotIndex) {
        /* Pulse every visible HUD slot with a quick red ring so the player
         * sees the throttle on whichever HUD is on screen.                */
        const slots = document.querySelectorAll(`.mine-slot[data-slot-index="${slotIndex}"]`);
        slots.forEach((s) => {
            s.classList.remove('place-cooldown'); void s.offsetWidth;
            s.classList.add('place-cooldown');
            setTimeout(() => s.classList.remove('place-cooldown'), 450);
        });
    }
    _flashGrenadeRankBlock() {
        /* Replaces the old "Rank Required" modal with a brief red full-screen
         * pulse so play isn't interrupted.                                  */
        document.body.classList.remove('grenade-rank-flash');
        void document.body.offsetWidth;
        document.body.classList.add('grenade-rank-flash');
        setTimeout(() => document.body.classList.remove('grenade-rank-flash'), 520);
    }

    /* ── Polished modal close: exit animation + SFX before hiding ── */
    _closeModalWithExit(modalId, sfxName) {
        const modal = document.getElementById(modalId);
        if (!modal || !modal.classList.contains('show')) return Promise.resolve();
        const content = modal.querySelector('.modal-content');
        if (sfxName && this.sfx) this.sfx.play(sfxName);
        if (content) content.classList.add('exiting');
        modal.classList.add('exiting');
        return new Promise(resolve => {
            setTimeout(() => {
                modal.classList.remove('show', 'exiting');
                if (content) content.classList.remove('exiting');
                resolve();
            }, 320);
        });
    }

    /* ── Floating "+N trench!" / similar one-shot label helper ─ */
    _spawnFloatingLabel(x, y, text, color) {
        const container = document.getElementById('explosion-container');
        if (!container) return;
        const el = document.createElement('div');
        el.className = 'floating-label-fx';
        el.textContent = text;
        el.style.cssText = `left:${x}px;top:${y}px;color:${color || '#fff'};`;
        container.appendChild(el);
        setTimeout(() => el.remove(), 1400);
    }

    /* ── Style HUD trigger feedback: unified scale/spin/shrink pop. ─
     * All mine procs (mine-mine, grenade, trench, fractal, totem) push a
     * short text into the style meter stack so the player sees every
     * effect in one consistent place.                                   */
    _spawnStyleTriggerText(text, color, sfxName) {
        const stack = document.getElementById('style-trigger-stack');
        if (!stack) return;
        const el = document.createElement('div');
        el.className = 'style-trigger-text';
        el.textContent = text;
        if (color) el.style.color = color;
        stack.appendChild(el);
        if (sfxName && this.sfx) this.sfx.play(sfxName);
        /* Cap stack to last 4 to avoid runaway growth */
        while (stack.children.length > 4) stack.removeChild(stack.firstChild);
        setTimeout(() => { if (el.parentNode) el.remove(); }, 1100);
    }

    /* ── Fractal radius indicator (3×3) with overlap brightness ─────
     * Counts how many fractal mines cover each cell, then paints an
     * overlay whose alpha scales with the overlap count so the player
     * can see chain hot-spots.                                       */
    _updateFractalIndicators() {
        /* Clear any existing radius marks first. */
        document.querySelectorAll('.cell.fractal-radius').forEach(c => {
            c.classList.remove('fractal-radius');
            c.style.removeProperty('--fractal-overlap');
        });
        if (!this.fractalMines || this.fractalMines.length === 0) return;
        const counts = new Map();
        for (const fm of this.fractalMines) {
            for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
                const nr = fm.r + di, nc = fm.c + dj;
                if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;
                const k = `${nr},${nc}`;
                counts.set(k, (counts.get(k) || 0) + 1);
            }
        }
        for (const [k, count] of counts) {
            const [rr, cc] = k.split(',').map(Number);
            const cell = this.getCell(rr, cc);
            if (!cell) continue;
            cell.classList.add('fractal-radius');
            cell.style.setProperty('--fractal-overlap', count);
        }
    }

    /* ── Fractal chain reaction ──────────────────────────────────
     * When any mine inside a fractal mine's 3×3 radius is triggered
     * (whether by a player dig or by a grenade), every mine in the
     * radius — including other fractal mines — detonates twice.
     * Triggering a fractal that contains another fractal in its
     * radius chains to that fractal too.                              */
    _triggerFractalChain(srcR, srcC) {
        if (!this.fractalMines || this.fractalMines.length === 0) return;
        const visited = new Set();
        const queue = [[srcR, srcC, 0]];
        const inRadius = (a, b, c, d) => Math.abs(a - c) <= 1 && Math.abs(b - d) <= 1;
        while (queue.length) {
            const [tr, tc, depth] = queue.shift();
            for (const fm of this.fractalMines) {
                const key = `${fm.r},${fm.c}`;
                if (visited.has(key)) continue;
                if (!inRadius(fm.r, fm.c, tr, tc)) continue;
                visited.add(key);
                const fractalDelay = depth * 280;
                this._detonateFractalRadius(fm.r, fm.c, fractalDelay, queue, depth);
            }
        }
    }
    _detonateFractalRadius(fr, fc, baseDelay, queue, depth) {
        /* Fractal flash on the fractal cell itself */
        setTimeout(() => {
            const fcell = this.getCell(fr, fc);
            if (fcell) {
                fcell.style.boxShadow = '0 0 0 6px #9C27B0, 0 0 24px #9C27B0aa';
                setTimeout(() => { if (fcell) fcell.style.boxShadow = ''; }, 380);
            }
            this.sfx.play('fractal_fx');
            const frect = fcell ? fcell.getBoundingClientRect() : null;
            if (frect) {
                this.spawnExplosion(frect.left + frect.width/2, frect.top + frect.height/2, '#9C27B0', 14);
            }
            /* HUD pop with the unified style-trigger animation per fractal proc. */
            this._spawnStyleTriggerText('Fractal!', '#9C27B0');
        }, baseDelay);

        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                const nr = fr + di, nc = fc + dj;
                if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;
                const isMine = this.board[nr] && this.board[nr][nc] === -1;
                const isFractalPlacement = this.fractalMines.some(m => m.r === nr && m.c === nc);
                if (!isMine && !isFractalPlacement) continue;
                /* Detonate ONCE per fractal — overlapping fractals naturally
                 * produce multiplicative re-triggers because each one fires
                 * its own pulse on shared cells.                            */
                const dly = baseDelay + 120 + (Math.abs(di) + Math.abs(dj)) * 35;
                setTimeout(() => {
                    const c2 = this.getCell(nr, nc);
                    const rect = c2 ? c2.getBoundingClientRect() : null;
                    const cx = rect ? rect.left + rect.width/2 : window.innerWidth/2;
                    const cy = rect ? rect.top + rect.height/2 : window.innerHeight/2;
                    const color = isFractalPlacement ? '#9C27B0' : '#f44336';
                    this.spawnExplosion(cx, cy, color, 9);
                }, dly);
                /* Chain to other fractals in radius. */
                if (isFractalPlacement && (nr !== fr || nc !== fc)) {
                    queue.push([nr, nc, depth + 1]);
                }
            }
        }
    }

    /* Centralised setter for board-level Style score. Every place that
     * updates the Style Meter's live score routes through here so the
     * Steel Mine's passive (every 100 cumulative Style score → +50 run
     * points) can be checked in exactly one spot instead of duplicated
     * at each call site. */
    _setBoardStyleScore(newScore) {
        const prev = this.boardStyleScore || 0;
        const delta = newScore - prev;
        this.boardStyleScore = newScore;
        if (delta > 0) this._checkSteelMine(delta);
    }
    _checkSteelMine(delta) {
        if (!this.playerMines || !this.playerMines.some(m => m && m.id === 'steel_mine' && !this.bannedMineIds.includes('steel_mine'))) return;
        const before = Math.floor((this.steelMilestoneScore || 0) / 100);
        this.steelMilestoneScore = (this.steelMilestoneScore || 0) + delta;
        const after = Math.floor(this.steelMilestoneScore / 100);
        if (after > before) {
            const gained = (after - before) * 50;
            this.runPoints += gained;
            const rptEl = document.getElementById('mm-run-pts');
            if (rptEl) rptEl.textContent = this.runPoints;
            this._spawnStyleTriggerText(`+${gained} steel!`, '#90A4AE', 'steel_fx');
        }
    }

    _onStyleRankUp(rank) {
        /* Trench mine: give style points = sum of adjacent numbers for each
         * placed trench mine. Each contributing trench plays an SFX, spawns
         * a small explosion at its tile, and pops a "+N trench!" label in
         * the unified Style HUD trigger stack.                             */
        this.trenchMines.forEach(({r, c}, idx) => {
            const adj = this._getAdj(r, c);
            const total = adj.reduce((sum, [ar, ac]) => {
                const v = this.board[ar] && this.board[ar][ac] > 0 ? this.board[ar][ac] : 0;
                return sum + v;
            }, 0);
            if (total <= 0) return;
            this.styleMeter.addScore(total);
            this._setBoardStyleScore(this.styleMeter.getScore());
            const cell = this.getCell(r, c);
            const rect = cell ? cell.getBoundingClientRect() : null;
            const cx = rect ? rect.left + rect.width/2 : window.innerWidth/2;
            const cy = rect ? rect.top + rect.height/2 : window.innerHeight/2;
            setTimeout(() => {
                this.spawnExplosion(cx, cy, '#a87555', 8);
                this._spawnStyleTriggerText(`+${total} trench!`, '#a87555', 'trench_fx');
            }, idx * 130);
        });

        /* Dormant Grenade/Pipe mines: check if this rank-up unlocks them */
        this._checkDormantMines();

        /* Tsar Mimba: shrink the board inward (void outermost ring) on
         * every rank-up once armed for this board.                       */
        if (this.tsarArmed) this._shrinkBoardRing();
    }

    /* ── Tsar Mimba: void the outermost remaining ring of the board ── */
    _shrinkBoardRing() {
        if (!this.boardRingInset) this.boardRingInset = 0;
        const inset = this.boardRingInset;
        const top = inset, bottom = this.rows - 1 - inset;
        const left = inset, right = this.cols - 1 - inset;
        if (top >= bottom || left >= right) return; /* board too small to shrink further */
        for (let j = left; j <= right; j++) { this._voidCell(top, j); this._voidCell(bottom, j); }
        for (let i = top; i <= bottom; i++) { this._voidCell(i, left); this._voidCell(i, right); }
        this.boardRingInset++;
        this._updateBoardClipPath();
        this._spawnStyleTriggerText('Board shrinks!', '#3F51B5', 'tsar_fx');
    }

    /* ── Visually shrinks the board's own card/background — not just the
     * individual voided cells — so Tsar Mimba and Circle Mine feel like
     * they're physically trimming the play area down.                    */
    _updateBoardClipPath() {
        const board = document.getElementById('game-board');
        if (!board) return;
        const CELL_PITCH = 32; /* 28px cell + 4px gap */
        const PAD = 14;
        if (this.circleMode) {
            const cr = (this.rows - 1) / 2, cc = (this.cols - 1) / 2;
            const radius = Math.min(cr, cc) * 0.95;
            const radiusPx = radius * CELL_PITCH + PAD;
            board.style.clipPath = `circle(${radiusPx}px at 50% 50%)`;
            board.style.borderRadius = '50%';
        } else if (this.boardRingInset > 0) {
            const insetPx = this.boardRingInset * CELL_PITCH;
            board.style.clipPath = `inset(${insetPx}px round 22px)`;
            board.style.borderRadius = '';
        } else {
            board.style.clipPath = '';
            board.style.borderRadius = '';
        }
    }
    _voidCell(r, c) {
        if (!this.voidedCells) this.voidedCells = new Set();
        const key = `${r},${c}`;
        if (this.voidedCells.has(key)) return;
        this.voidedCells.add(key);
        const cell = this.getCell(r, c);
        if (cell) cell.classList.add('circle-void', 'tsar-shrink-fx');
        /* Auto-flag mines and auto-reveal-equivalent safe tiles that get
         * voided so they don't block win detection.                      */
        if (this.board[r] && this.board[r][c] === -1) this.flagged[r][c] = true;
        else if (this.board[r]) this.revealed[r][c] = true;
    }

    /* ══ EXPLOSION PARTICLES ═══════════════════════════════════ */
    spawnExplosion(x, y, color, count) {
        if (this.particleAmount <= 0) return;
        const container = document.getElementById('explosion-container');
        if (!container) return;
        const actualCount = Math.max(1, Math.round(count * this.particleAmount));

        /* Primary ring */
        const ring = document.createElement('div');
        ring.className = 'explosion-ring';
        ring.style.cssText = `left:${x-20}px;top:${y-20}px;width:40px;height:40px;color:${color};animation:ringExpand .5s ease-out both`;
        container.appendChild(ring);
        setTimeout(() => ring.remove(), 600);

        /* Outer secondary ring */
        const ring2 = document.createElement('div');
        ring2.className = 'explosion-ring';
        ring2.style.cssText = `left:${x-30}px;top:${y-30}px;width:60px;height:60px;color:${color};opacity:.45;animation:ringExpand .72s .07s ease-out both`;
        container.appendChild(ring2);
        setTimeout(() => ring2.remove(), 900);

        /* Main particles */
        const shapes = ['50%', '0%', '30%', '50%'];
        for (let i = 0; i < actualCount; i++) {
            const angle = (i / actualCount) * Math.PI * 2 + Math.random() * 0.5;
            const dist = 35 + Math.random() * 65;
            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist;
            const size = 4 + Math.random() * 9;
            const dur = 0.45 + Math.random() * 0.45;
            const p = document.createElement('div');
            p.className = 'explosion-particle';
            p.style.cssText = `left:${x-size/2}px;top:${y-size/2}px;width:${size}px;height:${size}px;background:${color};border-radius:${shapes[Math.floor(Math.random()*shapes.length)]};--px:${px}px;--py:${py}px;animation:particleOut ${dur}s cubic-bezier(.2,.8,.2,1) both;animation-delay:${Math.random()*.12}s`;
            container.appendChild(p);
            setTimeout(() => p.remove(), (dur + 0.25) * 1000);
        }

        /* Sparks — thin fast streaks */
        const sparkCount = Math.max(2, Math.round(5 * this.particleAmount));
        for (let i = 0; i < sparkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 55 + Math.random() * 40;
            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist;
            const dur = 0.28 + Math.random() * 0.22;
            const p = document.createElement('div');
            p.className = 'explosion-particle';
            p.style.cssText = `left:${x-1}px;top:${y-3}px;width:2px;height:6px;background:${color};border-radius:2px;opacity:.85;--px:${px}px;--py:${py}px;animation:particleOut ${dur}s cubic-bezier(.1,.9,.3,1) both;animation-delay:${Math.random()*.07}s`;
            container.appendChild(p);
            setTimeout(() => p.remove(), (dur + 0.12) * 1000);
        }
    }

    /* ══ TRANSITIONS ═══════════════════════════════════════════ */
    transitionToGame(callback) {
        const overlay = document.getElementById('screen-transition');
        overlay.className = 'screen-transition';
        requestAnimationFrame(() => requestAnimationFrame(() => {
            overlay.classList.add('slide-down');
            setTimeout(() => {
                document.getElementById('menu-screen').classList.add('hidden');
                document.getElementById('mine-market-screen').classList.add('hidden');
                document.getElementById('game-screen').classList.remove('hidden');
                callback();
                overlay.classList.remove('slide-down'); overlay.classList.add('slide-up');
                setTimeout(() => { overlay.className = 'screen-transition'; }, 420);
            }, 380);
        }));
    }
    showMenu() {
        if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
        if (this.animationId)   { cancelAnimationFrame(this.animationId); this.animationId = null; }
        this.styleMeter.hide();
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('mine-market-screen').classList.add('hidden');
        document.getElementById('menu-screen').classList.remove('hidden');
        if (this.runState) this.carouselIndex = this.runState.currentBoard;
        if (this.runState && this.currentDifficulty) {
            document.querySelectorAll('.diff-box').forEach(b => b.classList.remove('selected'));
            const box = document.getElementById(`diff-${this.currentDifficulty}`);
            if (box) box.classList.add('selected');
        }
        this.renderDifficultyGrid(); this.renderCarousel(); this.renderLevelBar(); this.refreshMenuButtons();
        this.renderMineHud();
    }

    /* ══ AUTO FIT BOARD ════════════════════════════════════════ */
    _autoFitBoard() {
        requestAnimationFrame(() => {
            const container = document.getElementById('zoom-container');
            const board = document.getElementById('game-board');
            if (!container || !board) return;
            const cw = container.clientWidth, ch = container.clientHeight;
            const bw = board.offsetWidth, bh = board.offsetHeight;
            if (!bw || !bh || !cw || !ch) return;
            const scaleX = (cw - 24) / bw;
            const scaleY = (ch - 24) / bh;
            const scale = Math.min(scaleX, scaleY, this.maxZoom);
            const clamped = Math.max(this.minZoom, scale);
            this.zoomLevel = clamped;
            this._zoomTarget = clamped;
            board.style.transform = `scale(${clamped})`;
            document.getElementById('zoom-level').textContent = Math.round(clamped * 100) + '%';
            this.updateCellFontSize();
            /* Center */
            const scaledW = bw * clamped, scaledH = bh * clamped;
            this.scrollX = Math.max(0, (cw - scaledW) / 2);
            this.scrollY = Math.max(0, (ch - scaledH) / 2);
            this.updateBoardPosition();
            this._refreshScrollDims();
        });
    }

    /* ══ MENU EVENTS ═══════════════════════════════════════════ */
    /* Global defense against "click-through" on popups AND full-screen swaps
     * (menu / game / mine-market): a stray input event that resolves against
     * whatever is now exposed at the same screen coordinates right after a
     * screen or modal swap — a known ghost-event race on touch/mouse-emulated
     * browsers — must never reach the newly-shown UI underneath. This runs in
     * the capture phase on document so it wins the race against every other
     * listener regardless of where it's attached.
     *
     * Two layers:
     *  1. Time-armed swallow: a MutationObserver watches the top-level
     *     screens + every .modal-overlay for class changes (show/hide) and
     *     opens a short grace window; any input event of any kind arriving
     *     inside that window is swallowed outright.
     *  2. Spatial guard: while a modal is open (outside any grace window),
     *     any input event landing outside every open .modal-overlay is
     *     swallowed so it can never leak to the menu/board behind it. */
    _bindModalClickGuard() {
        let swallowUntil = 0;
        const arm = () => { swallowUntil = Date.now() + 220; };

        const watchTargets = [
            document.getElementById('menu-screen'),
            document.getElementById('game-screen'),
            document.getElementById('mine-market-screen'),
            ...document.querySelectorAll('.modal-overlay')
        ].filter(Boolean);
        const mo = new MutationObserver(arm);
        watchTargets.forEach(el => mo.observe(el, { attributes: true, attributeFilter: ['class'] }));

        const guard = (e) => {
            if (Date.now() < swallowUntil) {
                e.preventDefault();
                e.stopPropagation();
                if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                return;
            }
            const opens = document.querySelectorAll('.modal-overlay.show');
            if (!opens.length) return;
            for (const overlay of opens) {
                if (overlay.contains(e.target)) return;
            }
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        };
        ['pointerdown','mousedown','touchstart','click','pointerup','mouseup','touchend'].forEach(type => {
            document.addEventListener(type, guard, { capture: true, passive: false });
        });
    }

    bindMenuEvents() {
        this._bindModalClickGuard();
        ['easy','normal','hard','cs1','cs2','cs3'].forEach(k => {
            const el = document.getElementById(`diff-${k}`);
            if (el) el.addEventListener('click', () => this.onDifficultyClick(['cs1','cs2','cs3'].includes(k) ? 'soon' : k));
        });

        document.getElementById('play-btn').addEventListener('click',     () => { if (!document.getElementById('play-btn').classList.contains('greyed')) this.startRun(); });
        document.getElementById('continue-btn').addEventListener('click', () => this.continueRun());
        document.getElementById('abort-btn').addEventListener('click',    () => this.abortRun());

        /* Store / Themes */
        document.getElementById('store-btn').addEventListener('click', () => {
            this.sfx.play('modal'); this.storeTab='themes';
            document.querySelectorAll('#store-tab-bar .tab-btn').forEach(b => b.classList.toggle('active', b.dataset.storeTab==='themes'));
            document.querySelectorAll('#store-modal .tab-panel').forEach(p => p.classList.remove('active'));
            document.getElementById('store-panel-themes').classList.add('active');
            this.renderStoreThemes();
            document.getElementById('store-modal').classList.add('show');
            if (this._updateStoreArrows) this._updateStoreArrows();
        });
        document.getElementById('store-close-btn').addEventListener('click', () => { document.getElementById('store-modal').classList.remove('show'); this.revertPreview(); this.sfx.play('btn'); });
        document.getElementById('store-modal').addEventListener('click', e => { if (e.target===document.getElementById('store-modal')) { document.getElementById('store-modal').classList.remove('show'); this.revertPreview(); } });

        /* Feats */
        const featsButton = document.getElementById('feats-btn');
        let featHoldTimer = null;
        let featHoldTriggered = false;
        const cancelFeatHold = () => {
            if (featHoldTimer !== null) {
                clearTimeout(featHoldTimer);
                featHoldTimer = null;
            }
        };
        featsButton.addEventListener('pointerdown', e => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            if (featsButton.setPointerCapture) {
                try { featsButton.setPointerCapture(e.pointerId); } catch (_) {}
            }
            featHoldTriggered = false;
            cancelFeatHold();
            featHoldTimer = setTimeout(() => {
                featHoldTimer = null;
                featHoldTriggered = true;
                this._clearAllFeatIndicators();
                this.sfx.play('btn');
            }, 700);
        });
        featsButton.addEventListener('pointerup', e => {
            cancelFeatHold();
            if (featsButton.hasPointerCapture?.(e.pointerId)) {
                try { featsButton.releasePointerCapture(e.pointerId); } catch (_) {}
            }
        });
        featsButton.addEventListener('pointercancel', cancelFeatHold);
        featsButton.addEventListener('pointerleave', cancelFeatHold);
        featsButton.addEventListener('click', () => {
            if (featHoldTriggered) {
                featHoldTriggered = false;
                return;
            }
            this.sfx.play('modal'); this.featsTab='board';
            document.querySelectorAll('#feats-side-nav .feats-side-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.featsTab==='board'));
            this.renderFeatsPanel('board');
            document.getElementById('feats-modal').classList.add('show');
            this._updateTabDots();
            this.updateFeatsTabProgress('board');
        });
        featsButton.addEventListener('contextmenu', e => {
            e.preventDefault();
            featHoldTriggered = true;
            cancelFeatHold();
            this._clearAllFeatIndicators();
        });
        document.getElementById('feats-close-btn').addEventListener('click', () => { document.getElementById('feats-modal').classList.remove('show'); this.sfx.play('btn'); });
        document.getElementById('feats-modal').addEventListener('click', e => { if (e.target===document.getElementById('feats-modal')) document.getElementById('feats-modal').classList.remove('show'); });

        /* Collection */
        document.getElementById('collection-btn').addEventListener('click', () => {
            this.sfx.play('modal');
            this.renderCollectionMines();
            document.getElementById('collection-modal').classList.add('show');
        });
        document.getElementById('collection-close-btn').addEventListener('click', () => { document.getElementById('collection-modal').classList.remove('show'); this.sfx.play('btn'); });
        document.getElementById('collection-modal').addEventListener('click', e => { if (e.target===document.getElementById('collection-modal')) document.getElementById('collection-modal').classList.remove('show'); });

        /* Mine Info Close */
        document.getElementById('mine-info-close-btn').addEventListener('click', () => { document.getElementById('mine-info-modal').classList.remove('show'); this.sfx.play('btn'); });
        document.getElementById('mine-info-modal').addEventListener('click', e => { if (e.target===document.getElementById('mine-info-modal')) document.getElementById('mine-info-modal').classList.remove('show'); });

        /* Board Finished Modal — continue goes to MineMarket */
        document.getElementById('bf-continue-btn').addEventListener('click', () => {
            if (this.runState) {
                this._closeModalWithExit('board-finished-modal', 'btn').then(() => this.showMineMarket());
            } else {
                /* Run complete — go to menu */
                this._closeModalWithExit('board-finished-modal', 'boardwin').then(() => this.showMenu());
            }
        });
        /* Game Over Modal */
        document.getElementById('menu-btn').addEventListener('click', () => {
            this._closeModalWithExit('game-over-modal', 'btn').then(() => {
                this._flushRunPointsToMain();
                this._clearRunState(); this.runState = null;
                this._resetRunState();
                this.showMenu();
            });
        });
        document.getElementById('restart-btn').addEventListener('click', () => {
            const prevDiff = this.currentDifficulty || 'normal';
            this._closeModalWithExit('game-over-modal', 'btn').then(() => {
                this._flushRunPointsToMain();
                this._clearRunState(); this.runState = null;
                this.currentDifficulty = prevDiff;
                this.carouselIndex = 0;
                this.runStyleScore = 0; this.boardStyleScore = 0; this.steelMilestoneScore = 0;
                this._resetRunState();
                this.runState = { active:true, difficulty:prevDiff, currentBoard:0, unlockedUpTo:0, paused:false, boardState:null, boardRanks:[] };
                this._saveRunState();
                const cfg = this.getBoardConfig(0);
                this.rows = cfg.rows; this.cols = cfg.cols; this.mines = cfg.mines;
                this.createFreshBoard(); this.bindGameEvents(); this.setupScrolling(); this.updateBoardIndicator();
            });
        });
        /* Back button */
        document.getElementById('back-btn').addEventListener('click', () => { this.pauseRun(); this.showMenu(); this.sfx.play('btn'); });

        /* Zoom */
        document.getElementById('zoom-in') .addEventListener('click', () => { this.zoom(.25); this.sfx.play('btn'); });
        document.getElementById('zoom-out').addEventListener('click', () => { this.zoom(-.25); this.sfx.play('btn'); });

        /* Settings */
        const featuresToggle = document.getElementById('settings-features-toggle');
        const featuresPanel = document.getElementById('settings-features-panel');
        const setFeaturesExpanded = (expanded) => {
            if (!featuresToggle || !featuresPanel) return;
            featuresToggle.setAttribute('aria-expanded', String(expanded));
             featuresPanel.classList.toggle('is-open', expanded);
             featuresPanel.setAttribute('aria-hidden', String(!expanded));
             featuresPanel.inert = !expanded;
        };
        if (featuresToggle) {
            featuresToggle.addEventListener('click', () => {
                const expanded = featuresToggle.getAttribute('aria-expanded') !== 'true';
                setFeaturesExpanded(expanded);
                this.sfx.play('btn');
            });
        }
        document.getElementById('settings-open-btn').addEventListener('click', () => {
            setFeaturesExpanded(false);
            document.getElementById('settings-modal').classList.add('show');
            this.sfx.play('modal');
        });
        document.getElementById('settings-close-btn').addEventListener('click', () => { document.getElementById('settings-modal').classList.remove('show'); this.sfx.play('btn'); });
        document.getElementById('settings-modal').addEventListener('click', e => { if (e.target===document.getElementById('settings-modal')) document.getElementById('settings-modal').classList.remove('show'); });
        document.getElementById('dark-mode-toggle').addEventListener('change', e => {
            document.body.classList.toggle('dark-mode', e.target.checked);
            localStorage.setItem('darkMode', e.target.checked);
            this.sfx.play('btn');
        });
        const meterToggle = document.getElementById('style-meter-position-toggle');
        if (meterToggle) meterToggle.addEventListener('change', e => {
            document.body.classList.toggle('style-meter-right', e.target.checked);
            localStorage.setItem('ms_style_meter_right', e.target.checked);
            this.sfx.play('btn');
        });
        const mineBuyToggle = document.getElementById('mine-buying-popup-toggle');
        if (mineBuyToggle) mineBuyToggle.addEventListener('change', e => {
            this.mineBuyingPopup = e.target.checked;
            localStorage.setItem('ms_mine_buying_popup', e.target.checked);
            this.sfx.play('btn');
        });
        const featIndicatorsToggle = document.getElementById('feat-indicators-toggle');
        if (featIndicatorsToggle) featIndicatorsToggle.addEventListener('change', e => {
            this.featIndicators = e.target.checked;
            localStorage.setItem('ms_feat_indicators', e.target.checked);
            this._updateFeatIndicators();
            this.sfx.play('btn');
        });

        /* SFX Volume */
        const volSlider = document.getElementById('sfx-volume-slider');
        const volDisplay = document.getElementById('sfx-vol-display');
        if (volSlider) volSlider.addEventListener('input', () => {
            const v = parseInt(volSlider.value)/100;
            this.sfx.sfxVolume = v; localStorage.setItem('ms_sfx_volume', v);
            if (volDisplay) volDisplay.textContent = `${Math.round(v*100)}%`;
        });

        /* Particle Amount */
        const pSlider = document.getElementById('particle-amount-slider');
        const pDisplay = document.getElementById('particle-amount-display');
        if (pSlider) pSlider.addEventListener('input', () => {
            const v = parseInt(pSlider.value)/100;
            this.particleAmount = v;
            localStorage.setItem('ms_particle_amount', v);
            if (pDisplay) pDisplay.textContent = `${Math.round(v*100)}%`;
            if (this.floatingBg) this.floatingBg.setParticleAmount(v);
        });

        /* Save Files */
        document.getElementById('save-file-open-btn').addEventListener('click', () => { this.saveCurrentToSlot(this.currentSlot); this.renderSavesModal(); document.getElementById('saves-modal').classList.add('show'); this.sfx.play('modal'); });
        document.getElementById('saves-close-btn').addEventListener('click',    () => { document.getElementById('saves-modal').classList.remove('show'); this.sfx.play('btn'); });
        document.getElementById('saves-modal').addEventListener('click', e => { if (e.target===document.getElementById('saves-modal')) document.getElementById('saves-modal').classList.remove('show'); });

        /* Fun Code */
        const redeemInput = document.getElementById('redeem-input');
        const redeemApply = document.getElementById('redeem-apply-btn');
        if (redeemInput) redeemInput.addEventListener('keydown', e => { if (e.key==='Enter') this._handleFunCode(); });
        if (redeemApply) redeemApply.addEventListener('click', () => this._handleFunCode());

        /* Purchase Modal */
        document.getElementById('coming-soon-close-btn').addEventListener('click', () => { document.getElementById('coming-soon-modal').classList.remove('show'); this.sfx.play('btn'); });
        const sellConfirmModal = document.getElementById('sell-confirm-modal');
        if (sellConfirmModal) {
            sellConfirmModal.addEventListener('click', e => {
                if (e.target === sellConfirmModal) {
                    sellConfirmModal.classList.remove('show');
                    this.sfx.play('btn');
                }
            });
        }
        const mineBuyConfirmModal = document.getElementById('mine-buy-confirm-modal');
        if (mineBuyConfirmModal) {
            mineBuyConfirmModal.addEventListener('click', e => {
                if (e.target === mineBuyConfirmModal) {
                    mineBuyConfirmModal.classList.remove('show');
                    this.sfx.play('btn');
                }
            });
        }

        /* Carousel Swipe */
        this.bindCarouselSwipe();

        /* Abort confirm modal */
        const abortConfirmModal = document.getElementById('abort-confirm-modal');
        if (abortConfirmModal) {
            document.getElementById('abort-confirm-yes-btn').addEventListener('click', () => {
                abortConfirmModal.classList.remove('show');
                this._doAbortRun();
            });
            document.getElementById('abort-confirm-no-btn').addEventListener('click', () => {
                abortConfirmModal.classList.remove('show');
                this.sfx.play('btn');
            });
        }

        /* Mine Market events */
        const mmMenuBtn = document.getElementById('mm-menu-btn');
        if (mmMenuBtn) mmMenuBtn.addEventListener('click', () => {
            if (this.runState) { this.runState.pausedInMarket = true; this._saveRunState(); }
            document.getElementById('mine-market-screen').classList.add('hidden');
            this.sfx.play('btn');
            this.showMenu();
        });
        document.getElementById('mm-continue-btn').addEventListener('click', () => {
            this.sfx.play('btn');
            this.closeMineMarket();
        });
        const scratchBuyBtn = document.getElementById('scratch-buy-btn');
        if (scratchBuyBtn) scratchBuyBtn.addEventListener('click', () => { this.doScratchBuy(); });
        document.getElementById('scratch-btn').addEventListener('click', () => {
            if (!this.scratchBought) { this.sfx.play('error'); return; }
            this.sfx.play('btn'); this.doScratch();
        });
        const slotBuyBtn = document.getElementById('slot-buy-btn');
        if (slotBuyBtn) slotBuyBtn.addEventListener('click', () => { this.doSlotBuy(); });
        document.getElementById('slot-btn').addEventListener('click', () => {
            if (!this.slotBought || this.slotUsed) { this.sfx.play('error'); return; }
            this.sfx.play('btn'); this.openSlotMachine();
        });

        /* Mine Market collection shop reroll */
        const rerollBtn = document.getElementById('mm-shop-reroll-btn');
        if (rerollBtn) rerollBtn.addEventListener('click', () => { this._doMarketShopReroll(); });

        /* Slot popup */
        document.getElementById('slot-popup-close').addEventListener('click', () => {
            if (this._slotInterval) { clearInterval(this._slotInterval); this._slotInterval = null; }
            this._slotSpinning = false;
            /* Skipping discards the purchased ticket. A new ticket must be
             * bought before the slot machine can be opened again. */
            this.slotBought = false;
            this.slotUsed = false;
            const slotBuyBtn = document.getElementById('slot-buy-btn');
            const slotActBtn = document.getElementById('slot-btn');
            if (slotBuyBtn) {
                slotBuyBtn.textContent = `BUY · ${SLOT_MACHINE_COST} Rpts.`;
                slotBuyBtn.classList.remove('spent');
            }
            if (slotActBtn) {
                slotActBtn.textContent = 'SPIN';
                slotActBtn.classList.remove('used');
                slotActBtn.classList.add('mm-act-disabled');
            }
            document.getElementById('slot-popup').classList.remove('show');
            this.sfx.play('btn');
        });

        /* ── Feats side-nav ── */
        const _setFeatsTab = (tab) => {
            this.featsTab = tab;
            this._animateModalResize('feats-modal', () => {
                document.querySelectorAll('#feats-side-nav .feats-side-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.featsTab === tab));
                const activeBtn = document.querySelector(`#feats-side-nav .feats-side-nav-btn[data-feats-tab="${tab}"]`);
                if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                this.renderFeatsPanel(tab);
                this.updateFeatsTabProgress(tab);
                this._markFeatTabSeen(tab);
            });
            this.sfx.play('tab');
        };
        document.querySelectorAll('#feats-side-nav .feats-side-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => _setFeatsTab(btn.dataset.featsTab));
        });
        this._setFeatsTab = _setFeatsTab;

        /* ── Store tab arrow navigation ── */
        const _storeTabs = ['themes','uncommon'];
        const _storePrev = document.getElementById('store-tab-prev');
        const _storeNext = document.getElementById('store-tab-next');
        const _updateStoreArrows = () => {
            const idx = _storeTabs.indexOf(this.storeTab);
            if (_storePrev) _storePrev.classList.toggle('disabled', idx <= 0);
            if (_storeNext) _storeNext.classList.toggle('disabled', idx >= _storeTabs.length - 1);
        };
        const _setStoreTab = (tab) => {
            this.storeTab = tab;
            this._animateModalResize('store-modal', () => {
                document.querySelectorAll('#store-tab-bar .tab-btn').forEach(b => b.classList.toggle('active', b.dataset.storeTab === tab));
                document.querySelectorAll('#store-modal .tab-panel').forEach(p => p.classList.remove('active'));
                const panel = document.getElementById(`store-panel-${tab}`);
                if (panel) panel.classList.add('active');
                if (tab === 'themes') this.renderStoreThemes();
                _updateStoreArrows();
            });
            this.sfx.play('tab');
        };
        if (_storePrev) _storePrev.addEventListener('click', () => {
            const idx = _storeTabs.indexOf(this.storeTab);
            if (idx > 0) _setStoreTab(_storeTabs[idx - 1]);
        });
        if (_storeNext) _storeNext.addEventListener('click', () => {
            const idx = _storeTabs.indexOf(this.storeTab);
            if (idx < _storeTabs.length - 1) _setStoreTab(_storeTabs[idx + 1]);
        });
        document.querySelectorAll('#store-tab-bar .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => _setStoreTab(btn.dataset.storeTab));
        });
        _updateStoreArrows();
        this._updateStoreArrows = _updateStoreArrows;
    }

    _animateModalResize(modalId, update) {
        const modal = document.getElementById(modalId);
        const content = modal?.querySelector('.modal-content');
        if (!content || !modal.classList.contains('show')) {
            update();
            return;
        }

        /* Finish a previous resize first so rapid tab taps cannot leave a
         * stale inline height or transition on the popup. */
        if (content._cancelModalResize) content._cancelModalResize();

        const previous = {
            height: content.style.height,
            transition: content.style.transition,
            overflowY: content.style.overflowY,
            willChange: content.style.willChange,
        };
        const startHeight = content.getBoundingClientRect().height;
        let finished = false;
        let fallbackTimer = null;

        const finish = () => {
            if (finished) return;
            finished = true;
            if (fallbackTimer) clearTimeout(fallbackTimer);
            content.style.height = previous.height;
            content.style.transition = previous.transition;
            content.style.overflowY = previous.overflowY;
            content.style.willChange = previous.willChange;
            content.classList.remove('modal-resizing');
            content._cancelModalResize = null;
        };
        content._cancelModalResize = finish;

        content.classList.add('modal-resizing');
        content.style.transition = 'none';
        content.style.height = `${startHeight}px`;
        content.style.overflowY = 'hidden';
        content.style.willChange = 'height';
        update();

        /* Temporarily let the content size naturally to measure the
         * destination height, then animate from the captured height. */
        content.style.height = 'auto';
        const endHeight = content.getBoundingClientRect().height;
        content.style.height = `${startHeight}px`;
        void content.offsetHeight;

        if (Math.abs(endHeight - startHeight) < 1) {
            finish();
            return;
        }

        content.style.transition = 'height .34s cubic-bezier(.22,.75,.25,1)';
        requestAnimationFrame(() => {
            if (finished) return;
            content.style.height = `${endHeight}px`;
        });
        content.addEventListener('transitionend', finish, { once: true });
        fallbackTimer = setTimeout(finish, 420);
    }

    _handleFunCode() {
        const input = document.getElementById('redeem-input');
        const msg   = document.getElementById('redeem-msg');
        const rawCode = (input.value || '').trim();
        const code  = rawCode.toUpperCase();
        const codeLower = rawCode.toLowerCase();
        msg.classList.remove('hidden','success','error');
        const setSuccess = (text) => {
            msg.innerHTML = CHECK_SVG() + ' ' + text.replace(/^[✓✔]\s*/, '');
            msg.classList.add('success');
        };
        const setError = (text) => {
            msg.innerHTML = CROSS_SVG() + ' ' + text.replace(/^[✗✘]\s*/, '');
            msg.classList.add('error');
        };
        if (code === '123ABC') {
            this.infiniteCoins = true;
            localStorage.setItem('ms_infinite_coins', 'true');
            document.body.classList.add('dev-mode');
            this.feats.funCodeUsed = true; this._saveFeats();
            this.renderLevelBar(); this.checkFeats();
            setSuccess('Infinite coins activated!');
            input.value = '';
            this.sfx.play('redeem');
        } else if (codeLower === 'edgelord') {
            if (!this.ownedThemes.includes('black')) this.ownedThemes.push('black');
            this.activeTheme = 'black';
            this.feats.funCodeUsed = true;
            localStorage.setItem('ms_owned_themes', JSON.stringify(this.ownedThemes));
            localStorage.setItem('ms_active_theme', this.activeTheme);
            this._saveFeats(); this.applyTheme('black');
            this.renderStoreThemes(); this.renderDifficultyGrid();
            this._unlockSecret('edgelord_phase'); this.checkFeats();
            const txt = (this.t('edgelordSuccess','Black theme unlocked.') || 'Black theme unlocked.').replace(/^[✓✔]\s*/, '');
            setSuccess(txt);
            input.value = '';
            this.sfx.play('redeem');
        } else if (codeLower === '67' || codeLower === 'sixty seven' || codeLower === 'sixtyseven') {
            this.feats.funCodeUsed = true; this._saveFeats();
            this._unlockSecret('sixty_nine_better'); this.checkFeats();
            setSuccess('69 Better.');
            input.value = '';
            this.sfx.play('redeem');
        } else if (code === '') {
            msg.classList.add('hidden');
        } else {
            setError('Invalid code.');
            this.sfx.play('error');
        }
    }

    bindHoldToHide(buttonId, modalId) {
        const btn = document.getElementById(buttonId);
        const modal = document.getElementById(modalId);
        if (!btn || !modal) return;
        const restore = () => modal.classList.remove('hold-hidden');
        const hide = (e) => {
            e.preventDefault();
            modal.classList.add('hold-hidden');
            window.addEventListener('pointerup', restore, { once:true });
            window.addEventListener('touchend', restore, { once:true });
            window.addEventListener('mouseup', restore, { once:true });
        };
        btn.addEventListener('pointerdown', hide);
        btn.addEventListener('touchstart', hide, { passive:false });
        btn.addEventListener('mousedown', hide);
    }

    updateFeatsTabProgress(tab) {
        const bar = document.getElementById('feats-tab-progress');
        if (!bar) return;
        const tabs = ['board','score','collector','original'];
        const idx = Math.max(0, tabs.indexOf(tab));
        const pct = tabs.length <= 1 ? 100 : Math.round((1 - idx / (tabs.length - 1)) * 100);
        bar.style.setProperty('--tab-progress', `${pct}%`);
        bar.dataset.side = idx < Math.floor(tabs.length / 2) ? 'right' : (idx > Math.floor(tabs.length / 2) ? 'left' : 'center');
    }

    /* ══ ZOOM ══════════════════════════════════════════════════ */
    zoom(delta) {
        const target = Math.min(this.maxZoom, Math.max(this.minZoom, (this._zoomTarget !== undefined ? this._zoomTarget : this.zoomLevel) + delta));
        if (target === this._zoomTarget) return;
        this._zoomTarget = target;
        const el = document.getElementById('zoom-level');
        if (el) { el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 140); }
        if (!this._zoomAnimating) this._animateZoom();
    }
    _animateZoom() {
        this._zoomAnimating = true;
        const step = () => {
            const diff = this._zoomTarget - this.zoomLevel;
            if (Math.abs(diff) < 0.003) {
                this.zoomLevel = this._zoomTarget;
                this._zoomAnimating = false;
            } else {
                this.zoomLevel += diff * 0.18;
                this._zoomFrame = requestAnimationFrame(step);
            }
            const board = this._scrollBoardEl || document.getElementById('game-board');
            if (board) board.style.transform = `scale(${this.zoomLevel})`;
            const el = document.getElementById('zoom-level');
            if (el) el.textContent = Math.round(this.zoomLevel * 100) + '%';
            this.updateCellFontSize();
            this.clampScroll(); this.updateBoardPosition();
        };
        step();
    }
    updateCellFontSize() {
        const scaled = Math.min(1.4, Math.max(0.5, 0.82 / Math.sqrt(this.zoomLevel)));
        document.documentElement.style.setProperty('--cell-font-size', `${scaled.toFixed(3)}rem`);
    }

    /* ══ SCROLLING ═════════════════════════════════════════════ */
    setupScrolling() {
        const container = document.getElementById('zoom-container');
        const newC = container.cloneNode(false);
        const wrapper = document.getElementById('board-wrapper');
        newC.appendChild(wrapper);
        container.parentNode.replaceChild(newC, container);
        this._refreshScrollDims();
        if (!this._resizeListenerBound) {
            this._resizeListenerBound = true;
            window.addEventListener('resize', () => this._refreshScrollDims());
        }

        const handleStart = (x, y) => {
            if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
            this.isDragging=true; this.hasDragged=false;
            this.dragStartX=x; this.dragStartY=y;
            this.lastX=x; this.lastY=y; this.velocityX=0; this.velocityY=0;
        };
        const handleMove = (x, y) => {
            if (!this.isDragging) return;
            const dx = x-this.lastX, dy = y-this.lastY;
            if (Math.abs(x-this.dragStartX)>this.dragThreshold || Math.abs(y-this.dragStartY)>this.dragThreshold) this.hasDragged=true;
            if (this.hasDragged) {
                this.scrollX+=dx; this.scrollY+=dy;
                this.clampScroll(); this.updateBoardPosition();
                this.velocityX=dx*.8; this.velocityY=dy*.8;
            }
            this.lastX=x; this.lastY=y;
        };
        const handleEnd = () => {
            if (this.isDragging && this.hasDragged && (Math.abs(this.velocityX)>1 || Math.abs(this.velocityY)>1)) this.applyInertia();
            this.isDragging = false;
        };
        newC.addEventListener('touchstart', e => { if(e.touches.length===1) handleStart(e.touches[0].clientX,e.touches[0].clientY); }, {passive:true});
        newC.addEventListener('touchmove',  e => { if(e.touches.length===1) handleMove(e.touches[0].clientX,e.touches[0].clientY); }, {passive:true});
        newC.addEventListener('touchend',   handleEnd, {passive:true});
        newC.addEventListener('touchcancel',handleEnd, {passive:true});
        newC.addEventListener('mousedown',  e => handleStart(e.clientX,e.clientY));
        newC.addEventListener('mousemove',  e => handleMove(e.clientX,e.clientY));
        newC.addEventListener('mouseup',    handleEnd);
        newC.addEventListener('mouseleave', () => { this.isDragging=false; });
    }
    applyInertia() {
        const decay = .92;
        const animate = () => {
            if (Math.abs(this.velocityX)>.3 || Math.abs(this.velocityY)>.3) {
                this.scrollX+=this.velocityX; this.scrollY+=this.velocityY;
                this.clampScroll(); this.updateBoardPosition();
                this.velocityX*=decay; this.velocityY*=decay;
                this.animationId = requestAnimationFrame(animate);
            } else this.animationId = null;
        };
        this.animationId = requestAnimationFrame(animate);
    }
    _refreshScrollDims() {
        /* Cache container + board natural dimensions so the hot
         * drag/inertia/zoom loops don't force a synchronous layout
         * read (clientWidth/offsetWidth) on every single frame.        */
        const container = document.getElementById('zoom-container');
        const board = document.getElementById('game-board');
        this._scrollContainerEl = container;
        this._scrollBoardEl = board;
        if (container) { this._containerW = container.clientWidth; this._containerH = container.clientHeight; }
        if (board) { this._boardNaturalW = board.offsetWidth; this._boardNaturalH = board.offsetHeight; }
    }
    clampScroll() {
        if (this._containerW === undefined || this._boardNaturalW === undefined) this._refreshScrollDims();
        const cw = this._containerW, ch = this._containerH;
        const bw = this._boardNaturalW * this.zoomLevel, bh = this._boardNaturalH * this.zoomLevel;
        const pad=40;
        if (bw < cw) {
            const center = (cw - bw) / 2;
            this.scrollX = Math.max(center - pad, Math.min(center + pad, this.scrollX));
        } else {
            this.scrollX = Math.max(-(bw-cw+pad), Math.min(pad, this.scrollX));
        }
        if (bh < ch) {
            const center = (ch - bh) / 2;
            this.scrollY = Math.max(center - pad, Math.min(center + pad, this.scrollY));
        } else {
            this.scrollY = Math.max(-(bh-ch+pad), Math.min(pad, this.scrollY));
        }
    }
    updateBoardPosition() {
        const w = document.getElementById('board-wrapper');
        if (w) w.style.transform = `translate3d(${this.scrollX}px,${this.scrollY}px,0)`;
    }

    /* ══ BOARD SETUP ═══════════════════════════════════════════ */
    createFreshBoard() {
        this.board=[]; this.revealed=[]; this.flagged=[];
        this.gameOver=false; this.firstClick=true;
        this.timer=0; this.mode='dig'; this.circleMode=false;
        this.boardRingInset = 0;
        this.voidedCells = new Set();
        this.dormantMines = [];
        this.tsarArmed = false;
        this.diffusalCountdown = null;
        /* Diffusal Mine resets each board (unlike Totem, which is a
         * once-per-run consumable) so it can protect the player again
         * on a later board provided they still own it.                */
        this.bannedMineIds = (this.bannedMineIds || []).filter(id => id !== 'diffusal_mine');
        this.scrollX=0; this.scrollY=0; this.zoomLevel=1; this._zoomTarget=1; this._zoomAnimating=false;
        if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval=null; }

        for (let i=0; i<this.rows; i++) {
            this.board[i]=[]; this.revealed[i]=[]; this.flagged[i]=[];
            for (let j=0; j<this.cols; j++) { this.board[i][j]=0; this.revealed[i][j]=false; this.flagged[i][j]=false; }
        }
        const gb = document.getElementById('game-board');
        gb.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        gb.style.transform = 'scale(1)';
        gb.style.clipPath = '';
        gb.style.borderRadius = '';
        document.getElementById('zoom-level').textContent = '100%';
        this.updateCellFontSize(); this.updateBoardPosition();
        document.getElementById('dig-btn').classList.add('active');
        document.getElementById('flag-btn').classList.remove('active');
        this.renderBoard(); this.updateDisplay();
        this.renderMineHud();
        this._updateRunPtsHud();

        /* Auto fit board */
        this._autoFitBoard();

        /* Show style meter */
        this.styleMeter.reset(); this.styleMeter.show();
    }

    renderBoard() {
        const gb = document.getElementById('game-board'); gb.innerHTML = '';
        /* Build the DOM off-screen in a fragment (single reflow on
         * append) and cache every cell element in a 2D array so
         * getCell() never has to re-query the DOM during gameplay.       */
        const frag = document.createDocumentFragment();
        this.cellEls = [];
        for (let i=0; i<this.rows; i++) {
            const rowArr = [];
            for (let j=0; j<this.cols; j++) {
                const cell = document.createElement('button');
                cell.className = 'cell'; cell.dataset.row=i; cell.dataset.col=j;
                frag.appendChild(cell);
                rowArr.push(cell);
            }
            this.cellEls.push(rowArr);
        }
        gb.appendChild(frag);
        this._refreshScrollDims();
    }
    renderSavedState() {
        for (let i=0; i<this.rows; i++) for (let j=0; j<this.cols; j++) {
            const cell = this.getCell(i,j); if (!cell) continue;
            if (this.revealed[i][j]) {
                cell.classList.add('revealed');
                if (this.board[i][j] > 0) { cell.textContent=this.board[i][j]; cell.classList.add('n'+this.board[i][j]); }
            } else if (this.flagged[i][j]) { cell.classList.add('flagged'); cell.insertAdjacentHTML('beforeend', FLAG_SVG()); }
        }
        const dig = document.getElementById('dig-btn'), flag = document.getElementById('flag-btn');
        if (this.mode==='dig') { dig.classList.add('active'); flag.classList.remove('active'); }
        else { flag.classList.add('active'); dig.classList.remove('active'); }
        this.styleMeter.reset(); this.styleMeter.show();
    }

    /* ══ GAME EVENTS ═══════════════════════════════════════════ */
    bindGameEvents() {
        const gb = document.getElementById('game-board');
        const newGb = gb.cloneNode(true);
        gb.parentNode.replaceChild(newGb, gb);
        /* cloneNode(true) duplicates the cell buttons too, so any
         * previously cached cellEls now point at detached originals —
         * rebuild the cache from the live clone's children in one pass. */
        if (this.cellEls) {
            const liveCells = newGb.children;
            let idx = 0;
            for (let i=0; i<this.rows; i++) {
                for (let j=0; j<this.cols; j++) {
                    if (this.cellEls[i]) this.cellEls[i][j] = liveCells[idx];
                    idx++;
                }
            }
        }

        /* Unified pointer-event handling.
           The tap action fires on pointerdown via a one-frame microdefer so a
           true tap feels instant, while a quick swipe past MOVE_THR cancels it
           in favor of panning. Long-press still triggers the alternate action. */
        let longPressTimer=null, tapTimer=null;
        let pressedCell=null, pointerId=null;
        let pressX=0, pressY=0, isLongPress=false, actionFired=false;
        const LONG=400, MOVE_THR=10;

        const fireTap = () => {
            if (actionFired || !pressedCell || isLongPress) return;
            actionFired = true;
            const r=parseInt(pressedCell.dataset.row), c=parseInt(pressedCell.dataset.col);
            this.handleCellTap(r, c);
        };

        const clearTimers = () => {
            if (tapTimer)       { clearTimeout(tapTimer);       tapTimer=null; }
            if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer=null; }
        };

        const release = () => {
            clearTimers();
            if (pressedCell) pressedCell.classList.remove('pressed');
            pressedCell=null; pointerId=null;
            isLongPress=false; actionFired=false;
        };

        const onDown = e => {
            if (e.button !== undefined && e.button !== 0) return;
            const cell = e.target.closest('.cell');
            if (!cell) return;
            release();
            pressedCell = cell;
            pointerId   = e.pointerId;
            pressX = e.clientX; pressY = e.clientY;
            cell.classList.add('pressed');
            /* Fire on the next frame so a starting pan can cancel via pointermove. */
            tapTimer = setTimeout(fireTap, 0);
            longPressTimer = setTimeout(() => {
                if (actionFired || !pressedCell) return;
                isLongPress = true;
                pressedCell.classList.remove('pressed');
                const r=parseInt(pressedCell.dataset.row), c=parseInt(pressedCell.dataset.col);
                this.handleLongPress(r, c);
            }, LONG);
        };

        const onMove = e => {
            if (pointerId !== null && e.pointerId !== pointerId) return;
            if (!pressedCell || actionFired) return;
            if (Math.abs(e.clientX-pressX) > MOVE_THR || Math.abs(e.clientY-pressY) > MOVE_THR) {
                /* User is panning — cancel the pending tap & long-press. */
                clearTimers();
                pressedCell.classList.remove('pressed');
                pressedCell=null;
            }
        };

        const onUp = e => {
            if (pointerId !== null && e.pointerId !== pointerId) return;
            /* If the press was released before the deferred tap ran, fire now. */
            if (pressedCell && !actionFired && !isLongPress) {
                clearTimers();
                fireTap();
            }
            release();
        };

        newGb.addEventListener('pointerdown',   onDown);
        newGb.addEventListener('pointermove',   onMove);
        newGb.addEventListener('pointerup',     onUp);
        newGb.addEventListener('pointercancel', release);
        newGb.addEventListener('contextmenu',   e => e.preventDefault());

        document.getElementById('dig-btn').onclick = () => { this.mode='dig'; document.getElementById('dig-btn').classList.add('active'); document.getElementById('flag-btn').classList.remove('active'); this.sfx.play('btn'); };
        document.getElementById('flag-btn').onclick= () => { this.mode='flag'; document.getElementById('flag-btn').classList.add('active'); document.getElementById('dig-btn').classList.remove('active'); this.sfx.play('btn'); };

        const boardInd = document.getElementById('board-indicator');
        if (boardInd) {
            let circlePressTimer = null;
            boardInd.addEventListener('pointerdown', () => { circlePressTimer = setTimeout(() => { this._toggleCircleMode(); }, 900); });
            boardInd.addEventListener('pointerup',    () => clearTimeout(circlePressTimer));
            boardInd.addEventListener('pointerleave', () => clearTimeout(circlePressTimer));
        }
    }

    handleLongPress(r, c) {
        if (this.gameOver || this.revealed[r][c]) return;
        if (this.mode==='dig') this.toggleFlag(r, c);
        else if (!this.flagged[r][c]) this.digCell(r, c);
        this.updateDisplay(); this.saveCurrentBoardToRun();
    }

    handleCellTap(r, c) {
        if (this.gameOver) return;
        if (this.revealed[r][c]) {
            if (this.board[r][c] > 0) {
                if (this._tryQuickDig(r, c)) return;
                this._tryQuickFlag(r, c);
            }
            return;
        }
        if (this.mode==='dig') {
            if (this.flagged[r][c]) this.toggleFlag(r, c);
            else this.digCell(r, c);
        } else { this.toggleFlag(r, c); }
        this.updateDisplay(); this.saveCurrentBoardToRun();
    }

    _tryQuickDig(r, c) {
        if (!this.infiniteCoins) return false;
        const adj = this._getAdj(r, c);
        const flags = adj.filter(([ar,ac]) => this.flagged[ar][ac]).length;
        if (flags !== this.board[r][c]) return false;
        let revealed = 0;
        for (const [ar, ac] of adj) {
            if (!this.flagged[ar][ac] && !this.revealed[ar][ac]) {
                this.reveal(ar, ac); revealed++;
                if (this.gameOver) { this.updateDisplay(); this.saveCurrentBoardToRun(); return true; }
            }
        }
        if (revealed > 0) {
            const res = this.styleMeter.onAction('quickdig');
            if (res && res.hit69) this._unlockSecret('score_69');
            this._setBoardStyleScore(this.styleMeter.getScore());
            this.sfx.play('quickdig');
        }
        this.updateDisplay(); this.evaluateFlagCompletion(); this.saveCurrentBoardToRun();
        return true;
    }

    _tryQuickFlag(r, c) {
        if (!this.infiniteCoins) return false;
        const adj = this._getAdj(r, c);
        const flagCount = adj.filter(([ar,ac]) => this.flagged[ar][ac]).length;
        const unrevealed = adj.filter(([ar,ac]) => !this.revealed[ar][ac] && !this.flagged[ar][ac]);
        if (flagCount + unrevealed.length === this.board[r][c] && unrevealed.length > 0) {
            /* Stagger flag placements so the flag-pop animation never stacks on top of itself,
             * which previously caused the playing UI to briefly disappear during quick-flag. */
            unrevealed.forEach(([ar, ac], i) => {
                setTimeout(() => {
                    if (this.gameOver || this.flagged[ar][ac] || this.revealed[ar][ac]) return;
                    this.toggleFlag(ar, ac);
                    this.updateDisplay(); this.saveCurrentBoardToRun();
                }, i * 35);
            });
            return true;
        }
        return false;
    }

    _getAdj(r, c) {
        const adj = [];
        for (let di=-1; di<=1; di++) for (let dj=-1; dj<=1; dj++) {
            if (!di && !dj) continue;
            const nr=r+di, nc=c+dj;
            if (nr>=0 && nr<this.rows && nc>=0 && nc<this.cols) adj.push([nr, nc]);
        }
        return adj;
    }

    saveCurrentBoardToRun() {
        if (!this.runState || this.firstClick || this.gameOver) return;
        this.runState.boardState = {
            rows:this.rows, cols:this.cols, mines:this.mines,
            board:this.board, revealed:this.revealed, flagged:this.flagged,
            timer:this.timer, mode:this.mode, firstClick:this.firstClick,
            boardStyleScore:this.boardStyleScore, runStyleScore:this.runStyleScore
        };
        this._saveRunState();
    }

    digCell(r, c) {
        if (this.flagged[r][c]) return;
        const wasFirstClick = this.firstClick;
        if (this.firstClick) {
            this.firstClick=false; this.placeMines(r, c); this.startTimer();
            this.evaluateFlagCompletion();
            if (this.gameOver) return;
            this._checkKickstart(r, c);
        }
        this.sfx.play('dig');
        /* By default the guaranteed-safe first click of a board grants no
         * Style — only the Kickstart Mine (handled above) makes it count. */
        if (!wasFirstClick) {
            const res = this.styleMeter.onAction('dig');
            if (res && res.hit69) this._unlockSecret('score_69');
            this._setBoardStyleScore(this.styleMeter.getScore());
        }
        this.reveal(r, c, wasFirstClick);
    }

    _switchModeTo(mode) {
        if (this.mode === mode) return;
        this.mode = mode;
        const dig = document.getElementById('dig-btn'), flag = document.getElementById('flag-btn');
        if (dig && flag) {
            if (mode === 'dig') { dig.classList.add('active'); flag.classList.remove('active'); }
            else                { flag.classList.add('active'); dig.classList.remove('active'); }
        }
    }

    toggleFlag(r, c) {
        if (this.diffusalCountdown && this._tryDiffuse(r, c)) return;
        if (this.revealed[r][c]) return;
        const placingFlag = !this.flagged[r][c];
        this.flagged[r][c] = !this.flagged[r][c];
        const cell = this.getCell(r, c);
        if (cell) {
            cell.classList.toggle('flagged', this.flagged[r][c]);
            const ex = cell.querySelector('.cell-svg-icon'); if (ex) ex.remove();
            if (this.flagged[r][c]) { cell.insertAdjacentHTML('beforeend', FLAG_SVG()); this.sfx.play('flag'); this.playCellFx(cell, 'flag-pop'); }
            else this.sfx.play('unflag');
        }
        if (placingFlag) this.evaluateFlagCompletion();
    }

    allSafeTilesRevealed() {
        for (let i=0; i<this.rows; i++) for (let j=0; j<this.cols; j++) {
            if (this.board[i][j] !== -1 && !this.revealed[i][j]) return false;
        }
        return true;
    }
    allRequiredFlagsCorrect() {
        let flags = 0;
        for (let i=0; i<this.rows; i++) for (let j=0; j<this.cols; j++) {
            if (this.flagged[i][j]) { flags++; if (this.board[i][j] !== -1) return false; }
        }
        return flags === this.mines;
    }
    isBoardSolved() { return this.allSafeTilesRevealed() && this.allRequiredFlagsCorrect(); }

    evaluateFlagCompletion() {
        if (this.gameOver || this.firstClick) return;
        const flags = this.flagged.flat().filter(Boolean).length;
        if (flags === this.mines && !this.allRequiredFlagsCorrect()) { this.gameOver = true; this.endGame(); return; }
        if (this.isBoardSolved()) this.boardComplete();
    }

    placeMines(exR, exC) {
        let placed = 0;
        while (placed < this.mines) {
            const r = Math.floor(Math.random()*this.rows);
            const c = Math.floor(Math.random()*this.cols);
            if (this.board[r][c] !== -1 && !(Math.abs(r-exR)<=1 && Math.abs(c-exC)<=1)) {
                this.board[r][c]=-1; placed++;
            }
        }
        for (let i=0; i<this.rows; i++) for (let j=0; j<this.cols; j++)
            if (this.board[i][j] !== -1) this.board[i][j] = this._countAdj(i, j);
    }
    _countAdj(r, c) {
        let n=0;
        for (let di=-1; di<=1; di++) for (let dj=-1; dj<=1; dj++) {
            const nr=r+di, nc=c+dj;
            if (nr>=0&&nr<this.rows&&nc>=0&&nc<this.cols&&this.board[nr][nc]===-1) n++;
        }
        return n;
    }
    reveal(r, c, isFirstClickCascade = false) {
        if (r<0||r>=this.rows||c<0||c>=this.cols) return;
        if (this.revealed[r][c]||this.flagged[r][c]) return;
        this.revealed[r][c]=true;
        const cell = this.getCell(r, c);
        if (cell) {
            cell.classList.add('revealed');
            this.playCellFx(cell, 'reveal-pop');
        }
        if (this.board[r][c]===-1) {
            /* Check totem mine protection */
            if (this._checkTotemProtection(r, c)) return;
            /* Check diffusal mine protection (10s flag-the-mine countdown) */
            if (this._checkDiffusalProtection(r, c)) return;
            /* Fractal chain reaction — purely visual flourish before endGame.
             * Triggers when the dug-up mine sits inside any fractal's 3×3.  */
            this._triggerFractalChain(r, c);
            this.gameOver=true; this.endGame(); return;
        }
        if (this.board[r][c] > 0) {
            if (cell) { cell.textContent=this.board[r][c]; cell.classList.add('n'+this.board[r][c]); }
        } else {
            /* The guaranteed-safe cascade from the very first click of a
             * board grants no Style — cells opened by that initial reveal
             * shouldn't count, regardless of loadout (Kickstart grants its
             * own separate bonus via _checkKickstart, called once).        */
            if (!isFirstClickCascade) {
                const res = this.styleMeter.onAction('cascade');
                if (res && res.hit69) this._unlockSecret('score_69');
            }
            for (let di=-1;di<=1;di++) for (let dj=-1;dj<=1;dj++)
                if (di!==0||dj!==0) setTimeout(() => this.reveal(r+di,c+dj,isFirstClickCascade), 18);
        }
        this.sfx.play('reveal');
        this.evaluateFlagCompletion();
    }

    _checkKickstart(r, c) {
        /* Passive: grants an instant style/score kickstart on the very
         * first click of a board, once per board while charges remain. */
        const idx = this.playerMines.findIndex(m => m.id === 'kickstart_mine' && m.charges > 0 && !this.bannedMineIds.includes('kickstart_mine'));
        if (idx === -1) return;
        const mine = this.playerMines[idx];
        mine.charges--;
        this.renderMineHud();
        const res = this.styleMeter.onAction('cascade');
        if (res && res.hit69) this._unlockSecret('score_69');
        this.styleMeter.addScore(15);
        this._setBoardStyleScore(this.styleMeter.getScore());
        const cell = this.getCell(r, c);
        const rect = cell ? cell.getBoundingClientRect() : null;
        const cx = rect ? rect.left + rect.width/2 : window.innerWidth/2;
        const cy = rect ? rect.top + rect.height/2 : window.innerHeight/2;
        this.spawnExplosion(cx, cy, '#FF9800', 14);
        this._spawnStyleTriggerText('Kickstart!', '#FF9800');
        this.sfx.play('mine_place');
    }

    _checkDiffusalProtection(r, c) {
        /* Passive: if a Diffusal Mine is available, hitting a real mine
         * doesn't immediately end the run — instead a 10s countdown
         * starts. Flagging the EXACT mine tile within that window diffuses
         * it (+2 style ranks). Letting the countdown expire (or flagging
         * the wrong tile) ends the run as normal.                          */
        if (this.diffusalCountdown) return true; /* already mid-countdown, don't retrigger */
        const idx = this.playerMines.findIndex(m => m.id === 'diffusal_mine' && m.charges > 0 && !this.bannedMineIds.includes('diffusal_mine'));
        if (idx === -1) return false;
        const mine = this.playerMines[idx];
        mine.charges = 0;
        this.bannedMineIds.push('diffusal_mine');

        /* Undo the reveal while the countdown is live */
        this.revealed[r][c] = false;
        const cell = this.getCell(r, c);
        if (cell) cell.classList.remove('revealed');

        const cellRect = cell ? cell.getBoundingClientRect() : null;
        const cx = cellRect ? cellRect.left + cellRect.width/2 : window.innerWidth/2;
        const cy = cellRect ? cellRect.top + cellRect.height/2 : window.innerHeight/2;
        this.spawnExplosion(cx, cy, '#00BCD4', 16);
        this._spawnStyleTriggerText('Diffuse it! (10s)', '#00BCD4');
        this.sfx.play('totem_fx');
        if (cell) cell.classList.add('diffusal-armed');

        /* Live numeric countdown badge on the armed tile itself. */
        const badge = document.createElement('span');
        badge.className = 'diffusal-countdown-badge';
        badge.textContent = '10';
        if (cell) cell.appendChild(badge);
        const tickInterval = setInterval(() => {
            if (!this.diffusalCountdown) { clearInterval(tickInterval); return; }
            const remaining = Math.max(0, Math.ceil((this.diffusalCountdown.expiresAt - Date.now()) / 1000));
            badge.textContent = String(remaining);
        }, 200);

        this.diffusalCountdown = { r, c, expiresAt: Date.now() + 10000, tickInterval, badge };
        this.diffusalCountdown.timeout = setTimeout(() => {
            if (!this.diffusalCountdown) return;
            const { r: dr, c: dc, tickInterval: ti, badge: b } = this.diffusalCountdown;
            clearInterval(ti);
            if (b) b.remove();
            this.diffusalCountdown = null;
            const cEl = this.getCell(dr, dc);
            if (cEl) cEl.classList.remove('diffusal-armed');
            /* Countdown expired without diffusing: mine goes off for real. */
            this.revealed[dr][dc] = true;
            if (cEl) cEl.classList.add('revealed');
            this._triggerFractalChain(dr, dc);
            this.gameOver = true; this.endGame();
        }, 10000);

        this.renderMineHud();
        this.saveCurrentToSlot(this.currentSlot);
        return true;
    }

    _tryDiffuse(r, c) {
        /* Called from toggleFlag when a diffusal countdown is active. */
        if (!this.diffusalCountdown) return false;
        const { r: dr, c: dc, tickInterval, badge } = this.diffusalCountdown;
        if (r !== dr || c !== dc) return false;
        clearTimeout(this.diffusalCountdown.timeout);
        clearInterval(tickInterval);
        if (badge) badge.remove();
        this.diffusalCountdown = null;
        const cell = this.getCell(r, c);
        if (cell) cell.classList.remove('diffusal-armed');
        this.flagged[r][c] = false; /* leave the tile un-flagged/un-revealed, effectively defused */
        for (let i = 0; i < 2; i++) this.styleMeter._rankUp();
        this._setBoardStyleScore(this.styleMeter.getScore());
        const rect = cell ? cell.getBoundingClientRect() : null;
        const cx = rect ? rect.left + rect.width/2 : window.innerWidth/2;
        const cy = rect ? rect.top + rect.height/2 : window.innerHeight/2;
        this.spawnExplosion(cx, cy, '#00E5FF', 20);
        this._spawnStyleTriggerText('Diffused!', '#00E5FF');
        this.sfx.play('mine_place');
        this.saveCurrentToSlot(this.currentSlot);
        return true;
    }

    _checkTotemProtection(r, c) {
        /* Find an active totem mine in the loadout */
        const totemIdx = this.playerMines.findIndex(m => m.id === 'totem_mine' && m.charges > 0 && !this.bannedMineIds.includes('totem_mine'));
        if (totemIdx === -1) return false;

        /* Trigger totem: absorb the mine hit, then remove it from the loadout entirely */
        this.playerMines.splice(totemIdx, 1);
        this.bannedMineIds.push('totem_mine');
        this.totemTriggered = true;

        /* Visual effect */
        const cell = this.getCell(r, c);
        const cellRect = cell ? cell.getBoundingClientRect() : null;
        const cx = cellRect ? cellRect.left + cellRect.width/2 : window.innerWidth/2;
        const cy = cellRect ? cellRect.top + cellRect.height/2 : window.innerHeight/2;
        this.spawnExplosion(cx, cy, '#FFC107', 18);
        if (cell) {
            const shield = document.createElement('div');
            shield.className = 'totem-shield-fx';
            cell.appendChild(shield);
            setTimeout(() => shield.remove(), 800);
        }
        document.body.classList.add('runover-pulse');
        setTimeout(() => document.body.classList.remove('runover-pulse'), 600);
        this.sfx.play('totem_fx');

        /* Undo the reveal */
        this.revealed[r][c] = false;
        if (cell) { cell.classList.remove('revealed'); }

        this.renderMineHud();
        this.saveCurrentToSlot(this.currentSlot);
        return true;
    }

    getCell(r, c) {
        /* Cached 2D lookup instead of a fresh attribute-selector query
         * every call — getCell is invoked heavily during cascades,
         * explosions and mine effects, so this avoids re-scanning the
         * DOM (up to hundreds of cells on Hard boards) each time.       */
        if (this.cellEls && this.cellEls[r] && this.cellEls[r][c]) return this.cellEls[r][c];
        return document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
    }
    playCellFx(cell, cls) {
        if (!cell) return;
        cell.classList.remove(cls); void cell.offsetWidth; cell.classList.add(cls);
        setTimeout(() => cell.classList.remove(cls), 320);
    }
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timer++;
            document.getElementById('time').textContent = this.timer.toString().padStart(3,'0');
        }, 1000);
    }
    updateDisplay() {
        const flags = this.flagged.flat().filter(Boolean).length;
        document.getElementById('remaining').textContent = this.mines - flags;
        document.getElementById('time').textContent = this.timer.toString().padStart(3,'0');
    }
    endGame() {
        clearInterval(this.timerInterval); this.timerInterval=null;
        this.sfx.play('runover');
        document.body.classList.add('runover-pulse');
        setTimeout(() => document.body.classList.remove('runover-pulse'), 700);
        this.styleMeter.hide();
        this.feats.currentConsecutive=0; this._saveFeats();
        let correctFlags=0, delay=0;
        for (let i=0; i<this.rows; i++) for (let j=0; j<this.cols; j++) {
            const mine=this.board[i][j]===-1, flag=this.flagged[i][j];
            if (mine&&flag) { correctFlags++; }
            else if (mine&&!flag) {
                const d=delay;
                setTimeout(() => {
                    const c=this.getCell(i,j);
                    if (c) {
                        c.classList.add('mine'); c.classList.remove('flagged');
                        const ex=c.querySelector('.cell-svg-icon'); if(ex) ex.remove();
                        c.insertAdjacentHTML('beforeend', MINE_SVG());
                        /* Spawn small explosion per mine */
                        const rect = c.getBoundingClientRect();
                        this.spawnExplosion(rect.left + rect.width/2, rect.top + rect.height/2, '#f44336', 5);
                    }
                }, d);
                delay+=35;
            } else if (!mine&&flag) {
                const d=delay;
                setTimeout(() => { const c=this.getCell(i,j); if(c) c.classList.add('flag-wrong'); }, d);
                delay+=25;
            }
        }
        const boardNum = this.runState ? this.runState.currentBoard + 1 : 1;
        this.carouselIndex = 0;
        this._flushRunPointsToMain();
        this._clearRunState(); this.runState=null;
        /* NOTE: do NOT reset playerMines / loadout here — the user wants the
         * loadout to remain visible behind the run-over modal. The loadout is
         * cleared on the next startRun() call instead. */
        this.renderMineHud();
        const earned = this.awardPoints(correctFlags);
        const stylePts = this.styleMeter ? this.styleMeter.getScore() : 0;
        const styleRank = this.styleMeter ? this.styleMeter.getFinalRank() : 'D';
        const timerSnap = this.timer;
        setTimeout(() => {
            document.getElementById('modal-title').textContent = this.t('runOver','Run Over');
            const rankEl = document.getElementById('go-rank-badge-letter');
            if (rankEl) { rankEl.textContent = styleRank; rankEl.style.color = RANK_COLORS[styleRank]; }
            document.getElementById('go-time').textContent = this._formatTime(timerSnap);
            document.getElementById('go-spts-val').textContent = stylePts;
            document.getElementById('go-board-stat').textContent = `${boardNum}/${NUM_BOARDS}`;
            document.getElementById('go-flags-stat').textContent = `${correctFlags}`;
            document.getElementById('points-earned').textContent = earned > 0 ? `+${earned} ${this.t('points','points')}` : '';
            document.getElementById('game-over-modal').classList.add('show');
        }, Math.min(delay+300, 1400));
    }

    /* ══ CIRCLE MODE (secret) ══════════════════════════════════ */
    _toggleCircleMode() {
        this.circleMode = !this.circleMode;
        if (this.circleMode) { this._unlockSecret('circle_board'); this._applyCircleMode(); }
        else {
            document.querySelectorAll('.cell.circle-void').forEach(c => c.classList.remove('circle-void'));
            this._updateBoardClipPath();
        }
    }
    _applyCircleMode() {
        const cr = (this.rows-1)/2, cc = (this.cols-1)/2;
        const radius = Math.min(cr, cc) * 0.95;
        for (let i=0; i<this.rows; i++) for (let j=0; j<this.cols; j++) {
            const dist = Math.sqrt((i-cr)**2 + (j-cc)**2);
            const cell = this.getCell(i, j);
            if (cell) cell.classList.toggle('circle-void', dist > radius);
        }
        this._updateBoardClipPath();
    }

    /* ══ EASTER EGGS ═══════════════════════════════════════════ */
    _trackRedTheme() {
        const now = Date.now();
        this._redThemeClicks = this._redThemeClicks.filter(t => now-t < 1000);
        this._redThemeClicks.push(now);
        if (this._redThemeClicks.length >= 5) { this._redThemeClicks = []; this._triggerUltrakill(); }
    }
    _triggerUltrakill() {
        document.body.classList.add('ultrakill-flash', 'ultrakill-shake');
        setTimeout(() => document.body.classList.remove('ultrakill-flash', 'ultrakill-shake'), 1200);
        this.sfx.play('ultrakill'); this._unlockSecret('ultrakill');
    }
}


document.addEventListener('DOMContentLoaded', () => { new Minesweeper(); });
