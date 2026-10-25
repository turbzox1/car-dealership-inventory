// Collects freely licensed photos for the sample vehicles from Wikimedia Commons.
//
//   node scripts/fetch-vehicle-photos.mjs   ->  writes prisma/vehicle-photos.json
//
// For each model: the lead image of its Wikipedia article (usually a current,
// clean exterior shot) plus up to 3 recent Commons photos. Only CC0 / public
// domain / CC BY / CC BY-SA images are kept, and each keeps its author, license
// and source page so the app can credit it, as those licenses require.
// Images are hot-linked from upload.wikimedia.org; nothing is downloaded.

import { writeFileSync } from 'node:fs';

const USER_AGENT = 'AutoVaultDemo/1.0 (car dealership kata; contact: you@example.com)';
const PER_VEHICLE = 4;
const FREE_LICENSE = /^(CC0|Public domain|PD|CC BY(-SA)? \d)/i;

// make, model, Wikipedia article, Commons search phrase
const VEHICLES = [
  ['Toyota', 'Camry', 'Toyota Camry', 'Toyota Camry'],
  ['Honda', 'Civic', 'Honda Civic (eleventh generation)', 'Honda Civic sedan'],
  ['Hyundai', 'Sonata', 'Hyundai Sonata', 'Hyundai Sonata'],
  ['BMW', '3 Series', 'BMW 3 Series (G20)', 'BMW 3 Series G20'],
  ['Mercedes-Benz', 'C-Class', 'Mercedes-Benz C-Class (W206)', 'Mercedes-Benz C-Class W206'],
  ['Honda', 'CR-V', 'Honda CR-V', 'Honda CR-V'],
  ['Toyota', 'RAV4', 'Toyota RAV4 (XA50)', 'Toyota RAV4 XA50'],
  ['Mazda', 'CX-5', 'Mazda CX-5', 'Mazda CX-5'],
  ['Kia', 'Telluride', 'Kia Telluride', 'Kia Telluride'],
  ['Jeep', 'Grand Cherokee', 'Jeep Grand Cherokee (WL)', 'Jeep Grand Cherokee WL'],
  ['Volvo', 'XC90', 'Volvo XC90', 'Volvo XC90'],
  ['Ford', 'F-150', 'Ford F-Series (fourteenth generation)', 'Ford F-150'],
  ['Chevrolet', 'Silverado 1500', 'Chevrolet Silverado', 'Chevrolet Silverado 1500'],
  ['Ram', '1500', 'Ram pickup', 'Ram 1500'],
  ['Toyota', 'Tacoma', 'Toyota Tacoma', 'Toyota Tacoma'],
  ['Volkswagen', 'Golf', 'Volkswagen Golf Mk8', 'Volkswagen Golf Mk8'],
  ['Mazda', 'Mazda3 Hatchback', 'Mazda3', 'Mazda3 hatchback'],
  ['Toyota', 'GR Corolla', 'Toyota GR Corolla', 'Toyota GR Corolla'],
  ['Honda', 'Civic Type R', 'Honda Civic Type R', 'Honda Civic Type R FL5'],
  ['BMW', '4 Series', 'BMW 4 Series (G22)', 'BMW 4 Series G22'],
  ['Ford', 'Mustang', 'Ford Mustang (seventh generation)', 'Ford Mustang S650'],
  ['Chevrolet', 'Corvette Stingray', 'Chevrolet Corvette (C8)', 'Chevrolet Corvette C8'],
  ['Toyota', 'GR86', 'Toyota 86', 'Toyota GR86'],
  ['Mazda', 'MX-5 Miata', 'Mazda MX-5 (ND)', 'Mazda MX-5 ND'],
  ['Porsche', '718 Boxster', 'Porsche Boxster and Cayman', 'Porsche 718 Boxster'],
  ['BMW', 'Z4', 'BMW Z4 (G29)', 'BMW Z4 G29'],
  ['Mini', 'Cooper Convertible', 'Mini Hatch', 'Mini Cooper Convertible'],
  ['Chrysler', 'Pacifica', 'Chrysler Pacifica (minivan)', 'Chrysler Pacifica'],
  ['Honda', 'Odyssey', 'Honda Odyssey (North America)', 'Honda Odyssey'],
  ['Toyota', 'Sienna', 'Toyota Sienna', 'Toyota Sienna'],
  ['Kia', 'Carnival', 'Kia Carnival', 'Kia Carnival'],
  ['Tesla', 'Model 3', 'Tesla Model 3', 'Tesla Model 3'],
  ['Tesla', 'Model Y', 'Tesla Model Y', 'Tesla Model Y'],
  ['Hyundai', 'Ioniq 5', 'Hyundai Ioniq 5', 'Hyundai Ioniq 5'],
  ['Ford', 'Mustang Mach-E', 'Ford Mustang Mach-E', 'Ford Mustang Mach-E'],
  ['Rivian', 'R1S', 'Rivian R1S', 'Rivian R1S'],
  ['Kia', 'EV6', 'Kia EV6', 'Kia EV6'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(host, params) {
  const url = new URL(`https://${host}/w/api.php`);
  for (const [k, v] of Object.entries({ format: 'json', formatversion: '2', ...params })) url.searchParams.set(k, v);
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (res.ok) return res.json();
    if (attempt === 3) throw new Error(`${res.status} for ${url}`);
    await sleep(1500 * attempt);
  }
}

const stripHtml = (s = '') => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/** Turns a Commons imageinfo record into our photo shape, or null if unusable. */
function toPhoto(page) {
  const info = page.imageinfo?.[0];
  if (!info) return null;
  const meta = info.extmetadata ?? {};
  const license = stripHtml(meta.LicenseShortName?.value);
  if (!FREE_LICENSE.test(license)) return null;
  if (!/\.(jpe?g|png|webp)$/i.test(page.title)) return null;
  if (info.width < 1200 || info.width < info.height) return null; // landscape, reasonably large
  // Drop Wikimedia's tracking query string; the bare thumbnail URL is stable
  const url = info.thumburl.split('?')[0];
  return {
    url,
    // Wikimedia only serves standard thumbnail widths (e.g. 330, 500, 960, 1280)
    thumbUrl: url.replace(/\/\d+px-/, '/500px-'),
    title: page.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, ''),
    author: stripHtml(meta.Artist?.value) || 'Unknown author',
    license,
    licenseUrl: meta.LicenseUrl?.value ?? null,
    sourceUrl: info.descriptionurl,
  };
}

const IMAGE_PROPS = {
  prop: 'imageinfo',
  iiprop: 'url|size|extmetadata',
  iiurlwidth: '1280',
  iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl',
};

async function leadImage(article) {
  const page = (await api('en.wikipedia.org', { action: 'query', titles: article, redirects: '1', prop: 'pageimages', piprop: 'name' }))
    .query?.pages?.[0];
  if (!page?.pageimage) return null;
  const file = (await api('commons.wikimedia.org', { action: 'query', titles: `File:${page.pageimage}`, ...IMAGE_PROPS })).query?.pages?.[0];
  return file ? toPhoto(file) : null;
}

/** Recent photos: titles mentioning a 2019+ model year, or no year at all. */
async function galleryImages(search, model) {
  const result = await api('commons.wikimedia.org', {
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: `${search} filetype:bitmap`,
    gsrlimit: '30',
    ...IMAGE_PROPS,
  });
  const modelWord = model.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  return (result.query?.pages ?? [])
    .sort((a, b) => a.index - b.index)
    .filter((p) => {
      const title = p.title.toLowerCase();
      const years = [...title.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => Number(m[0]));
      const recent = years.length === 0 || years.some((y) => y >= 2019);
      return recent && title.replace(/[^a-z0-9]/g, '').includes(modelWord) && !/interior|engine|badge|logo|dashboard/.test(title);
    })
    .map(toPhoto)
    .filter(Boolean);
}

const output = {};
for (const [make, model, article, search] of VEHICLES) {
  const photos = [];
  const lead = await leadImage(article).catch(() => null);
  if (lead) photos.push(lead);
  for (const photo of await galleryImages(search, model).catch(() => [])) {
    if (photos.length >= PER_VEHICLE) break;
    if (!photos.some((p) => p.sourceUrl === photo.sourceUrl)) photos.push(photo);
  }
  output[`${make}|${model}`] = photos;
  console.log(`${String(photos.length).padStart(1)} photo(s)  ${make} ${model}${lead ? '' : '  (no lead image)'}`);
  await sleep(300); // be polite to the API
}

writeFileSync(new URL('../prisma/vehicle-photos.json', import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
console.log(`\nWrote ${Object.values(output).flat().length} photos for ${VEHICLES.length} vehicles to prisma/vehicle-photos.json`);
