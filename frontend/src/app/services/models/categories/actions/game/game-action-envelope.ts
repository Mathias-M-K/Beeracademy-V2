import {WebsocketEnvelope} from '../../../websocket-envelope';
import {GameAction} from './game-action';

interface GameActionEnvelope extends WebsocketEnvelope{
  payload: GameAction;
}

export function gameClientActionEnvelope(payload: GameAction): GameActionEnvelope {
  return {category: 'GAME_CLIENT_ACTION', payload};
}
