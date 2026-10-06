// Downloads a picture from another website so the app can keep its own copy.
// Browsers often aren't allowed to read pictures from other sites (Pinterest, Instagram, most CDNs),
// so the app asks this function instead. It accepts a picture's address or a page's address
// (a Pinterest pin, an article): for pages it finds the page's main picture.
import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import zlib from 'node:zlib';

const MAX_DOWNLOAD = 25 * 1024 * 1024;  // refuse anything bigger than this from the source
const MAX_REPLY = 4 * 1024 * 1024;      // Vercel caps a response at 4.5 MB
const MAX_SIDE = 2400;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

// Never fetch from private or local networks.
const blocked = new net.BlockList();
for(const [a, p] of [['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 3]]) blocked.addSubnet(a, p, 'ipv4');
for(const [a, p] of [['::', 128], ['::1', 128], ['2001:db8::', 32], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8]]) blocked.addSubnet(a, p, 'ipv6');
// IPv6 forms that wrap an IPv4 address (::ffff:a.b.c.d, 64:ff9b::a.b.c.d) are checked as that IPv4 address.
// (Adding those prefixes to the BlockList would also match every plain IPv4 address.)
export function isBlocked(address, family){
  const wrapped = family === 6 && /^(::ffff:|64:ff9b::)(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  if(wrapped) return blocked.check(wrapped[2], 'ipv4');
  if(family === 6 && /^(::ffff:|64:ff9b::)/i.test(address)) return true;
  return blocked.check(address, family === 6 ? 'ipv6' : 'ipv4');
}

// DNS lookup used for every connection, so a site can't point us at a private address.
function safeLookup(hostname, options, callback){
  dns.lookup(hostname, { all: true, verbatim: true }, (err, addrs) => {
    if(err) return callback(err);
    if(!addrs.length || addrs.some(a => isBlocked(a.address, a.family))) return callback(Object.assign(new Error('blocked address'), { code: 'EBLOCKED' }));
    if(options && options.all) return callback(null, addrs);
    callback(null, addrs[0].address, addrs[0].family);
  });
}

function allowedURL(s){
  try {
    const u = new URL(s);
    if(!(u.protocol === 'https:' || u.protocol === 'http:') || (u.port && u.port !== '80' && u.port !== '443') || u.username || u.password) return null;
    // Addresses written as numbers skip the DNS lookup, so check them here.
    const host = u.hostname.replace(/^\[|\]$/g, ''), family = net.isIP(host);
    return family && isBlocked(host, family) ? null : u;
  } catch(e){ return null; }
}

function request(u, accept){
  return new Promise((resolve, reject) => {
    const req = (u.protocol === 'https:' ? https : http).request(u, {
      method: 'GET', lookup: safeLookup, timeout: 10000,
      headers: { 'User-Agent': UA, 'Accept': accept, 'Accept-Language': 'en-US,en;q=0.9', 'Accept-Encoding': 'gzip, deflate, br', 'Referer': u.origin + '/' }
    }, resolve);
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}

// Follows up to 5 redirects; each hop is checked again.
async function open(url, accept){
  let u = allowedURL(url);
  for(let hop = 0; u && hop < 6; hop++){
    const res = await request(u, accept);
    if(res.statusCode >= 300 && res.statusCode < 400 && res.headers.location){
      res.resume();
      u = allowedURL(new URL(res.headers.location, u).href);
      continue;
    }
    if(res.statusCode !== 200){ res.resume(); return null; }
    return { res, url: u.href };
  }
  return null;
}

async function readAll(res, limit){
  const enc = String(res.headers['content-encoding'] || '').toLowerCase();
  const stream = enc === 'gzip' ? res.pipe(zlib.createGunzip()) : enc === 'br' ? res.pipe(zlib.createBrotliDecompress()) : enc === 'deflate' ? res.pipe(zlib.createInflate()) : res;
  const chunks = []; let size = 0;
  for await (const c of stream){
    size += c.length;
    if(size > limit){ res.destroy(); throw Object.assign(new Error('too large'), { code: 'TOO_LARGE' }); }
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}

// Recognises a picture by its first bytes, since some sites label pictures wrongly.
function sniff(b, declared){
  const ascii = (s, e) => b.subarray(s, e).toString('latin1');
  if(b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if(ascii(0, 8) === '\x89PNG\r\n\x1a\n') return 'image/png';
  if(ascii(0, 4) === 'GIF8') return 'image/gif';
  if(ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if(ascii(4, 8) === 'ftyp' && /^(avif|avis|heic|heix|mif1|msf1)/.test(ascii(8, 12))) return ascii(8, 12).startsWith('avi') ? 'image/avif' : 'image/heic';
  if(ascii(0, 2) === 'BM') return 'image/bmp';
  if(/^(II\*\0|MM\0\*)/.test(ascii(0, 4))) return 'image/tiff';
  if(/svg/i.test(declared) && /<svg[\s>]/i.test(ascii(0, 2048))) return 'image/svg+xml';
  return null;
}

const decode = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

// Finds a page's main picture: og:image, twitter:image, or <link rel="image_src">.
function pagePicture(html, base){
  const found = {};
  for(const tag of html.match(/<(meta|link)\b[^>]*>/gi) || []){
    const attrs = {};
    for(const m of tag.matchAll(/([a-zA-Z:_-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g)) attrs[m[1].toLowerCase()] = decode(m[3] ?? m[4] ?? m[5] ?? '');
    const key = (attrs.property || attrs.name || attrs.rel || '').toLowerCase();
    const val = attrs.content || attrs.href;
    if(val && !found[key]) found[key] = val;
  }
  const pick = found['og:image:secure_url'] || found['og:image'] || found['og:image:url'] || found['twitter:image'] || found['twitter:image:src'] || found['image_src'];
  try { return pick ? new URL(pick, base).href : null; } catch(e){ return null; }
}

// Pinterest grid pictures are small thumbnails (e.g. /236x/); try the full-size versions first.
function sizeUpgrades(url){
  const u = allowedURL(url);
  if(!u || u.hostname !== 'i.pinimg.com' || !/^\/\d+x\d*\//.test(u.pathname)) return [];
  return ['originals', '736x'].map(size => { const v = new URL(u); v.pathname = u.pathname.replace(/^\/\d+x\d*\//, '/' + size + '/'); return v.href; });
}

async function loadPicture(url, allowPage){
  for(const better of sizeUpgrades(url)){
    try { const pic = await loadPicture(better, false); if(pic) return pic; } catch(e){}
  }
  const got = await open(url, 'image/avif,image/webp,image/apng,image/*,text/html;q=0.9,*/*;q=0.8');
  if(!got) return null;
  const declared = String(got.res.headers['content-type'] || '').toLowerCase();
  if(declared.includes('text/html') || declared.includes('application/xhtml')){
    if(!allowPage){ got.res.resume(); return null; }
    const html = (await readAll(got.res, 3 * 1024 * 1024)).toString('utf8');
    const pic = pagePicture(html, got.url);
    return pic ? loadPicture(pic, false) : null;
  }
  const bytes = await readAll(got.res, MAX_DOWNLOAD);
  const type = sniff(bytes, declared);
  return type ? { bytes, type, url: got.url } : null;
}

// Keeps the original when it's small and widely supported; otherwise shrinks or converts it.
async function prepare(pic){
  const simple = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'].includes(pic.type);
  if(simple && pic.bytes.length <= MAX_REPLY && (pic.type === 'image/svg+xml' || pic.type === 'image/gif')) return pic;
  const { default: sharp } = await import('sharp');
  const meta = await sharp(pic.bytes).metadata();
  if(simple && pic.bytes.length <= MAX_REPLY && Math.max(meta.width || 0, meta.height || 0) <= 4000) return pic;
  for(const [side, quality] of [[MAX_SIDE, 86], [1800, 80], [1400, 72]]){
    const img = sharp(pic.bytes).rotate().resize({ width: side, height: side, fit: 'inside', withoutEnlargement: true });
    const bytes = meta.hasAlpha ? await img.webp({ quality }).toBuffer() : await img.jpeg({ quality, mozjpeg: true }).toBuffer();
    if(bytes.length <= MAX_REPLY) return { bytes, type: meta.hasAlpha ? 'image/webp' : 'image/jpeg', url: pic.url };
  }
  return null;
}

const fail = (status, error) => new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export async function GET(request){
  // Only the app itself may use this, not other websites.
  if(request.headers.get('sec-fetch-site') === 'cross-site') return fail(403, 'forbidden');
  const target = new URL(request.url).searchParams.get('url');
  if(!target || !allowedURL(target)) return fail(400, 'bad_url');
  let timer;
  try {
    const pic = await Promise.race([loadPicture(target, true), new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('timeout')), 25000); })]);
    if(!pic) return fail(422, 'no_picture');
    const out = await prepare(pic);
    if(!out) return fail(413, 'too_large');
    return new Response(out.bytes, { headers: { 'Content-Type': out.type, 'Cache-Control': 'private, max-age=86400', 'X-Picture-Source': out.url } });
  } catch(e){
    console.error('image fetch failed', target, e && (e.code || e.message));
    return fail(e && e.code === 'TOO_LARGE' ? 413 : 502, e && e.code === 'TOO_LARGE' ? 'too_large' : 'unreachable');
  } finally { clearTimeout(timer); }
}
