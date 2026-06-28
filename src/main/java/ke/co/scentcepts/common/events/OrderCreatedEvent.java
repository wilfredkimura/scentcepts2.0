package ke.co.scentcepts.common.events;

import java.math.BigDecimal;

/**
 * Event published asynchronously in-memory when a new perfume checkout order is initiated.
 */
public record OrderCreatedEvent(
        String orderId,        // Tracking ID generated during checkout
        String phone,          // Customer's phone number for M-Pesa push
        BigDecimal amount,     // Total price in KES
        Long perfumeId,        // ID of the perfume being purchased
        Integer quantity,      // Quantity ordered
        Long userId            // ID of the user who initiated checkout
) {}