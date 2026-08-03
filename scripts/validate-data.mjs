// Validates the JSON data files the site renders from. Run by .worktree-verify.
// Usage: node scripts/validate-data.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

function readJson(relPath) {
    const abs = join(root, relPath);
    try {
        return JSON.parse(readFileSync(abs, 'utf8'));
    } catch (e) {
        errors.push(`${relPath}: not valid JSON — ${e.message}`);
        return null;
    }
}

function validateBirthdays() {
    const data = readJson('birthdays.json');
    if (data === null) return;
    if (!Array.isArray(data)) {
        errors.push('birthdays.json: expected a top-level array');
        return;
    }

    const currentYear = new Date().getFullYear();
    const seen = new Map();

    data.forEach((entry, i) => {
        const where = `birthdays.json[${i}]`;
        if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
            errors.push(`${where}: expected an object`);
            return;
        }
        if (typeof entry.name !== 'string' || entry.name.trim() === '') {
            errors.push(`${where}: "name" must be a non-empty string`);
        }
        if (typeof entry.date !== 'string' || !/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(entry.date)) {
            errors.push(`${where} (${entry.name}): "date" must be "MM-DD", got ${JSON.stringify(entry.date)}`);
        } else {
            const [month, day] = entry.date.split('-').map(Number);
            // Feb 29 is allowed; the pages format month/day against a leap year.
            const maxDay = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
            if (day > maxDay) {
                errors.push(`${where} (${entry.name}): ${entry.date} is not a real date`);
            }
        }
        // "year" is optional. When present it must be a plausible 4-digit integer.
        if ('year' in entry) {
            if (!Number.isInteger(entry.year) || entry.year < 1800 || entry.year > currentYear) {
                errors.push(`${where} (${entry.name}): "year" must be an integer between 1800 and ${currentYear}, got ${JSON.stringify(entry.year)}`);
            } else if (entry.year % 4 !== 0 && entry.date === '02-29') {
                errors.push(`${where} (${entry.name}): 02-29 with non-leap year ${entry.year}`);
            }
        }
        const known = Object.keys(entry).filter(k => !['name', 'date', 'year'].includes(k));
        if (known.length > 0) {
            errors.push(`${where} (${entry.name}): unexpected field(s) ${known.join(', ')}`);
        }

        const key = `${entry.name}|${entry.date}`;
        if (seen.has(key)) {
            errors.push(`${where} (${entry.name}): duplicate of entry [${seen.get(key)}] — same name and date`);
        } else {
            seen.set(key, i);
        }
    });

    if (errors.length === 0) {
        const withYear = data.filter(e => 'year' in e).length;
        console.log(`birthdays.json: ${data.length} entries OK (${withYear} with a birth year)`);
    }
}

function validateSimpleJson(relPath) {
    const data = readJson(relPath);
    if (data !== null) {
        console.log(`${relPath}: valid JSON`);
    }
}

validateBirthdays();
validateSimpleJson('slideshow_data.json');
validateSimpleJson('voicemails.json');

if (errors.length > 0) {
    console.error(`\n${errors.length} problem(s) found:`);
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
}
console.log('data validation passed');
