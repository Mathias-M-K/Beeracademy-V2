import {Stats} from '../../../../api-models/model/stats';
import {SessionDto} from '../../../../api-models/model/sessionDto';
import {PlayerDto} from '../../../../api-models/model/playerDto';

export class Player {

  name!: string;
  color: string = 'rebeccapurple';
  id!: string;
  sipsInABeer!: number;
  canDrawChugCard!: boolean;
  stats?: Stats;
  sessionInfo?: SessionDto;

  public static fromPlayerDto(dto: PlayerDto): Player {
    if (dto.name == null) throw new Error('PlayerDto is missing "name"');
    if (dto.id == null) throw new Error('PlayerDto is missing "id"');
    if (dto.sipsInABeer == null) throw new Error(`PlayerDto "${dto.id}" is missing "sipsInABeer"`);
    if (dto.canDrawChugCard == null) throw new Error(`PlayerDto "${dto.id}" is missing "canDrawChugCard"`);

    const player = new Player();
    player.name = dto.name;
    player.id = dto.id;
    player.sipsInABeer = dto.sipsInABeer;
    player.canDrawChugCard = dto.canDrawChugCard;
    player.stats = dto.stats;
    player.sessionInfo = dto.session;
    return player;
  }

}
