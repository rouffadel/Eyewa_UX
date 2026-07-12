#!/usr/bin/env node
/**
 * Production Android build: ng build → cap sync android → Gradle.
 * Usage: node scripts/android-build.js [--debug|--release|--bundle]
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const isWin = process.platform === 'win32';

function run(label, cmd, args, opts = {}) {
  const cwd = opts.cwd || root;
  const env = { ...process.env, ...opts.env };
  const useShell = opts.shell ?? false;
  console.log(`\n=== ${label} ===\n`);
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: useShell, env });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const args = process.argv.slice(2);
const variant = args.includes('--bundle')
  ? 'bundleRelease'
  : args.includes('--release')
    ? 'assembleRelease'
    : 'assembleDebug';

const outputs = {
  assembleDebug: 'android/app/build/outputs/apk/debug/app-debug.apk',
  assembleRelease: 'android/app/build/outputs/apk/release/app-release.apk',
  bundleRelease: 'android/app/build/outputs/bundle/release/app-release.aab',
};

run('Step 1/3 — Angular production build', isWin ? 'npm.cmd' : 'npm', ['run', 'build'], {
  shell: isWin,
});
run('Step 2/3 — Capacitor sync (android)', isWin ? 'npx.cmd' : 'npx', ['cap', 'sync', 'android'], {
  shell: isWin,
});

const androidDir = path.join(root, 'android');
const gradlew = path.join(androidDir, isWin ? 'gradlew.bat' : 'gradlew');
if (!fs.existsSync(gradlew)) {
  console.error('Android project missing. Run: npx cap add android');
  process.exit(1);
}

const env = { ...process.env };
if (isWin && !env.ANDROID_HOME) {
  const sdk = path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
  if (fs.existsSync(sdk)) {
    env.ANDROID_HOME = sdk;
  }
}

if (isWin) {
  run(`Step 3/3 — Gradle ${variant}`, 'cmd.exe', ['/c', gradlew, variant], {
    cwd: androidDir,
    env,
    shell: false,
  });
} else {
  run(`Step 3/3 — Gradle ${variant}`, gradlew, [variant], { cwd: androidDir, env, shell: false });
}

const outputPath = path.join(root, outputs[variant]);
console.log('\n=== Build complete ===');
console.log(`Output: ${outputPath}`);
