package ke.co.scentcepts.common.events;

import java.math.BigDecimal;

public record OrderCreatedEvent(
        String orderId,
        String phone,
        BigDecimal amount,
        Long perfumeId,
        Integer quantity
) {}