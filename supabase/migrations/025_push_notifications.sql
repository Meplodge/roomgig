-- ============================================================================
-- Push Notifications System
-- ============================================================================
-- This migration adds support for:
-- - Storing Expo push tokens per user/device
-- - Enhanced notifications table with push delivery tracking
-- - Database functions to trigger push notifications
-- ============================================================================

-- Push tokens table to store Expo push tokens
CREATE TABLE IF NOT EXISTS push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    device_type TEXT, -- 'ios', 'android', 'web'
    device_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- Add push notification tracking to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS push_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS push_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS push_error TEXT;

-- Add new notification types for push
DO $$ 
BEGIN
    -- Check if the type exists and add new values if needed
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'new_listing' AND enumtypid = 'notification_type'::regtype) THEN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_listing';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'payment_reminder' AND enumtypid = 'notification_type'::regtype) THEN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'payment_reminder';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'price_drop' AND enumtypid = 'notification_type'::regtype) THEN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'price_drop';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'booking_reminder' AND enumtypid = 'notification_type'::regtype) THEN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking_reminder';
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- Indexes for push_tokens
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_is_active ON push_tokens(is_active);

-- Indexes for notification push tracking
CREATE INDEX IF NOT EXISTS idx_notifications_push_sent ON notifications(push_sent);

-- Function to update push_tokens updated_at
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for push_tokens updated_at
DROP TRIGGER IF EXISTS update_push_tokens_updated_at ON push_tokens;
CREATE TRIGGER update_push_tokens_updated_at
    BEFORE UPDATE ON push_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_push_tokens_updated_at();

-- Function to create a notification and return it (for push sending)
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type notification_type,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT NULL,
    p_property_id UUID DEFAULT NULL,
    p_booking_id UUID DEFAULT NULL,
    p_conversation_id UUID DEFAULT NULL
)
RETURNS notifications AS $$
DECLARE
    v_notification notifications;
BEGIN
    INSERT INTO notifications (
        user_id, type, title, message, data, 
        property_id, booking_id, conversation_id
    ) VALUES (
        p_user_id, p_type, p_title, p_message, p_data,
        p_property_id, p_booking_id, p_conversation_id
    )
    RETURNING * INTO v_notification;
    
    RETURN v_notification;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's push tokens
CREATE OR REPLACE FUNCTION get_user_push_tokens(p_user_id UUID)
RETURNS TABLE(token TEXT, device_type TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT pt.token, pt.device_type
    FROM push_tokens pt
    WHERE pt.user_id = p_user_id AND pt.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as push sent
CREATE OR REPLACE FUNCTION mark_notification_push_sent(
    p_notification_id UUID,
    p_error TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE notifications
    SET push_sent = TRUE,
        push_sent_at = NOW(),
        push_error = p_error
    WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for push_tokens
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see their own push tokens
CREATE POLICY "Users can view own push tokens"
    ON push_tokens FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own push tokens
CREATE POLICY "Users can insert own push tokens"
    ON push_tokens FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own push tokens
CREATE POLICY "Users can update own push tokens"
    ON push_tokens FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own push tokens
CREATE POLICY "Users can delete own push tokens"
    ON push_tokens FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- Notification Triggers for Real-time Events
-- ============================================================================

-- Trigger function for new message notifications
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
    v_sender_name TEXT;
    v_conversation conversations;
BEGIN
    -- Get sender name
    SELECT full_name INTO v_sender_name
    FROM profiles
    WHERE id = NEW.sender_id;
    
    -- Get conversation details
    SELECT * INTO v_conversation
    FROM conversations
    WHERE id = NEW.conversation_id;
    
    -- Create notification for the recipient (other_user_id if sender is user_id, vice versa)
    IF NEW.sender_id = v_conversation.user_id THEN
        PERFORM create_notification(
            v_conversation.other_user_id,
            'message'::notification_type,
            'New Message from ' || COALESCE(v_sender_name, 'Someone'),
            LEFT(NEW.content, 100),
            jsonb_build_object(
                'conversation_id', NEW.conversation_id,
                'message_id', NEW.id,
                'sender_id', NEW.sender_id
            ),
            v_conversation.property_id,
            NULL,
            NEW.conversation_id
        );
    ELSE
        PERFORM create_notification(
            v_conversation.user_id,
            'message'::notification_type,
            'New Message from ' || COALESCE(v_sender_name, 'Someone'),
            LEFT(NEW.content, 100),
            jsonb_build_object(
                'conversation_id', NEW.conversation_id,
                'message_id', NEW.id,
                'sender_id', NEW.sender_id
            ),
            v_conversation.property_id,
            NULL,
            NEW.conversation_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_message();

-- Trigger function for booking status changes
CREATE OR REPLACE FUNCTION notify_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_property_title TEXT;
    v_notification_title TEXT;
    v_notification_message TEXT;
BEGIN
    -- Only trigger on status changes
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- Get property title
    SELECT title INTO v_property_title
    FROM properties
    WHERE id = NEW.property_id;
    
    -- Set notification content based on new status
    CASE NEW.status
        WHEN 'confirmed' THEN
            v_notification_title := 'Booking Confirmed!';
            v_notification_message := 'Your booking for ' || COALESCE(v_property_title, 'the property') || ' has been confirmed.';
        WHEN 'cancelled' THEN
            v_notification_title := 'Booking Cancelled';
            v_notification_message := 'Your booking for ' || COALESCE(v_property_title, 'the property') || ' has been cancelled.';
        WHEN 'completed' THEN
            v_notification_title := 'Booking Completed';
            v_notification_message := 'Your stay at ' || COALESCE(v_property_title, 'the property') || ' is complete. Leave a review!';
        ELSE
            RETURN NEW;
    END CASE;
    
    -- Create notification
    PERFORM create_notification(
        NEW.user_id,
        'booking'::notification_type,
        v_notification_title,
        v_notification_message,
        jsonb_build_object(
            'booking_id', NEW.id,
            'property_id', NEW.property_id,
            'status', NEW.status
        ),
        NEW.property_id,
        NEW.id,
        NULL
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking status changes
DROP TRIGGER IF EXISTS trigger_notify_booking_status ON bookings;
CREATE TRIGGER trigger_notify_booking_status
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_booking_status_change();

-- Trigger function for new property listings (notify users who have saved searches)
CREATE OR REPLACE FUNCTION notify_new_property()
RETURNS TRIGGER AS $$
BEGIN
    -- This creates a system notification that can be picked up by the app
    -- to send push notifications to interested users
    -- For now, we'll just log it - the app will handle matching users
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for payment reminders
CREATE OR REPLACE FUNCTION notify_payment_reminder()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'pending' AND OLD.status = 'pending' THEN
        -- Create reminder notification
        PERFORM create_notification(
            NEW.user_id,
            'payment_reminder'::notification_type,
            'Payment Reminder',
            'You have a pending payment of $' || NEW.amount::TEXT,
            jsonb_build_object(
                'payment_id', NEW.id,
                'booking_id', NEW.booking_id,
                'amount', NEW.amount
            ),
            NULL,
            NEW.booking_id,
            NULL
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE push_tokens IS 'Stores Expo push notification tokens for each user device';
COMMENT ON FUNCTION create_notification IS 'Creates a notification record and returns it for push sending';
COMMENT ON FUNCTION get_user_push_tokens IS 'Gets all active push tokens for a user';
COMMENT ON FUNCTION mark_notification_push_sent IS 'Marks a notification as sent via push';
