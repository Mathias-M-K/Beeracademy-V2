import {GameAction} from '../game-action';

interface ResumeGameAction extends GameAction {}

export function resumeGameAction(): ResumeGameAction {
  return {type: 'RESUME_GAME'};
}
