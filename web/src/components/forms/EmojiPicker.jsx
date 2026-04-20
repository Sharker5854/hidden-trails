const DEFAULT_EMOJIS = [
  '😀',
  '😄',
  '😊',
  '😍',
  '👍',
  '🔥',
  '❤️',
  '👏',
  '🌲',
  '🏔️',
  '🗺️',
  '📍',
  '✨',
  '🙏',
];

export default function EmojiPicker({ onSelect, emojis = DEFAULT_EMOJIS }) {
  return (
    <div className="emoji-picker" aria-label="Смайлики">
      {emojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="emoji-picker__button"
          onClick={() => onSelect?.(emoji)}
          aria-label={`Добавить ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
