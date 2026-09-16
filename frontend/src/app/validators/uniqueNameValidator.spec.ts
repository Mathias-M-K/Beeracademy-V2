import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FieldTree, form } from '@angular/forms/signals';
import { uniqueNameValidator } from './uniqueNameValidator';

describe('uniqueNameValidator', () => {
  let model: WritableSignal<{ name: string }>;
  let existingNames: WritableSignal<string[]>;
  let nameForm: FieldTree<{ name: string }>;

  beforeEach(() => {
    model = signal({ name: '' });
    existingNames = signal(['Anna', 'Bo']);

    nameForm = TestBed.runInInjectionContext(() =>
      form(model, (path) => uniqueNameValidator(path.name, () => existingNames())),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('unique names', () => {
    it('accepts a name nobody else has', () => {
      // Arrange
      const name = 'Carl';

      // Act
      model.set({ name });

      // Assert
      expect(nameForm.name().valid()).toBe(true);
      expect(nameForm.name().errors()).toEqual([]);
    });

    it('treats names case-sensitively', () => {
      // Arrange
      const name = 'anna';

      // Act
      model.set({ name });

      // Assert
      expect(nameForm.name().valid()).toBe(true);
    });
  });

  describe('duplicate names', () => {
    it('rejects a name that is already taken', () => {
      // Arrange
      const name = 'Anna';

      // Act
      model.set({ name });

      // Assert
      expect(nameForm.name().valid()).toBe(false);
      expect(nameForm.name().errors()).toEqual([
        expect.objectContaining({ kind: 'name', message: 'Name needs to be unique' }),
      ]);
    });

    it('invalidates the whole form', () => {
      // Arrange
      const name = 'Bo';

      // Act
      model.set({ name });

      // Assert
      expect(nameForm().invalid()).toBe(true);
    });
  });

  describe('changing existing names', () => {
    it('re-validates when a name is taken later', () => {
      // Arrange
      model.set({ name: 'Carl' });

      // Act
      existingNames.set(['Anna', 'Bo', 'Carl']);

      // Assert
      expect(nameForm.name().valid()).toBe(false);
    });

    it('re-validates when the conflicting name is freed', () => {
      // Arrange
      model.set({ name: 'Anna' });

      // Act
      existingNames.set(['Bo']);

      // Assert
      expect(nameForm.name().valid()).toBe(true);
    });
  });
});
