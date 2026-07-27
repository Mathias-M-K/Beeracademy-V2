import {LobbyAction} from '../lobby-action';

interface StartGameAction extends LobbyAction {
}

export function startGameAction() : StartGameAction {
  return {type:'LOBBY_START_GAME'}
}
