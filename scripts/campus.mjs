#!/usr/bin/env node
// Campus tool: create, run and build a branded ComradeConnect app for a specific campus.
//
//   npm run campus -- list
//   npm run campus -- new <id> "<App name>" "<Campus name>"
//   npm run campus -- dev <id>
//   npm run campus -- build <id>
//   npm run campus -- android <id>            (apply branding, build web app, sync Android project)
//   npm run campus -- apk <id> [--release]    (all of the above, then build the APK with Gradle)
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { CAMPUSES_DIR, ROOT, listCampuses, loadCampus } from './campus-config.mjs';

const isWindows = process.platform === 'win32';
const [command, id, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter((a) => a.startsWith('--')));
const args = rest.filter((a) => !a.startsWith('--'));

function run(cmd, cmdArgs, options = {}) {
  console.log(`\n> ${cmd} ${cmdArgs.join(' ')}`);
  const result = spawnSync(cmd, cmdArgs, { stdio: 'inherit', shell: isWindows, cwd: ROOT, ...options });
  if (result.status !== 0) {
    console.error(`\nCommand failed: ${cmd} ${cmdArgs.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

function requireId() {
  if (!id) {
    console.error(`Missing campus id. Available campuses: ${listCampuses().join(', ')}`);
    process.exit(1);
  }
  return loadCampus(id);
}

const withCampus = (campus) => ({ env: { ...process.env, CAMPUS: campus.id } });
const fileSafe = (s) => s.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');

function buildWeb(campus) {
  run('npx', ['vite', 'build'], withCampus(campus));
}

async function applyAndroid(campus) {
  console.log(`\nApplying "${campus.appName}" (${campus.android.appId}) to the Android project…`);

  const props = {
    appId: campus.android.appId,
    appName: campus.appName,
    versionCode: campus.android.versionCode,
    versionName: campus.android.versionName,
    primaryColor: campus.theme.primary,
    backgroundColor: campus.theme.background,
  };
  // Properties files are ISO-8859-1 by spec; escape anything outside ASCII so names like "Égerton" survive.
  const escape = (v) =>
    String(v).replace(/[\\:=]/g, '\\$&').replace(/[^\x20-\x7e]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
  writeFileSync(
    join(ROOT, 'android', 'campus.properties'),
    `# Generated from campuses/${campus.id}/campus.json. Do not edit.\n` +
      Object.entries(props)
        .map(([k, v]) => `${k}=${escape(v)}`)
        .join('\n') +
      '\n',
  );

  writeFileSync(
    join(ROOT, 'capacitor.config.json'),
    `${JSON.stringify({ appId: campus.android.appId, appName: campus.appName, webDir: 'dist' }, null, 2)}\n`,
  );

  // Launcher icons and splash screens from the campus logo (falls back to campuses/default/logo.png).
  // capacitor-assets resolves --assetPath relative to the project root.
  const assetPath = 'node_modules/.campus-assets';
  mkdirSync(join(ROOT, assetPath), { recursive: true });
  copyFileSync(campus.logoPath, join(ROOT, assetPath, 'logo.png'));
  const icon = join(ROOT, 'android', 'app', 'src', 'main', 'res', 'mipmap-xxxhdpi', 'ic_launcher.png');
  const startedAt = Date.now() - 1000;
  run('npx', [
    'capacitor-assets',
    'generate',
    '--android',
    '--assetPath',
    assetPath,
    '--iconBackgroundColor',
    campus.theme.primary,
    '--iconBackgroundColorDark',
    campus.theme.primary,
    '--splashBackgroundColor',
    campus.theme.background,
    '--splashBackgroundColorDark',
    campus.theme.background,
  ]);
  // capacitor-assets exits 0 even when it fails, so check that icons were actually written.
  if (!existsSync(icon) || statSync(icon).mtimeMs < startedAt) {
    throw new Error('Launcher icons were not generated. Check the capacitor-assets output above.');
  }
  await writeLegacyIcons(campus);
}

// capacitor-assets leaves pre-Android 8 icons transparent in single-logo mode; draw them on the brand colour.
async function writeLegacyIcons(campus) {
  const sizes = { ldpi: 36, mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const [density, size] of Object.entries(sizes)) {
    const dir = join(ROOT, 'android', 'app', 'src', 'main', 'res', `mipmap-${density}`);
    mkdirSync(dir, { recursive: true });
    const logo = await sharp(campus.logoPath).resize(Math.round(size * 0.62)).toBuffer();
    for (const [name, radius] of [
      ['ic_launcher.png', size * 0.18],
      ['ic_launcher_round.png', size / 2],
    ]) {
      const shape = Buffer.from(
        `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${campus.theme.primary}"/></svg>`,
      );
      await sharp(shape).composite([{ input: logo, gravity: 'center' }]).png().toFile(join(dir, name));
    }
  }
}

async function syncAndroid(campus) {
  await applyAndroid(campus);
  buildWeb(campus);
  run('npx', ['cap', 'sync', 'android']);
}

async function buildApk(campus) {
  const release = flags.has('--release');
  await syncAndroid(campus);

  if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT && !existsSync(join(ROOT, 'android', 'local.properties'))) {
    console.error('\nAndroid SDK not found. Install Android Studio, or set ANDROID_HOME to your SDK folder.');
    process.exit(1);
  }
  if (release && !process.env.CC_KEYSTORE_FILE) {
    console.warn('\nCC_KEYSTORE_FILE is not set: the release build will be unsigned and cannot be installed as-is.');
  }

  const tasks = release ? ['assembleRelease', 'bundleRelease'] : ['assembleDebug'];
  const androidDir = join(ROOT, 'android');
  if (isWindows) run('gradlew.bat', tasks, { cwd: androidDir });
  else run('sh', ['./gradlew', ...tasks], { cwd: androidDir });

  const outDir = join(ROOT, 'release', campus.id);
  mkdirSync(outDir, { recursive: true });
  const base = `${fileSafe(campus.appName)}-${campus.android.versionName}`;
  const outputs = [];
  const collect = (dir, ext) => {
    if (!existsSync(dir)) return;
    for (const f of readdirSync(dir).filter((n) => n.endsWith(ext))) {
      const suffix = f.includes('unsigned') ? '-unsigned' : '';
      const target = join(outDir, `${base}-${release ? 'release' : 'debug'}${suffix}${ext}`);
      copyFileSync(join(dir, f), target);
      outputs.push(target);
    }
  };
  const buildDir = join(androidDir, 'app', 'build', 'outputs');
  collect(join(buildDir, 'apk', release ? 'release' : 'debug'), '.apk');
  if (release) collect(join(buildDir, 'bundle', 'release'), '.aab');

  console.log(`\nDone. Output:\n${outputs.map((o) => `  ${o}`).join('\n')}`);
}

function createCampus() {
  if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    console.error('Usage: npm run campus -- new <id> "<App name>" "<Campus name>"   (id: lowercase letters, numbers, dashes)');
    process.exit(1);
  }
  const dir = join(CAMPUSES_DIR, id);
  if (existsSync(dir)) {
    console.error(`campuses/${id} already exists.`);
    process.exit(1);
  }
  const campusName = args[1] || id.toUpperCase();
  const appName = args[0] || `${campusName} Connect`;
  // A dedicated app for one university: it opens straight into that university (no picker).
  const config = {
    appName,
    university: id,
    tagline: `The ${campusName} marketplace for students, merchants and traders.`,
    android: {
      appId: `com.komradi.${id.replace(/-/g, '_').replace(/^(\d)/, 'c$1')}`,
      versionName: '1.0.0',
      versionCode: 1,
    },
    theme: { primary: '#0071e3', background: '#000000' },
  };
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'campus.json'), `${JSON.stringify(config, null, 2)}\n`);
  loadCampus(id);
  console.log(`Created campuses/${id}/campus.json. It opens straight into the university with id "${id}",
which the super admin must create in the app first. Optionally add campuses/${id}/logo.png, then run:
  npm run campus -- dev ${id}
  npm run campus -- apk ${id}`);
}

try {
  switch (command) {
    case 'list':
      for (const c of listCampuses().map((name) => loadCampus(name))) {
        console.log(`${c.id.padEnd(16)} ${c.appName.padEnd(24)} ${c.android.appId}`);
      }
      break;
    case 'new':
      createCampus();
      break;
    case 'dev':
      run('npx', ['vite'], withCampus(requireId()));
      break;
    case 'build':
      buildWeb(requireId());
      break;
    case 'android':
      await syncAndroid(requireId());
      console.log('\nAndroid project ready. Open it with: npx cap open android');
      break;
    case 'apk':
      await buildApk(requireId());
      break;
    default:
      console.log(readmeUsage());
      process.exit(command ? 1 : 0);
  }
} catch (err) {
  console.error(`\n${err.message}`);
  process.exit(1);
}

function readmeUsage() {
  return `Usage: npm run campus -- <command> [campus]

  list                         Show all campuses
  new <id> "<App>" "<Campus>"  Create campuses/<id>/campus.json
  dev <id>                     Run the web app for a campus
  build <id>                   Build the web app for a campus into dist/
  android <id>                 Brand + sync the Android project (then: npx cap open android)
  apk <id> [--release]         Build an installable APK into release/<id>/`;
}
