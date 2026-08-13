const express = require('express');
const { supabase } = require('../supabase');
const { requireRole } = require('../middleware/requireAdmin');
const { logAction } = require('../audit');
const {
  parsePaging,
  parseRange,
  asyncRoute,
  throwOnSupabaseError,
  badRequest,
  notFound,
} = require('../utils');

const router = express.Router();

/**
 * Volume metrics only. Message bodies are deliberately excluded from this
 * endpoint - reading a conversation requires the separate, audited route below.
 */
router.get(
  '/stats',
  asyncRoute(async (req, res) => {
    const { from, to } = parseRange(req.query);

    const [conversations, messages, unread] = await Promise.all([
      supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', from)
        .lt('created_at', to),
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', from)
        .lt('created_at', to),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
    ]);

    const conversationCount = conversations.count || 0;
    const messageCount = messages.count || 0;

    res.json({
      data: {
        conversations: conversationCount,
        messages: messageCount,
        unread: unread.count || 0,
        avg_messages_per_conversation: conversationCount ? messageCount / conversationCount : 0,
      },
      range: { from, to },
    });
  })
);

router.get(
  '/conversations',
  asyncRoute(async (req, res) => {
    const { page, pageSize, from, to } = parsePaging(req.query);

    const { data, count, error } = await supabase
      .from('conversations')
      .select(
        `id, last_message_at, unread_count, created_at, property_id, roommate_listing_id,
         participant:user_id (id, full_name, email, avatar_url),
         other_participant:other_user_id (id, full_name, email, avatar_url),
         properties:property_id (id, title)`,
        { count: 'exact' }
      )
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(from, to);
    throwOnSupabaseError(error, 'listing conversations');

    // Message counts per conversation, without exposing any content.
    const ids = (data || []).map((c) => c.id);
    const counts = {};
    if (ids.length) {
      const { data: rows } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', ids);
      for (const row of rows || []) {
        counts[row.conversation_id] = (counts[row.conversation_id] || 0) + 1;
      }
    }

    res.json({
      data: (data || []).map((c) => ({ ...c, message_count: counts[c.id] || 0 })),
      count: count || 0,
      page,
      pageSize,
    });
  })
);

/**
 * Reading message bodies is a privacy-sensitive action: super_admin only, a
 * written reason is mandatory, and every access is recorded in the audit log.
 */
router.post(
  '/conversations/:id/read',
  requireRole('super_admin'),
  asyncRoute(async (req, res) => {
    const reason = (req.body.reason || '').trim();
    if (reason.length < 10) {
      throw badRequest('A reason of at least 10 characters is required to read a conversation');
    }

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, user_id, other_user_id, property_id, created_at')
      .eq('id', req.params.id)
      .maybeSingle();
    throwOnSupabaseError(convError, 'loading conversation');
    if (!conversation) throw notFound('Conversation not found');

    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, sender_id, content, status, is_read, created_at')
      .eq('conversation_id', req.params.id)
      .order('created_at', { ascending: true })
      .limit(500);
    throwOnSupabaseError(error, 'loading messages');

    await logAction(req, {
      action: 'messaging.read_conversation',
      table: 'conversations',
      id: req.params.id,
      reason,
    });

    res.json({ data: { conversation, messages: messages || [] } });
  })
);

module.exports = router;
