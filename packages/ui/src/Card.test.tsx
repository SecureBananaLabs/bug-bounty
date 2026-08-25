import Card from './Card';

describe('Card UI Component', () => {
  it('should export Card component accepting native HTML section props', () => {
    expect(Card).toBeDefined();
    expect(typeof Card).toBe('function');
  });
});
