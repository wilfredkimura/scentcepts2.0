package ke.co.scentcepts.common.events;

public record PaymentCompletedEvent(
        String orderId,
        Long perfumeId,
        Integer quantity,
        String mpesaReceipt
) {}