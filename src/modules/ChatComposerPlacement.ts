function placeChatComposer(root: HTMLElement): void {
  const chatRoom = root.querySelector<HTMLElement>('.bk-chat-room-card');
  const layout = chatRoom?.querySelector<HTMLElement>('.bk-chat-layout');
  const thread = chatRoom?.querySelector<HTMLElement>('.bk-chat-thread');
  const composer = thread?.querySelector<HTMLElement>('[data-chat-composer="true"]');

  if (!chatRoom || !layout || !composer) return;
  if (composer.parentElement === chatRoom) return;

  composer.classList.add('bk-chat-composer-outside-thread');
  layout.insertAdjacentElement('afterend', composer);
}

export function initChatComposerPlacement(root: HTMLElement): void {
  placeChatComposer(root);

  const observer = new MutationObserver(() => placeChatComposer(root));
  observer.observe(root, { childList: true, subtree: true });
}
