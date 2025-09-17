import React, { createElement } from 'react';
import type { FC } from 'react';
import { emojis } from '@componentAssets/user-interface/utils/emojis';

interface EmojiProps {
  emoji: string;
  /** The HTML tag or component to render, e.g., 'h1', 'span' */
  as: React.ElementType;
}

const Emoji: FC<EmojiProps> = ({ emoji, as }) => {
  const emojiObject = emojis.find(o => o.name === emoji);

  if (!emojiObject) {
    console.warn(`Emoji with name "${emoji}" not found.`);
    return null;
  }
  
  const emojiString = emojiObject.emoji;

  // FIX: Use createElement to bypass JSX parsing rules.
  // 'as' is passed directly as the element type.
  return createElement(as, null, emojiString);
};

export default Emoji;