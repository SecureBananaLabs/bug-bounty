import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Deterministic dependency-boundary regression test.
 * 
 * This test validates that the locked dependency graph resolves to the
 * patched versions that address the following advisories:
 * - express: moderate via qs (fixed in 4.22.3)
 * - body-parser: moderate GHSA-v422-hmwv-36x6 (fixed in 1.20.8)
 * - proxy-addr: critical GHSA-jqcg-44mw-7w3h (fixed in 2.0.8)
 * - qs: moderate (fixed in 6.16.0)
 * 
 * The test reads package-lock.json directly to ensure the locked versions
 * match the expected patched versions, independent of npm audit output format changes.
 */
describe('Dependency Boundary Regression', () => {
  const lockfilePath = join(process.cwd(), 'package-lock.json');
  let lockfile: any;

  beforeAll(() => {
    const lockfileContent = readFileSync(lockfilePath, 'utf-8');
    lockfile = JSON.parse(lockfileContent);
  });

  const getLockedVersion = (packageName: string): string | undefined => {
    // Check in the root packages (direct dependencies)
    if (lockfile.packages?.[`node_modules/${packageName}`]?.version) {
      return lockfile.packages[`node_modules/${packageName}`].version;
    }
    // Check in the dependencies object (lockfile v2+ format)
    if (lockfile.dependencies?.[packageName]?.version) {
      return lockfile.dependencies[packageName].version;
    }
    return undefined;
  };

  describe('Patched dependency versions', () => {
    it('should lock express to 4.22.3 (patched moderate via qs)', () => {
      const version = getLockedVersion('express');
      expect(version).toBe('4.22.3');
    });

    it('should lock body-parser to 1.20.8 (patched moderate GHSA-v422-hmwv-36x6)', () => {
      const version = getLockedVersion('body-parser');
      expect(version).toBe('1.20.8');
    });

    it('should lock proxy-addr to 2.0.8 (patched critical GHSA-jqcg-44mw-7w3h)', () => {
      const version = getLockedVersion('proxy-addr');
      expect(version).toBe('2.0.8');
    });

    it('should lock qs to 6.16.0 (patched moderate)', () => {
      const version = getLockedVersion('qs');
      expect(version).toBe('6.16.0');
    });
  });

  describe('No vulnerable versions in lockfile', () => {
    const vulnerableVersions: Record<string, string[]> = {
      express: ['4.22.2', '4.22.1', '4.22.0'],
      'body-parser': ['1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20.0'],
      'proxy-addr': ['2.0.7', '2.0.6', '2.0.5', '2.0.4', '2.0.3', '2.0.2', '2.0.1', '2.0.0'],
      qs: ['6.15.1', '6.15.0', '6.14.1', '6.14.0', '6.13.1', '6.13.0', '6.12.1', '6.12.0', '6.11.2', '6.11.1', '6.11.0'],
    };

    it('should not contain any known vulnerable versions of express', () => {
      const version = getLockedVersion('express');
      expect(vulnerableVersions.express).not.toContain(version);
    });

    it('should not contain any known vulnerable versions of body-parser', () => {
      const version = getLockedVersion('body-parser');
      expect(vulnerableVersions['body-parser']).not.toContain(version);
    });

    it('should not contain any known vulnerable versions of proxy-addr', () => {
      const version = getLockedVersion('proxy-addr');
      expect(vulnerableVersions['proxy-addr']).not.toContain(version);
    });

    it('should not contain any known vulnerable versions of qs', () => {
      const version = getLockedVersion('qs');
      expect(vulnerableVersions.qs).not.toContain(version);
    });
  });
});
