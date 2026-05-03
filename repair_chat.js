const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

const setupChatRealtimeBlock = `function setupChatRealtime(chatId) {
  if (!supabaseClient) return;
  // Cleanup old sub if exists
  if (state._chatSub) {
    supabaseClient.removeChannel(state._chatSub);
  }

  state._chatSub = supabaseClient
    .channel('chat_' + chatId)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'chat_messages', 
      filter: 'club_id=eq.' + chatId 
    }, (payload) => {
      const msg = payload.new;
      const user = JSON.parse(sessionStorage.getItem('unisync_user') || '{}');
      const myName = ((user.firstName || '') + ' ' + (user.lastName || '')).trim();
      
      // Skip if already rendered (optimistic UI)
      if (CHAT_MESSAGES[chatId] && CHAT_MESSAGES[chatId].find(x => x.id === msg.id)) return;

      const newMsg = {
        id: msg.id,
        sender: msg.sender,
        text: msg.text,
        time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mine: msg.sender.trim() === myName,
        avatarUrl: msg.avatar_url || ''
      };
      
      if (!CHAT_MESSAGES[chatId]) CHAT_MESSAGES[chatId] = [];
      CHAT_MESSAGES[chatId].push(newMsg);
      localStorage.setItem('chat_cache_' + chatId, JSON.stringify(CHAT_MESSAGES[chatId]));
      
      if (state.chatOpen === chatId) {
        renderChatMessages(chatId);
        playNotifChime();
      }
    })
    .subscribe();
}`;

const pollingCode = `let chatPollInterval = null;
let _lastChatMsgId = null;

async function startChatPolling(chatId) {
  if (chatPollInterval) clearInterval(chatPollInterval);
  _lastChatMsgId = null;
  chatPollInterval = setInterval(async () => {
    if (!state.chatOpen || state.chatOpen !== chatId) return;
    try {
      const res = await fetch(\`\${API_BASE}/api/chat/\${chatId}\`);
      if (!res.ok) return;
      const msgs = await res.json();
      if (!Array.isArray(msgs)) return;
      const latestId = msgs.length > 0 ? msgs[msgs.length - 1].id : null;
      if (latestId === _lastChatMsgId && CHAT_MESSAGES[chatId]?.length === msgs.length) return;
      _lastChatMsgId = latestId;
      const user = JSON.parse(sessionStorage.getItem('unisync_user') || '{}');
      const myName = ((user.firstName || '') + ' ' + (user.lastName || '')).trim();
      CHAT_MESSAGES[chatId] = msgs.map(m => ({
        id: m.id, sender: m.sender, text: m.text,
        time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        mine: m.sender.trim() === myName, avatarUrl: m.avatar_url || '',
      }));
      localStorage.setItem('chat_cache_' + chatId, JSON.stringify(CHAT_MESSAGES[chatId]));
      renderChatMessages(chatId);
    } catch (e) { }
  }, 2000);
}`;

content = content.replace(setupChatRealtimeBlock, pollingCode);
content = content.replace('setupChatRealtime(chatId);', 'startChatPolling(chatId);');
content = content.replace(/function closeChatModal\(\) \{[\s\S]*?state.chatOpen = null;\n\}/, `function closeChatModal() {
  document.getElementById('chatModal').classList.remove('open');
  if (chatPollInterval) {
    clearInterval(chatPollInterval);
    chatPollInterval = null;
  }
  state.chatOpen = null;
}`);

fs.writeFileSync('app.js', content);
console.log('Success');
