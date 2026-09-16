import { Player } from './player';
import { aPlayerDto, PLAYER_1 } from '../../../../testing/game-builders';
import { PlayerDto } from '../../../../api-models/model/playerDto';

describe('Player', () => {
  describe('fromPlayerDto', () => {
    it('copies every field from the dto', () => {
      // Arrange
      const dto = aPlayerDto({
        id: PLAYER_1,
        name: 'Anna',
        sipsInABeer: 12,
        canDrawChugCard: false,
        stats: { turns: [], chugs: [] },
        session: { isConnected: false, isClaimed: true },
      });

      // Act
      const player = Player.fromPlayerDto(dto);

      // Assert
      expect(player).toBeInstanceOf(Player);
      expect(player.id).toBe(PLAYER_1);
      expect(player.name).toBe('Anna');
      expect(player.sipsInABeer).toBe(12);
      expect(player.canDrawChugCard).toBe(false);
      expect(player.stats).toEqual({ turns: [], chugs: [] });
      expect(player.sessionInfo).toEqual({ isConnected: false, isClaimed: true });
    });

    it('gives the player the default colour', () => {
      // Arrange
      const dto = aPlayerDto();

      // Act
      const player = Player.fromPlayerDto(dto);

      // Assert
      expect(player.color).toBe('rebeccapurple');
    });

    it('accepts a dto without stats or session', () => {
      // Arrange
      const dto = aPlayerDto({ stats: undefined, session: undefined });

      // Act
      const player = Player.fromPlayerDto(dto);

      // Assert
      expect(player.stats).toBeUndefined();
      expect(player.sessionInfo).toBeUndefined();
    });

    it('accepts falsy but present values', () => {
      // Arrange
      const dto = aPlayerDto({ name: '', sipsInABeer: 0, canDrawChugCard: false });

      // Act
      const player = Player.fromPlayerDto(dto);

      // Assert
      expect(player.name).toBe('');
      expect(player.sipsInABeer).toBe(0);
      expect(player.canDrawChugCard).toBe(false);
    });

    it.each([
      ['name', 'PlayerDto is missing "name"'],
      ['id', 'PlayerDto is missing "id"'],
      ['sipsInABeer', `PlayerDto "${PLAYER_1}" is missing "sipsInABeer"`],
      ['canDrawChugCard', `PlayerDto "${PLAYER_1}" is missing "canDrawChugCard"`],
    ] as const)('throws when %s is missing', (field, message) => {
      // Arrange
      const dto = { ...aPlayerDto(), [field]: undefined } as unknown as PlayerDto;

      // Act & Assert
      expect(() => Player.fromPlayerDto(dto)).toThrow(message);
    });

    it.each(['name', 'id', 'sipsInABeer', 'canDrawChugCard'] as const)(
      'throws when %s is null',
      (field) => {
        // Arrange
        const dto = { ...aPlayerDto(), [field]: null } as unknown as PlayerDto;

        // Act & Assert
        expect(() => Player.fromPlayerDto(dto)).toThrow(`"${field}"`);
      },
    );
  });
});
