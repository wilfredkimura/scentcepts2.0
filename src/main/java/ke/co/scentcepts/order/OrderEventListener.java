package ke.co.scentcepts.order;

import ke.co.scentcepts.common.events.PaymentCompletedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class OrderEventListener {
    private final OrderRepository orderRepository;

    // OrderEventListener constructor.
    public OrderEventListener(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Async
    @EventListener
    // method that listens for PaymentCompletedEvent(a common event) for orders
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        System.out.println("Order Module: Finalizing state for Order " + event.orderId());
        // orderRepository.findById - method that Retrieves an entity by its id.
        orderRepository.findById(event.orderId()).ifPresent(order -> {
            order.setStatus("COMPLETED");

            // Saves the order entity
            orderRepository.save(order);
        });
    }
}