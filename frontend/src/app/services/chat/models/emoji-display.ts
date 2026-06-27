import {Emoji} from '../../../../api-models/model/emoji';

/**
 * Maps the generated {@link Emoji} codes to their display characters.
 *
 * `Record<Emoji, string>` makes this exhaustive: add a new code to the
 * (generated) Emoji model and TypeScript will flag this map until it's handled.
 */
export const EMOJI_DISPLAY: Record<Emoji, string> = {
  [Emoji.Beer]: '🍺',
  [Emoji.Vomit]: '🤮',
  [Emoji.Confetti]: '🎉',
  [Emoji.CryLaugh]: '😂',
  [Emoji.Fire]: '🔥',
  [Emoji.Skull]: '💀',
};