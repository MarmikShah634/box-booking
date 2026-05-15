import { HashService } from './hash.service';

function makeService(): HashService {
  const config = {
    get: (key: string, def: number) => def,
  } as any;
  const svc = new HashService(config);
  svc.onModuleInit();
  return svc;
}

describe('HashService', () => {
  let svc: HashService;

  beforeEach(() => {
    svc = makeService();
  });

  it('hash() produces an argon2id string', async () => {
    const h = await svc.hash('password123');
    expect(h).toMatch(/^\$argon2id\$/);
  });

  it('verify() returns true for correct password', async () => {
    const h = await svc.hash('correct-horse');
    expect(await svc.verify(h, 'correct-horse')).toBe(true);
  });

  it('verify() returns false for wrong password', async () => {
    const h = await svc.hash('correct-horse');
    expect(await svc.verify(h, 'wrong-horse')).toBe(false);
  });

  it('verify() returns false for garbage hash', async () => {
    expect(await svc.verify('not-a-hash', 'anything')).toBe(false);
  });

  it('two hashes of same input differ (unique salts)', async () => {
    const h1 = await svc.hash('same');
    const h2 = await svc.hash('same');
    expect(h1).not.toBe(h2);
  });
});

// argon2id is slow — increase default timeout for this file
jest.setTimeout(30_000);
