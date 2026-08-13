-- ============================================================================
-- Fix: trigger functions that insert notifications for OTHER users fail RLS
--
-- The notifications table has RLS: INSERT requires auth.uid() = user_id.
-- Trigger functions like notify_new_message() create notifications for the
-- RECIPIENT, but auth.uid() is the SENDER, so the RLS check fails with
-- "new row violates row-level security policy for table notifications".
--
-- Fix: make create_notification() SECURITY DEFINER so it bypasses RLS.
-- This is safe because the function is only called from triggers, not from
-- client-facing RPCs, and the user_id is always derived from the row that
-- triggered the call (not from user input).
-- ============================================================================

-- create_notification: bypass RLS so system triggers can insert for any user
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- notify_new_message: also SECURITY DEFINER so the SELECTs on profiles /
-- conversations inside the trigger are not blocked by RLS either.
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
    v_sender_name TEXT;
    v_conversation conversations;
BEGIN
    SELECT full_name INTO v_sender_name
    FROM profiles
    WHERE id = NEW.sender_id;

    SELECT * INTO v_conversation
    FROM conversations
    WHERE id = NEW.conversation_id;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- notify_booking_status_change: same fix
CREATE OR REPLACE FUNCTION notify_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_property_title TEXT;
    v_notification_title TEXT;
    v_notification_message TEXT;
BEGIN
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    SELECT title INTO v_property_title
    FROM properties
    WHERE id = NEW.property_id;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- notify_payment_reminder: same fix
CREATE OR REPLACE FUNCTION notify_payment_reminder()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'pending' AND OLD.status = 'pending' THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
