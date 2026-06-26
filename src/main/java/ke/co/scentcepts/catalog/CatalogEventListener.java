package ke.co.scentcepts.catalog;

import ke.co.scentcepts.common.events.PaymentCompletedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class CatalogEventListener {

    // method that reduces perfume stock when payment is completed.
    // Listens for PaymentCompletedEvent and reduces stock accordingly.
    @Async
    @EventListener
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        System.out.println("Catalog Module: Reducing stock for item ID: " + event.perfumeId());
        // This is boilerplate code.
        // Code to reduce the inventory count in the database goes here
    }
}