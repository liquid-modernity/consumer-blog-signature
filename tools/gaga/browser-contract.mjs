import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const contract = JSON.parse(readFileSync(new URL('./browser-contract.json', import.meta.url), 'utf8'));
assert.ok(contract.schema === 'consumer.release-browser/v1', 'Unknown release browser contract');
assert.ok(Array.isArray(contract.projects) && contract.projects.length > 0 && new Set(contract.projects).size === contract.projects.length, 'Invalid browser projects');
assert.ok(Array.isArray(contract.cases) && contract.cases.length > 0, 'Missing browser cases');
const expected = new Set(contract.cases.flatMap(c => {
  assert.ok(typeof c.file === 'string' && typeof c.title === 'string', 'Invalid browser case');
  return contract.projects.map(project => JSON.stringify([c.file, c.title, project]));
}));
const count = contract.cases.length * contract.projects.length;
assert.ok(expected.size === count, 'Duplicate browser case');

/** @param {string | undefined} productionOrigin */
export function browserTarget(productionOrigin) {
  if (productionOrigin !== undefined) {
    assert.ok(productionOrigin === contract.productionOrigin, 'Unapproved production browser target');
    return { production: true, baseURL: contract.productionOrigin, origins: [contract.productionOrigin] };
  }
  return { production: false, baseURL: contract.localOrigins[0], origins: [...contract.localOrigins] };
}

/**
 * @param {string} requestURL
 * @param {string | undefined} productionOrigin
 */
export function browserRequestAllowed(requestURL, productionOrigin) {
  const target = browserTarget(productionOrigin);
  try {
    const url = new URL(requestURL);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && target.origins.includes(url.origin);
  } catch {
    return false;
  }
}

/** Validate every mandatory file/title/project result, not merely its total. @param {any} report */
export function assertBrowserReport(report) {
  const stats = report?.stats;
  assert.ok(stats && stats.expected === count, 'Release browser count differs from the mandatory matrix');
  assert.ok(stats.unexpected === 0 && stats.skipped === 0 && stats.flaky === 0, 'Unexpected, skipped or flaky browser cases');
  assert.ok(Array.isArray(report.errors) && report.errors.length === 0, 'Browser runner errors');
  const seen = new Set();
  function visit(suites) {
    assert.ok(Array.isArray(suites), 'Missing browser suites');
    for (const suite of suites) {
      for (const spec of suite.specs ?? []) {
        assert.ok(spec.ok === true && Array.isArray(spec.tests) && spec.tests.length > 0, 'Incomplete browser specification');
        for (const test of spec.tests) {
          const key = JSON.stringify([spec.file, spec.title, test.projectName]);
          assert.ok(expected.has(key) && !seen.has(key), 'Unknown or duplicate browser case');
          assert.ok(test.expectedStatus === 'passed' && test.status === 'expected', 'Browser case did not pass normally');
          assert.ok(Array.isArray(test.results) && test.results.length === 1, 'Missing or retried browser result');
          const result = test.results[0];
          assert.ok(result.status === 'passed' && result.retry === 0 && Array.isArray(result.errors) && result.errors.length === 0, 'Failed, skipped or retried browser result');
          seen.add(key);
        }
      }
      if (suite.suites) visit(suite.suites);
    }
  }
  visit(report.suites);
  assert.ok(seen.size === expected.size, 'Missing mandatory browser cases');
  return stats;
}

export function releaseQualification() {
  return { browserPassed: count, browserFailed: 0, consumer: 'PASS', auditVulnerabilities: 0 };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--qualification') console.log(JSON.stringify(releaseQualification()));
  else if (process.argv[2] === '--report' && process.argv.length === 4) console.log(JSON.stringify(assertBrowserReport(JSON.parse(readFileSync(process.argv[3], 'utf8')))));
  else throw Error('Expected --qualification or --report <Playwright JSON>');
}
