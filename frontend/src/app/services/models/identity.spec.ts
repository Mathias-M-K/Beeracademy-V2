import { identifyFromEvent } from './identity';
import { IdentityEvent } from './categories/events/common/identity-event';
import { Role } from '../../../api-models/model/role';

describe('identifyFromEvent', () => {
  it.each([Role.GameClient, Role.PlayerClient])('extracts the id and %s role', (role) => {
    // Arrange
    const event = { type: 'HELLO_IDENTITY', id: 'client-1', role } as unknown as IdentityEvent;

    // Act
    const identity = identifyFromEvent(event);

    // Assert
    expect(identity).toEqual({ id: 'client-1', role });
  });

  it('drops every other field of the event', () => {
    // Arrange
    const event = {
      type: 'HELLO_IDENTITY',
      id: 'client-1',
      role: Role.GameClient,
      extra: 'ignored',
    } as unknown as IdentityEvent;

    // Act
    const identity = identifyFromEvent(event);

    // Assert
    expect(Object.keys(identity)).toEqual(['id', 'role']);
  });
});
