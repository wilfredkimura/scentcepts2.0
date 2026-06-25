package ke.co.scentcepts.order;

import ke.co.scentcepts.common.events.OrderCreatedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service

// Initialized OrderServiceImplentation Class
public class OrderServiceImpl {

    // final non-access modifiers restrict modification of orderRepository and eventPublisher.
    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher;

    // OrderService Constructor
    public OrderServiceImpl(OrderRepository orderRepository, ApplicationEventPublisher eventPublisher) {
        this.orderRepository = orderRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public String checkout(Order request) {
        String orderId = UUID.randomUUID().toString(); // generates a random unique string to be used as the orderId during checkout
        Order order = new Order(orderId, request.getPhone(), request.getAmount(), request.getPerfumeId(), request.getQuantity());
        orderRepository.save(order);

        // Publish event to the internal in-memory bus
        OrderCreatedEvent event = new OrderCreatedEvent(orderId, order.getPhone(), order.getAmount(), order.getPerfumeId(), order.getQuantity());
        eventPublisher.publishEvent(event);

        return orderId;
    }
}